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

  if (path === "" || path === "/") return send(res, 200, { status: "ok" });

  if (path !== "/api/episode") {
    return send(res, 404, { error: "Use GET /api/episode?title=...&ep=N" });
  }

  const title = (url.searchParams.get("title") || "").trim();
  const epNum = parseInt(url.searchParams.get("ep"), 10);

  if (!title) return send(res, 400, { error: "Missing param: title" });
  if (isNaN(epNum) || epNum < 1) return send(res, 400, { error: "Missing param: ep" });

  console.log(`[request] title="${title}" ep=${epNum}`);

  try {
    // Try original title first
    let animeId = await findAnimeId(title);
    
    // If no match, try multiple translation strategies
    if (!animeId) {
      const translations = await getAllTranslations(title);
      for (const translated of translations) {
        if (translated !== title.toLowerCase()) {
          console.log(`[translate] "${title}" -> "${translated}"`);
          animeId = await findAnimeId(translated);
          if (animeId) break;
        }
      }
    }

    if (!animeId) return send(res, 404, { error: `Anime not found: "${title}"` });

    const numId = animeId.match(/(\d+)$/)?.[1];
    const episodes = await fetchEpisodes(animeId, numId);
    if (!episodes.length) return send(res, 404, { error: "No episodes found" });

    const ep = episodes.find(e => e.number === epNum);
    if (!ep) return send(res, 404, { error: `Episode ${epNum} not found. Available: 1-${episodes.length}` });

    send(res, 200, {
      episodeId: ep.episodeId,
      episodeNumber: epNum,
      totalEpisodes: episodes.length,
      url: `${BASE}/watch/${animeId}?ep=${ep.episodeId}`,
    });
  } catch (e) {
    console.error("[handler] error:", e);
    send(res, 500, { error: "Internal error: " + e.message });
  }

}).listen(PORT, () => console.log(`Running on port ${PORT}`));

