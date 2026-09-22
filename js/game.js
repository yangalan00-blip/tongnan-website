/* ==================================================================
   game.js —— 小游戏逻辑（可玩的最小版本）
   ------------------------------------------------------------------
   玩法：显示一个 Tongnan 字形（实为拉丁文本 + Tongnan 字体渲染），
         从 4 个拉丁词选项中选出正确答案。
   纯前端、零依赖。题库可后续替换为 data/lexicon.json。
   ================================================================== */

(function () {
    "use strict";

    var promptEl   = document.getElementById("game-prompt");
    var optionsEl  = document.getElementById("game-options");
    var roundEl    = document.getElementById("game-round");
    var scoreEl    = document.getElementById("game-score");
    var answeredEl = document.getElementById("game-answered");

    if (!promptEl || !optionsEl) {
        return;
    }

    /* —— 题库（占位，后续可换成 JSON） —— */
    var WORDS = [
        "tongnan", "language", "hello", "world",
        "snow", "winter", "water", "fire",
        "moon", "star", "tree", "river"
    ];

    var score = 0;
    var round = 0;
    var locked = false;

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function pick(n, exclude) {
        var pool = WORDS.filter(function (w) { return w !== exclude; });
        return shuffle(pool).slice(0, n);
    }

    function renderRound() {
        round += 1;
        locked = false;

        var answer = WORDS[Math.floor(Math.random() * WORDS.length)];
        var choices = shuffle([answer].concat(pick(3, answer)));

        promptEl.textContent = answer;
        roundEl.textContent = round;

        optionsEl.innerHTML = "";
        choices.forEach(function (word) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "game-option";
            btn.textContent = word;
            btn.addEventListener("click", function () {
                onChoose(btn, word, answer);
            });
            optionsEl.appendChild(btn);
        });
    }

    function onChoose(btn, word, answer) {
        if (locked) {
            return;
        }
        locked = true;

        var correct = word === answer;
        btn.dataset.state = correct ? "correct" : "wrong";

        if (correct) {
            score += 1;
            scoreEl.textContent = score;
        } else {
            /* 高亮正确答案 */
            Array.prototype.forEach.call(
                optionsEl.querySelectorAll(".game-option"),
                function (b) {
                    if (b.textContent === answer) {
                        b.dataset.state = "correct";
                    }
                }
            );
        }

        answeredEl.textContent = parseInt(answeredEl.textContent, 10) + 1;

        /* 短暂停顿后进入下一题 */
        window.setTimeout(renderRound, 900);
    }

    renderRound();
})();
