/* ==================================================================
   tongnan-chars.js —— 冬语特殊字符数据
   ------------------------------------------------------------------
   数据来源：Alphabet Information.xlsx（sheet「alphabet」）

   收录规则：
   - 排除 a–z / A–Z 基本拉丁字母（普通键盘可直接输入）
   - 排除「元音槽」c    —— 按需求不做按钮
   - 排除「长音符」;    —— 按需求不做按钮

   分组：
   - vowel  元音（middle / top 中高调标记）
   - mark   符号（全消音 / 半消音 / 持音）
   - syllabic 音节字母

   每条字段：
   - ch    实际插入字符
   - name  悬浮提示（英文名 + 中文说明）
   pure data，无副作用。
   ================================================================== */

(function (global) {
    "use strict";

    var GROUPS = [
        {
            id: "vowel",
            label: "元音",
            chars: [
                /* —— 中调（middle）：标记位于中部 —— */
                { ch: "À", name: "Agrave · o middle 中调 o" },
                { ch: "Á", name: "Aacute · e middle 中调 e" },
                { ch: "Â", name: "Acircumflex · i middle 中调 i" },
                { ch: "Ã", name: "Atilde · u middle 中调 u" },
                { ch: "Ä", name: "Adieresis · a middle 中调 a" },

            ]
        },
        {
            id: "mark",
            label: "符号",
            chars: [
                { ch: "`", name: "grave · spreading mark 持音符" },
                { ch: "Å", name: "Aring · a high 高调 a" },
                { ch: "Æ", name: "AE · vowel deletion mark 半消音符" }
            ]
        },
        {
            id: "syllabic",
            label: "音节字母",
            chars: [
                { ch: "Ì", name: "Igrave · ha 音节 ha" },
                { ch: "Í", name: "Iacute · na 音节 na" },
                { ch: "Î", name: "Icircumflex · ma 音节 ma" },
                { ch: "Ï", name: "Idieresis · nga 音节 nga" },
                { ch: "Ð", name: "Eth · da 音节 da" },
                { ch: "Ñ", name: "Ntilde · ta 音节 ta" },
                { ch: "Ò", name: "Ograve · pa 音节 pa" },
                { ch: "Ó", name: "Oacute · ai 音节 ai" }
            ]
        }
    ];

    global.TONGNAN_CHARS = GROUPS;
})(window);
