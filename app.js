/* ============================================================================
   PORRA MUNDIAL 2026 · CONNECTOR — App (Alpine + Supabase)
   Porra independiente con MARCADORES EXACTOS de la fase de grupos.
   ========================================================================== */
// Proyecto Supabase propio de la porra Connector (se rellena al desplegar).
const SUPA_URL = "__CONNECTOR_SUPABASE_URL__";
const SUPA_KEY = "__CONNECTOR_SUPABASE_PUBLISHABLE_KEY__";
const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
const D = window.PORRA_DATA;
const Eng = window.PorraEngine;

const ALL_TEAMS = [].concat(...D.GROUP_LETTERS.map((L) => D.GROUPS[L]));
const TEAM_GROUP = (function () { const m = {}; for (const L of D.GROUP_LETTERS) for (const t of D.GROUPS[L]) m[t] = L; return m; })();
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
  BAD_PIN: "PIN incorrecto.",
  PARTICIPANT_NOT_FOUND: "No encuentro tu quiniela en esta porra.",
};

window.porraApp = function () {
  return {
    // navegación
    view: "home", tab: "play", step: 1, rTab: "cal", aTab: "groups", calFilter: "all",
    teamProbs: {}, teamProbsSims: 0, scorers: [], assisters: [],
    phase: "welcome", gIdx: 0, chosenNew: false, confirmClaim: null, claimFromName: false,
    wmode: "choose", entriesLoaded: false,
    // estado porra / jugador
    pool: null, me: { first: "", last: "", id: null, saved: false },
    joinCode: "", newPool: { name: "", code: "", pin: "" }, recent: [],
    // ui
    toasts: [], busy: false, probBusy: false, syncBusy: false, syncMsg: "",
    showInstall: false, deferredPrompt: null,
    // pronósticos
    groups: emptyGroups(), scores: emptyScores(), derivedStandings: {}, thirds: [], bracket: {}, _cols: [], _champion: null,
    extras: { revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} },
    letters: D.GROUP_LETTERS, allTeams: ALL_TEAMS.slice().sort((a, b) => D.es(a).localeCompare(D.es(b))),
    sideBets: D.SIDE_BETS,
    // en vivo (ESPN) + cierre automático
    espnEvents: [], espnAt: 0, liveBusy: false, nowTs: 0, outcome: null, extrasActual: {}, _espnTimer: null,
    extrasActualEdit: { revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} },
    // datos
    entries: [], ranked: [], results: {}, rEdit: defaultREdit(), koEdit: defaultKoEdit(), liveBr: { teamsByMatch: {}, winnerOf: {}, complete: false },
    // admin
    adminOk: false, adminPin: "", settings: Object.assign({}, D.DEFAULT_SCORING),
    scoreKeys: [
      { key: "exact", label: "Marcador exacto (partido)" }, { key: "gd", label: "Resultado + diferencia" }, { key: "result", label: "Solo tendencia (1/X/2)" },
      { key: "g1", label: "Acertar 1º de grupo" }, { key: "g2", label: "Acertar 2º de grupo" },
      { key: "g3", label: "Acertar 3º de grupo" }, { key: "qual", label: "Equipo que clasifica (top 2)" },
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
      // Mostrar el tutorial de instalación una sola vez (primera visita, si no es ya una app)
      try { if (!this.isStandalone && !localStorage.getItem("porra_install_seen")) setTimeout(() => { if (!this.isStandalone) this.showInstall = true; }, 1800); } catch (e) {}
      this._espnTimer = setInterval(() => { if (!this.pool) return; if (this.tab === "leaderboard") this.loadBoard(); else if (this.tab === "results") this.fetchEspn(false); }, 60000);
      const code = new URLSearchParams(location.search).get("porra");
      if (code) await this.loadPool(code);
    },

    // ---------- cierre automático ----------
    get isLocked() { return !!(this.pool && (this.pool.locked || (this.pool.lock_at && this.nowTs >= Date.parse(this.pool.lock_at)))); },
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
        await this.rpc("porra_create_pool", { p_name: n.name, p_code: n.code, p_admin_pin: n.pin });
        this.adminPin = n.pin.trim(); this.adminOk = true;
        this.toast("¡Porra creada! 🎉 Comparte el código con tu grupo.");
        await this.loadPool(n.code);
      } catch (e) { this.toast(this.errMsg(e), "err"); } finally { this.busy = false; }
    },
    async joinPool() { if (!this.joinCode.trim()) return this.toast("Escribe el código de la porra.", "err"); await this.loadPool(this.joinCode); },

    async loadPool(code) {
      this.busy = true;
      try {
        const pool = await this.rpc("porra_get_pool", { p_code: code });
        if (!pool) { this.toast(ERRORS.POOL_NOT_FOUND, "err"); return; }
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
        this.fetchEspn(true);
      } catch (e) { this.toast(this.errMsg(e), "err"); } finally { this.busy = false; }
    },
    async loadExtrasActual() {
      try { this.extrasActual = (await this.rpc("porra_get_extras", {})) || {}; } catch (e) { this.extrasActual = {}; }
      this.extrasActualEdit = Object.assign({ revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} }, this.extrasActual, { sidebets: Object.assign({}, this.extrasActual.sidebets || {}) });
    },
    async saveExtrasActual() {
      this.busy = true;
      try {
        await this.rpc("porra_set_extras", { p_pin: this.adminPin, p_extras: this.extrasActualEdit });
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
      const src = mine || draft;
      this.groups = emptyGroups(); this.scores = emptyScores(); this.thirds = []; this.bracket = {};
      this.extras = { revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} };
      this.me = { first: "", last: "", id: null, saved: false };
      if (mine) { this.me = { first: mine.first || "", last: mine.last || "", id: mine.id || null, saved: !!mine.id }; }
      else if (draft) { this.me.first = draft.first || ""; this.me.last = draft.last || ""; }
      if (src) {
        const p = src.picks || src;
        if (p.scores) for (const fx of D.GROUP_FIXTURES) if (Array.isArray(p.scores[fx.code])) this.scores[fx.code] = p.scores[fx.code].slice();
        this.thirds = (p.thirds || []).slice();
        this.bracket = Object.assign({}, p.bracket || {});
        if (p.extras) this.extras = Object.assign({ revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} }, p.extras, { sidebets: Object.assign({}, p.extras.sidebets || {}) });
      }
      this.deriveGroups();
    },
    persistDraft() {
      if (!this.pool) return;
      localStorage.setItem("porra_draft_" + this.pool.code, JSON.stringify({ scores: this.scores, groups: this.groups, thirds: this.thirds, bracket: this.bracket, extras: this.extras, first: this.me.first, last: this.me.last }));
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
    // Recalcula el orden de los 12 grupos a partir de los marcadores predichos (tabla en vivo).
    deriveGroups() {
      const r = Eng.standingsFromScores(this.scores);
      this.derivedStandings = r.standingsByGroup;
      this.groups = r.order;
      // al completar los 72 marcadores, sugerir los 8 mejores terceros (solo si aún no se han tocado)
      if (r.complete && r.qualifiers && this.thirds.length === 0) {
        this.thirds = r.qualifiers.thirdsRanked.slice(0, 8).map((t) => t.team);
      }
      this.reconcileThirds(); this.rebuild();
    },
    derivedTable(L) { return (this.derivedStandings && this.derivedStandings[L]) || Eng.groupStandings(L, {}, false, null); },
    groupScoresFilled(L) { let n = 0; for (const fx of this.groupFixtures(L)) { const p = this.scores[fx.code]; if (p && p[0] != null && p[1] != null) n++; } return n; },
    groupScoresDone(L) { return this.groupScoresFilled(L) === 6; },
    get scoresFilled() { let n = 0; for (const fx of D.GROUP_FIXTURES) { const p = this.scores[fx.code]; if (p && p[0] != null && p[1] != null) n++; } return n; },
    get scoresComplete() { return this.scoresFilled === D.GROUP_FIXTURES.length; },

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
      this._cols = defs.map((d) => ({ key: d.key, title: d.title, matches: d.list.map((m) => ({ match: m.match, a: tbm[m.match].a, b: tbm[m.match].b })) }));
      this._champion = winnerOf[D.FINAL.match] || null;
    },
    pickWinner(match, team) { if (!team || this.isLocked) return; this.bracket[match] = team; this.rebuild(); this.persistDraft(); },
    get bracketCols() { return this._cols; },
    get myChampion() { return this._champion; },
    get bracketPicked() { let n = 0; for (const m of [...D.R32, ...D.R16, ...D.QF, ...D.SF, D.FINAL]) if (this.bracket[m.match]) n++; return n; },
    get bracketDone() { return this.bracketPicked === 31; },
    get prog() { return { groups: this.scoresComplete, thirds: this.thirds.length === 8, bracket: this.bracketDone }; },

    goStep(n) {
      if (n >= 3 && this.thirds.length !== 8) { this.toast("Primero elige tus 8 mejores terceros.", "warn"); this.step = 2; return; }
      this.step = n; if (n === 3) this.rebuild(); this.persistDraft();
    },

    // ---------- asistente: guardar / navegación ----------
    get currentLetter() { return this.letters[this.gIdx]; },
    async _save(quiet) {
      if (this.isLocked) { if (!quiet) this.toast(ERRORS.POOL_LOCKED, "err"); return false; }
      if (!this.me.first.trim() || !this.me.last.trim()) { if (!quiet) this.toast(ERRORS.NAME_REQUIRED, "err"); return false; }
      this.busy = true;
      try {
        return await this._doSave();
      } catch (e) {
        if (((e && e.raw) || "").includes("PARTICIPANT_NOT_FOUND")) {
          try {
            const r = await this.rpc("porra_register", { p_code: this.pool.code, p_first: this.me.first, p_last: this.me.last });
            this.me.id = r.participant_id;
            return await this._doSave();
          } catch (e2) { if (!quiet) this.toast(this.errMsg(e2), "err"); return false; }
        }
        if (!quiet) this.toast(this.errMsg(e), "err");
        return false;
      } finally { this.busy = false; }
    },
    async _doSave() {
      const picks = { scores: this.scores, groups: this.groups, thirds: this.thirds, bracket: this.bracket, extras: this.extras };
      const res = await this.rpc("porra_save_entry", { p_code: this.pool.code, p_first: this.me.first, p_last: this.me.last, p_picks: picks, p_participant_id: this.me.id });
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
        const res = await this.rpc("porra_register", { p_code: this.pool.code, p_first: this.me.first, p_last: this.me.last });
        this.me.id = res.participant_id; this.me.saved = true;
        if (res.claimed && res.picks && Object.keys(res.picks).length) this.applyPicks(res.picks);
        this._persistMe();
        this.chosenNew = false; this.phase = "hub";
        this.toast(res.claimed ? ("¡Hola de nuevo, " + this.me.first + "! He recuperado tu porra. 👌") : ("¡Estás dentro, " + this.me.first + "! Ya apareces en la clasificación. 🎉"));
      } catch (e) { this.toast(this.errMsg(e), "err"); }
      finally { this.busy = false; }
    },
    async createNew() {
      if (!this.me.first.trim() || !this.me.last.trim()) return this.toast("Pon tu nombre y tu apellido.", "warn");
      this.busy = true;
      try {
        const res = await this.rpc("porra_register", { p_code: this.pool.code, p_first: this.me.first, p_last: this.me.last, p_force_new: true });
        this.me.id = res.participant_id; this.me.saved = true;
        this._persistMe();
        this.chosenNew = false; this.phase = "hub";
        this.toast("¡Estás dentro, " + this.me.first + "! Ya apareces en la clasificación. 🎉");
      } catch (e) { this.toast(this.errMsg(e), "err"); }
      finally { this.busy = false; }
    },
    async doClaim() {
      const sel = this.confirmClaim; if (!sel) return;
      this.busy = true;
      try {
        const res = await this.rpc("porra_claim", { p_code: this.pool.code, p_participant_id: sel.id });
        this.me.id = res.participant_id; this.me.first = res.first_name; this.me.last = res.last_name; this.me.saved = true;
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
      this.bracket = Object.assign({}, p.bracket || {});
      this.extras = Object.assign({ revelacion: "", decepcion: "", pichichi: "", asistente: "", sidebets: {} }, p.extras || {}, { sidebets: Object.assign({}, (p.extras && p.extras.sidebets) || {}) });
      this.deriveGroups();
    },
    _persistMe() {
      if (!this.pool) return;
      const picks = { scores: this.scores, groups: this.groups, thirds: this.thirds, bracket: this.bracket, extras: this.extras };
      try { localStorage.setItem("porra_me_" + this.pool.code, JSON.stringify({ id: this.me.id, first: this.me.first, last: this.me.last, picks })); } catch (e) {}
    },
    // panel "Mi porra" (resumen): navegación fácil + estado
    editSection(name) { this.deriveGroups(); if (name === "groups") this.gIdx = 0; this.phase = name; },
    goHub() { if (!this.isLocked) { this._save(true); this.toast("Guardado ✓"); } this.phase = "hub"; },
    get extrasFilled() { const e = this.extras, sb = e.sidebets || {}; return !!(e.revelacion || e.decepcion || e.pichichi || e.asistente || sb.hattrick || sb.dobleRoja); },
    get status() {
      const t = this.thirds.length, b = this.bracketPicked, e = this.extras, sb = e.sidebets || {}, missing = [];
      const sc = this.scoresFilled, scoresDone = this.scoresComplete;
      const exCount = ["revelacion", "decepcion", "pichichi", "asistente"].filter((k) => e[k]).length + ["hattrick", "dobleRoja"].filter((k) => sb[k]).length;
      const extrasDone = exCount === 6;
      const generalDone = scoresDone && t === 8 && b === 31;
      if (!scoresDone) missing.push("poner " + (72 - sc) + " marcador" + (72 - sc > 1 ? "es" : "") + " más (" + sc + "/72)");
      if (t !== 8) missing.push(t < 8 ? "elegir " + (8 - t) + " tercero" + (8 - t > 1 ? "s" : "") + " más" : "ajustar los terceros");
      if (b !== 31) missing.push("completar el cuadro (" + b + "/31)");
      if (!extrasDone) missing.push("las predicciones especiales (" + exCount + "/6)");
      return {
        scores: scoresDone, scoresTxt: sc + "/72",
        thirds: t === 8, thirdsTxt: t + "/8", bracket: b === 31, bracketTxt: b + "/31",
        extras: extrasDone, extrasTxt: exCount + "/6", generalDone, complete: generalDone && extrasDone, missing,
      };
    },
    startGroups() { this.phase = "groups"; this.gIdx = 0; this.deriveGroups(); },
    nextGroup() { if (this.gIdx < 11) { this.gIdx++; this.persistDraft(); } else { this.phase = "thirds"; this._save(true); } },
    prevGroup() { if (this.gIdx > 0) this.gIdx--; else this.goHub(); },
    goBracketPhase() {
      if (this.thirds.length !== 8) return this.toast("Elige tus 8 mejores terceros.", "warn");
      this.rebuild(); this.phase = "bracket"; this._save(true);
    },
    goExtras() { this.phase = "extras"; this._save(true); },
    toggleSideBet(key, val) { if (this.isLocked) return; this.extras.sidebets[key] = this.extras.sidebets[key] === val ? "" : val; this.persistDraft(); },
    async finishPorra() {
      const ok = await this._save(false);
      if (ok) { this.phase = "hub"; this.toast("💾 ¡Porra guardada!"); }
    },

    // ---------- cargar resultados / participantes ----------
    async loadResults() {
      const rows = await this.rpc("porra_get_results", {});
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
        try { const r = await this.rpc("porra_list_entries_admin", { p_code: this.pool.code, p_pin: this.adminPin }); entries = r.entries; }
        catch (e) { const res = await this.rpc("porra_list_entries", { p_code: this.pool.code }); entries = res.entries; }
      } else {
        const res = await this.rpc("porra_list_entries", { p_code: this.pool.code }); entries = res.entries;
      }
      this.entries = entries || [];
      this.entriesLoaded = true;
      if (!opts || opts.recompute !== false) this.recomputeRanking();
    },

    // ---------- ver la quiniela de un participante ----------
    get canViewPicks() { return !!(this.pool && (this.boardLocked || this.adminOk)); },
    toggleDetail(id) {
      const e = this.entries.find((x) => x.id === id);
      if (!e) return;
      if (!e.picks) { this.toast("Las quinielas se revelan cuando se cierra la porra (para que nadie copie).", "warn"); return; }
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
    async loadBoard() {
      if (!this.pool) return;
      this.probBusy = true;
      let ok = false;
      try {
        const { data, error } = await sb.functions.invoke("porra-prob", { body: { code: this.pool.code } });
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
      try { await this.loadResults(); if (ok && this.boardLocked) await this.loadEntries({ recompute: false }); } catch (e) {}
      if (!ok) { this.usingServerBoard = false; try { await this.refreshBoard(); } catch (e) {} }
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
      const simResults = (this.outcome && this.outcome.groupMap) ? this.outcome.groupMap : this.results;
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
      try { const ok = await this.rpc("porra_check_master", { p_pin: this.adminPin }); if (ok) { this.adminOk = true; this.toast("🔓 Acceso admin concedido."); } else this.toast(ERRORS.BAD_PIN, "err"); }
      catch (e) { this.toast(this.errMsg(e), "err"); } finally { this.busy = false; }
    },
    async toggleLock() {
      this.busy = true;
      try {
        await this.rpc("porra_lock_pool", { p_code: this.pool.code, p_pin: this.adminPin, p_locked: !this.pool.locked, p_lock_at: null });
        const pool = await this.rpc("porra_get_pool", { p_code: this.pool.code }); this.pool = pool;
        this.toast(pool.locked ? "🔒 Porra cerrada. ¡Que empiece el Mundial!" : "🔓 Porra reabierta.");
        await this.loadEntries();
      } catch (e) { this.toast(this.errMsg(e), "err"); } finally { this.busy = false; }
    },
    async saveSettings() {
      this.busy = true;
      try { await this.rpc("porra_set_settings", { p_code: this.pool.code, p_pin: this.adminPin, p_settings: this.settings }); this.pool.settings = Object.assign({}, this.settings); this.toast("Puntuación guardada."); this.recomputeRanking(); }
      catch (e) { this.toast(this.errMsg(e), "err"); } finally { this.busy = false; }
    },
    async saveGroupResult(fx) {
      const e = this.rEdit[fx.code];
      if (e.h == null || e.a == null || e.h === "" || e.a === "") return this.toast("Pon el marcador completo.", "warn");
      this.busy = true;
      try {
        await this.rpc("porra_set_result", { p_pin: this.adminPin, p_match_code: fx.code, p_stage: "group", p_home_team: fx.home, p_away_team: fx.away, p_home_score: Number(e.h), p_away_score: Number(e.a), p_winner: null, p_played: true });
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
        await this.rpc("porra_set_result", { p_pin: this.adminPin, p_match_code: String(m.match), p_stage: m.stageKey, p_home_team: e.home, p_away_team: e.away, p_home_score: e.h == null || e.h === "" ? null : Number(e.h), p_away_score: e.a == null || e.a === "" ? null : Number(e.a), p_winner: e.winner, p_played: true });
        this.toast(`M${m.match} guardado · pasa ${D.es(e.winner)}`);
        await this.loadResults();
      } catch (er) { this.toast(this.errMsg(er), "err"); } finally { this.busy = false; }
    },
    async deleteEntry(e) {
      if (!confirm(`¿Borrar la quiniela de ${e.first_name} ${e.last_name}?`)) return;
      this.busy = true;
      try { await this.rpc("porra_delete_entry", { p_code: this.pool.code, p_pin: this.adminPin, p_participant_id: e.id }); this.toast("Quiniela borrada."); await this.loadEntries(); }
      catch (er) { this.toast(this.errMsg(er), "err"); } finally { this.busy = false; }
    },
    async autoSync() {
      this.syncBusy = true; this.syncMsg = "";
      try {
        const { data, error } = await sb.functions.invoke("porra-sync", { body: { pin: this.adminPin } });
        if (error) throw error;
        this.syncMsg = (data && data.message) || "Sincronizado.";
        await this.loadResults();
      } catch (e) {
        this.syncMsg = "Sincronizador automático no configurado todavía — mete los resultados a mano aquí abajo (siempre funciona).";
      } finally { this.syncBusy = false; }
    },
  };
};
