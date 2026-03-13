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
  const sp = new URL(req.url).searchParams;
  const title = (sp.get("title") || "").trim();
  const epNum = parseInt(sp.get("ep"), 10);

  if (!title) return res({ error: "Missing param: title" }, 400);
  if (isNaN(epNum) || epNum < 1) return res({ error: "Missing param: ep" }, 400);

  const searchRes = await fetch(`${BASE}/search?keyword=${encodeURIComponent(title)}`, { headers: H });
  const html = await searchRes.text();
  const anime = parseSearch(html, title);
  if (!anime) return res({ error: "Anime not found" }, 404);

  const numId = anime.id.match(/(\d+)$/)?.[1];
  const epRes = await fetch(`${BASE}/ajax/v2/episode/list/${numId}`, { headers: { ...H, Referer: `${BASE}/${anime.id}` } });
  const data = await epRes.json();
  const episodes = parseEpisodes(data.html || "");
  const ep = episodes.find(e => e.number === epNum);
  if (!ep) return res({ error: `Episode ${epNum} not found. Total: ${episodes.length}` }, 404);

  return res({
    episodeId: ep.episodeId,
    episodeNumber: epNum,
    url: `${BASE}/watch/${anime.id}?ep=${ep.episodeId}`,
  });
}

function parseSearch(html, query) {
  const seen = new Set(), results = [];
  let m;
  const re = /<a[^>]+href="\/([a-z0-9][a-z0-9-]+-\d{4,6})"[^>]*class="[^"]*dynamic-name[^"]*"[^>]*>([^<]+)<\/a>/g;
  while ((m = re.exec(html)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); results.push({ id: m[1].trim(), name: m[2].trim() }); }
  }
  if (!results.length) {
    const fb = /href="\/([a-z][a-z0-9-]+-\d{4,6})"/g;
    while ((m = fb.exec(html)) !== null) {
      if (!seen.has(m[1])) { seen.add(m[1]); results.push({ id: m[1], name: "" }); }
    }
  }
  if (!results.length) return null;
  const q = query.toLowerCase();
  return results.find(r => r.name.toLowerCase().includes(q) || r.id.includes(q.replace(/\s+/g, "-"))) || results[0];
}

function parseEpisodes(html) {
  const eps = [], seen = new Set();
  const re = /<a\b([^>]*)>/g; let m;
  while ((m = re.exec(html)) !== null) {
    const num = m[1].match(/data-number="(\d+)"/);
    const id  = m[1].match(/data-id="(\d+)"/);
    if (!num || !id) continue;
    const number = +num[1], episodeId = +id[1];
    if (!seen.has(episodeId)) { seen.add(episodeId); eps.push({ number, episodeId }); }
  }
  return eps.sort((a, b) => a.number - b.number);
}

function res(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
