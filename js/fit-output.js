/* ==================================================================
   fit-output.js —— 转写预览自适应字号（对齐 Tecendil 的 fitLinearLayout）
   ------------------------------------------------------------------
   目标：输入很长的冬语文本时，不让文字溢出预览框。

   策略（与 Tecendil 一致，单行优先）：
   1) 先按最大字号、禁止换行（white-space: nowrap）测量整行的
      scrollWidth；
   2) 按「容器可用宽度 / 本行宽度」等比缩小字号，下限 MIN；
   3) 若缩到下限仍放不下，才解除 nowrap，允许自动换行，并把字号
      恢复到最大（此时靠换行溢出，字号可以放大回来）；
   4) 结束后固定容器高度，避免布局抖动。

   仅依赖 #output 的父级宽度；无后端、无外部依赖。
   ================================================================== */

(function () {
    "use strict";

    var MAX = 56;   // 最大字号 px（与 .tongnan 3.5rem ≈ 56px 对齐）
    var MIN = 18;   // 最小字号 px（低于此值则改用换行）
    var SAFE = 4;   // 右侧安全留白 px，避免末字贴边/被裁

    // 用隐藏的测量元素量出「指定字号下，单行文本的真实宽度」
    function measureSingleLine(el, fontPx) {
        var probe = document.createElement("div");
        var cs = getComputedStyle(el);
        probe.style.position = "fixed";
        probe.style.top = "-99999px";
        probe.style.left = "0";
        probe.style.width = "max-content";
        probe.style.whiteSpace = "nowrap";
        probe.style.fontFamily = cs.fontFamily;
        probe.style.fontSize = fontPx + "px";
        probe.style.fontWeight = cs.fontWeight;
        probe.style.fontStyle = cs.fontStyle;
        probe.style.letterSpacing = cs.letterSpacing;
        probe.style.display = "block";
        probe.textContent = el.textContent;
        document.body.appendChild(probe);
        var w = probe.getBoundingClientRect().width;
        document.body.removeChild(probe);
        return w;
    }

    function fit(el) {
        if (!el) { return; }

        // 可用于文本的宽度：用 #output 自身的 clientWidth 减去左右内边距
        // （注意不能直接用父级 clientWidth —— 父级可能带额外 padding，
        //  会比 #output 的实际内容宽度更大，导致末字贴边/被裁）
        var cs = getComputedStyle(el);
        var avail =
            el.clientWidth -
            parseFloat(cs.paddingLeft || 0) -
            parseFloat(cs.paddingRight || 0) -
            SAFE;

        if (avail <= 0) { return; }

        // 空内容：恢复默认最大字号
        if (!el.textContent) {
            el.style.fontSize = MAX + "px";
            el.style.whiteSpace = "pre-wrap";
            return;
        }

        // —— 1) 量出 MAX 字号下的单行真实宽度 ——
        var w = measureSingleLine(el, MAX);

        // —— 2) 等比缩放（下限 MIN） ——
        var size = MAX;
        if (w > 0) {
            size = (avail / w) * MAX;
            if (size > MAX) { size = MAX; }
        }

        if (size < MIN) {
            // 缩到下限仍放不下 → 用 MIN 字号换行消化（字号不跳回 MAX）
            el.style.fontSize = MIN + "px";
            el.style.whiteSpace = "pre-wrap";
        } else {
            el.style.fontSize = size + "px";
            el.style.whiteSpace = "nowrap";
        }
    }

    function refit() {
        fit(document.getElementById("output"));
    }

    // 对外暴露：页面在写入预览文本后调用
    window.fitTongnanPreview = refit;

    function init() {
        if (!document.getElementById("output")) { return; }

        // 视口尺寸变化（防抖）
        var t = null;
        window.addEventListener("resize", function () {
            if (t) { clearTimeout(t); }
            t = setTimeout(refit, 120);
        });

        // 字体就绪后重算一次（自定义字体加载会改变宽度）
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(refit).catch(refit);
        }

        refit();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
