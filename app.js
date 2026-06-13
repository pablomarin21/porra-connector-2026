/* ============================================================================
   PORRA MUNDIAL 2026 · CONNECTOR — App (Alpine + Supabase)
   Porra independiente con MARCADORES EXACTOS de la fase de grupos.
   ========================================================================== */
// Proyecto Supabase propio de la porra Connector (se rellena al desplegar).
const SUPA_URL = "https://enzbrjqdxurrwdpoezxr.supabase.co";
const SUPA_KEY = "sb_publishable_TFWre0qvDBGKWvzc5D4Mzg_-FLySJ-w";
const DEFAULT_POOL = "CONNECTOR";   // el enlace carga sola esta porra: el usuario solo pone nombre+apellido
const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
const D = window.PORRA_DATA;
const Eng = window.PorraEngine;

const ALL_TEAMS = [].concat(...D.GROUP_LETTERS.map((L) => D.GROUPS[L]));
const TEAM_GROUP = (function () { const m = {}; for (const L of D.GROUP_LETTERS) for (const t of D.GROUPS[L]) m[t] = L; return m; })();
// Par de selecciones (orden indiferente) → código de su partido de grupo. Para mostrar "lo que puso cada uno" por partido.
const PAIR_FX = (function () { const m = {}; for (const fx of D.GROUP_FIXTURES) m[[fx.home, fx.away].slice().sort().join("|")] = fx.code; return m; })();
const KO_META = []
  .concat(D.R32.map((m) => ({ match: m.match, round: "1/16", stageKey: "r32" })))
  .concat(D.R16.map((m) => ({ match: m.match, round: "Octavos", stageKey: "r16" })))
  .concat(D.QF.map((m) => ({ match: m.match, round: "Cuartos", stageKey: "qf" })))
  .concat(D.SF.map((m) => ({ match: m.match, round: "Semifinal", stageKey: "sf" })))
  .concat([{ match: 103, round: "3er puesto", stageKey: "thirdplace" }])
  .concat([{ match: D.FINAL.match, round: "FINAL", stageKey: "final" }]);

function emptyGroups() { const g = {}; for (const L of D.GROUP_LETTERS) g[L] = D.GROUPS[L].slice(); return g; }
function emptyScores() { const s = {}; for (const fx of D.GROUP_FIXTURES) s[fx.code] = [null, null]; return s; }
function defaultREdit() { const re = {}; for (const fx of D.GROUP_FIXTURES) re[fx.code] = { h: null, a: null }; return re; }
function defaultKoEdit() { const ke = {}; for (const m of KO_META) ke[m.match] = { home: "", away: "", h: null, a: null, winner: "" }; return ke; }
const ERRORS = {
  CODE_TAKEN: "Ese código ya está cogido, elige otro.",
  CODE_TOO_SHORT: "El código debe tener al menos 3 caracteres.",
  PIN_TOO_SHORT: "El PIN debe tener al menos 4 caracteres.",
  POOL_NOT_FOUND: "No existe ninguna porra con ese código.",
  POOL_LOCKED: "La porra está cerrada: ya no se pueden cambiar los pronósticos.",
  NAME_REQUIRED: "Pon tu nombre y tu apellido.",
  NAME_TOO_LONG: "El nombre o el apellido es demasiado largo (máx. 40 letras).",
  PICKS_TOO_BIG: "Los datos de tu porra son demasiado grandes.",
  POOL_FULL: "Esta porra ya está llena.",
  TOO_MANY_POOLS: "Se ha alcanzado el límite de porras.",
  CODE_TOO_LONG: "El código es demasiado largo (máx. 24 caracteres).",
  PIN_TOO_LONG: "El PIN es demasiado largo.",
  BAD_PIN: "PIN incorrecto.",
  PARTICIPANT_NOT_FOUND: "No encuentro tu quiniela en esta porra.",
};

