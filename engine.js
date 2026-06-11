/* ============================================================================
   PORRA MUNDIAL 2026 — Motor de cálculo (puro, sin dependencias)
   - Tablas de grupos con desempates (pts > dif.goles > goles a favor)
   - 8 mejores terceros + asignación a slots del bracket (matching bipartito
     que respeta la elegibilidad oficial de cada slot)
   - Resolución de eliminatorias (real + simulada)
   - Puntuación de cada quiniela
   - Simulación Monte Carlo -> probabilidad de ganar la porra en vivo
   Funciona en navegador (window.PorraEngine) y en Node (module.exports) para tests.
   ========================================================================== */
(function (root, factory) {
  const D = (typeof window !== "undefined" && window.PORRA_DATA) ||
            (typeof require !== "undefined" && require("./data-node.js"));
  const eng = factory(D);
  if (typeof module !== "undefined" && module.exports) module.exports = eng;
  if (typeof window !== "undefined") window.PorraEngine = eng;
})(this, function (DATA) {
  "use strict";

  const ELO = DATA.ELO;
  const LETTERS = DATA.GROUP_LETTERS;
  const THIRD_SLOT_NUMS = [74, 77, 79, 80, 81, 82, 85, 87];

  // -------- utilidades aleatorias / partidos --------
  function poisson(lambda, rng) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= rng(); } while (p > L);
    return k - 1;
  }

  // Marcador simulado a partir de la diferencia de Elo (modelo Poisson).
  function simGoals(home, away, rng) {
    const diff = (ELO[home] || 1500) - (ELO[away] || 1500);
    const exp = 2.6;                 // media de goles por partido (Mundial)
    const gd = diff / 170;           // ventaja esperada de goles
    const muA = Math.max(0.12, (exp + gd) / 2);
    const muB = Math.max(0.12, (exp - gd) / 2);
    return [poisson(muA, rng), poisson(muB, rng)];
  }

  // Ganador de un cruce de eliminatoria simulado (prórroga -> penaltis por Elo).
  function simKnockoutWinner(a, b, rng) {
    const g = simGoals(a, b, rng);
    if (g[0] > g[1]) return a;
    if (g[1] > g[0]) return b;
    const pa = 1 / (1 + Math.pow(10, ((ELO[b] || 1500) - (ELO[a] || 1500)) / 400));
    return rng() < pa ? a : b;
  }

  function fixturesOf(letter) {
    return DATA.GROUP_FIXTURES.filter((f) => f.group === letter);
  }

  // -------- tabla de un grupo --------
  // resultsMap: { match_code|matchNum : {home_score, away_score, winner, played} }
  // Devuelve [{team,pts,gd,gf,ga,pj}] ordenado, o null si !simulate y faltan partidos.
  function groupStandings(letter, resultsMap, simulate, rng) {
    const teams = DATA.GROUPS[letter];
    const st = {};
    teams.forEach((t) => (st[t] = { team: t, pts: 0, gd: 0, gf: 0, ga: 0, pj: 0 }));
    let played = 0;
    for (const fx of fixturesOf(letter)) {
      const r = resultsMap[fx.code];
      let hs, as;
      if (r && r.played && r.home_score != null && r.away_score != null) {
        hs = r.home_score; as = r.away_score; played++;
      } else if (simulate) {
        const g = simGoals(fx.home, fx.away, rng); hs = g[0]; as = g[1];
      } else {
        continue;
      }
      const H = st[fx.home], A = st[fx.away];
      H.pj++; A.pj++;
      H.gf += hs; H.ga += as; A.gf += as; A.ga += hs;
      H.gd = H.gf - H.ga; A.gd = A.gf - A.ga;
      if (hs > as) { H.pts += 3; }
      else if (as > hs) { A.pts += 3; }
      else { H.pts += 1; A.pts += 1; }
    }
    const arr = teams.map((t) => st[t]);
    arr.sort((x, y) => {
      if (y.pts !== x.pts) return y.pts - x.pts;
      if (y.gd !== x.gd) return y.gd - x.gd;
      if (y.gf !== x.gf) return y.gf - x.gf;
      if (simulate) return rng() - 0.5;                 // desempate aleatorio en simulación
      return (ELO[y.team] || 0) - (ELO[x.team] || 0);   // estable para tabla real
    });
    arr._complete = simulate || played === 6;
    return arr;
  }

  // -------- matching de terceros a slots del bracket --------
  // qualGroups: array de 8 letras (grupos cuyo 3º clasifica). -> {matchNum: letra}
  function thirdMatching(qualGroups) {
    const slots = THIRD_SLOT_NUMS;
    const elig = slots.map((s) => DATA.THIRD_SLOTS[s].filter((g) => qualGroups.includes(g)));
    const slotToGroup = {};   // índice de slot -> letra
    const groupToSlot = {};   // letra -> índice de slot
    function aug(si, visited) {
      for (const g of elig[si]) {
        if (visited.has(g)) continue;
        visited.add(g);
        if (groupToSlot[g] === undefined || aug(groupToSlot[g], visited)) {
          groupToSlot[g] = si; slotToGroup[si] = g; return true;
        }
      }
      return false;
    }
    let ok = true;
    for (let si = 0; si < slots.length; si++) if (!aug(si, new Set())) ok = false;
    const res = {};
    for (let si = 0; si < slots.length; si++) res[slots[si]] = slotToGroup[si] || null;
    if (!ok) { // red de seguridad: nunca dejar un slot sin equipo
      const used = new Set(Object.values(res).filter(Boolean));
      const left = qualGroups.filter((g) => !used.has(g));
      let li = 0;
      for (let si = 0; si < slots.length; si++) if (!res[slots[si]]) res[slots[si]] = left[li++];
    }
    return res;
  }

  // Resuelve un código de slot ("W-A","RU-B","3rd") a un equipo concreto.
  function resolveSlot(matchNum, code, q, thirdAssign) {
    if (code === "3rd") { const g = thirdAssign[matchNum]; return g ? q.thirdByGroup[g] : null; }
    const i = code.indexOf("-");
    const type = code.slice(0, i), grp = code.slice(i + 1);
    if (type === "W") return q.winners[grp];
    if (type === "RU") return q.runnersUp[grp];
    return null;
  }

  // Construye los 16 cruces de 1/16 (matchNum -> {a,b}) a partir de los clasificados.
  function buildR32Teams(q) {
    const thirdAssign = thirdMatching(q.qualifiedThirdGroups);
    const res = {};
    for (const m of DATA.R32) {
      res[m.match] = {
        a: resolveSlot(m.match, m.a, q, thirdAssign),
        b: resolveSlot(m.match, m.b, q, thirdAssign),
      };
    }
    return { teams: res, thirdAssign };
  }

  // qualifiers a partir de las tablas de los 12 grupos
  function computeQualifiers(standingsByGroup) {
    const winners = {}, runnersUp = {}, thirdByGroup = {};
    const thirds = [];
    for (const L of LETTERS) {
      const s = standingsByGroup[L];
      winners[L] = s[0].team; runnersUp[L] = s[1].team; thirdByGroup[L] = s[2].team;
      thirds.push({ group: L, team: s[2].team, pts: s[2].pts, gd: s[2].gd, gf: s[2].gf });
    }
    thirds.sort((x, y) => (y.pts - x.pts) || (y.gd - x.gd) || (y.gf - x.gf) ||
                          ((ELO[y.team] || 0) - (ELO[x.team] || 0)));
    const qualifiedThirdGroups = thirds.slice(0, 8).map((t) => t.group);
    const qualifiedThirdTeams = thirds.slice(0, 8).map((t) => t.team);
    return { winners, runnersUp, thirdByGroup, qualifiedThirdGroups, qualifiedThirdTeams, thirdsRanked: thirds };
  }

  // -------- derivar tablas/orden de grupo a partir de marcadores predichos --------
  // scores: { code:[home,away] }  (marcadores que ha puesto un jugador para los 72 partidos)
  // Devuelve { order:{L:[4 equipos]}, standingsByGroup, complete, qualifiers|null }.
  // Reutiliza groupStandings tratando los marcadores predichos como "resultados".
  function standingsFromScores(scores) {
    scores = scores || {};
    const resultsMap = {};
    for (const fx of DATA.GROUP_FIXTURES) {
      const p = scores[fx.code];
      if (p && p[0] != null && p[1] != null) resultsMap[fx.code] = { played: true, home_score: p[0], away_score: p[1] };
    }
    const standingsByGroup = {}, order = {};
    let complete = true;
    for (const L of LETTERS) {
      const s = groupStandings(L, resultsMap, false, null);
      standingsByGroup[L] = s;
      order[L] = s.map((x) => x.team);
      if (!s._complete) complete = false;
    }
    const qualifiers = complete ? computeQualifiers(standingsByGroup) : null;
    return { order, standingsByGroup, complete, qualifiers };
  }

  // -------- puntos por marcadores exactos de los 72 partidos de grupo --------
  // predScores: { code:[h,a] };  actScores: { code:{played,home_score,away_score} }
  // Niveles excluyentes por partido: exacto > resultado+diferencia > solo tendencia (1/X/2).
  function scoreScores(predScores, actScores, S) {
    if (!predScores || !actScores) return 0;
    let total = 0;
    for (const fx of DATA.GROUP_FIXTURES) {
      const a = actScores[fx.code]; const p = predScores[fx.code];
      if (!a || !a.played || a.home_score == null || a.away_score == null) continue;
      if (!p || p[0] == null || p[1] == null) continue;
      const ah = a.home_score, aa = a.away_score, ph = p[0], pa = p[1];
      if (ph === ah && pa === aa) { total += (S.exact || 0); continue; }
      const aSign = Math.sign(ah - aa), pSign = Math.sign(ph - pa);
      if (aSign !== pSign) continue;                      // ni siquiera el 1/X/2 → 0
      if ((ah - aa) === (ph - pa)) total += (S.gd || 0);  // acierta resultado y diferencia exacta
      else total += (S.result || 0);                      // solo la tendencia (1/X/2)
    }
    return total;
  }

  // -------- outcome completo (simulado) --------
  function simulateOutcome(resultsMap, rng) {
    // Marcador completo de los 72 partidos de grupo: el real si se jugó, si no uno simulado.
    // Así cada simulación tiene un marcador por partido y se pueden puntuar los aciertos de marcador exacto.
    const full = {};
    for (const fx of DATA.GROUP_FIXTURES) {
      const r = resultsMap[fx.code];
      if (r && r.played && r.home_score != null && r.away_score != null) {
        full[fx.code] = { played: true, home_score: r.home_score, away_score: r.away_score };
      } else {
        const g = simGoals(fx.home, fx.away, rng);
        full[fx.code] = { played: true, home_score: g[0], away_score: g[1] };
      }
    }
    const standingsByGroup = {}, groupOrder = {};
    for (const L of LETTERS) {
      const s = groupStandings(L, full, true, rng);  // todos "jugados" → simulate solo aporta el desempate aleatorio
      standingsByGroup[L] = s;
      groupOrder[L] = s.map((x) => x.team);
    }
    const q = computeQualifiers(standingsByGroup);
    const built = buildR32Teams(q);
    const teamsByMatch = {}, winnerOf = {};
    function decide(matchNum, a, b) {
      if (!a || !b) return null;
      const r = resultsMap[matchNum] || resultsMap[String(matchNum)];
      if (r && r.played && r.winner) return r.winner;
      return simKnockoutWinner(a, b, rng);
    }
    for (const m of DATA.R32) { teamsByMatch[m.match] = built.teams[m.match]; winnerOf[m.match] = decide(m.match, built.teams[m.match].a, built.teams[m.match].b); }
    function round(list) {
      for (const m of list) {
        const a = winnerOf[m.a], b = winnerOf[m.b];
        teamsByMatch[m.match] = { a, b };
        winnerOf[m.match] = decide(m.match, a, b);
      }
    }
    round(DATA.R16); round(DATA.QF); round(DATA.SF);
    { const m = DATA.FINAL; const a = winnerOf[m.a], b = winnerOf[m.b]; teamsByMatch[m.match] = { a, b }; winnerOf[m.match] = decide(m.match, a, b); }

    const r32set = new Set();
    for (const m of DATA.R32) { r32set.add(built.teams[m.match].a); r32set.add(built.teams[m.match].b); }
    const octavos = new Set(DATA.R32.map((m) => winnerOf[m.match]).filter(Boolean));
    const cuartos = new Set(DATA.R16.map((m) => winnerOf[m.match]).filter(Boolean));
    const semis = new Set(DATA.QF.map((m) => winnerOf[m.match]).filter(Boolean));
    const finalists = new Set(DATA.SF.map((m) => winnerOf[m.match]).filter(Boolean));
    const champion = winnerOf[DATA.FINAL.match];

    return {
      complete: true, allGroupsComplete: true, groupOrder, groupScores: full,
      qualifiedThirdTeams: new Set(q.qualifiedThirdTeams),
      reached: { r32: r32set, octavos, cuartos, semis, final: finalists, champion },
      qualifiers: q, teamsByMatch, winnerOf,
    };
  }

  // -------- outcome real (parcial, sin simular) para la clasificación en vivo --------
  function liveOutcome(resultsMap) {
    const groupOrder = {}; let allComplete = true;
    const standingsByGroup = {};
    for (const L of LETTERS) {
      const s = groupStandings(L, resultsMap, false, null);
      standingsByGroup[L] = s;
      if (s._complete) { groupOrder[L] = s.map((x) => x.team); }
      else {
        allComplete = false;
        // Puntuación EN DIRECTO (provisional): si el grupo YA ha empezado, puntuamos con la
        // tabla actual "como si acabara ahora". Se recalcula con cada partido.
        if (s.some((x) => x.pj > 0)) groupOrder[L] = s.map((x) => x.team);
      }
    }
    let qualifiedThirdTeams = null;
    if (allComplete) qualifiedThirdTeams = new Set(computeQualifiers(standingsByGroup).qualifiedThirdTeams);

    // reached: directamente de los ganadores registrados en eliminatorias
    const wOf = (n) => { const r = resultsMap[n] || resultsMap[String(n)]; return r && r.played && r.winner ? r.winner : null; };
    const octavos = new Set(DATA.R32.map((m) => wOf(m.match)).filter(Boolean));
    const cuartos = new Set(DATA.R16.map((m) => wOf(m.match)).filter(Boolean));
    const semis = new Set(DATA.QF.map((m) => wOf(m.match)).filter(Boolean));
    const finalists = new Set(DATA.SF.map((m) => wOf(m.match)).filter(Boolean));
    const champion = wOf(DATA.FINAL.match);

    return {
      complete: false, allGroupsComplete: allComplete, groupOrder, standingsByGroup,
      qualifiedThirdTeams,
      reached: { octavos, cuartos, semis, final: finalists, champion },
    };
  }

  // -------- derivar de una quiniela los conjuntos "llega a la ronda X" --------
  // picks = { groups:{L:[4]}, thirds:[...], bracket:{matchNum: team} }
  function derivePicks(picks) {
    const b = picks.bracket || {};
    const win = (nums) => nums.map((n) => b[n] || b[String(n)]).filter(Boolean);
    return {
      groups: picks.groups || {},
      thirds: picks.thirds || [],
      scores: picks.scores || {},
      octavos: new Set(win(DATA.R32.map((m) => m.match))),
      cuartos: new Set(win(DATA.R16.map((m) => m.match))),
      semis: new Set(win(DATA.QF.map((m) => m.match))),
      final: new Set(win(DATA.SF.map((m) => m.match))),
      champion: b[DATA.FINAL.match] || b[String(DATA.FINAL.match)] || null,
    };
  }

  // -------- puntuación de una quiniela frente a un outcome --------
  function scoreEntry(P, oc, S) {
    let total = scoreScores(P.scores, oc.groupScores || oc.groupMap, S);   // marcadores exactos de los 72 partidos
    for (const L of LETTERS) {
      const act = oc.groupOrder[L];
      const pred = P.groups[L];
      if (!act || !pred) continue;
      if (pred[0] && pred[0] === act[0]) total += S.g1;
      if (pred[1] && pred[1] === act[1]) total += S.g2;
      if (pred[2] && pred[2] === act[2]) total += S.g3;
      const top2 = new Set([act[0], act[1]]);
      if (pred[0] && top2.has(pred[0])) total += S.qual;
      if (pred[1] && top2.has(pred[1])) total += S.qual;
      if (act.length === 4 && pred[0] === act[0] && pred[1] === act[1] && pred[2] === act[2] && pred[3] === act[3]) total += (S.groupExact || 0); // 🎁 bonus: orden completo del grupo (1º-4º)
    }
    if (oc.qualifiedThirdTeams) {
      for (const t of P.thirds) if (oc.qualifiedThirdTeams.has(t)) total += S.thirdQual;
    }
    const stages = [["octavos", S.octavos], ["cuartos", S.cuartos], ["semis", S.semis], ["final", S.finalists]];
    for (const [stage, pts] of stages) {
      const actSet = oc.reached[stage]; const predSet = P[stage];
      if (!actSet || !predSet) continue;
      predSet.forEach((t) => { if (actSet.has(t)) total += pts; });
    }
    if (oc.reached.champion && P.champion && P.champion === oc.reached.champion) total += S.champion;
    return total;
  }

  // -------- desglose de puntos por categoría (para mostrar en la app) --------
  function scoreBreakdown(P, oc, S) {
    const bd = { marcadores: 0, grupos: 0, terceros: 0, octavos: 0, cuartos: 0, semis: 0, final: 0, campeon: 0 };
    bd.marcadores = scoreScores(P.scores, oc.groupScores || oc.groupMap, S);
    for (const L of LETTERS) {
      const act = oc.groupOrder[L]; const pred = P.groups[L];
      if (!act || !pred) continue;
      if (pred[0] && pred[0] === act[0]) bd.grupos += S.g1;
      if (pred[1] && pred[1] === act[1]) bd.grupos += S.g2;
      if (pred[2] && pred[2] === act[2]) bd.grupos += S.g3;
      const top2 = new Set([act[0], act[1]]);
      if (pred[0] && top2.has(pred[0])) bd.grupos += S.qual;
      if (pred[1] && top2.has(pred[1])) bd.grupos += S.qual;
      if (act.length === 4 && pred[0] === act[0] && pred[1] === act[1] && pred[2] === act[2] && pred[3] === act[3]) bd.grupos += (S.groupExact || 0); // 🎁 bonus orden completo del grupo
    }
    if (oc.qualifiedThirdTeams) for (const t of P.thirds) if (oc.qualifiedThirdTeams.has(t)) bd.terceros += S.thirdQual;
    const stages = [["octavos", S.octavos, "octavos"], ["cuartos", S.cuartos, "cuartos"], ["semis", S.semis, "semis"], ["final", S.finalists, "final"]];
    for (const [stage, pts, key] of stages) {
      const actSet = oc.reached[stage]; const predSet = P[stage];
      if (!actSet || !predSet) continue;
      predSet.forEach((t) => { if (actSet.has(t)) bd[key] += pts; });
    }
    if (oc.reached.champion && P.champion && P.champion === oc.reached.champion) bd.campeon += S.champion;
    bd.total = bd.marcadores + bd.grupos + bd.terceros + bd.octavos + bd.cuartos + bd.semis + bd.final + bd.campeon;
    return bd;
  }

  // -------- puntos de las predicciones especiales --------
  function scoreExtras(extras, actuals, S) {
    const e = extras || {}, a = actuals || {};
    const bd = { revelacion: 0, decepcion: 0, pichichi: 0, asistente: 0, hattrick: 0, dobleRoja: 0 };
    const norm = (s) => (s || "").toString().trim().toLowerCase();
    if (a.revelacion && e.revelacion === a.revelacion) bd.revelacion += S.revelacion;
    if (a.decepcion && e.decepcion === a.decepcion) bd.decepcion += S.decepcion;
    if (a.pichichi && norm(e.pichichi) && norm(e.pichichi) === norm(a.pichichi)) bd.pichichi += S.pichichi;
    if (a.asistente && norm(e.asistente) && norm(e.asistente) === norm(a.asistente)) bd.asistente += S.asistente;
    const sb = e.sidebets || {}, asb = a.sidebets || {};
    if (asb.hattrick && sb.hattrick === asb.hattrick) bd.hattrick += S.hattrick;
    if (asb.dobleRoja && sb.dobleRoja === asb.dobleRoja) bd.dobleRoja += S.dobleRoja;
    bd.total = bd.revelacion + bd.decepcion + bd.pichichi + bd.asistente + bd.hattrick + bd.dobleRoja;
    return bd;
  }

  // -------- outcome en vivo a partir de los datos de ESPN (+ correcciones manuales) --------
  function outcomeFromEspn(events, dbResults, extrasActual) {
    dbResults = dbResults || {};
    const pairToFx = {};
    for (const fx of DATA.GROUP_FIXTURES) pairToFx[[fx.home, fx.away].slice().sort().join("|")] = fx;
    const groupMap = {};
    const ko = { octavos: new Set(), cuartos: new Set(), semis: new Set(), final: new Set(), champion: null };
    for (const ev of (events || [])) {
      const comp = ev.competitions && ev.competitions[0]; if (!comp) continue;
      const cs = comp.competitors || []; if (cs.length !== 2) continue;
      const A = cs.find((c) => c.homeAway === "home") || cs[0];
      const B = cs.find((c) => c.homeAway === "away") || cs[1];
      const tA = DATA.espnCanon(A.team.displayName), tB = DATA.espnCanon(B.team.displayName);
      if (!tA || !tB) continue; // placeholder: equipos sin decidir todavía
      const completed = !!(ev.status && ev.status.type && ev.status.type.completed);
      const date = (ev.date || "").slice(0, 10);
      const sA = parseInt(A.score, 10), sB = parseInt(B.score, 10);
      const koWin = DATA.KO_WINDOWS.find((w) => date >= w.from && date <= w.to);
      const fx = pairToFx[[tA, tB].slice().sort().join("|")];
      if (fx && !koWin) {
        if (completed && !isNaN(sA) && !isNaN(sB)) {
          const home = fx.home === tA ? sA : sB, away = fx.home === tA ? sB : sA;
          groupMap[fx.code] = { played: true, home_score: home, away_score: away };
        }
      } else if (koWin && completed) {
        let w = A.winner ? tA : (B.winner ? tB : (!isNaN(sA) && !isNaN(sB) ? (sA > sB ? tA : (sB > sA ? tB : null)) : null));
        if (w) { if (koWin.reached === "champion") ko.champion = w; else ko[koWin.reached].add(w); }
      }
    }
    // correcciones manuales (DB) de grupos
    for (const fx of DATA.GROUP_FIXTURES) {
      const r = dbResults[fx.code];
      if (r && r.played && r.home_score != null) groupMap[fx.code] = { played: true, home_score: r.home_score, away_score: r.away_score };
    }
    const oc = liveOutcome(groupMap);
    // correcciones manuales (DB) de eliminatorias por nº de partido → ronda
    const roundOf = {};
    for (const m of DATA.R32) roundOf[m.match] = "octavos";
    for (const m of DATA.R16) roundOf[m.match] = "cuartos";
    for (const m of DATA.QF) roundOf[m.match] = "semis";
    for (const m of DATA.SF) roundOf[m.match] = "final";
    roundOf[DATA.FINAL.match] = "champion";
    for (const k in dbResults) {
      const r = dbResults[k]; if (!r || !r.played || !r.winner) continue;
      const rr = roundOf[k] || roundOf[Number(k)]; if (!rr) continue;
      if (rr === "champion") ko.champion = r.winner; else ko[rr].add(r.winner);
    }
    oc.reached = {
      octavos: ko.octavos, cuartos: ko.cuartos, semis: ko.semis, final: ko.final, champion: ko.champion,
    };
    oc.extrasActual = extrasActual || {};
    oc.groupMap = groupMap;
    oc.groupScores = groupMap;   // mismo formato {code:{played,home_score,away_score}} para puntuar marcadores
    return oc;
  }

  // -------- Monte Carlo: probabilidad de ganar la porra en vivo --------
  // entries: [{id, picks(derivados)}].  Devuelve {byId:{id:{win,podium,avg}}, sims}
  function monteCarlo(entries, resultsMap, N, S, rng) {
    rng = rng || Math.random;
    const ids = entries.map((e) => e.id);
    const win = {}, pod = {}, sum = {};
    ids.forEach((id) => { win[id] = 0; pod[id] = 0; sum[id] = 0; });
    const n = Math.max(1, N | 0);
    for (let s = 0; s < n; s++) {
      const oc = simulateOutcome(resultsMap, rng);
      let best = -Infinity;
      const scored = entries.map((e) => {
        const p = scoreEntry(e.picks, oc, S) + (e.extraPts || 0);
        sum[e.id] += p;
        if (p > best) best = p;
        return { id: e.id, p };
      });
      const winners = scored.filter((x) => x.p === best);
      const share = 1 / winners.length;
      winners.forEach((w) => (win[w.id] += share));
      // podio: top 3 puestos (con empates por puntuación contados)
      const sorted = scored.slice().sort((a, b) => b.p - a.p);
      const cutoff = sorted.length >= 3 ? sorted[2].p : (sorted.length ? sorted[sorted.length - 1].p : -Infinity);
      scored.forEach((x) => { if (x.p >= cutoff) pod[x.id] += 1; });
    }
    const byId = {};
    ids.forEach((id) => { byId[id] = { win: win[id] / n, podium: pod[id] / n, avg: sum[id] / n }; });
    return { byId, sims: n };
  }

  // -------- Monte Carlo por SELECCIÓN: prob. de clasificar / 1º / top2 (solo fase de grupos) --------
  function monteCarloTeams(resultsMap, N, rng) {
    rng = rng || Math.random;
    const teams = [].concat(...LETTERS.map((L) => DATA.GROUPS[L]));
    const acc = {}; teams.forEach((t) => (acc[t] = { qualify: 0, first: 0, top2: 0 }));
    const n = Math.max(1, N | 0);
    for (let s = 0; s < n; s++) {
      const standingsByGroup = {};
      for (const L of LETTERS) standingsByGroup[L] = groupStandings(L, resultsMap, true, rng);
      const q = computeQualifiers(standingsByGroup);
      for (const L of LETTERS) {
        const st = standingsByGroup[L];
        acc[st[0].team].first++;
        acc[st[0].team].top2++; acc[st[1].team].top2++;
      }
      const qset = new Set([].concat(Object.values(q.winners), Object.values(q.runnersUp), q.qualifiedThirdTeams));
      qset.forEach((t) => { if (acc[t]) acc[t].qualify++; });
    }
    const out = {};
    teams.forEach((t) => (out[t] = { qualify: acc[t].qualify / n, first: acc[t].first / n, top2: acc[t].top2 / n }));
    return { byTeam: out, sims: n };
  }

  return {
    poisson, simGoals, simKnockoutWinner,
    groupStandings, thirdMatching, buildR32Teams, computeQualifiers,
    standingsFromScores, scoreScores,
    simulateOutcome, liveOutcome, derivePicks, scoreEntry, scoreBreakdown, monteCarlo, monteCarloTeams,
    scoreExtras, outcomeFromEspn, THIRD_SLOT_NUMS,
  };
});
