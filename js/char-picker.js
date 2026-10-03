/* ==================================================================
   char-picker.js —— 转写器：特殊字符插入
   ------------------------------------------------------------------
   在转写输入框上方渲染一组按钮，点击后把对应冬语字符插入到
   光标位置（有选区则替换选区），并同步刷新预览区。

   要点：
   - 用 setRangeText 而非 value += ch：保留光标位置、支持替换选区
   - value 赋值不会派发 input 事件，需手动 dispatch 才能刷新预览
   - 按钮只显示冬语字形，名称放在 title 里（悬浮可见）

   【字形居中】
   这些字符在字体里是 mark（附标）字形：advance width = 0，
   轮廓相对文本原点偏右偏上（为叠在基字上方而设计）。
   flex 的居中只对 advance box 生效，因此单独放进按钮时会偏。

   「符号」组（id=mark）例外：只做水平居中，不做垂直居中
   （按设计这些附标应保持在基线附近的原始高度，不拉正到按钮中心）。

   measureText 的 actualBoundingBox* 对这些字形并不可靠
   （实测与像素不符，且为整数、小字号下严重量化），
   因此改为「把字符画进离屏 canvas，再扫描像素求墨迹包围盒」，
   得到的是真实渲染结果，与字体度量约定无关。

   拿到像素墨迹盒后：
     - 水平：墨迹中心 x 相对文本原点
     - 垂直：墨迹中心 y 相对「span 内容盒中心」
       （span line-height:1 ⇒ 盒高=字号，基线距盒顶=ascent·ratio）
   再用 transform 平移内部 span 补偿。

   数据来自 /js/tongnan-chars.js（window.TONGNAN_CHARS）。
   ================================================================== */

