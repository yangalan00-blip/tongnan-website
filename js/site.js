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
            "</header>"
        );
    }

    function buildFooter() {
        return (
            '<footer class="site-footer">' +
                "<p>" +
                    '&copy; ' + new Date().getFullYear() + " Tongnan ・ 冬语。 " +
                    '源码：<a href="https://github.com/yangalan00-blip/tongnan-website" ' +
                    'target="_blank" rel="noopener">GitHub</a>' +
                "</p>" +
            "</footer>"
        );
    }

    function inject() {
        var navHost = document.querySelector("[data-site-nav]");
        if (navHost) {
            navHost.outerHTML = buildNav();
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
