/* ==================================================================
   book.js —— 文档页交互
   ------------------------------------------------------------------
   1. 滚动高亮：根据当前视口所在章节，高亮左侧大纲对应条目。
   2. 平滑跳转：点击大纲时平滑滚动（CSS 已设 scroll-behavior，这里
      额外用 scroll-margin-top 避开吸顶导航）。
   纯静态、零依赖。
   ================================================================== */

(function () {
    "use strict";

    var tocLinks = Array.prototype.slice.call(
        document.querySelectorAll(".book-toc-nav a[href^='#']")
    );
    if (!tocLinks.length) {
        return;
    }

    /* 建立 锚点 id → 链接 的映射 */
    var linkById = {};
    tocLinks.forEach(function (a) {
        linkById[a.getAttribute("href").slice(1)] = a;
    });

    /* 收集所有目标章节元素，按文档顺序排列 */
    var sections = tocLinks
        .map(function (a) {
            return document.getElementById(a.getAttribute("href").slice(1));
        })
        .filter(Boolean);

    function setActive(id) {
        tocLinks.forEach(function (a) {
            a.classList.toggle("active", a === linkById[id]);
        });
    }

    /* 用 IntersectionObserver 做滚动高亮（性能好） */
    if ("IntersectionObserver" in window) {
        var visible = {};

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    visible[entry.target.id] = entry.isIntersecting
                        ? entry.intersectionRatio
                        : 0;
                });

                /* 选出当前可见度最高、且最靠上的章节 */
                var bestId = null;
                var bestRatio = 0;
                sections.forEach(function (el) {
                    var r = visible[el.id] || 0;
                    if (r > bestRatio) {
                        bestRatio = r;
                        bestId = el.id;
                    }
                });
                if (bestId) {
                    setActive(bestId);
                }
            },
            {
                rootMargin: "-88px 0px -55% 0px",
                threshold: [0, 0.25, 0.5, 1]
            }
        );

        sections.forEach(function (el) {
            observer.observe(el);
        });
    }

    /* 初始状态：若 URL 带 hash，则高亮对应项 */
    if (window.location.hash) {
        var id = window.location.hash.slice(1);
        if (linkById[id]) {
            setActive(id);
        }
    }
})();