(function () {
    "use strict";

    /* —— 测量基准字号：越大越准，最后按比例缩到真实字号 —— */
    var PROBE_SIZE = 100;
    var FONT_STACK = '"TongnanWeb", monospace';
    /* 离屏画布尺寸：够放下 100px 的任意字形轮廓 */
    var BOX = 200;

    /* —— 取得可复用的离屏 2D 上下文 —— */
    var probeCtx = null;
    function getProbeCtx() {
        if (probeCtx === null) {
            var cv = document.createElement("canvas");
            cv.width = BOX;
            cv.height = BOX;
            probeCtx = cv.getContext ? cv.getContext("2d", { willReadFrequently: true }) : null;
        }
        return probeCtx;
    }

    /* —— 扫描像素，求字符墨迹相对文本原点的偏移（PROBE_SIZE 单位）——
       返回 { dx, dy, inkW, inkH }，或 null 表示无法测量
       dx / dy：墨迹中心相对文本原点（y 向下为正） */
    function measureInk(ch) {
        var ctx = getProbeCtx();
        if (!ctx || !ctx.fillText) {
            return null;
        }

        // 文本原点置于画布中心偏下，保证 100px 字形轮廓完整落在画布内
        var originX = BOX / 2;
        var originY = BOX * 0.75;

        ctx.clearRect(0, 0, BOX, BOX);
        ctx.font = PROBE_SIZE + "px " + FONT_STACK;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#000";

        try {
            ctx.fillText(ch, originX, originY);
        } catch (err) {
            return null;
        }

        var data;
        try {
            data = ctx.getImageData(0, 0, BOX, BOX).data;
        } catch (err) {
            return null;
        }

        var minX = BOX, minY = BOX, maxX = -1, maxY = -1;
        for (var y = 0; y < BOX; y++) {
            var row = y * BOX * 4;
            for (var x = 0; x < BOX; x++) {
                if (data[row + x * 4 + 3] > 40) {
                    if (x < minX) { minX = x; }
                    if (x > maxX) { maxX = x; }
                    if (y < minY) { minY = y; }
                    if (y > maxY) { maxY = y; }
                }
            }
        }

        if (maxX < minX || maxY < minY) {
            return null; // 空白字形
        }

        return {
            dx: (minX + maxX) / 2 - originX,
            dy: (minY + maxY) / 2 - originY,
            inkW: maxX - minX + 1,
            inkH: maxY - minY + 1
        };
    }

    /* —— 基线距「span 内容盒顶」的距离（PROBE_SIZE 单位）——
       span 设了 line-height:1 ⇒ 内容盒高 = 字号，
       且字体 ascent+descent ≈ 1em，故基线基本落在盒顶下方 ascent 处。
       用 fontBoundingBox* 校正；常量比对不上时退回经验值 0.8。 */
    function baselineFromBoxTop() {
        var ctx = getProbeCtx();
        if (ctx && ctx.measureText) {
            ctx.font = PROBE_SIZE + "px " + FONT_STACK;
            var f = ctx.measureText("H");
            if (typeof f.fontBoundingBoxAscent === "number") {
                return f.fontBoundingBoxAscent;
            }
        }
        return PROBE_SIZE * 0.8;
    }

    /* —— 把字形墨迹中心平移到 span 盒中心 ——
       测量在 PROBE_SIZE 下完成，再乘 fs / PROBE_SIZE 缩到真实字号，
       因此响应式改字号后只需重跑一次即可。
       horizontalOnly=true 时只修正水平偏移，垂直保持字体原始位置。 */
    function centerGlyph(span, ch, horizontalOnly) {
        var ink = measureInk(ch);
        if (!ink) {
            span.style.transform = "";
            return;
        }

        var box = span.getBoundingClientRect();
        // 注意：mark 类字形的 advance=0，box.width 合法地为 0，
        // 因此只能以高度判断元素是否已完成布局
        if (!box.height) {
            return;
        }

        var fs = parseFloat(getComputedStyle(span).fontSize) || PROBE_SIZE;
        var ratio = fs / PROBE_SIZE;

        /* 水平：span 是 flex 子项，其盒中心已被 flex 对齐到按钮中心。
           span 盒中心相对「文本原点」的距离 = box.width / 2
           （文本原点在 span 左内边缘；advance=0 时 box.width=0）。
           无变换时墨迹中心 = 文本原点 + ink.dx；要让墨迹中心落到盒中心：
             dx = box.width / 2 - ink.dx * ratio */
        var dx = box.width / 2 - ink.dx * ratio;

        // 垂直：span 的 line-height:1 ⇒ 内容盒高 = 字号，盒中心已在按钮中心。
        //   墨迹中心距盒顶 = baselineFromBoxTop + ink.dy
        //   盒中心距盒顶   = PROBE_SIZE / 2  （盒高 = 字号 = PROBE_SIZE）
        // 「符号」组不做垂直居中：保留字形在字体中的原始高度
        var dy = horizontalOnly
            ? 0
            : -((baselineFromBoxTop() + ink.dy) - PROBE_SIZE / 2) * ratio;

        // 取整到 0.01px，避免无意义的子像素抖动
        dx = Math.round(dx * 100) / 100;
        dy = Math.round(dy * 100) / 100;

        span.style.transform = "translate(" + dx + "px, " + dy + "px)";
    }

    /* —— 插入字符到 textarea 光标处 —— */
    function insertAtCursor(field, text) {
        field.focus();

        var start = field.selectionStart;
        var end = field.selectionEnd;

        if (typeof start === "number" && typeof end === "number") {
            // 有选区 → 替换；无选区 → 插入；光标停在插入内容之后
            field.setRangeText(text, start, end, "end");
        } else {
            // 极旧浏览器兜底：追加到末尾
            field.value += text;
        }

        // 手动通知监听者（如预览区），value 改动本身不触发事件
        field.dispatchEvent(new Event("input", { bubbles: true }));
    }

    /* —— 渲染单个字符按钮 ——
       horizontalOnly=true 的按钮只做水平居中（见 centerGlyph） */
    function buildButton(item, horizontalOnly) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "char-btn";
        btn.title = item.name;
        btn.setAttribute("aria-label", item.name);
        btn.dataset.char = item.ch;
        btn._horizontalOnly = !!horizontalOnly;

        // 字形单独放在内层 span：
        // 1) 校正用的 transform 不会干扰按钮自身的 hover 动效
        // 2) inline 元素不能 transform，span 设为 inline-block
        var glyph = document.createElement("span");
        glyph.className = "char-glyph";
        glyph.textContent = item.ch;
        btn.appendChild(glyph);

        btn._glyph = glyph;   // 供后续居中校正使用
        return btn;
    }

    /* —— 统一跑一遍居中校正 ——
       必须在字体真正就绪后调用，否则量到的是 fallback 字形 */
    function centerAll(mount) {
        var buttons = mount.querySelectorAll(".char-btn");
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            if (btn._glyph) {
                centerGlyph(btn._glyph, btn.dataset.char, btn._horizontalOnly);
            }
        }
    }

    /* —— 字体就绪后再测量；失败也不影响按钮可用性 —— */
    function whenFontReady(callback) {
        var fonts = document.fonts;
        if (!fonts || !fonts.ready) {
            callback();
            return;
        }

        if (fonts.load) {
            try {
                fonts.load('1em "TongnanWeb"');
            } catch (err) { /* 忽略：仅影响测量精度 */ }
        }

        fonts.ready.then(callback).catch(callback);
    }

    /* —— 组间分隔符（竖直细线），纯装饰，不参与点击 —— */
    function buildSeparator() {
        var sep = document.createElement("span");
        sep.className = "char-sep";
        sep.setAttribute("aria-hidden", "true");
        return sep;
    }

    /* —— 把一个分组的按钮直接追加到线性容器（mount）中 ——
       分组间插入一条竖线分隔符；不再有分组标签与分行 */
    function appendGroup(mount, group, isFirst) {
        if (!isFirst) {
            mount.appendChild(buildSeparator());
        }

        // 「符号」组只做水平居中，垂直保持字体原始位置
        var horizontalOnly = group.id === "mark";

        for (var i = 0; i < group.chars.length; i++) {
            mount.appendChild(buildButton(group.chars[i], horizontalOnly));
        }
    }

    function init() {
        var field = document.getElementById("input");
        var mount = document.getElementById("char-picker");
        var groups = window.TONGNAN_CHARS;

        if (!field || !mount || !groups || !groups.length) {
            return;
        }

        for (var i = 0; i < groups.length; i++) {
            appendGroup(mount, groups[i], i === 0);
        }

        // 字体就绪后做一次居中校正（量墨迹盒需要真实字体）
        whenFontReady(function () {
            centerAll(mount);
        });

        // 断点改变字号时重新校正（transform 用 px，需随字号更新）
        var resizeTimer = null;
        window.addEventListener("resize", function () {
            if (resizeTimer) {
                clearTimeout(resizeTimer);
            }
            resizeTimer = setTimeout(function () {
                centerAll(mount);
            }, 150);
        });

        // 事件委托：一次监听覆盖所有按钮
        mount.addEventListener("click", function (e) {
            var btn = e.target.closest ? e.target.closest(".char-btn") : null;
            if (!btn || !mount.contains(btn)) {
                return;
            }
            insertAtCursor(field, btn.dataset.char);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
