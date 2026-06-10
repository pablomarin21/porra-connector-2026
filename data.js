/* ============================================================================
   PORRA MUNDIAL 2026 — Datos oficiales verificados (doble fuente: Wikipedia + ESPN)
   Sorteo: 5 dic 2025 (Kennedy Center, Washington D.C.) · 48 selecciones · 12 grupos
   Estructura de eliminatorias y regla de los 8 mejores terceros verificadas contra
   la web oficial de la fase eliminatoria (Annex C de la normativa FIFA).
   ========================================================================== */
window.PORRA_DATA = (function () {
  // --- 12 grupos (nombre canónico interno en inglés) ---
  const GROUPS = {
    A: ["Mexico", "South Africa", "South Korea", "Czech Republic"],
    B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
    C: ["Brazil", "Morocco", "Haiti", "Scotland"],
    D: ["United States", "Paraguay", "Australia", "Turkey"],
    E: ["Germany", "Curacao", "Ivory Coast", "Ecuador"],
    F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
    G: ["Belgium", "Egypt", "Iran", "New Zealand"],
    H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
    I: ["France", "Senegal", "Iraq", "Norway"],
    J: ["Argentina", "Algeria", "Austria", "Jordan"],
    K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
    L: ["England", "Croatia", "Ghana", "Panama"],
  };
  const GROUP_LETTERS = Object.keys(GROUPS);

  // --- Nombre en español + bandera (emoji) por selección ---
  const TEAM_INFO = {
    "Mexico": { es: "México", flag: "🇲🇽" },
    "South Africa": { es: "Sudáfrica", flag: "🇿🇦" },
    "South Korea": { es: "Corea del Sur", flag: "🇰🇷" },
    "Czech Republic": { es: "Chequia", flag: "🇨🇿" },
    "Canada": { es: "Canadá", flag: "🇨🇦" },
    "Bosnia and Herzegovina": { es: "Bosnia y H.", flag: "🇧🇦" },
    "Qatar": { es: "Catar", flag: "🇶🇦" },
    "Switzerland": { es: "Suiza", flag: "🇨🇭" },
    "Brazil": { es: "Brasil", flag: "🇧🇷" },
    "Morocco": { es: "Marruecos", flag: "🇲🇦" },
    "Haiti": { es: "Haití", flag: "🇭🇹" },
    "Scotland": { es: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    "United States": { es: "EE. UU.", flag: "🇺🇸" },
    "Paraguay": { es: "Paraguay", flag: "🇵🇾" },
    "Australia": { es: "Australia", flag: "🇦🇺" },
    "Turkey": { es: "Turquía", flag: "🇹🇷" },
    "Germany": { es: "Alemania", flag: "🇩🇪" },
    "Curacao": { es: "Curazao", flag: "🇨🇼" },
    "Ivory Coast": { es: "Costa de Marfil", flag: "🇨🇮" },
    "Ecuador": { es: "Ecuador", flag: "🇪🇨" },
    "Netherlands": { es: "Países Bajos", flag: "🇳🇱" },
    "Japan": { es: "Japón", flag: "🇯🇵" },
    "Sweden": { es: "Suecia", flag: "🇸🇪" },
    "Tunisia": { es: "Túnez", flag: "🇹🇳" },
    "Belgium": { es: "Bélgica", flag: "🇧🇪" },
    "Egypt": { es: "Egipto", flag: "🇪🇬" },
    "Iran": { es: "Irán", flag: "🇮🇷" },
    "New Zealand": { es: "Nueva Zelanda", flag: "🇳🇿" },
    "Spain": { es: "España", flag: "🇪🇸" },
    "Cape Verde": { es: "Cabo Verde", flag: "🇨🇻" },
    "Saudi Arabia": { es: "Arabia Saudí", flag: "🇸🇦" },
    "Uruguay": { es: "Uruguay", flag: "🇺🇾" },
    "France": { es: "Francia", flag: "🇫🇷" },
    "Senegal": { es: "Senegal", flag: "🇸🇳" },
    "Iraq": { es: "Irak", flag: "🇮🇶" },
    "Norway": { es: "Noruega", flag: "🇳🇴" },
    "Argentina": { es: "Argentina", flag: "🇦🇷" },
    "Algeria": { es: "Argelia", flag: "🇩🇿" },
    "Austria": { es: "Austria", flag: "🇦🇹" },
    "Jordan": { es: "Jordania", flag: "🇯🇴" },
    "Portugal": { es: "Portugal", flag: "🇵🇹" },
    "DR Congo": { es: "RD Congo", flag: "🇨🇩" },
    "Uzbekistan": { es: "Uzbekistán", flag: "🇺🇿" },
    "Colombia": { es: "Colombia", flag: "🇨🇴" },
    "England": { es: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    "Croatia": { es: "Croacia", flag: "🇭🇷" },
    "Ghana": { es: "Ghana", flag: "🇬🇭" },
    "Panama": { es: "Panamá", flag: "🇵🇦" },
  };

  // --- Ratings Elo (World Football Elo, ~jun 2026). Turquía y Suecia estimados. ---
  const ELO = {
    "Mexico": 1868, "South Africa": 1517, "South Korea": 1756, "Czech Republic": 1733,
    "Canada": 1793, "Bosnia and Herzegovina": 1591, "Qatar": 1423, "Switzerland": 1894,
    "Brazil": 1988, "Morocco": 1822, "Haiti": 1532, "Scotland": 1770,
    "United States": 1733, "Paraguay": 1833, "Australia": 1775, "Turkey": 1815,
    "Germany": 1925, "Curacao": 1433, "Ivory Coast": 1676, "Ecuador": 1935,
    "Netherlands": 1961, "Japan": 1906, "Sweden": 1810, "Tunisia": 1633,
    "Belgium": 1866, "Egypt": 1699, "Iran": 1764, "New Zealand": 1585,
    "Spain": 2165, "Cape Verde": 1576, "Saudi Arabia": 1566, "Uruguay": 1892,
    "France": 2081, "Senegal": 1866, "Iraq": 1608, "Norway": 1917,
    "Argentina": 2113, "Algeria": 1743, "Austria": 1830, "Jordan": 1685,
    "Portugal": 1984, "DR Congo": 1655, "Uzbekistan": 1718, "Colombia": 1977,
    "England": 2020, "Croatia": 1930, "Ghana": 1503, "Panama": 1733,
  };

  // --- Fixtures de fase de grupos: round-robin (6 partidos por grupo, 3 jornadas) ---
  // El orden de cruces es estándar; el marcador lo introduce el admin, así que la
  // disposición no afecta a la clasificación ni a la simulación.
  const GROUP_FIXTURES = [];
  for (const L of GROUP_LETTERS) {
    const t = GROUPS[L];
    const pairs = [
      [t[0], t[1], 1], [t[2], t[3], 1], // Jornada 1
      [t[0], t[2], 2], [t[3], t[1], 2], // Jornada 2
      [t[3], t[0], 3], [t[1], t[2], 3], // Jornada 3
    ];
    pairs.forEach((p, i) => {
      GROUP_FIXTURES.push({ code: `G:${L}:${i + 1}`, group: L, home: p[0], away: p[1], md: p[2] });
    });
  }

  // --- Bracket eliminatorias (VERIFICADO; M89/M90 corregidos) ---
  // Codes: "W-X"=ganador grupo X, "RU-X"=segundo grupo X, "3rd:slot"=mejor tercero.
  const R32 = [
    { match: 73, a: "RU-A", b: "RU-B" },
    { match: 74, a: "W-E", b: "3rd" },
    { match: 75, a: "W-F", b: "RU-C" },
    { match: 76, a: "W-C", b: "RU-F" },
    { match: 77, a: "W-I", b: "3rd" },
    { match: 78, a: "RU-E", b: "RU-I" },
    { match: 79, a: "W-A", b: "3rd" },
    { match: 80, a: "W-L", b: "3rd" },
    { match: 81, a: "W-D", b: "3rd" },
    { match: 82, a: "W-G", b: "3rd" },
    { match: 83, a: "RU-K", b: "RU-L" },
    { match: 84, a: "W-H", b: "RU-J" },
    { match: 85, a: "W-B", b: "3rd" },
    { match: 86, a: "W-J", b: "RU-H" },
    { match: 87, a: "W-K", b: "3rd" },
    { match: 88, a: "RU-D", b: "RU-G" },
  ];
  // Slots de terceros (matchNum -> grupos elegibles)
  const THIRD_SLOTS = {
    74: ["A", "B", "C", "D", "F"],
    77: ["C", "D", "F", "G", "H"],
    79: ["C", "E", "F", "H", "I"],
    80: ["E", "H", "I", "J", "K"],
    81: ["B", "E", "F", "I", "J"],
    82: ["A", "E", "H", "I", "J"],
    85: ["E", "F", "G", "I", "J"],
    87: ["D", "E", "I", "J", "L"],
  };
  const R16 = [
    { match: 89, a: 74, b: 77 }, { match: 90, a: 73, b: 75 },
    { match: 91, a: 76, b: 78 }, { match: 92, a: 79, b: 80 },
    { match: 93, a: 83, b: 84 }, { match: 94, a: 81, b: 82 },
    { match: 95, a: 86, b: 88 }, { match: 96, a: 85, b: 87 },
  ];
  const QF = [
    { match: 97, a: 89, b: 90 }, { match: 98, a: 93, b: 94 },
    { match: 99, a: 91, b: 92 }, { match: 100, a: 95, b: 96 },
  ];
  const SF = [
    { match: 101, a: 97, b: 98 }, { match: 102, a: 99, b: 100 },
  ];
  const FINAL = { match: 104, a: 101, b: 102 };

  const SCHEDULE = {
    groupStage: "11 – 27 jun 2026",
    r32: "28 jun – 3 jul 2026",
    r16: "4 – 7 jul 2026",
    qf: "9 – 11 jul 2026",
    sf: "14 – 15 jul 2026",
    final: "19 jul 2026 · MetLife Stadium",
  };

  // --- Puntuación por defecto (el admin puede cambiarla) ---
  const DEFAULT_SCORING = {
    // --- marcadores de los 72 partidos de fase de grupos (sistema de puntos por partido) ---
    exact: 5,       // 🎯 acertar el MARCADOR EXACTO (p.ej. pones 2-1 y queda 2-1)
    gd: 3,          // ➕ acertar quién gana/empata Y la diferencia de goles (2-1 vs 3-2)
    result: 2,      // ✅ acertar solo el resultado: victoria / empate / derrota (1-X-2)
    g1: 5,          // acertar el 1º del grupo (posición exacta)
    g2: 3,          // acertar el 2º del grupo (posición exacta)
    g3: 3,          // acertar el 3º del grupo (posición exacta)
    qual: 2,        // acertar que un equipo queda entre los 2 primeros (clasifica directo)
    thirdQual: 4,   // acertar un tercero que entra entre los 8 mejores (clasifica)
    octavos: 4,     // por cada equipo que predices en octavos y llega
    cuartos: 7,     // por cada equipo en cuartos
    semis: 10,      // por cada equipo en semifinales
    finalists: 15,  // por cada finalista
    champion: 25,   // por acertar el campeón
    // --- predicciones especiales (puntos extra) ---
    revelacion: 8, decepcion: 8, pichichi: 12, asistente: 10, hattrick: 5, dobleRoja: 5,
  };

  // --- Cierre automático: 1 hora antes del primer partido (saque 19:00 UTC, jue 11 jun) ---
  const LOCK_AT_DEFAULT = "2026-06-11T18:00:00Z";

  // --- Predicciones especiales (aparte de la general) ---
  const SIDE_BETS = [
    { key: "hattrick", emoji: "⚽", q: "¿Habrá algún hat-trick (un jugador marca 3 goles) en el Mundial?" },
    { key: "dobleRoja", emoji: "🟥", q: "¿Habrá un partido con tarjeta roja para los DOS equipos?" },
  ];

  // --- Mapeo de nombres de ESPN a nuestro nombre canónico (solo los que difieren) ---
  const ESPN_NAME = {
    "Bosnia-Herzegovina": "Bosnia and Herzegovina",
    "Congo DR": "DR Congo",
    "Curaçao": "Curacao",
    "Czechia": "Czech Republic",
    "Türkiye": "Turkey",
  };
  const TEAM_SET = new Set([].concat(...GROUP_LETTERS.map((L) => GROUPS[L])));
  function espnCanon(name) {
    const n = ESPN_NAME[name] || name;
    return TEAM_SET.has(n) ? n : null; // null = placeholder ("Group A Winner", etc.)
  }

  // --- Ventanas de fechas de eliminatorias (para saber qué ronda alcanzó cada equipo) ---
  // El ganador de un partido jugado en esa ventana "llega" a la ronda indicada.
  const KO_WINDOWS = [
    { reached: "octavos", from: "2026-06-28", to: "2026-07-03" }, // gana 1/16 → llega a octavos
    { reached: "cuartos", from: "2026-07-04", to: "2026-07-07" }, // gana octavos → llega a cuartos
    { reached: "semis", from: "2026-07-09", to: "2026-07-11" },   // gana cuartos → llega a semis
    { reached: "final", from: "2026-07-14", to: "2026-07-15" },   // gana semis → llega a la final
    { reached: "champion", from: "2026-07-19", to: "2026-07-19" },// gana la final → campeón
  ];

  return {
    GROUPS, GROUP_LETTERS, TEAM_INFO, ELO, GROUP_FIXTURES,
    R32, THIRD_SLOTS, R16, QF, SF, FINAL, SCHEDULE, DEFAULT_SCORING,
    LOCK_AT_DEFAULT, SIDE_BETS, ESPN_NAME, espnCanon, KO_WINDOWS, TEAM_SET,
    es: (t) => (TEAM_INFO[t] ? TEAM_INFO[t].es : t),
    flag: (t) => (TEAM_INFO[t] ? TEAM_INFO[t].flag : "🏳️"),
  };
})();
