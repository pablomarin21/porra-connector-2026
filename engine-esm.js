/* Motor de la porra como módulo ES (para la Edge Function de probabilidades). GENERADO por build-esm.js — no editar a mano. */
const GROUPS={"A":["Mexico","South Africa","South Korea","Czech Republic"],"B":["Canada","Bosnia and Herzegovina","Qatar","Switzerland"],"C":["Brazil","Morocco","Haiti","Scotland"],"D":["United States","Paraguay","Australia","Turkey"],"E":["Germany","Curacao","Ivory Coast","Ecuador"],"F":["Netherlands","Japan","Sweden","Tunisia"],"G":["Belgium","Egypt","Iran","New Zealand"],"H":["Spain","Cape Verde","Saudi Arabia","Uruguay"],"I":["France","Senegal","Iraq","Norway"],"J":["Argentina","Algeria","Austria","Jordan"],"K":["Portugal","DR Congo","Uzbekistan","Colombia"],"L":["England","Croatia","Ghana","Panama"]};
const GROUP_LETTERS=["A","B","C","D","E","F","G","H","I","J","K","L"];
const ELO={"Mexico":1868,"South Africa":1517,"South Korea":1756,"Czech Republic":1733,"Canada":1793,"Bosnia and Herzegovina":1591,"Qatar":1423,"Switzerland":1894,"Brazil":1988,"Morocco":1822,"Haiti":1532,"Scotland":1770,"United States":1733,"Paraguay":1833,"Australia":1775,"Turkey":1815,"Germany":1925,"Curacao":1433,"Ivory Coast":1676,"Ecuador":1935,"Netherlands":1961,"Japan":1906,"Sweden":1810,"Tunisia":1633,"Belgium":1866,"Egypt":1699,"Iran":1764,"New Zealand":1585,"Spain":2165,"Cape Verde":1576,"Saudi Arabia":1566,"Uruguay":1892,"France":2081,"Senegal":1866,"Iraq":1608,"Norway":1917,"Argentina":2113,"Algeria":1743,"Austria":1830,"Jordan":1685,"Portugal":1984,"DR Congo":1655,"Uzbekistan":1718,"Colombia":1977,"England":2020,"Croatia":1930,"Ghana":1503,"Panama":1733};
const GROUP_FIXTURES=[{"code":"G:A:1","group":"A","home":"Mexico","away":"South Africa","md":1},{"code":"G:A:2","group":"A","home":"South Korea","away":"Czech Republic","md":1},{"code":"G:A:3","group":"A","home":"Mexico","away":"South Korea","md":2},{"code":"G:A:4","group":"A","home":"Czech Republic","away":"South Africa","md":2},{"code":"G:A:5","group":"A","home":"Czech Republic","away":"Mexico","md":3},{"code":"G:A:6","group":"A","home":"South Africa","away":"South Korea","md":3},{"code":"G:B:1","group":"B","home":"Canada","away":"Bosnia and Herzegovina","md":1},{"code":"G:B:2","group":"B","home":"Qatar","away":"Switzerland","md":1},{"code":"G:B:3","group":"B","home":"Canada","away":"Qatar","md":2},{"code":"G:B:4","group":"B","home":"Switzerland","away":"Bosnia and Herzegovina","md":2},{"code":"G:B:5","group":"B","home":"Switzerland","away":"Canada","md":3},{"code":"G:B:6","group":"B","home":"Bosnia and Herzegovina","away":"Qatar","md":3},{"code":"G:C:1","group":"C","home":"Brazil","away":"Morocco","md":1},{"code":"G:C:2","group":"C","home":"Haiti","away":"Scotland","md":1},{"code":"G:C:3","group":"C","home":"Brazil","away":"Haiti","md":2},{"code":"G:C:4","group":"C","home":"Scotland","away":"Morocco","md":2},{"code":"G:C:5","group":"C","home":"Scotland","away":"Brazil","md":3},{"code":"G:C:6","group":"C","home":"Morocco","away":"Haiti","md":3},{"code":"G:D:1","group":"D","home":"United States","away":"Paraguay","md":1},{"code":"G:D:2","group":"D","home":"Australia","away":"Turkey","md":1},{"code":"G:D:3","group":"D","home":"United States","away":"Australia","md":2},{"code":"G:D:4","group":"D","home":"Turkey","away":"Paraguay","md":2},{"code":"G:D:5","group":"D","home":"Turkey","away":"United States","md":3},{"code":"G:D:6","group":"D","home":"Paraguay","away":"Australia","md":3},{"code":"G:E:1","group":"E","home":"Germany","away":"Curacao","md":1},{"code":"G:E:2","group":"E","home":"Ivory Coast","away":"Ecuador","md":1},{"code":"G:E:3","group":"E","home":"Germany","away":"Ivory Coast","md":2},{"code":"G:E:4","group":"E","home":"Ecuador","away":"Curacao","md":2},{"code":"G:E:5","group":"E","home":"Ecuador","away":"Germany","md":3},{"code":"G:E:6","group":"E","home":"Curacao","away":"Ivory Coast","md":3},{"code":"G:F:1","group":"F","home":"Netherlands","away":"Japan","md":1},{"code":"G:F:2","group":"F","home":"Sweden","away":"Tunisia","md":1},{"code":"G:F:3","group":"F","home":"Netherlands","away":"Sweden","md":2},{"code":"G:F:4","group":"F","home":"Tunisia","away":"Japan","md":2},{"code":"G:F:5","group":"F","home":"Tunisia","away":"Netherlands","md":3},{"code":"G:F:6","group":"F","home":"Japan","away":"Sweden","md":3},{"code":"G:G:1","group":"G","home":"Belgium","away":"Egypt","md":1},{"code":"G:G:2","group":"G","home":"Iran","away":"New Zealand","md":1},{"code":"G:G:3","group":"G","home":"Belgium","away":"Iran","md":2},{"code":"G:G:4","group":"G","home":"New Zealand","away":"Egypt","md":2},{"code":"G:G:5","group":"G","home":"New Zealand","away":"Belgium","md":3},{"code":"G:G:6","group":"G","home":"Egypt","away":"Iran","md":3},{"code":"G:H:1","group":"H","home":"Spain","away":"Cape Verde","md":1},{"code":"G:H:2","group":"H","home":"Saudi Arabia","away":"Uruguay","md":1},{"code":"G:H:3","group":"H","home":"Spain","away":"Saudi Arabia","md":2},{"code":"G:H:4","group":"H","home":"Uruguay","away":"Cape Verde","md":2},{"code":"G:H:5","group":"H","home":"Uruguay","away":"Spain","md":3},{"code":"G:H:6","group":"H","home":"Cape Verde","away":"Saudi Arabia","md":3},{"code":"G:I:1","group":"I","home":"France","away":"Senegal","md":1},{"code":"G:I:2","group":"I","home":"Iraq","away":"Norway","md":1},{"code":"G:I:3","group":"I","home":"France","away":"Iraq","md":2},{"code":"G:I:4","group":"I","home":"Norway","away":"Senegal","md":2},{"code":"G:I:5","group":"I","home":"Norway","away":"France","md":3},{"code":"G:I:6","group":"I","home":"Senegal","away":"Iraq","md":3},{"code":"G:J:1","group":"J","home":"Argentina","away":"Algeria","md":1},{"code":"G:J:2","group":"J","home":"Austria","away":"Jordan","md":1},{"code":"G:J:3","group":"J","home":"Argentina","away":"Austria","md":2},{"code":"G:J:4","group":"J","home":"Jordan","away":"Algeria","md":2},{"code":"G:J:5","group":"J","home":"Jordan","away":"Argentina","md":3},{"code":"G:J:6","group":"J","home":"Algeria","away":"Austria","md":3},{"code":"G:K:1","group":"K","home":"Portugal","away":"DR Congo","md":1},{"code":"G:K:2","group":"K","home":"Uzbekistan","away":"Colombia","md":1},{"code":"G:K:3","group":"K","home":"Portugal","away":"Uzbekistan","md":2},{"code":"G:K:4","group":"K","home":"Colombia","away":"DR Congo","md":2},{"code":"G:K:5","group":"K","home":"Colombia","away":"Portugal","md":3},{"code":"G:K:6","group":"K","home":"DR Congo","away":"Uzbekistan","md":3},{"code":"G:L:1","group":"L","home":"England","away":"Croatia","md":1},{"code":"G:L:2","group":"L","home":"Ghana","away":"Panama","md":1},{"code":"G:L:3","group":"L","home":"England","away":"Ghana","md":2},{"code":"G:L:4","group":"L","home":"Panama","away":"Croatia","md":2},{"code":"G:L:5","group":"L","home":"Panama","away":"England","md":3},{"code":"G:L:6","group":"L","home":"Croatia","away":"Ghana","md":3}];
const R32=[{"match":73,"a":"RU-A","b":"RU-B"},{"match":74,"a":"W-E","b":"3rd"},{"match":75,"a":"W-F","b":"RU-C"},{"match":76,"a":"W-C","b":"RU-F"},{"match":77,"a":"W-I","b":"3rd"},{"match":78,"a":"RU-E","b":"RU-I"},{"match":79,"a":"W-A","b":"3rd"},{"match":80,"a":"W-L","b":"3rd"},{"match":81,"a":"W-D","b":"3rd"},{"match":82,"a":"W-G","b":"3rd"},{"match":83,"a":"RU-K","b":"RU-L"},{"match":84,"a":"W-H","b":"RU-J"},{"match":85,"a":"W-B","b":"3rd"},{"match":86,"a":"W-J","b":"RU-H"},{"match":87,"a":"W-K","b":"3rd"},{"match":88,"a":"RU-D","b":"RU-G"}];
const THIRD_SLOTS={"74":["A","B","C","D","F"],"77":["C","D","F","G","H"],"79":["C","E","F","H","I"],"80":["E","H","I","J","K"],"81":["B","E","F","I","J"],"82":["A","E","H","I","J"],"85":["E","F","G","I","J"],"87":["D","E","I","J","L"]};
const R16=[{"match":89,"a":74,"b":77},{"match":90,"a":73,"b":75},{"match":91,"a":76,"b":78},{"match":92,"a":79,"b":80},{"match":93,"a":83,"b":84},{"match":94,"a":81,"b":82},{"match":95,"a":86,"b":88},{"match":96,"a":85,"b":87}];
const QF=[{"match":97,"a":89,"b":90},{"match":98,"a":93,"b":94},{"match":99,"a":91,"b":92},{"match":100,"a":95,"b":96}];
const SF=[{"match":101,"a":97,"b":98},{"match":102,"a":99,"b":100}];
const FINAL={"match":104,"a":101,"b":102};
const DEFAULT_SCORING={"exact":5,"gd":3,"result":2,"g1":5,"g2":3,"g3":3,"qual":2,"thirdQual":4,"octavos":4,"cuartos":7,"semis":10,"finalists":15,"champion":25,"revelacion":8,"decepcion":8,"pichichi":12,"asistente":10,"hattrick":5,"dobleRoja":5};
const ESPN_NAME={"Bosnia-Herzegovina":"Bosnia and Herzegovina","Congo DR":"DR Congo","Curaçao":"Curacao","Czechia":"Czech Republic","Türkiye":"Turkey"};
const KO_WINDOWS=[{"reached":"octavos","from":"2026-06-28","to":"2026-07-03"},{"reached":"cuartos","from":"2026-07-04","to":"2026-07-07"},{"reached":"semis","from":"2026-07-09","to":"2026-07-11"},{"reached":"final","from":"2026-07-14","to":"2026-07-15"},{"reached":"champion","from":"2026-07-19","to":"2026-07-19"}];
const TEAM_SET=new Set([].concat(...GROUP_LETTERS.map(L=>GROUPS[L])));
function espnCanon(name){const n=ESPN_NAME[name]||name;return TEAM_SET.has(n)?n:null;}
const DATA={GROUPS,GROUP_LETTERS,ELO,GROUP_FIXTURES,R32,THIRD_SLOTS,R16,QF,SF,FINAL,DEFAULT_SCORING,ESPN_NAME,KO_WINDOWS,TEAM_SET,espnCanon};

const ENGINE=(function(DATA){

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
      if (s._complete) groupOrder[L] = s.map((x) => x.team); else allComplete = false;
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

})(DATA);

export { DATA, ENGINE };
