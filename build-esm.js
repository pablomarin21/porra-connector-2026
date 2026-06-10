// Genera engine-esm.js (módulo ES para la Edge Function) a partir de data.js + engine.js.
// Garantiza que el motor del servidor sea IDÉNTICO al del navegador.
const fs = require("fs");
const D = require("./data-node.js");
const lean = {
  GROUPS: D.GROUPS, GROUP_LETTERS: D.GROUP_LETTERS, ELO: D.ELO, GROUP_FIXTURES: D.GROUP_FIXTURES,
  R32: D.R32, THIRD_SLOTS: D.THIRD_SLOTS, R16: D.R16, QF: D.QF, SF: D.SF, FINAL: D.FINAL,
  DEFAULT_SCORING: D.DEFAULT_SCORING, ESPN_NAME: D.ESPN_NAME, KO_WINDOWS: D.KO_WINDOWS,
};
// Cuerpo del motor: lo que hay dentro de  factory(function (DATA) { ... })
const src = fs.readFileSync("engine.js", "utf8");
const startMarker = "})(this, function (DATA) {";
const si = src.indexOf(startMarker);
if (si < 0) throw new Error("no encuentro el inicio del factory");
let body = src.slice(si + startMarker.length);
// recortar el cierre final  "});\n"  (última aparición)
const endIdx = body.lastIndexOf("});");
body = body.slice(0, endIdx);   // queda: "use strict"; ... return {...};
const out =
`/* Motor de la porra como módulo ES (para la Edge Function de probabilidades). GENERADO por build-esm.js — no editar a mano. */
const GROUPS=${JSON.stringify(lean.GROUPS)};
const GROUP_LETTERS=${JSON.stringify(lean.GROUP_LETTERS)};
const ELO=${JSON.stringify(lean.ELO)};
const GROUP_FIXTURES=${JSON.stringify(lean.GROUP_FIXTURES)};
const R32=${JSON.stringify(lean.R32)};
const THIRD_SLOTS=${JSON.stringify(lean.THIRD_SLOTS)};
const R16=${JSON.stringify(lean.R16)};
const QF=${JSON.stringify(lean.QF)};
const SF=${JSON.stringify(lean.SF)};
const FINAL=${JSON.stringify(lean.FINAL)};
const DEFAULT_SCORING=${JSON.stringify(lean.DEFAULT_SCORING)};
const ESPN_NAME=${JSON.stringify(lean.ESPN_NAME)};
const KO_WINDOWS=${JSON.stringify(lean.KO_WINDOWS)};
const TEAM_SET=new Set([].concat(...GROUP_LETTERS.map(L=>GROUPS[L])));
function espnCanon(name){const n=ESPN_NAME[name]||name;return TEAM_SET.has(n)?n:null;}
const DATA={GROUPS,GROUP_LETTERS,ELO,GROUP_FIXTURES,R32,THIRD_SLOTS,R16,QF,SF,FINAL,DEFAULT_SCORING,ESPN_NAME,KO_WINDOWS,TEAM_SET,espnCanon};

const ENGINE=(function(DATA){
${body}
})(DATA);

export { DATA, ENGINE };
`;
fs.writeFileSync("engine-esm.js", out);
console.log("engine-esm.js generado:", out.length, "bytes");
