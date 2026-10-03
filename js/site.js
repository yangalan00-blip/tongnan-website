/* ==================================================================
   site.js —— 全站公共组件注入
   ------------------------------------------------------------------
   一处维护导航栏与页脚，所有页面共用。
   - <div data-site-nav></div>  → 自动注入导航栏
   - <div data-site-footer></div> → 自动注入页脚
   当前页会根据路径自动高亮（aria-current="page"）。
   纯静态，无需后端。
   ================================================================== */

(function () {
    "use strict";

    var NAV_ITEMS = [
        { href: "/",            label: "首页" },
        { href: "/book/",       label: "文档" },
        { href: "/dictionary/", label: "词典" },
        { href: "/game/",       label: "游戏" },
        { href: "/about/",      label: "关于" }
    ];

    /* 判断某个链接是否为当前页 */
    function isCurrent(href) {
        var path = window.location.pathname;

        if (href === "/") {
            return path === "/" || path === "/index.html";
        }
        // 归一化：确保以 / 结尾再比较
        var norm = path.endsWith("/") ? path : path + "/";
        return norm.indexOf(href) === 0;
    }

    /* —— 主题（浅色/深色）—— */
    var THEME_KEY = "tongnan-theme";

    function storedTheme() {
        try {
            var v = window.localStorage.getItem(THEME_KEY);
            return v === "light" || v === "dark" ? v : null;
        } catch (e) {
            return null;
        }
    }

    function effectiveTheme() {
        var saved = storedTheme();
        if (saved) { return saved; }
        return window.matchMedia &&
               window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark" : "light";
    }

    /* 把主题写到 <html data-theme>，供 CSS 选择 */
    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
    }

    function toggleTheme() {
        var next = effectiveTheme() === "dark" ? "light" : "dark";
        try { window.localStorage.setItem(THEME_KEY, next); } catch (e) { /* 忽略 */ }
        applyTheme(next);
        syncThemeButton();
    }

    /* 同步按钮图标 / 无障碍标签 */
    function syncThemeButton() {
        var btn = document.querySelector(".theme-toggle");
        if (!btn) { return; }
        var isDark = effectiveTheme() === "dark";
        btn.setAttribute("aria-pressed", isDark ? "true" : "false");
        btn.setAttribute(
            "aria-label",
            isDark ? "切换到浅色模式" : "切换到深色模式"
        );
        btn.setAttribute("title", isDark ? "浅色模式" : "深色模式");
        btn.innerHTML =
            '<span class="theme-toggle-icon" aria-hidden="true">' +
            (isDark ? "☀" : "☾") +
            "</span>";
    }

    function initTheme() {
        applyTheme(effectiveTheme());
        // 未做显式选择时，跟随系统切换
        if (window.matchMedia) {
            var mq = window.matchMedia("(prefers-color-scheme: dark)");
            var onChange = function () {
                if (!storedTheme()) {
                    applyTheme(effectiveTheme());
                    syncThemeButton();
                }
            };
            if (mq.addEventListener) { mq.addEventListener("change", onChange); }
            else if (mq.addListener) { mq.addListener(onChange); }
        }
    }

    function buildNav() {
        var links = NAV_ITEMS.map(function (item) {
            var current = isCurrent(item.href) ? ' aria-current="page"' : "";
            return '<a href="' + item.href + '"' + current + ">" +
                   item.label + "</a>";
        }).join("");

        return (
            '<header class="site-nav">' +
                '<a class="brand" href="/">Tongnan<span class="dot">.</span></a>' +
                "<nav>" + links + "</nav>" +
                '<button type="button" class="theme-toggle" aria-label="切换主题">' +
                    '<span class="theme-toggle-icon" aria-hidden="true">☾</span>' +
                "</button>" +
            "</header>"
        );
    }

    function buildFooter() {
        return (
            '<footer class="site-footer">' +
                "<p>" +
                    '&copy; ' + new Date().getFullYear() + " 音速海螺 Turbo Jairo"+
                "</p>" +
            "</footer>"
        );
    }

    function inject() {
        initTheme();

        var navHost = document.querySelector("[data-site-nav]");
        if (navHost) {
            navHost.outerHTML = buildNav();

            var toggle = document.querySelector(".theme-toggle");
            if (toggle) {
                toggle.addEventListener("click", toggleTheme);
                syncThemeButton();
            }
        }

        var footerHost = document.querySelector("[data-site-footer]");
        if (footerHost) {
            footerHost.outerHTML = buildFooter();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inject);
    } else {
        inject();
    }
})();

/* —— 尽早应用主题，避免首屏闪烁（FOUC）—— */
(function () {
    "use strict";
    try {
        var saved = window.localStorage.getItem("tongnan-theme");
        var theme = (saved === "light" || saved === "dark")
            ? saved
            : (window.matchMedia &&
               window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark" : "light");
        document.documentElement.setAttribute("data-theme", theme);
    } catch (e) { /* 忽略 */ }
})();
