/* ==================================================================
   export-transcriber.js —— 转写结果截图导出
   ------------------------------------------------------------------
   把 #transcriber-export 区域（转写预览）渲染成 PNG 并触发下载。

   设计沿用 export-alpha.js：
   - 用 html-to-image（CDN，按需懒加载）做 DOM → PNG
   - 先把预览内容克隆进一个离屏"导出画布"（白底、去玻璃透明），
     避免直接截取玻璃卡片时出现半透明/背景穿透导致的低对比。
   - 字体加载完成后才渲染，确保 TongnanWeb 字形正确。
   - 空内容时给出可见提示，不生成空白图。

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

    /* —— 底部右下角的水印网址（灰色）—— */
    function buildFooter() {
        var footer = document.createElement("div");
        footer.className = "transcriber-export-footer";
        footer.textContent = "tongnan.turbo-jairo.page";
        return footer;
    }

    /* —— 读取要导出的文本内容（来自预览区）—— */
    function readContent(source) {
        var text = source ? source.textContent : "";
        return (text || "").replace(/[\s\u00A0]+/g, " ").trim();
    }

    /* —— 渲染主体：把纯文本铺进导出画布（白底、大字）—— */
    function render(text, options) {
        var stage = document.createElement("div");
        stage.className = "alpha-export-stage";

        var sheet = document.createElement("div");
        sheet.className = "alpha-export-sheet transcriber-export-sheet";

        // 用 <div> 承载文本；换行交给 CSS（white-space: pre-wrap），
        // 保留用户输入里的换行，但长行自动折行。
        var body = document.createElement("div");
        body.className = "transcriber-export-body tongnan";
        body.textContent = text || "";
        sheet.appendChild(body);

        // 右下角灰色水印网址
        sheet.appendChild(buildFooter());

        stage.appendChild(sheet);
        document.body.appendChild(stage);

        var cleanup = function () {
            if (stage.parentNode) {
                stage.parentNode.removeChild(stage);
            }
        };

        return loadLib()
            .then(function (htmlToImage) {
                return fontsReady().then(function () { return htmlToImage; });
            })
            .then(function (htmlToImage) {
                return htmlToImage.toPng(sheet, {
                    backgroundColor: "#FFFFFF",
                    pixelRatio: options.pixelRatio || 4,
                    cacheBust: true
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
        var btn = document.getElementById("export-transcriber");
        var source = document.getElementById("output");
        if (!btn || !source) { return; }

        var status = btn.querySelector(".btn-status");
        var setStatus = function (text) {
            if (status) { status.textContent = text; }
        };

        var busy = false;
        var resetSoon = function (ms) {
            setTimeout(function () {
                setStatus("");
                btn.disabled = false;
                busy = false;
            }, ms);
        };

        btn.addEventListener("click", function () {
            if (busy) { return; }

            var text = readContent(source);
            if (!text) {
                setStatus("内容为空");
                resetSoon(1600);
                return;
            }

            busy = true;
            btn.disabled = true;
            setStatus("正在生成…");

            render(text, { pixelRatio: 4 })
                .then(function (dataUrl) {
                    triggerDownload(dataUrl, "tongnan-transcriber-" + stamp() + ".png");
                    setStatus("已下载 ✓");
                    resetSoon(1400);
                })
                .catch(function (err) {
                    console.error("[export-transcriber]", err);
                    setStatus("导出失败");
                    resetSoon(1800);
                });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
