/* ==================================================================
   coming-soon.js —— 「即将上线」跳转控制（单一配置文件）
   ------------------------------------------------------------------
   ★ 以后要调整「哪些页面进入开发中状态」，只需要改下面这一个数组。

   工作方式：
     1. 用户在导航栏点击某个处于开发中的链接
     2. 本脚本拦截该点击，跳转到 /coming-soon/?feature=<名称>
     3. 若用户直接输入 URL 访问开发中的页面，也会自动重定向
     4. 本地预览（localhost / 127.0.0.1）默认【不拦截】，
        方便开发时查看真实页面（见 ALLOW_LOCAL_PREVIEW）

   要新增/移除一个「开发中」页面，只需增删 COMING_SOON 里的条目：
       要拦截的路径 : 显示的模块名称
   ================================================================== */

(function () {
    "use strict";

    /* =============================================================
       ① 开发中模块清单（唯一的日常修改点）
       -------------------------------------------------------------
       键   = 需要跳转到「即将上线」页面的路径（以 / 开头）
       值   = 在提示页上显示的模块名称
       ============================================================= */
    var COMING_SOON = {
        "/game/":       "小游戏",
        "/dictionary/": "词典",
        "/book/":       "文档"
    };

    /* 提示页路径 */
    var SOON_PAGE = "/coming-soon/";

    /* =============================================================
       ② 本地预览开关
       -------------------------------------------------------------
       true  → 在 localhost / 127.0.0.1 上【不拦截】，
               可以直接预览被隐藏的真实页面（推荐开发时使用）
       false → 本地也执行跳转，行为和线上一致
       ============================================================= */
    var ALLOW_LOCAL_PREVIEW = true;

    /* 判断当前是否处于本地预览环境 */
    function isLocalPreview() {
        var h = window.location.hostname;
        return h === "localhost" || h === "127.0.0.1" || h === "::1";
    }

    /* 规范化路径：保证以 / 结尾，方便比较 */
    function normalize(path) {
        if (!path) {
            return "/";
        }
        return path.charAt(path.length - 1) === "/" ? path : path + "/";
    }

    /* 查询某个路径是否属于「开发中」；是则返回模块名，否则返回 null */
    function lookup(path) {
        var norm = normalize(path);
        var keys = Object.keys(COMING_SOON);
        for (var i = 0; i < keys.length; i++) {
            if (normalize(keys[i]) === norm) {
                return COMING_SOON[keys[i]];
            }
        }
        return null;
    }

    /* 构造带模块名的提示页地址 */
    function soonUrl(name) {
        return SOON_PAGE + "?feature=" + encodeURIComponent(name);
    }

    /* =============================================================
       ⑤ 在提示页上填充模块名称（读取 ?feature=）
       —— 无论是否本地预览都要执行，故放在最前面注册
       ============================================================= */
    function fillTargetName() {
        var host = document.getElementById("soon-target");
        if (!host) {
            return;
        }
        var m = window.location.search.match(/[?&]feature=([^&]+)/);
        if (m) {
            try {
                host.textContent = decodeURIComponent(m[1]) + " · 开发中";
            } catch (e) {
                /* 忽略解码错误 */
            }
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fillTargetName);
    } else {
        fillTargetName();
    }

    /* —— 未开启本地预览时，才执行以下拦截/跳转逻辑 —— */
    if (ALLOW_LOCAL_PREVIEW && isLocalPreview()) {
        return;
    }

    /* =============================================================
       ③ 直接访问 URL 时自动重定向
       ============================================================= */
    var currentName = lookup(window.location.pathname);
    if (currentName) {
        window.location.replace(soonUrl(currentName));
        return;
    }

    /* =============================================================
       ④ 拦截导航栏（及页内）点击，改为跳转提示页
       ============================================================= */
    document.addEventListener(
        "click",
        function (ev) {
            // 找到被点击的 <a>
            var el = ev.target;
            while (el && el !== document.body) {
                if (el.tagName === "A" && el.getAttribute("href")) {
                    break;
                }
                el = el.parentNode;
            }
            if (!el || el.tagName !== "A") {
                return;
            }

            // 跳过新标签页 / 修饰键点击 / 锚点 / 外链
            if (el.target === "_blank" || ev.metaKey || ev.ctrlKey ||
                ev.shiftKey || ev.altKey) {
                return;
            }

            var href = el.getAttribute("href");
            if (!href || href.charAt(0) === "#") {
                return;
            }
            // 仅处理站内绝对路径
            if (href.indexOf("/") !== 0) {
                return;
            }

            var name = lookup(href);
            if (name) {
                ev.preventDefault();
                window.location.href = soonUrl(name);
            }
        },
        true
    );
})();
