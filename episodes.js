// api/episodes.js — GET /api/episodes?id=anime-slug-20401
export const config = { runtime: "edge" };

const BASE = "https://aniwatchtv.to";
const H = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: BASE + "/",
  "X-Requested-With": "XMLHttpRequest",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return cors204();
  if (req.method !== "GET") return err("METHOD_NOT_ALLOWED", "Use GET", 405);

  const sp = new URL(req.url).searchParams;
  const id = (sp.get("id") || "").trim().toLowerCase();
  if (!id) return err("MISSING_PARAM", "Required param: id (anime slug)", 400);
  if (!/^[a-z0-9][a-z0-9-]+-\d{4,6}$/.test(id)) return err("INVALID_PARAM", "id must be a valid anime slug e.g. jujutsu-kaisen-20401", 400);

  try {
    const numId = id.match(/(\d+)$/)?.[1];
    const res = await fetch(`${BASE}/ajax/v2/episode/list/${numId}`, { headers: { ...H, Referer: `${BASE}/${id}` } });
    if (!res.ok) { if (res.status === 429) return err("UPSTREAM_RATE_LIMITED", "Rate limited", 429, { "Retry-After": "60" }); return err("UPSTREAM_ERROR", `Request failed: ${res.status}`, 502); }
    const data = await res.json();
    if (!data.status || !data.html) return err("UNEXPECTED_RESPONSE", "Invalid AniWatch response", 502);

    const eps = parseEpisodeList(data.html);
    if (!eps.length) return err("NO_EPISODES", "No episodes found for this anime", 404);

    return ok({ animeId: id, totalEpisodes: eps.length, episodes: eps.map(e => ({ number: e.number, episodeId: e.episodeId, url: `${BASE}/watch/${id}?ep=${e.episodeId}` })) });
  } catch (e) {
    return err("INTERNAL_ERROR", "Unexpected error", 500);
  }
}

function parseEpisodeList(html) {
  const eps = [], seen = new Set();
  const re = /<a\b([^>]*)>/g; let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const num = attrs.match(/data-number="(\d+)"/);
    const id  = attrs.match(/data-id="(\d+)"/);
    if (!num || !id) continue;
    const number = +num[1], episodeId = +id[1];
    if (!isNaN(number) && !isNaN(episodeId) && !seen.has(episodeId)) { seen.add(episodeId); eps.push({ number, episodeId }); }
  }
  return eps.sort((a, b) => a.number - b.number);
}

function ok(data) {
  return new Response(JSON.stringify(data, null, 2), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
}
function err(code, message, status, extra = {}) {
  return new Response(JSON.stringify({ error: { code, message } }, null, 2), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store", ...extra } });
}
function cors204() {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
