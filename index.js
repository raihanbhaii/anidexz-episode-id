import http from "http";
import { URL } from "url";

const BASE = "https://aniwatchtv.to";
const H = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: BASE + "/",
};

const PORT = process.env.PORT || 3000;

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname.replace(/\/+$/, "");

  if (path === "" || path === "/") {
    return send(res, 200, { status: "ok" });
  }

  // GET /api/episode?title=...&ep=N&lang=sub|dub
  if (path === "/api/episode") {
    const title = (url.searchParams.get("title") || "").trim();
    const epNum = parseInt(url.searchParams.get("ep"), 10);
    const lang = (url.searchParams.get("lang") || "sub").toLowerCase();

    if (!title) return send(res, 400, { error: "Missing param: title" });
    if (isNaN(epNum) || epNum < 1) return send(res, 400, { error: "Missing param: ep (must be a number >= 1)" });
    if (lang !== "sub" && lang !== "dub") return send(res, 400, { error: "lang must be 'sub' or 'dub'" });

    console.log(`[request] title="${title}" ep=${epNum} lang=${lang}`);

    try {
      const animeId = await findAnimeId(title);
      if (!animeId) {
        console.log(`[search] no match for: "${title}"`);
        return send(res, 404, { error: `Anime not found: "${title}"` });
      }

      const numId = animeId.match(/(\d+)$/)?.[1];
      const episodes = await fetchEpisodes(animeId, numId);
      if (!episodes.length) return send(res, 404, { error: "No episodes found for this anime" });

      const ep = episodes.find(e => e.number === epNum);
      if (!ep) return send(res, 404, { error: `Episode ${epNum} not found. Available: 1-${episodes.length}` });

      const embedUrl = `https://megaplay.buzz/stream/s-2/${ep.episodeId}/${lang}`;
      const embedHtml = `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" scrolling="no" allowfullscreen></iframe>`;

      send(res, 200, {
        embed: {
          url: embedUrl,
          html: embedHtml,
          lang,
        },
        episode: {
          id: ep.episodeId,
          number: epNum,
          totalEpisodes: episodes.length,
        },
        anime: {
          id: animeId,
        },
      });

    } catch (e) {
      console.error("[handler] unexpected error:", e);
      send(res, 500, { error: "Internal error: " + e.message });
    }
    return;
  }

  send(res, 404, { error: "Use GET /api/episode?title=...&ep=N&lang=sub|dub" });

}).listen(PORT, () => console.log(`Running on port ${PORT}`));

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findAnimeId(title) {
  // Try AJAX suggest first
  try {
    const ajaxRes = await fetch(`${BASE}/ajax/search/suggest?keyword=${encodeURIComponent(title)}`, {
      headers: { ...H, Accept: "application/json, text/plain, */*", "X-Requested-With": "XMLHttpRequest" },
    });
    if (ajaxRes.ok) {
      const data = await ajaxRes.json();
      const id = extractId(data.html || "", title);
      if (id) { console.log(`[search] found via AJAX: ${id}`); return id; }
    }
  } catch (e) { console.warn("[search] AJAX failed:", e.message); }

  // Fallback: scrape search page
  try {
    const pageRes = await fetch(`${BASE}/search?keyword=${encodeURIComponent(title)}`, { headers: H });
    const id = extractId(await pageRes.text(), title);
    if (id) { console.log(`[search] found via page: ${id}`); return id; }
  } catch (e) { console.warn("[search] page scrape failed:", e.message); }

  return null;
}

async function fetchEpisodes(animeId, numId) {
  const epRes = await fetch(`${BASE}/ajax/v2/episode/list/${numId}`, {
    headers: { ...H, Accept: "application/json, text/plain, */*", "X-Requested-With": "XMLHttpRequest", Referer: `${BASE}/${animeId}` },
  });
  if (!epRes.ok) throw new Error(`Episode list fetch failed: ${epRes.status}`);
  const data = await epRes.json();
  const eps = parseEpisodes(data.html || "");
  console.log(`[episodes] found ${eps.length} for ${animeId}`);
  return eps;
}

function extractId(html, query) {
  const seen = new Set(), candidates = [];
  let m;

  const s1 = /<a[^>]+href="\/([a-z0-9][a-z0-9-]+-\d{4,6})"[^>]*class="[^"]*dynamic-name[^"]*"[^>]*>([^<]*)<\/a>/gi;
  while ((m = s1.exec(html)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); candidates.push({ id: m[1].trim(), name: m[2].trim() }); }
  }
  const s2 = /<a[^>]+href="\/([a-z0-9][a-z0-9-]+-\d{4,6})"[^>]*class="[^"]*(?:film.name|title)[^"]*"[^>]*>([^<]*)<\/a>/gi;
  while ((m = s2.exec(html)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); candidates.push({ id: m[1].trim(), name: m[2].trim() }); }
  }
  const s3 = /href="\/([a-z0-9][a-z0-9-]+-\d{4,6})(?:\?[^"]*)?"[^>]*>([^<]{2,80})</gi;
  while ((m = s3.exec(html)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); candidates.push({ id: m[1].trim(), name: m[2].trim() }); }
  }
  const s4 = /href="\/([a-z0-9][a-z0-9-]+-\d{4,6})"/gi;
  while ((m = s4.exec(html)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); candidates.push({ id: m[1], name: "" }); }
  }

  if (!candidates.length) return null;

  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/).filter(Boolean);
  const qSlug = q.replace(/\s+/g, "-");
  const queryHasSeason = /\b(season\s*\d|s\d|part\s*\d|\d+(nd|rd|th)\s*season)\b/i.test(query);

  let best = null, bestScore = -1;
  for (const c of candidates) {
    const name = c.name.toLowerCase(), slug = c.id.toLowerCase();
    let score = 0;
    if (name === q || slug === qSlug) score += 100;
    else if (name.startsWith(q) || slug.startsWith(qSlug)) score += 70;
    else if (name.includes(q) || slug.includes(qSlug)) score += 50;
    score += (qWords.filter(w => name.includes(w) || slug.includes(w)).length / qWords.length) * 40;
    if (!queryHasSeason) {
      const isSequel = /\b(season [2-9]|[2-9](nd|rd|th) season|part [2-9]|cour [2-9])\b/.test(name)
        || /-(season|part)-[2-9]/.test(slug);
      if (isSequel) score -= 60;
    }
    if (score > bestScore) { bestScore = score; best = c; }
  }

  return best ? best.id : candidates[0].id;
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

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(data, null, 2));
}
