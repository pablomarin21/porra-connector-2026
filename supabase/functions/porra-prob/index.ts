import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
// IMPORTANTE: el bundler de Supabase NO permite importar desde github.io, pero sí desde cdn.jsdelivr.net.
// Esta URL se fija al commit que contiene engine-esm.js del repo de la porra Connector (se rellena al desplegar).
import { DATA, ENGINE } from "https://cdn.jsdelivr.net/gh/pablomarin21/porra-connector-2026@4aba40c18859508a6966fd31905914335dc6495c/engine-esm.js";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const jsonR = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const KO = [...DATA.R32, ...DATA.R16, ...DATA.QF, ...DATA.SF, DATA.FINAL];

// Una porra está COMPLETA cuando: los 72 marcadores de grupo + 8 terceros + 31 cruces del cuadro + 6 especiales.
function isComplete(picks: any) {
  if (!picks) return false;
  const scoresN = (DATA.GROUP_FIXTURES as any[]).filter((fx: any) => { const p = picks.scores && picks.scores[fx.code]; return p && p[0] != null && p[1] != null; }).length;
  const bracketN = KO.filter((m: any) => picks.bracket && picks.bracket[m.match]).length;
  const thirdsN = (picks.thirds || []).length;
  const ex = picks.extras || {}, sbx = ex.sidebets || {};
  const exN = ["revelacion", "decepcion", "pichichi", "asistente"].filter((k) => ex[k]).length + ["hattrick", "dobleRoja"].filter((k) => sbx[k]).length;
  return scoresN === DATA.GROUP_FIXTURES.length && thirdsN === 8 && bracketN === 31 && exN === 6;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").toUpperCase().trim();
    if (!code) return jsonR({ error: "NO_CODE" }, 400);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: pool } = await sb.from("porra2_pools").select("id,locked,lock_at,settings").eq("code", code).maybeSingle();
    if (!pool) return jsonR({ error: "POOL_NOT_FOUND" }, 404);
    const { data: parts } = await sb.from("porra2_participants").select("id,first_name,last_name,created_at").eq("pool_id", pool.id).order("created_at");
    const { data: preds } = await sb.from("porra2_predictions").select("participant_id,picks").eq("pool_id", pool.id);
    const picksById: Record<string, any> = {};
    (preds || []).forEach((p: any) => { picksById[p.participant_id] = p.picks; });
    const { data: results } = await sb.from("porra2_results").select("*");
    const dbResults: Record<string, any> = {};
    (results || []).forEach((r: any) => { dbResults[r.match_code] = r; });
    const { data: cfg } = await sb.from("porra2_config").select("extras_actual").eq("id", 1).maybeSingle();
    const extrasActual = (cfg && cfg.extras_actual) || {};
    let espnEvents: any[] = [];
    try { const r = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200"); const j = await r.json(); espnEvents = j.events || []; } catch (_e) { /* sigue con DB */ }
    const oc = ENGINE.outcomeFromEspn(espnEvents, dbResults, extrasActual);
    const S = Object.assign({}, DATA.DEFAULT_SCORING, pool.settings || {});
    const entries = (parts || []).filter((p: any) => picksById[p.id]).map((p: any) => {
      const picks = picksById[p.id];
      const dp = ENGINE.derivePicks(picks);
      const base = ENGINE.scoreEntry(dp, oc, S);
      const extra = ENGINE.scoreExtras(picks.extras, extrasActual, S).total;
      return { id: p.id, first_name: p.first_name, last_name: p.last_name, dp, extra, points: base + extra, complete: isComplete(picks) };
    });
    let rows: any[] = []; let simsUsed = 0;
    if (entries.length) {
      const N = entries.length > 40 ? 2000 : 4000; simsUsed = N;
      // Base de la simulación: resultados de DB (grupos + ELIMINATORIAS por nº de partido) + marcadores de grupo en vivo (ESPN).
      const simMap = Object.assign({}, dbResults, oc.groupMap || {});
      const mc = ENGINE.monteCarlo(entries.map((e: any) => ({ id: e.id, picks: e.dp, extraPts: e.extra })), simMap, N, S, Math.random);
      rows = entries.map((e: any) => ({ id: e.id, first_name: e.first_name, last_name: e.last_name, points: e.points, win: mc.byId[e.id].win, podium: mc.byId[e.id].podium, avg: mc.byId[e.id].avg, complete: e.complete }));
    }
    rows.sort((a: any, b: any) => (b.points - a.points) || ((b.win || 0) - (a.win || 0)) || String(a.last_name).localeCompare(String(b.last_name)));
    const locked = !!(pool.locked || (pool.lock_at && Date.now() >= Date.parse(pool.lock_at)));
    return jsonR({ locked, count: rows.length, incomplete: rows.filter((r: any) => !r.complete).length, sims: simsUsed, rows });
  } catch (e) { return jsonR({ error: String((e as any)?.message || e) }, 500); }
});
