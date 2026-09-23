/* ==================================================================
   export-alpha.js —— 字母表截图导出
   ------------------------------------------------------------------
   把 #alphabet-export 区域渲染成 PNG 并触发下载。

   实现：
   - 用 html-to-image（CDN，按需懒加载）做 DOM → PNG
   - 先把字母表克隆进一个离屏"导出画布"（白底、去玻璃透明），
     避免直接截取玻璃卡片时出现半透明/背景穿透导致的低对比。
   - 字体加载完成后才渲染，确保 TongnanWeb 字形正确。

   纯静态，无后端；失败时给出可见提示。
   ================================================================== */

(function () {
    "use strict";

    var CDN = "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js";

    /* —— 懒加载 html-to-image —— */
    var libPromise = null;

    function loadLib() {
        if (window.htmlToImage) {
            return Promise.resolve(window.htmlToImage);
        }
        if (libPromise) {
            return libPromise;
        }
        libPromise = new Promise(function (resolve, reject) {
            var s = document.createElement("script");
            s.src = CDN;
            s.onload = function () {
                window.htmlToImage ? resolve(window.htmlToImage) : reject(new Error("库加载后不可用"));
            };
            s.onerror = function () {
                reject(new Error("无法加载截图库（请检查网络）"));
            };
            document.head.appendChild(s);
        });
        return libPromise;
    }

    /* —— 等待页面字体就绪（TongnanWeb 等） —— */
    function fontsReady() {
        if (document.fonts && document.fonts.ready) {
            return document.fonts.ready.catch(function () {});
        }
        return Promise.resolve();
    }

    function triggerDownload(dataUrl, filename) {
        var a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function stamp() {
        var d = new Date();
        var p = function (n) { return String(n).padStart(2, "0"); };
        return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
               "-" + p(d.getHours()) + p(d.getMinutes());
    }

    /* —— 生成导出图的表头 —— */
    function buildHeader() {
        var header = document.createElement("div");
        header.className = "export-sheet-title";
        header.textContent = "Tongnan 冬语 · Basic Alphabet 基础字母表";

        var sub = document.createElement("small");
        sub.textContent = "tongnan.turbo-jairo.page";
        header.appendChild(sub);

        return header;
    }

    /* —— 渲染主体 —— */
    function render(source, options) {
        // 1. 建离屏画布
        var stage = document.createElement("div");
        stage.className = "alpha-export-stage";
        var sheet = document.createElement("div");
        sheet.className = "alpha-export-sheet";

        // 表头（不进入页面 DOM，只出现在导出图里）
        if (options.header !== false) {
            sheet.appendChild(buildHeader());
        }

        var clone = source.cloneNode(true);
        clone.removeAttribute("id"); // 防止重复 id
        sheet.appendChild(clone);
        stage.appendChild(sheet);
        document.body.appendChild(stage);

        var cleanup = function () {
            if (stage.parentNode) {
                stage.parentNode.removeChild(stage);
            }
        };

        // 2. 渲染
        return loadLib()
            .then(function (htmlToImage) {
                return fontsReady().then(function () { return htmlToImage; });
            })
            .then(function (htmlToImage) {
                return htmlToImage.toPng(sheet, {
                    backgroundColor: "#FFFFFF",
                    pixelRatio: options.pixelRatio || 4,
                    cacheBust: true,
                    filter: function (node) {
                        // 排除工具条等不该进图的东西
                        if (!node || !node.classList) { return true; }
                        return !node.classList.contains("alpha-toolbar");
                    }
                });
            })
            .then(function (dataUrl) {
                cleanup();
                return dataUrl;
            })
            .catch(function (err) {
                cleanup();
                throw err;
            });
    }

    /* —— 按钮接线 —— */
    function init() {
        var btn = document.getElementById("export-alphabet");
        var source = document.getElementById("alphabet-export");
        if (!btn || !source) { return; }

        // 状态文字单独一个 span，避免覆盖按钮内的 SVG 图标
        var status = btn.querySelector(".btn-status");
        var setStatus = function (text) {
            if (status) { status.textContent = text; }
        };

        var busy = false;

        btn.addEventListener("click", function () {
            if (busy) { return; }
            busy = true;
            btn.disabled = true;
            setStatus("正在生成…");

            render(source, { pixelRatio: 4 })
                .then(function (dataUrl) {
                    triggerDownload(dataUrl, "tongnan-alphabet-" + stamp() + ".png");
                    setStatus("已下载 ✓");
                    setTimeout(function () {
                        setStatus("");
                        btn.disabled = false;
                        busy = false;
                    }, 1400);
                })
                .catch(function (err) {
                    console.error("[export-alpha]", err);
                    setStatus("导出失败");
                    setTimeout(function () {
                        setStatus("");
                        btn.disabled = false;
                        busy = false;
                    }, 1800);
                });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