window.porraApp = function () {
  return {
    // navegación
    view: "home", booting: true, loadFailed: false, tab: "play", step: 1, rTab: "cal", aTab: "groups", calFilter: "all", openMatch: null, brRound: 0,
    teamProbs: {}, teamProbsSims: 0, scorers: [], assisters: [],
    phase: "welcome", gIdx: 0, chosenNew: false, confirmClaim: null, claimFromName: false,
    wmode: "choose", entriesLoaded: false,
    // estado porra / jugador
    pool: null, me: { first: "", last: "", id: null, saved: false },
    joinCode: "", newPool: { name: "", code: "", pin: "" }, recent: [],
    // ui
    toasts: [], busy: false, probBusy: false, syncBusy: false, syncMsg: "", _saveTimer: null,
    showInstall: false, deferredPrompt: null,
    // pronósticos
    groups: emptyGroups(), scores: emptyScores(), derivedStandings: {}, thirds: [], _thirdsTouched: false, bracket: {}, _cols: [], _champion: null,
    extras: { revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} },
    letters: D.GROUP_LETTERS, allTeams: ALL_TEAMS.slice().sort((a, b) => D.es(a).localeCompare(D.es(b))),
    sideBets: D.SIDE_BETS,
    // en vivo (ESPN) + cierre automático
    espnEvents: [], espnAt: 0, liveBusy: false, nowTs: 0, outcome: null, extrasActual: {}, _espnTimer: null, explain: null,
    extrasActualEdit: { revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} },
    // datos
    entries: [], ranked: [], results: {}, rEdit: defaultREdit(), koEdit: defaultKoEdit(), liveBr: { teamsByMatch: {}, winnerOf: {}, complete: false },
    // admin
    adminOk: false, adminPin: "", settings: Object.assign({}, D.DEFAULT_SCORING),
    scoreKeys: [
      { key: "exact", label: "Marcador exacto (partido)" }, { key: "gd", label: "Resultado + diferencia" }, { key: "result", label: "Solo tendencia (1/X/2)" },
      { key: "g1", label: "Acertar 1º de grupo" }, { key: "g2", label: "Acertar 2º de grupo" },
      { key: "g3", label: "Acertar 3º de grupo" }, { key: "qual", label: "Equipo que clasifica (top 2)" },
      { key: "groupExact", label: "Bonus: grupo en orden exacto" },
      { key: "thirdQual", label: "Tercero que clasifica" }, { key: "octavos", label: "Llega a octavos" },
      { key: "cuartos", label: "Llega a cuartos" }, { key: "semis", label: "Llega a semifinal" },
      { key: "finalists", label: "Llega a la final" }, { key: "champion", label: "Campeón del mundo" },
    ],
    // probabilidades
    lastProb: false, simN: 0, probData: {},
    boardLocked: false, usingServerBoard: false, boardIncomplete: 0,
    selectedId: null, det: null,
    koMeta: KO_META,

    // ---------- helpers de presentación ----------
    es: (t) => D.es(t), flag: (t) => D.flag(t),
    rankClass(i) { return i < 2 ? "qual" : i === 2 ? "third" : "out"; },
    pct(x) { if (x == null) return "—"; const v = x * 100; return (v >= 9.95 ? v.toFixed(0) : v.toFixed(1)) + "%"; },
    groupFixtures(L) { return D.GROUP_FIXTURES.filter((f) => f.group === L); },
    scoreTxt(code) {
      const g = this.outcome && this.outcome.groupMap && this.outcome.groupMap[code];
      const r = g || this.results[code];
      return r && r.played && r.home_score != null ? `${r.home_score} - ${r.away_score}` : "— : —";
    },
    get playedTxt() {
      const done = (this.espnEvents || []).filter((ev) => ev.status && ev.status.type && ev.status.type.completed).length;
      const dbDone = Object.values(this.results).filter((r) => r && r.played).length;
      const n = Math.max(done, dbDone);
      return n ? `${n} partido${n > 1 ? "s" : ""} jugado${n > 1 ? "s" : ""}` : "Aún no hay partidos jugados";
    },
    koLabel(name) {
      return (name || "").replace("Group ", "Grupo ").replace(" Winner", " (ganador)").replace(" 2nd Place", " (2º)")
        .replace("Round of 32", "1/16").replace("Round of 16", "Octavos").replace("Quarterfinal", "Cuartos")
        .replace("Semifinal", "Semis").replace(/Third Place.*/, "3º clasificado").replace(" Loser", " (perdedor)");
    },
    // --- fechas/horas en hora de España (Madrid) ---
    _d(iso) { if (!iso) return null; let s = String(iso); if (/T\d\d:\d\dZ$/.test(s)) s = s.replace("Z", ":00Z"); const d = new Date(s); return isNaN(d.getTime()) ? null : d; },
    madridTime(iso) { const d = this._d(iso); if (!d) return ""; try { return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false }).format(d); } catch (e) { return ""; } },
    madridDayLong(iso) { const d = this._d(iso); if (!d) return ""; try { const s = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", weekday: "long", day: "numeric", month: "long" }).format(d); return s.charAt(0).toUpperCase() + s.slice(1); } catch (e) { return ""; } },
    madridDayShort(iso) { const d = this._d(iso); if (!d) return ""; try { return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", weekday: "short", day: "numeric", month: "short" }).format(d); } catch (e) { return ""; } },
    _dayKey(iso) { const d = this._d(iso); if (!d) return (iso || "").slice(0, 10); try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(d); } catch (e) { return (iso || "").slice(0, 10); } },

    get liveMatches() {
      const out = [];
      for (const ev of (this.espnEvents || [])) {
        const comp = ev.competitions && ev.competitions[0]; if (!comp) continue;
        const cs = comp.competitors || []; if (cs.length !== 2) continue;
        const H = cs.find((c) => c.homeAway === "home") || cs[0], A = cs.find((c) => c.homeAway === "away") || cs[1];
        const st = (ev.status && ev.status.type) || {};
        const cH = D.espnCanon(H.team.displayName), cA = D.espnCanon(A.team.displayName);
        const venue = (comp.venue && comp.venue.address && comp.venue.address.city) ? String(comp.venue.address.city).split(",")[0].trim() : ((comp.venue && comp.venue.fullName) || "");
        out.push({
          id: ev.id, ts: this._d(ev.date) ? this._d(ev.date).getTime() : 0, venue,
          time: this.madridTime(ev.date), dayShort: this.madridDayShort(ev.date), dayLong: this.madridDayLong(ev.date), dayKey: this._dayKey(ev.date),
          hCanon: cH, aCanon: cA,
          hName: cH ? D.es(cH) : this.koLabel(H.team.displayName), hFlag: cH ? D.flag(cH) : "🏳️",
          aName: cA ? D.es(cA) : this.koLabel(A.team.displayName), aFlag: cA ? D.flag(cA) : "🏳️",
          hs: H.score, as: A.score, live: st.state === "in", done: !!st.completed, pre: st.state === "pre",
          status: st.shortDetail || st.detail || st.description || "",
        });
      }
      out.sort((a, b) => a.ts - b.ts);
      return out;
    },
    get liveGroups() {
      const seen = {}, out = [];
      for (const m of this.liveMatches) {
        if (!m.live) continue;
        const g = m.hCanon && TEAM_GROUP[m.hCanon];
        if (g && g === (m.aCanon && TEAM_GROUP[m.aCanon]) && !seen[g]) { seen[g] = true; out.push({ letter: g, match: m }); }
      }
      return out.sort((a, b) => a.letter.localeCompare(b.letter));
    },
    groupPredictions(L) {
      return (this.entries || [])
        .filter((e) => e.picks && e.picks.groups && e.picks.groups[L] && e.picks.groups[L].length === 4)
        .map((e) => ({ id: e.id, name: e.first_name + " " + e.last_name, me: e.id === this.me.id, bot: (e.first_name || "").startsWith("🤖"), order: e.picks.groups[L] }));
    },
    // ---------- "lo que ha puesto cada uno" por PARTIDO (marcadores en directo) ----------
    matchFx(m) { return (m && m.hCanon && m.aCanon) ? (PAIR_FX[[m.hCanon, m.aCanon].slice().sort().join("|")] || null) : null; },
    matchActual(code) {
      const g = this.outcome && this.outcome.groupMap && this.outcome.groupMap[code];
      const r = g || this.results[code];
      return (r && r.played && r.home_score != null && r.away_score != null) ? [r.home_score, r.away_score] : null;
    },
    matchPicks(code) {
      if (!code) return [];
      const act = this.matchActual(code);
      const out = [];
      for (const e of (this.entries || [])) {
        const sc = e.picks && e.picks.scores && e.picks.scores[code];
        if (!sc || sc[0] == null || sc[1] == null) continue;
        let hit = "";
        if (act) { if (sc[0] === act[0] && sc[1] === act[1]) hit = "exact"; else if (Math.sign(sc[0] - sc[1]) === Math.sign(act[0] - act[1])) hit = "tend"; }
        out.push({ id: e.id, name: e.first_name + " " + e.last_name, me: e.id === this.me.id, bot: (e.first_name || "").startsWith("🤖"), h: sc[0], a: sc[1], hit });
      }
      out.sort((x, y) => ((y.me ? 1 : 0) - (x.me ? 1 : 0)) || (x.hit === "exact" ? -1 : 0) - (y.hit === "exact" ? -1 : 0) || x.name.localeCompare(y.name));
      return out;
    },
    matchPicksOpen(m) { return this.matchFx(m) && (m.live || this.openMatch === this.matchFx(m)); },
    toggleMatch(m) { const c = this.matchFx(m); if (!c) return; this.openMatch = this.openMatch === c ? null : c; },
    get liveToday() {
      const live = this.liveMatches.filter((m) => m.live);
      if (live.length) return live;
      const upcoming = this.liveMatches.filter((m) => m.ts >= this.nowTs - 6 * 3600000);
      return (upcoming.length ? upcoming : this.liveMatches).slice(0, 10);
    },
    get todayKey() { return this._dayKey(new Date(this.nowTs || Date.now()).toISOString()); },
    get schedule() {
      const f = this.calFilter, today = this.todayKey, byDay = {};
      for (const m of this.liveMatches) {
        if (f === "spain" && m.hCanon !== "Spain" && m.aCanon !== "Spain") continue;
        if (f === "today" && m.dayKey !== today) continue;
        const k = m.dayKey || "?";
        if (!byDay[k]) byDay[k] = { key: k, label: m.dayLong, matches: [] };
        byDay[k].matches.push(m);
      }
      return Object.values(byDay).sort((a, b) => a.key.localeCompare(b.key));
    },

    // ---------- init ----------
    async init() {
      try { this.recent = JSON.parse(localStorage.getItem("porra_recent") || "[]"); } catch (e) { this.recent = []; }
      this.rebuild();
      this.nowTs = Date.now();
      setInterval(() => { this.nowTs = Date.now(); }, 20000);
      window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); this.deferredPrompt = e; });
      window.addEventListener("appinstalled", () => { this.deferredPrompt = null; this.showInstall = false; });
      this._espnTimer = setInterval(() => { if (!this.pool) return; if (this.tab === "leaderboard") this.loadBoard(); else if (this.tab === "results") this.fetchEspn(false); }, 60000);
      // Al volver a la pestaña/app, refresca al instante (clasificación siempre al día con lo que se está jugando).
      document.addEventListener("visibilitychange", () => { if (!document.hidden && this.pool) { if (this.tab === "leaderboard") this.loadBoard(); else if (this.tab === "results") this.fetchEspn(false); } });
      // El enlace carga directamente la porra Connector → el usuario solo pone nombre + apellido.
      // Reintenta si la red falla (datos móviles flojos / cold start) en vez de caer a la pantalla de inicio.
      const code = new URLSearchParams(location.search).get("porra");
      let ok = false;
      for (let i = 0; i < 4 && !ok; i++) {
        ok = await this.loadPool(code || DEFAULT_POOL);
        if (!ok) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
      this.booting = false; this.loadFailed = !ok;
    },
    async retryLoad() {
      this.loadFailed = false; this.booting = true;
      const code = new URLSearchParams(location.search).get("porra");
      const ok = await this.loadPool(code || DEFAULT_POOL);
      this.booting = false; this.loadFailed = !ok;
    },

    // ---------- cierre automático ----------
    get isLocked() { return !!(this.pool && (this.pool.locked || (this.pool.lock_at && this.nowTs >= Date.parse(this.pool.lock_at)))); },
    // "Gracia para completar": aunque la porra esté cerrada, este jugador puede rellenar los
    // cruces VACÍOS del cuadro (octavos→final). Lo ya enviado queda intocable (lo protege el servidor).
    get canFinishBracket() { return !!(this.me && this.me.finishGrace && this.isLocked); },
    bracketEditable(match) { return !this.isLocked || (this.canFinishBracket && !this.bracket[match]); },
    get lockCountdown() {
      if (!this.pool || !this.pool.lock_at) return null;
      const ms = Date.parse(this.pool.lock_at) - this.nowTs;
      if (ms <= 0) return null;
      if (ms < 3600000) return Math.max(1, Math.floor(ms / 60000)) + " min";
      return Math.floor(ms / 3600000) + " h"; // solo horas
    },

    // ---------- datos en vivo (ESPN, sin clave, CORS abierto) ----------
    async fetchEspn(force) {
      if (!force && Date.now() - this.espnAt < 40000 && this.espnEvents.length) { this.computeLive(); return; }
      this.liveBusy = true;
      try {
        const r = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200");
        const j = await r.json();
        if (j && j.events) { this.espnEvents = j.events; this.espnAt = Date.now(); }
      } catch (e) { /* mantener datos previos si falla */ }
      finally { this.liveBusy = false; this.computeLive(); }
    },
    computeLive() {
      this.outcome = Eng.outcomeFromEspn(this.espnEvents, this.results, this.extrasActual);
      this.computeScorers();
      if (this.tab === "results") {
        const mc = Eng.monteCarloTeams((this.outcome && this.outcome.groupMap) || {}, 3000, Math.random);
        this.teamProbs = mc.byTeam; this.teamProbsSims = mc.sims;
      }
      this.recomputeRanking();
      this.refreshLiveBracket();
      this.explain = this.buildExplain();
    },
    // ---------- explicación de la puntuación (modelo MARCADORES del Connector) ----------
    buildExplain() {
      const oc = this.outcome || Eng.liveOutcome(this.results);
      const S = this.settings;
      if (!oc || !this.entries || !this.entries.length) return null;
      const es = (t) => D.es(t);
      const groups = D.GROUP_LETTERS.map((L) => {
        const s = oc.standingsByGroup && oc.standingsByGroup[L];
        const order = oc.groupOrder && oc.groupOrder[L];
        const played = s ? Math.round(s.reduce((a, t) => a + (t.pj || 0), 0) / 2) : 0;
        let estado = "⏳ sin empezar", detalle = "";
        if (s && s._complete) { estado = "✅ terminado"; detalle = (order || s.map((x) => x.team)).map((t, i) => (i + 1) + "º " + es(t)).join(" · "); }
        else if (played > 0) { estado = "🔴 en juego (" + played + "/6)"; detalle = s.slice().map((t, i) => (i + 1) + "º " + es(t.team)).join(" · "); }
        return { L, estado, detalle, started: played > 0 };
      });
      const byId = {}; this.entries.forEach((e) => { byId[e.id] = e; });
      const people = (this.ranked || []).map((r) => {
        const e = byId[r.id]; if (!e || !e.picks) return null;
        const dp = Eng.derivePicks(e.picks);
        const bd = Eng.scoreBreakdown(dp, oc, S);
        const ex = Eng.scoreExtras(e.picks.extras, this.extrasActual, S);
        const cuadro = bd.octavos + bd.cuartos + bd.semis + bd.final + bd.campeon;
        const cats = [];
        if (bd.marcadores) cats.push("Marcadores " + bd.marcadores);
        if (bd.grupos) cats.push("Grupos " + bd.grupos);
        if (cuadro) cats.push("Cuadro " + cuadro);
        if (ex.total) cats.push("Especiales " + ex.total);
        return { id: r.id, name: (e.first_name + " " + e.last_name).trim(), total: bd.total + ex.total, summary: cats.join("  ·  ") || "Aún sin puntos", bits: this._explainBits(e.picks, oc, S, bd, ex) };
      }).filter(Boolean);
      return { groups, people };
    },
    _explainBits(picks, oc, S, bd, ex) {
      const es = (t) => D.es(t); const bits = [];
      // 1) marcadores por partido jugado (lo que puntúa en vivo)
      const act = oc.groupScores || oc.groupMap || {}; const preds = picks.scores || {};
      for (const fx of D.GROUP_FIXTURES) {
        const a = act[fx.code]; if (!a || !a.played || a.home_score == null || a.away_score == null) continue;
        const p = preds[fx.code]; if (!p || p[0] == null || p[1] == null) continue;
        const ah = a.home_score, aa = a.away_score, ph = p[0], pa = p[1];
        const m = es(fx.home) + " " + ah + "-" + aa + " " + es(fx.away);
        if (ph === ah && pa === aa) { bits.push({ icon: "🎯", text: m + ": ¡clavaste el marcador " + ph + "-" + pa + "! +" + S.exact }); continue; }
        if (Math.sign(ah - aa) !== Math.sign(ph - pa)) continue;   // ni el 1/X/2 → no se muestra
        const r = (ah - aa) === (ph - pa) ? (S.gd || S.result) : (S.result || 0);
        bits.push({ icon: "✅", text: m + ": acertaste el 1-X-2 (pusiste " + ph + "-" + pa + ") +" + r });
      }
      // 2) orden de grupo (SOLO cuando el grupo termina)
      for (const L of D.GROUP_LETTERS) {
        const a = oc.groupOrder[L]; const pred = picks.groups && picks.groups[L]; if (!a || !pred) continue;
        const ri = oc.groupRank && oc.groupRank[L]; const firm = (i) => !ri || (ri[i] && ri[i].firm);
        const dT = (t) => { const idx = a.indexOf(t); return idx < 0 ? false : (ri ? !!(ri[idx] && ri[idx].worstRank <= 1) : idx <= 1); };
        let g = 0, parts = [];
        if (pred[0] && pred[0] === a[0] && firm(0)) { g += S.g1; parts.push("1º " + es(pred[0]) + " +" + S.g1); }
        if (pred[1] && pred[1] === a[1] && firm(1)) { g += S.g2; parts.push("2º " + es(pred[1]) + " +" + S.g2); }
        if (pred[2] && pred[2] === a[2] && firm(2)) { g += S.g3; parts.push("3º " + es(pred[2]) + " +" + S.g3); }
        if (pred[0] && dT(pred[0])) { g += S.qual; parts.push(es(pred[0]) + " clasifica +" + S.qual); }
        if (pred[1] && dT(pred[1])) { g += S.qual; parts.push(es(pred[1]) + " clasifica +" + S.qual); }
        if (a.length === 4 && (!ri || ri.every((x) => x && x.firm)) && pred[0] === a[0] && pred[1] === a[1] && pred[2] === a[2] && pred[3] === a[3]) { g += (S.groupExact || 0); parts.push("🎁 orden exacto 1º-4º +" + S.groupExact); }
        if (g > 0) bits.push({ icon: "📊", text: "Grupo " + L + " (terminado): " + parts.join(", ") + "  = +" + g });
      }
      if (bd.terceros) bits.push({ icon: "🥉", text: "Mejores terceros que clasifican: +" + bd.terceros });
      [["octavos", "octavos"], ["cuartos", "cuartos"], ["semis", "semifinales"], ["final", "la final"]].forEach(([k, label]) => { if (bd[k]) bits.push({ icon: "🏆", text: "Equipos tuyos en " + label + ": +" + bd[k] }); });
      if (bd.campeon) bits.push({ icon: "👑", text: "¡Campeón acertado! +" + bd.campeon });
      if (ex.revelacion) bits.push({ icon: "✨", text: "Revelación acertada +" + ex.revelacion });
      if (ex.decepcion) bits.push({ icon: "💀", text: "Decepción acertada +" + ex.decepcion });
      if (ex.pichichi) bits.push({ icon: "⚽", text: "Pichichi acertado +" + ex.pichichi });
      if (ex.asistente) bits.push({ icon: "🅰️", text: "Asistente acertado +" + ex.asistente });
      if (ex.hattrick) bits.push({ icon: "🎩", text: "Hat-trick (apostó sí, y lo hubo) +" + ex.hattrick });
      if (ex.dobleRoja) bits.push({ icon: "🟥", text: "Doble roja (apostó sí, y la hubo) +" + ex.dobleRoja });
      return bits;
    },
    teamQ(team) { const p = this.teamProbs[team]; return p ? p.qualify : null; },
    computeScorers() {
      const goals = {}, assists = {};
      for (const ev of (this.espnEvents || [])) {
        const comp = ev.competitions && ev.competitions[0]; if (!comp) continue;
        const flagBy = {};
        for (const c of (comp.competitors || [])) { const canon = D.espnCanon(c.team && c.team.displayName); flagBy[c.team && c.team.id] = canon ? D.flag(canon) : "🏳️"; }
        for (const dd of (comp.details || [])) {
          if (!dd.scoringPlay) continue;
          const inv = dd.athletesInvolved || [];
          if (!dd.ownGoal && inv[0] && inv[0].displayName) {
            const a = inv[0], k = a.id || a.displayName;
            if (!goals[k]) goals[k] = { name: a.displayName, flag: flagBy[a.team && a.team.id] || "🏳️", n: 0 };
            goals[k].n++;
          }
          if (inv[1] && inv[1].displayName) {
            const a = inv[1], k = a.id || a.displayName;
            if (!assists[k]) assists[k] = { name: a.displayName, flag: flagBy[a.team && a.team.id] || "🏳️", n: 0 };
            assists[k].n++;
          }
        }
      }
      this.scorers = Object.values(goals).sort((a, b) => b.n - a.n).slice(0, 25);
      this.assisters = Object.values(assists).sort((a, b) => b.n - a.n).slice(0, 25);
    },
    get liveAgo() {
      if (!this.espnAt) return "";
      const s = Math.round((this.nowTs - this.espnAt) / 1000);
      return s < 60 ? "hace " + Math.max(1, s) + "s" : "hace " + Math.round(s / 60) + " min";
    },
    goHome() { this.view = "home"; this.pool = null; this.adminOk = false; this.adminPin = ""; history.replaceState(null, "", location.pathname); },

    // ---------- instalar en el móvil (PWA) ----------
    get isStandalone() { try { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; } catch (e) { return false; } },
    get isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent || ""); },
    async installApp() {
      if (!this.deferredPrompt) return;
      this.deferredPrompt.prompt();
      try { await this.deferredPrompt.userChoice; } catch (e) {}
      this.deferredPrompt = null; this.showInstall = false;
    },
    closeInstall() { this.showInstall = false; try { localStorage.setItem("porra_install_seen", "1"); } catch (e) {} },

    // ---------- toasts / rpc ----------
    toast(msg, kind = "ok") { const id = Math.random().toString(36).slice(2); this.toasts.push({ id, msg, kind }); setTimeout(() => { this.toasts = this.toasts.filter((t) => t.id !== id); }, 3800); },
    errMsg(e) { const m = (e && e.message) || ""; for (const k in ERRORS) if (m.includes(k)) return ERRORS[k]; return m || "Algo ha fallado, inténtalo de nuevo."; },
    async rpc(name, args) { const { data, error } = await sb.rpc(name, args); if (error) { const e = new Error(this.errMsg(error)); e.raw = (error && error.message) || ""; throw e; } return data; },

    // ---------- crear / unirse ----------
    async createPool() {
      const n = this.newPool;
      if (!n.code || n.code.trim().length < 3) return this.toast("Pon un código de al menos 3 letras.", "err");
      if (!n.pin || n.pin.trim().length < 4) return this.toast("El PIN debe tener 4+ caracteres.", "err");
      this.busy = true;
      try {
        await this.rpc("porra2_create_pool", { p_name: n.name, p_code: n.code, p_admin_pin: n.pin });
        this.adminPin = n.pin.trim(); this.adminOk = true;
        this.toast("¡Porra creada! 🎉 Comparte el código con tu grupo.");
        await this.loadPool(n.code);
      } catch (e) { this.toast(this.errMsg(e), "err"); } finally { this.busy = false; }
    },
    async joinPool() { if (!this.joinCode.trim()) return this.toast("Escribe el código de la porra.", "err"); await this.loadPool(this.joinCode); },

    async loadPool(code) {
      this.busy = true;
      try {
        const pool = await this.rpc("porra2_get_pool", { p_code: code });
        if (!pool) { this.toast(ERRORS.POOL_NOT_FOUND, "err"); return false; }
        this.pool = pool;
        this.settings = Object.assign({}, D.DEFAULT_SCORING, pool.settings || {});
        this.view = "pool"; this.tab = "play"; this.step = 1;
        this.adminOk = this.adminOk && this.adminPin ? this.adminOk : false;
        history.replaceState(null, "", location.pathname + "?porra=" + pool.code);
        this.rememberPool(pool);
        this.loadMine(pool.code);
        this.phase = this.me.id ? "hub" : "welcome"; this.gIdx = 0; this.chosenNew = false; this.confirmClaim = null; this.wmode = "choose"; this.entriesLoaded = false;
        await this.loadExtrasActual();
        await this.loadResults();
        await this.loadEntries();
        // Si mi id guardado ya no existe (p.ej. participante borrado), reconciliar por nombre o pedir el nombre otra vez.
        if (this.me.id && (this.entries || []).length && !this.entries.some((e) => e.id === this.me.id)) {
          const m = (this.entries || []).find((e) => this._sameName(e));
          if (m) { this.me.id = m.id; this._persistMe(); }
          else { this.me.id = null; this.me.saved = false; this.phase = "welcome"; }
        }
        if (this.me.id) this.tab = "leaderboard";   // quien ya juega entra directo a la Clasificación
        if (this.me.finishGrace) this.tab = "play";  // …salvo quien tiene permiso para terminar: a su porra, a completarla
        this.fetchEspn(true);
        if (this.tab === "leaderboard") this.loadBoard();
        return true;
      } catch (e) { this.toast(this.errMsg(e), "err"); return false; } finally { this.busy = false; }
    },
    async loadExtrasActual() {
      try { this.extrasActual = (await this.rpc("porra2_get_extras", {})) || {}; } catch (e) { this.extrasActual = {}; }
      this.extrasActualEdit = Object.assign({ revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} }, this.extrasActual, { sidebets: Object.assign({}, this.extrasActual.sidebets || {}) });
    },
    async saveExtrasActual() {
      this.busy = true;
      try {
        await this.rpc("porra2_set_extras", { p_pin: this.adminPin, p_extras: this.extrasActualEdit });
        this.extrasActual = JSON.parse(JSON.stringify(this.extrasActualEdit));
        this.toast("Respuestas de las especiales guardadas.");
        this.computeLive();
      } catch (e) { this.toast(this.errMsg(e), "err"); } finally { this.busy = false; }
    },
    rememberPool(pool) {
      this.recent = [{ code: pool.code, name: pool.name }].concat(this.recent.filter((r) => r.code !== pool.code)).slice(0, 6);
      localStorage.setItem("porra_recent", JSON.stringify(this.recent));
    },
    copyShare() {
      const url = location.origin + location.pathname + "?porra=" + this.pool.code;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
        .then(() => this.toast("🔗 Enlace copiado. Pásalo a tu grupo por WhatsApp."))
        .catch(() => this.toast("Comparte este enlace: " + url));
    },

    // ---------- carga local de mi quiniela ----------
    loadMine(code) {
      let mine = null, draft = null;
      try { mine = JSON.parse(localStorage.getItem("porra_me_" + code) || "null"); } catch (e) {}
      try { draft = JSON.parse(localStorage.getItem("porra_draft_" + code) || "null"); } catch (e) {}
      // Elegir la copia MÁS COMPLETA (el borrador se escribe en cada cambio → suele ser el más fresco;
      // así una recarga del móvil no pierde los pronósticos a medio rellenar).
      const fullness = (o) => { if (!o) return -1; const pk = o.picks || o; let n = 0; const s = pk.scores || {}; for (const k in s) { const v = s[k]; if (Array.isArray(v) && v[0] != null && v[1] != null) n++; } return n + Object.keys(pk.bracket || {}).length; };
      const src = fullness(draft) > fullness(mine) ? draft : (mine || draft);
      this.groups = emptyGroups(); this.scores = emptyScores(); this.thirds = []; this._thirdsTouched = false; this.bracket = {};
      this.extras = { revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} };
      this.me = { first: "", last: "", id: null, saved: false, finishGrace: false };
      if (mine) { this.me = { first: mine.first || "", last: mine.last || "", id: mine.id || null, saved: !!mine.id, finishGrace: false }; }
      else if (draft) { this.me.first = draft.first || ""; this.me.last = draft.last || ""; }
      if (src) {
        const p = src.picks || src;
        if (p.scores) for (const fx of D.GROUP_FIXTURES) if (Array.isArray(p.scores[fx.code])) this.scores[fx.code] = p.scores[fx.code].slice();
        this.thirds = (p.thirds || []).slice();
        this._thirdsTouched = p.thirdsTouched != null ? !!p.thirdsTouched : (this.thirds.length > 0);
        this.bracket = Object.assign({}, p.bracket || {});
        if (p.extras) this.extras = Object.assign({ revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} }, p.extras, { sidebets: Object.assign({}, p.extras.sidebets || {}) });
      }
      this.deriveGroups();
    },
    persistDraft() {
      if (!this.pool) return;
      localStorage.setItem("porra_draft_" + this.pool.code, JSON.stringify({ scores: this.scores, groups: this.groups, thirds: this.thirds, thirdsTouched: this._thirdsTouched, bracket: this.bracket, extras: this.extras, first: this.me.first, last: this.me.last }));
      this._scheduleSave();   // guardar también en el servidor (con retardo) para no perder nada
    },
    // Autoguardado al servidor: 1,5 s tras el último cambio (marcadores, cuadro, especiales…).
    _scheduleSave() {
      if ((this.isLocked && !this.canFinishBracket) || !this.me.id) return;
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => { if (this.me.id && (!this.isLocked || this.canFinishBracket)) this._save(true); }, 1500);
    },

    // ---------- paso 1: grupos ----------
    moveTeam(L, idx, dir) {
      if (this.isLocked) return;
      const j = idx + dir; if (j < 0 || j > 3) return;
      const a = this.groups[L]; const t = a[idx]; a[idx] = a[j]; a[j] = t;
      this.groups[L] = a.slice();
      this.reconcileThirds(); this.rebuild(); this.persistDraft();
    },
    // ---------- paso 2: terceros ----------
    toggleThird(team) {
      if (this.isLocked) return;
      this._thirdsTouched = true;   // el usuario ha personalizado sus terceros → respetar su selección
      const i = this.thirds.indexOf(team);
      if (i >= 0) this.thirds.splice(i, 1);
      else if (this.thirds.length < 8) this.thirds.push(team);
      else return this.toast("Ya has elegido 8 terceros. Quita uno para cambiar.", "warn");
      this.rebuild(); this.persistDraft();
    },
    reconcileThirds() { this.thirds = this.thirds.filter((t) => D.GROUP_LETTERS.some((L) => this.groups[L][2] === t)); },

    // ---------- marcadores exactos de la fase de grupos (lo nuevo de esta porra) ----------
    scoreVal(code, side) { const p = this.scores[code]; return p && p[side] != null ? p[side] : ""; },
    setScore(code, side, raw) {
      if (this.isLocked) return;
      let v = (raw === "" || raw == null) ? null : parseInt(raw, 10);
      if (v != null) v = isNaN(v) ? null : Math.max(0, Math.min(20, v));
      const pair = (this.scores[code] || [null, null]).slice();
      pair[side] = v; this.scores[code] = pair;
      this.deriveGroups(); this.persistDraft();
    },
    // Recalcula el orden de los 12 grupos a partir de los marcadores predichos (tabla en vivo)
    // y mantiene los 8 terceros SIEMPRE válidos y completos cuando ya están los 72 marcadores.
    deriveGroups() {
      const r = Eng.standingsFromScores(this.scores);
      this.derivedStandings = r.standingsByGroup;
      this.groups = r.order;
      if (r.complete && r.qualifiers) {
        const ranked = r.qualifiers.thirdsRanked.map((t) => t.team);   // los 12 terceros, ordenados (mejor primero)
        if (!this._thirdsTouched) {
          this.thirds = ranked.slice(0, 8);                            // sugerencia automática, siempre fresca con los marcadores
        } else {
          this.thirds = this.thirds.filter((t) => ranked.includes(t)); // quitar los que ya no son 3º de ningún grupo
          for (const t of ranked) { if (this.thirds.length >= 8) break; if (!this.thirds.includes(t)) this.thirds.push(t); } // recompletar hasta 8 (nunca dejar el cuadro a medias en silencio)
        }
      } else {
        this.reconcileThirds();   // incompleto: solo quitar terceros inválidos
      }
      this.rebuild();
    },
    derivedTable(L) { return (this.derivedStandings && this.derivedStandings[L]) || Eng.groupStandings(L, {}, false, null); },
    groupScoresFilled(L) { let n = 0; for (const fx of this.groupFixtures(L)) { const p = this.scores[fx.code]; if (p && p[0] != null && p[1] != null) n++; } return n; },
    groupScoresDone(L) { return this.groupScoresFilled(L) === 6; },
    get scoresFilled() { let n = 0; for (const fx of D.GROUP_FIXTURES) { const p = this.scores[fx.code]; if (p && p[0] != null && p[1] != null) n++; } return n; },
    get scoresComplete() { return this.scoresFilled === D.GROUP_FIXTURES.length; },
    // 8 mejores terceros AUTOMÁTICOS (de los marcadores): por puntos > diferencia de goles > goles a favor
    get autoThirds() {
      const r = Eng.standingsFromScores(this.scores);
      if (!r.qualifiers) return [];
      return r.qualifiers.thirdsRanked.slice(0, 8).map((t) => ({ team: t.team, group: t.group, pts: t.pts, gd: t.gd, gf: t.gf }));
    },

    // ---------- bracket ----------
    qualFromPicks() {
      const winners = {}, runnersUp = {}, thirdByGroup = {};
      for (const L of D.GROUP_LETTERS) { winners[L] = this.groups[L][0]; runnersUp[L] = this.groups[L][1]; thirdByGroup[L] = this.groups[L][2]; }
      const qualifiedThirdGroups = D.GROUP_LETTERS.filter((L) => this.thirds.includes(this.groups[L][2]));
      return { winners, runnersUp, thirdByGroup, qualifiedThirdGroups };
    },
    rebuild() {
      const q = this.qualFromPicks();
      const built = Eng.buildR32Teams(q);
      const tbm = {}; for (const m of D.R32) tbm[m.match] = built.teams[m.match];
      const b = this.bracket; const winnerOf = {};
      const valid = (mNum) => { const pair = tbm[mNum]; const w = b[mNum]; if (w && pair && (w === pair.a || w === pair.b)) return w; if (w !== undefined) delete b[mNum]; return null; };
      for (const m of D.R32) winnerOf[m.match] = valid(m.match);
      for (const list of [D.R16, D.QF, D.SF, [D.FINAL]]) for (const m of list) { tbm[m.match] = { a: winnerOf[m.a] || null, b: winnerOf[m.b] || null }; winnerOf[m.match] = valid(m.match); }
      const defs = [{ key: "r32", title: "1/16", list: D.R32 }, { key: "r16", title: "Octavos", list: D.R16 }, { key: "qf", title: "Cuartos", list: D.QF }, { key: "sf", title: "Semis", list: D.SF }, { key: "final", title: "Final", list: [D.FINAL] }];
      this._cols = defs.map((d) => ({ key: d.key, title: d.title, matches: d.list.map((m) => ({ match: m.match, a: tbm[m.match].a, b: tbm[m.match].b, aLabel: this.slotLabel(m.a), bLabel: this.slotLabel(m.b) })) }));
      this._champion = winnerOf[D.FINAL.match] || null;
    },
    // Qué le toca a un hueco vacío del cuadro (para que NUNCA salga "—" sin explicación).
    slotLabel(code) {
      if (code === "3rd") return "🥉 Mejor 3º";
      const s = String(code), i = s.indexOf("-");
      if (i < 0) return "Ganador";   // ronda posterior: depende de tu pick anterior
      const t = s.slice(0, i), g = s.slice(i + 1);
      return (t === "W" ? "1º Grupo " : t === "RU" ? "2º Grupo " : "") + g;
    },
    pickWinner(match, team) {
      if (!team || !this.bracketEditable(match)) return;
      this.bracket[match] = team; this.rebuild(); this.persistDraft();
      // auto-avanza a la siguiente ronda cuando completas la actual
      const c = this._cols[this.brRound];
      if (c && this.brRound < this._cols.length - 1 && c.matches.every((m) => this.bracket[m.match])) this.brRound++;
    },
    // navegación por rondas (móvil: una ronda cada vez)
    roundPicked(i) { const c = this._cols[i]; return c ? c.matches.filter((m) => this.bracket[m.match]).length : 0; },
    roundReady(i) { const c = this._cols[i]; return c ? c.matches.every((m) => m.a && m.b) : false; },
    brNext() { if (this.brRound < this._cols.length - 1) this.brRound++; },
    brPrev() { if (this.brRound > 0) this.brRound--; },
    get bracketCols() { return this._cols; },
    get myChampion() { return this._champion; },
    get bracketPicked() { let n = 0; for (const m of [...D.R32, ...D.R16, ...D.QF, ...D.SF, D.FINAL]) if (this.bracket[m.match]) n++; return n; },
    get bracketDone() { return this.bracketPicked === 31; },
    get prog() { return { groups: this.scoresComplete, bracket: this.bracketDone }; },

    goStep(n) {
      if (n >= 3 && this.thirds.length !== 8) { this.toast("Primero elige tus 8 mejores terceros.", "warn"); this.step = 2; return; }
      this.step = n; if (n === 3) this.rebuild(); this.persistDraft();
    },

    // ---------- asistente: guardar / navegación ----------
    get currentLetter() { return this.letters[this.gIdx]; },
    async _save(quiet) {
      if (this.isLocked && !this.canFinishBracket) { if (!quiet) this.toast(ERRORS.POOL_LOCKED, "err"); return false; }
      if (!this.me.first.trim() || !this.me.last.trim()) { if (!quiet) this.toast(ERRORS.NAME_REQUIRED, "err"); return false; }
      this.busy = true;
      try {
        return await this._doSave();
      } catch (e) {
        if (((e && e.raw) || "").includes("PARTICIPANT_NOT_FOUND")) {
          try {
            const r = await this.rpc("porra2_register", { p_code: this.pool.code, p_first: this.me.first, p_last: this.me.last });
            this.me.id = r.participant_id;
            return await this._doSave();
          } catch (e2) { if (!quiet) this.toast(this.errMsg(e2), "err"); return false; }
        }
        if (!quiet) this.toast(this.errMsg(e), "err");
        return false;
      } finally { this.busy = false; }
    },
    async _doSave() {
      const picks = { scores: this.scores, groups: this.groups, thirds: this.thirds, thirdsTouched: this._thirdsTouched, bracket: this.bracket, extras: this.extras };
      const res = await this.rpc("porra2_save_entry", { p_code: this.pool.code, p_first: this.me.first, p_last: this.me.last, p_picks: picks, p_participant_id: this.me.id });
      this.me.id = res.participant_id; this.me.saved = true;
      this._persistMe();
      await this.loadEntries({ recompute: false });
      return true;
    },
    chooseNew() { this.chosenNew = true; },
    askClaim(e) { this.claimFromName = false; this.confirmClaim = e; },
    cancelClaim() { this.confirmClaim = null; this.claimFromName = false; },
    rejectClaim() { const fromName = this.claimFromName; this.confirmClaim = null; this.claimFromName = false; if (fromName) this.createNew(); },
    _sameName(e) { const n = (s) => (s || "").trim().toLowerCase(); return n(e.first_name) === n(this.me.first) && n(e.last_name) === n(this.me.last); },
    // Botón de la pantalla de nombre: reconoce SIEMPRE si ya existe (espera a que cargue la lista; el servidor también revisa)
    async submitName() {
      if (!this.me.first.trim() || !this.me.last.trim()) return this.toast("Pon tu nombre y tu apellido.", "warn");
      if (!this.entries.length) { try { await this.loadEntries({ recompute: false }); } catch (e) {} }
      const m = (this.entries || []).find((e) => this._sameName(e));
      if (m) { this.claimFromName = true; this.confirmClaim = m; return; }   // ya existe ese nombre → confirmar y recuperar
      await this.registerOrClaim();                                          // sin match → crear (el servidor reclama si lo hubiera)
    },
    async registerOrClaim() {
      if (!this.me.first.trim() || !this.me.last.trim()) return this.toast("Pon tu nombre y tu apellido.", "warn");
      this.busy = true;
      try {
        const res = await this.rpc("porra2_register", { p_code: this.pool.code, p_first: this.me.first, p_last: this.me.last });
        this.me.id = res.participant_id; this.me.saved = true;
        this.me.finishGrace = !!res.finish_grace;
        if (res.claimed && res.picks && Object.keys(res.picks).length) this.applyPicks(res.picks);
        this._persistMe();
        this.chosenNew = false;
        if (res.claimed) { this.phase = "hub"; }                                  // ya existía → ve su resumen
        else { this.phase = "groups"; this.gIdx = 0; this.deriveGroups(); }        // nuevo → directo a poner marcadores
        this.toast(res.claimed ? ("¡Hola de nuevo, " + this.me.first + "! He recuperado tu porra. 👌") : ("¡A jugar, " + this.me.first + "! Empieza poniendo los marcadores. 🎯"));
      } catch (e) { this.toast(this.errMsg(e), "err"); }
      finally { this.busy = false; }
    },
    async createNew() {
      if (!this.me.first.trim() || !this.me.last.trim()) return this.toast("Pon tu nombre y tu apellido.", "warn");
      this.busy = true;
      try {
        const res = await this.rpc("porra2_register", { p_code: this.pool.code, p_first: this.me.first, p_last: this.me.last, p_force_new: true });
        this.me.id = res.participant_id; this.me.saved = true;
        this._persistMe();
        this.chosenNew = false; this.phase = "groups"; this.gIdx = 0; this.deriveGroups();
        this.toast("¡A jugar, " + this.me.first + "! Empieza poniendo los marcadores. 🎯");
      } catch (e) { this.toast(this.errMsg(e), "err"); }
      finally { this.busy = false; }
    },
    async doClaim() {
      const sel = this.confirmClaim; if (!sel) return;
      this.busy = true;
      try {
        const res = await this.rpc("porra2_claim", { p_code: this.pool.code, p_participant_id: sel.id });
        this.me.id = res.participant_id; this.me.first = res.first_name; this.me.last = res.last_name; this.me.saved = true;
        this.me.finishGrace = !!sel.finish_grace;   // permiso para completar el cuadro (si lo tiene)
        if (res.picks && Object.keys(res.picks).length) this.applyPicks(res.picks);
        this._persistMe();
        this.confirmClaim = null; this.claimFromName = false; this.chosenNew = false; this.phase = "hub";
        this.toast("¡Hola de nuevo, " + this.me.first + "! He recuperado tu porra. 👌");
      } catch (e) { this.toast(this.errMsg(e), "err"); }
      finally { this.busy = false; }
    },
    applyPicks(p) {
      this.groups = emptyGroups(); this.scores = emptyScores();
      if (p.scores) for (const fx of D.GROUP_FIXTURES) if (Array.isArray(p.scores[fx.code])) this.scores[fx.code] = p.scores[fx.code].slice();
      this.thirds = (p.thirds || []).slice();
      this._thirdsTouched = p.thirdsTouched != null ? !!p.thirdsTouched : (this.thirds.length > 0);
      this.bracket = Object.assign({}, p.bracket || {});
      this.extras = Object.assign({ revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} }, p.extras || {}, { sidebets: Object.assign({}, (p.extras && p.extras.sidebets) || {}) });
      this.deriveGroups();
    },
    _persistMe() {
      if (!this.pool) return;
      const picks = { scores: this.scores, groups: this.groups, thirds: this.thirds, thirdsTouched: this._thirdsTouched, bracket: this.bracket, extras: this.extras };
      try { localStorage.setItem("porra_me_" + this.pool.code, JSON.stringify({ id: this.me.id, first: this.me.first, last: this.me.last, picks })); } catch (e) {}
    },
    // panel "Mi porra" (resumen): navegación fácil + estado
    editSection(name) { this.deriveGroups(); if (name === "groups") this.gIdx = 0; if (name === "bracket") this.brRound = 0; this.phase = name; },
    goHub() { if (!this.isLocked || this.canFinishBracket) { this._save(true); this.toast("Guardado ✓"); } this.phase = "hub"; },
    // Cambiar de jugador (móvil compartido): cierra la sesión local y vuelve a pedir nombre.
    logout() {
      clearTimeout(this._saveTimer);
      if (this.pool) { try { localStorage.removeItem("porra_me_" + this.pool.code); localStorage.removeItem("porra_draft_" + this.pool.code); } catch (e) {} }
      this.me = { first: "", last: "", id: null, saved: false };
      this.groups = emptyGroups(); this.scores = emptyScores(); this.thirds = []; this._thirdsTouched = false; this.bracket = {};
      this.extras = { revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} };
      this.deriveGroups();
      this.chosenNew = false; this.confirmClaim = null; this.claimFromName = false; this.wmode = "choose";
      this.selectedId = null; this.det = null;
      this.phase = "welcome"; this.tab = "play";
      this.toast("Sesión cerrada. Pon tu nombre para entrar.");
    },
    get extrasFilled() { const e = this.extras, sb = e.sidebets || {}; return !!(e.revelacion || e.decepcion || e.pichichi || e.asistente || sb.hattrick || sb.dobleRoja); },
    get status() {
      const t = this.thirds.length, b = this.bracketPicked, e = this.extras, sb = e.sidebets || {}, missing = [];
      const sc = this.scoresFilled, scoresDone = this.scoresComplete;
      const exCount = ["revelacion", "decepcion", "pichichi", "asistente"].filter((k) => e[k]).length + ["hattrick", "dobleRoja"].filter((k) => sb[k]).length;
      const extrasDone = exCount === 6;
      const generalDone = scoresDone && b === 31;   // los terceros salen solos de los marcadores (no se eligen)
      if (!scoresDone) missing.push("poner " + (72 - sc) + " marcador" + (72 - sc > 1 ? "es" : "") + " más (" + sc + "/72)");
      if (b !== 31) missing.push("completar el cuadro (" + b + "/31)");
      if (!extrasDone) missing.push("las predicciones especiales (" + exCount + "/6)");
      return {
        scores: scoresDone, scoresTxt: sc + "/72",
        thirds: t === 8, thirdsTxt: t + "/8", bracket: b === 31, bracketTxt: b + "/31",
        extras: extrasDone, extrasTxt: exCount + "/6", generalDone, complete: generalDone && extrasDone, missing,
      };
    },
    startGroups() { this.phase = "groups"; this.gIdx = 0; this.deriveGroups(); },
    nextGroup() { if (this.gIdx < 11) { this.gIdx++; this.persistDraft(); } else { this.rebuild(); this.brRound = 0; this.phase = "bracket"; this._save(true); } },
    prevGroup() { if (this.gIdx > 0) this.gIdx--; else this.goHub(); },
    goBracketPhase() { this.rebuild(); this.brRound = 0; this.phase = "bracket"; this._save(true); },
    goExtras() { this.phase = "extras"; this._save(true); },
    toggleSideBet(key, val) { if (this.isLocked) return; this.extras.sidebets[key] = this.extras.sidebets[key] === val ? "" : val; this.persistDraft(); },
    async finishPorra() {
      const ok = await this._save(false);
      if (ok) { this.phase = "hub"; this.toast("💾 ¡Porra guardada!"); }
    },

    // ---------- cargar resultados / participantes ----------
    async loadResults() {
      const rows = await this.rpc("porra2_get_results", {});
      const map = {}; (rows || []).forEach((r) => { map[r.match_code] = r; });
      this.results = map;
      // rEdit (grupos)
      const re = {}; for (const fx of D.GROUP_FIXTURES) { const r = map[fx.code]; re[fx.code] = { h: r ? r.home_score : null, a: r ? r.away_score : null }; }
      this.rEdit = re;
      this.refreshLiveBracket();
      // koEdit (eliminatorias) prefill
      const ke = {};
      for (const m of KO_META) {
        const r = map[String(m.match)];
        const pred = this.liveBr.teamsByMatch[m.match] || {};
        ke[m.match] = { home: r ? r.home_team || "" : (pred.a || ""), away: r ? r.away_team || "" : (pred.b || ""), h: r ? r.home_score : null, a: r ? r.away_score : null, winner: r ? r.winner || "" : "" };
      }
      this.koEdit = ke;
      this.computeLive();
    },
    async loadEntries(opts) {
      let entries;
      if (this.adminOk && this.adminPin) {
        try { const r = await this.rpc("porra2_list_entries_admin", { p_code: this.pool.code, p_pin: this.adminPin }); entries = r.entries; }
        catch (e) { const res = await this.rpc("porra2_list_entries", { p_code: this.pool.code }); entries = res.entries; }
      } else {
        const res = await this.rpc("porra2_list_entries", { p_code: this.pool.code }); entries = res.entries;
      }
      this.entries = entries || [];
      this.entriesLoaded = true;
      const meE = this.me.id ? this.entries.find((e) => e.id === this.me.id) : null;
      this.me.finishGrace = !!(meE && meE.finish_grace);   // ¿tiene permiso para completar el cuadro?
      if (!opts || opts.recompute !== false) this.recomputeRanking();
    },

    // ---------- ver la quiniela de un participante ----------
    get canViewPicks() { return !!this.pool; },   // quinielas públicas: todos ven la de todos
    get detRank() { return (this.ranked || []).find((r) => r.id === this.selectedId) || null; },
    toggleDetail(id) {
      const e = this.entries.find((x) => x.id === id);
      if (!e) return;
      if (!e.picks) { this.toast("Este participante aún no ha guardado su porra.", "warn"); return; }
      if (this.selectedId === id) { this.selectedId = null; this.det = null; }
      else { this.selectedId = id; this.det = this._computeDetail(id); }
    },
    _computeDetail(id) {
      const e = this.entries.find((x) => x.id === id);
      if (!e || !e.picks) return null;
      const dp = Eng.derivePicks(e.picks);
      const oc = this.outcome || Eng.liveOutcome(this.results);
      const bd = Eng.scoreBreakdown(dp, oc, this.settings);
      const ex = Eng.scoreExtras(e.picks.extras, this.extrasActual, this.settings);
      const ord = (set) => [...set].sort((a, b) => D.es(a).localeCompare(D.es(b)));
      return {
        name: e.first_name + " " + e.last_name,
        champion: dp.champion, finalists: ord(dp.final), semis: ord(dp.semis),
        cuartos: ord(dp.cuartos), octavos: ord(dp.octavos),
        groups: e.picks.groups || {}, thirds: e.picks.thirds || [], bd,
        extras: e.picks.extras || {}, ex, total: bd.total + ex.total,
      };
    },
    refreshLiveBracket() {
      const standings = {}; let complete = true;
      for (const L of D.GROUP_LETTERS) { const s = Eng.groupStandings(L, this.results, false, null); standings[L] = s; if (!s._complete) complete = false; }
      const wOf = (n) => { const r = this.results[n] || this.results[String(n)]; return r && r.played && r.winner ? r.winner : null; };
      const tbm = {};
      let built = null;
      if (complete) { try { built = Eng.buildR32Teams(Eng.computeQualifiers(standings)); } catch (e) {} }
      const stored = (n) => this.results[String(n)];
      for (const m of D.R32) { const r = stored(m.match); tbm[m.match] = r && r.home_team ? { a: r.home_team, b: r.away_team } : (built ? built.teams[m.match] : { a: null, b: null }); }
      const winnerOf = {}; for (const m of D.R32) winnerOf[m.match] = wOf(m.match);
      for (const list of [D.R16, D.QF, D.SF, [D.FINAL]]) for (const m of list) {
        const r = stored(m.match);
        tbm[m.match] = { a: r && r.home_team ? r.home_team : (winnerOf[m.a] || null), b: r && r.away_team ? r.away_team : (winnerOf[m.b] || null) };
        winnerOf[m.match] = wOf(m.match);
      }
      this.liveBr = { teamsByMatch: tbm, winnerOf, complete };
    },
    get koReady() { return this.liveBr.complete; },
    get liveBracketCols() {
      const defs = [{ key: "r32", title: "1/16", list: D.R32 }, { key: "r16", title: "Octavos", list: D.R16 }, { key: "qf", title: "Cuartos", list: D.QF }, { key: "sf", title: "Semis", list: D.SF }, { key: "final", title: "Final", list: [D.FINAL] }];
      return defs.map((d) => ({ key: d.key, title: d.title, matches: d.list.map((m) => ({ match: m.match, a: this.liveBr.teamsByMatch[m.match] ? this.liveBr.teamsByMatch[m.match].a : null, b: this.liveBr.teamsByMatch[m.match] ? this.liveBr.teamsByMatch[m.match].b : null })) }));
    },
    koWinner(match) { return this.liveBr.winnerOf[match] || null; },
    get koAdminList() { return KO_META; },

    liveTable(L) { return (this.outcome && this.outcome.standingsByGroup && this.outcome.standingsByGroup[L]) || Eng.groupStandings(L, this.results, false, null); },

    // ---------- clasificación + probabilidades ----------
    openLeaderboard() { this.tab = "leaderboard"; this.selectedId = null; this.det = null; this.loadBoard(); },
    openQuinielas() { this.tab = "quinielas"; this.selectedId = null; this.det = null; this.loadEntries({ recompute: false }); if (!this.ranked.length) this.loadBoard(); },
    get quinielaCards() {
      const rankMap = {}; (this.ranked || []).forEach((r) => { rankMap[r.id] = r; });
      const arr = (this.entries || []).map((e) => {
        let champion = null;
        if (e.picks) { try { champion = Eng.derivePicks(e.picks).champion; } catch (x) {} }
        const rr = rankMap[e.id];
        return { id: e.id, name: (e.first_name + " " + e.last_name).trim(), first_name: e.first_name, complete: rr ? rr.complete !== false : !!e.picks, hasPicks: !!e.picks, champion, isMe: e.id === this.me.id };
      });
      arr.sort((a, b) => (b.hasPicks - a.hasPicks) || a.name.localeCompare(b.name));
      return arr;
    },
    async loadBoard() {
      if (!this.pool) return;
      this.probBusy = true;
      let ok = false;
      try {
        const { data, error } = await sb.functions.invoke("porra-prob-connector", { body: { code: this.pool.code } });
        if (!error && data && !data.error && Array.isArray(data.rows)) {
          this.usingServerBoard = true;
          this.boardLocked = !!data.locked;
          this.simN = data.sims || 4000; this.lastProb = true;
          this.ranked = data.rows.map((r) => ({ id: r.id, first_name: r.first_name, last_name: r.last_name, points: r.points, win: r.win, podium: r.podium, avg: r.avg, complete: r.complete }));
          this.boardIncomplete = data.incomplete || 0;
          ok = true;
        }
      } catch (e) { /* fallback abajo */ }
      // marcadores en vivo + picks (no deben afectar a la tabla del servidor)
      try { await this.loadResults(); if (ok) await this.loadEntries({ recompute: false }); } catch (e) {}
      if (!ok) { this.usingServerBoard = false; try { await this.refreshBoard(); } catch (e) {} }
      try { await this.fetchEspn(false); } catch (e) {}
      this.explain = this.buildExplain();
      this.probBusy = false;
    },
    openResults() { this.tab = "results"; this.fetchEspn(false); this.loadEntries({ recompute: false }); },
    async refreshBoard() { await this.loadResults(); await this.loadEntries(); },
    recomputeRanking() {
      if (this.usingServerBoard) { if (this.selectedId) this.det = this._computeDetail(this.selectedId); return; }
      const oc = this.outcome || Eng.liveOutcome(this.results); const S = this.settings;
      const arr = this.entries.map((e) => {
        let base = 0, extra = 0;
        if (e.picks) {
          try { base = Eng.scoreEntry(Eng.derivePicks(e.picks), oc, S); } catch (x) {}
          try { extra = Eng.scoreExtras(e.picks.extras, this.extrasActual, S).total; } catch (x) {}
        }
        const pr = this.probData[e.id];
        return Object.assign({}, e, { points: base + extra, basePoints: base, extraPts: extra, win: pr ? pr.win : null, podium: pr ? pr.podium : null, avg: pr ? pr.avg : null });
      });
      arr.sort((a, b) => (b.points - a.points) || ((b.win || 0) - (a.win || 0)) || a.last_name.localeCompare(b.last_name));
      this.ranked = arr;
      if (this.selectedId) this.det = this._computeDetail(this.selectedId);
    },
    runProbabilities() {
      const S = this.settings;
      const mcEntries = this.entries.filter((e) => e.picks).map((e) => ({ id: e.id, picks: Eng.derivePicks(e.picks), extraPts: Eng.scoreExtras(e.picks.extras, this.extrasActual, S).total }));
      if (!mcEntries.length) return this.toast("No hay quinielas guardadas todavía.", "warn");
      this.simN = mcEntries.length > 60 ? 1500 : mcEntries.length > 30 ? 2500 : 4000;
      // Base de la simulación: resultados de DB (incluye eliminatorias por nº de partido) + marcadores de grupo en vivo.
      const simResults = Object.assign({}, this.results, (this.outcome && this.outcome.groupMap) || {});
      this.probBusy = true;
      setTimeout(() => {
        try {
          const mc = Eng.monteCarlo(mcEntries, simResults, this.simN, S, Math.random);
          this.probData = mc.byId; this.lastProb = true; this.recomputeRanking();
          this.toast("🎲 Probabilidades actualizadas (" + this.simN.toLocaleString("es") + " simulaciones).");
        } catch (e) { this.toast("Error simulando: " + e.message, "err"); }
        finally { this.probBusy = false; }
      }, 60);
    },

    // ---------- admin ----------
    async checkAdmin() {
      if (!this.adminPin) return;
      this.busy = true;
      try { const ok = await this.rpc("porra2_check_master", { p_pin: this.adminPin }); if (ok) { this.adminOk = true; this.toast("🔓 Acceso admin concedido."); } else this.toast(ERRORS.BAD_PIN, "err"); }
      catch (e) { this.toast(this.errMsg(e), "err"); } finally { this.busy = false; }
    },
    async toggleLock() {
      this.busy = true;
      try {
        await this.rpc("porra2_lock_pool", { p_code: this.pool.code, p_pin: this.adminPin, p_locked: !this.pool.locked, p_lock_at: null });
        const pool = await this.rpc("porra2_get_pool", { p_code: this.pool.code }); this.pool = pool;
        this.toast(pool.locked ? "🔒 Porra cerrada. ¡Que empiece el Mundial!" : "🔓 Porra reabierta.");
        await this.loadEntries();
      } catch (e) { this.toast(this.errMsg(e), "err"); } finally { this.busy = false; }
    },
    async saveSettings() {
      this.busy = true;
      try { await this.rpc("porra2_set_settings", { p_code: this.pool.code, p_pin: this.adminPin, p_settings: this.settings }); this.pool.settings = Object.assign({}, this.settings); this.toast("Puntuación guardada."); this.recomputeRanking(); }
      catch (e) { this.toast(this.errMsg(e), "err"); } finally { this.busy = false; }
    },
    async saveGroupResult(fx) {
      const e = this.rEdit[fx.code];
      if (e.h == null || e.a == null || e.h === "" || e.a === "") return this.toast("Pon el marcador completo.", "warn");
      this.busy = true;
      try {
        await this.rpc("porra2_set_result", { p_pin: this.adminPin, p_match_code: fx.code, p_stage: "group", p_home_team: fx.home, p_away_team: fx.away, p_home_score: Number(e.h), p_away_score: Number(e.a), p_winner: null, p_played: true });
        this.toast(`Guardado: ${D.es(fx.home)} ${e.h}-${e.a} ${D.es(fx.away)}`);
        await this.loadResults();
      } catch (er) { this.toast(this.errMsg(er), "err"); } finally { this.busy = false; }
    },
    async saveKoResult(m) {
      const e = this.koEdit[m.match];
      if (!e.home || !e.away) return this.toast("Indica los dos equipos del cruce.", "warn");
      if (!e.winner) return this.toast("Indica quién pasa de ronda.", "warn");
      this.busy = true;
      try {
        await this.rpc("porra2_set_result", { p_pin: this.adminPin, p_match_code: String(m.match), p_stage: m.stageKey, p_home_team: e.home, p_away_team: e.away, p_home_score: e.h == null || e.h === "" ? null : Number(e.h), p_away_score: e.a == null || e.a === "" ? null : Number(e.a), p_winner: e.winner, p_played: true });
        this.toast(`M${m.match} guardado · pasa ${D.es(e.winner)}`);
        await this.loadResults();
      } catch (er) { this.toast(this.errMsg(er), "err"); } finally { this.busy = false; }
    },
    async deleteEntry(e) {
      if (!confirm(`¿Borrar la quiniela de ${e.first_name} ${e.last_name}?`)) return;
      this.busy = true;
      try { await this.rpc("porra2_delete_entry", { p_code: this.pool.code, p_pin: this.adminPin, p_participant_id: e.id }); this.toast("Quiniela borrada."); await this.loadEntries(); }
      catch (er) { this.toast(this.errMsg(er), "err"); } finally { this.busy = false; }
    },
    async autoSync() {
      this.syncBusy = true; this.syncMsg = "";
      try {
        const { data, error } = await sb.functions.invoke("porra-sync-connector", { body: { pin: this.adminPin } });
        if (error) throw error;
        this.syncMsg = (data && data.message) || "Sincronizado.";
        await this.loadResults();
      } catch (e) {
        this.syncMsg = "Sincronizador automático no configurado todavía — mete los resultados a mano aquí abajo (siempre funciona).";
      } finally { this.syncBusy = false; }
    },
  };
};