async function getAllTranslations(title) {
  const translations = [];
  
  // 1. Pinyin/Romanized Chinese names (handles "Xiuluo Wu Shen")
  const pinyinMatch = title.match(/([A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+)/i);
  if (pinyinMatch) {
    const pinyin = pinyinMatch[1];
    const englishName = pinyinToEnglish[pinyin];
    if (englishName) translations.push(englishName);
  }

  // 2. Detect CJK characters
  const cjkRegex = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  if (cjkRegex.test(title)) {
    translations.push(...await googleTranslate(title));
  }

  // 3. Exact popular title mappings (covers both CJK and Pinyin)
  const exactMatch = findExactTranslation(title);
  if (exactMatch) translations.push(exactMatch);

  // 4. Common Pinyin patterns
  const pinyinTranslation = await pinyinTranslate(title);
  if (pinyinTranslation) translations.push(pinyinTranslation);

  return [...new Set(translations)]; // Remove duplicates
}

const pinyinToEnglish = {
  // Pinyin/Romanized Chinese donghua names → English
  'Xiuluo Wu Shen': 'Martial God Asura',
  'Dou Luo Da Lu': 'Douluo Continent',
  'Dou Po Cang Qiong': 'Battle Through the Heavens',
  'Fan Ren Xiu Xian Zhuan': 'A Record of a Mortal\'s Journey to Immortality',
  'Hu Yao Xiao Hong Niang': 'Fox Spirit Matchmaker',
  'Wan Mei Shi Jie': 'Perfect World',
  'Xing Chen Bian': 'Stellar Transformations',
  
  // More Pinyin names
  'Ling Jian Zun': 'Spirit Sword Sovereign',
  'Wu Dong Qian Kun': 'Martial Universe',
  'Yao Lao': 'Battle Through the Heavens', // Common character name
};

async function googleTranslate(title) {
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(title)}`,
      { 
        headers: { 
          'User-Agent': H['User-Agent'],
          'Accept': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return [data[0][0][0]];
    }
  } catch (e) {
    console.warn('[google-translate] failed:', e.message);
  }
  return [];
}

function findExactTranslation(title) {
  const lowerTitle = title.toLowerCase();
  
  // Comprehensive exact matches (CJK + Pinyin + English variants)
  const translations = {
    // Chinese CJK
    '一人之下': 'Under One Person',
    '斗罗大陆': 'Douluo Continent',
    '斗破苍穹': 'Battle Through the Heavens',
    '完美世界': 'Perfect World',
    '凡人修仙传': 'A Record of a Mortal\'s Journey to Immortality',
    '狐妖小红娘': 'Fox Spirit Matchmaker',
    '修罗武神': 'Martial God Asura',
    
    // Pinyin/Romanized
    'xiuluo wu shen': 'Martial God Asura',
    'dou luo da lu': 'Douluo Continent',
    'dou po cang qiong': 'Battle Through the Heavens',
    
    // Japanese
    '鬼滅の刃': 'Demon Slayer',
    '進撃の巨人': 'Attack on Titan',
    '僕のヒーローアカデミア': 'My Hero Academia',
    
    // Korean
    '나혼잇따': 'Solo Leveling',
    '신의 탑': 'Tower of God',
  };

  for (const [orig, eng] of Object.entries(translations)) {
    if (title.includes(orig) || lowerTitle.includes(orig.toLowerCase())) {
      return eng;
    }
  }
  return null;
}

async function pinyinTranslate(title) {
  // Simple Pinyin pattern matching for common 3-4 word titles
  const pinyinPattern = /^([A-Z][a-z]+(?: [A-Z][a-z]+){2,3})$/i;
  if (!pinyinPattern.test(title)) return null;

  const words = title.toLowerCase().split(/\s+/);
  const knownPinyin = words.filter(word => pinyinToEnglish[word]);
  
  if (knownPinyin.length === words.length) {
    // Full Pinyin match
    return pinyinToEnglish[title.toLowerCase()];
  }
  
  // Partial Pinyin → try combinations
  for (const word of words) {
    if (pinyinToEnglish[word]) {
      return pinyinToEnglish[word];
    }
  }
  
  return null;
}

// [Rest of your original functions unchanged - findAnimeId, fetchEpisodes, extractId, parseEpisodes, send]
async function findAnimeId(title) {
  try {
    const r = await fetch(`${BASE}/ajax/search/suggest?keyword=${encodeURIComponent(title)}`, {
      headers: { ...H, Accept: "application/json, text/plain, */*", "X-Requested-With": "XMLHttpRequest" },
    });
    if (r.ok) {
      const d = await r.json();
      const id = extractId(d.html || "", title);
      if (id) { console.log(`[search] AJAX: ${id}`); return id; }
    }
  } catch (e) { console.warn("[search] AJAX failed:", e.message); }

  try {
    const r = await fetch(`${BASE}/search?keyword=${encodeURIComponent(title)}`, { headers: H });
    const id = extractId(await r.text(), title);
    if (id) { console.log(`[search] page: ${id}`); return id; }
  } catch (e) { console.warn("[search] page failed:", e.message); }

  return null;
}

async function fetchEpisodes(animeId, numId) {
  const r = await fetch(`${BASE}/ajax/v2/episode/list/${numId}`, {
    headers: { ...H, Accept: "application/json, text/plain, */*", "X-Requested-With": "XMLHttpRequest", Referer: `${BASE}/${animeId}` },
  });
  if (!r.ok) throw new Error(`Episode fetch failed: ${r.status}`);
  const d = await r.json();
  const eps = parseEpisodes(d.html || "");
  console.log(`[episodes] ${eps.length} found for ${animeId}`);
  return eps;
}

function extractId(html, query) {
  const seen = new Set(), candidates = [];
  let m;

  const s1 = /<a[^>]+href="\/([a-z0-9][a-z0-9-]+-\d{4,6})"[^>]*class="[^"]*dynamic-name[^"]*"[^>]*>([^<]*)<\/a>/gi;
  while ((m = s1.exec(html)) !== null)
    if (!seen.has(m[1])) { seen.add(m[1]); candidates.push({ id: m[1].trim(), name: m[2].trim() }); }

  const s2 = /<a[^>]+href="\/([a-z0-9][a-z0-9-]+-\d{4,6})"[^>]*class="[^"]*(?:film.name|title)[^"]*"[^>]*>([^<]*)<\/a>/gi;
  while ((m = s2.exec(html)) !== null)
    if (!seen.has(m[1])) { seen.add(m[1]); candidates.push({ id: m[1].trim(), name: m[2].trim() }); }

  const s3 = /href="\/([a-z0-9][a-z0-9-]+-\d{4,6})(?:\?[^"]*)?"[^>]*>([^<]{2,80})</gi;
  while ((m = s3.exec(html)) !== null)
    if (!seen.has(m[1])) { seen.add(m[1]); candidates.push({ id: m[1].trim(), name: m[2].trim() }); }

  const s4 = /href="\/([a-z0-9][a-z0-9-]+-\d{4,6})"/gi;
  while ((m = s4.exec(html)) !== null)
    if (!seen.has(m[1])) { seen.add(m[1]); candidates.push({ id: m[1], name: "" }); }

  if (!candidates.length) return null;

  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/).filter(Boolean);
  const qSlug = q.replace(/\s+/g, "-");

  // ✅ EXACT MATCH FIRST
  for (const c of candidates) {
    const name = c.name.toLowerCase();
    const slug = c.id.toLowerCase();
    
    if (name === q || slug === qSlug) {
      console.log(`[EXACT] ${c.id} "${c.name}"`);
      return c.id;
    }
    
    const cleanName = name.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanQ = q.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanName === cleanQ) {
      console.log(`[EXACT-CLEAN] ${c.id} "${c.name}"`);
      return c.id;
    }
  }

  // Fallback similarity scoring (your original logic)
  let best = null, bestScore = -1;
  for (const c of candidates) {
    const name = c.name.toLowerCase(), slug = c.id.toLowerCase();
    let score = 0;
    if (name === q || slug === qSlug) score += 100;
    else if (name.startsWith(q) || slug.startsWith(qSlug)) score += 70;
    else if (name.includes(q) || slug.includes(qSlug)) score += 50;
    score += (qWords.filter(w => name.includes(w) || slug.includes(w)).length / qWords.length) * 40;
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
