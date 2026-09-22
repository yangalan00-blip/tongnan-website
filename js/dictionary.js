/* ==================================================================
   dictionary.js —— 词典页逻辑（骨架）
   ------------------------------------------------------------------
   当前：静态示例词条 + 前端即时筛选。
   后续：改为 fetch('/data/lexicon.json') 动态加载真实词库。
   ================================================================== */

(function () {
    "use strict";

    var searchInput = document.getElementById("dict-search");
    var list = document.getElementById("dict-list");

    if (!searchInput || !list) {
        return;
    }

    /* 前端即时筛选：按输入内容过滤可见词条 */
    searchInput.addEventListener("input", function () {
        var q = searchInput.value.trim().toLowerCase();
        var entries = list.querySelectorAll(".dict-entry");

        entries.forEach(function (entry) {
            var text = entry.textContent.toLowerCase();
            var hit = q === "" || text.indexOf(q) !== -1;
            entry.hidden = !hit;
        });
    });

    /* --------------------------------------------------------------
       预留：加载真实词库
       --------------------------------------------------------------
       启用后，用 JSON 数据替换静态 <li>。示例：

       fetch("/data/lexicon.json")
         .then(function (r) { return r.json(); })
         .then(function (data) { renderEntries(data); })
         .catch(function () { console.warn("词库加载失败，使用静态占位词条"); });
    ---------------------------------------------------------------- */
})();
