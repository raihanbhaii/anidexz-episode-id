<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=220&section=header&text=AniDexz%20Episode%20API&fontSize=55&fontColor=fff&animation=twinkling&fontAlignY=38&desc=⚡%20Blazing%20Fast%20Anime%20Episode%20ID%20Lookup&descAlignY=58&descSize=20" width="100%"/>

<br/>

<br/>

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdmNnRibnVxbnVodXp6NHY5NzBtNXozemF5MDhuaWx5eTFuMGcyNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/hv5AEBpH3ZyNoRnABG/giphy.gif" width="160"/>

<br/><br/>

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Platform](https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-ff69b4?style=for-the-badge)
![Anime](https://img.shields.io/badge/Powered%20By-Anime-FF6B9D?style=for-the-badge&logo=crunchyroll&logoColor=white)
![Status](https://img.shields.io/badge/Status-Online-00D26A?style=for-the-badge&logo=statuspage&logoColor=white)
![Zero Deps](https://img.shields.io/badge/Dependencies-Zero-blueviolet?style=for-the-badge&logo=npm&logoColor=white)
![PRs](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge&logo=github&logoColor=white)

<br/>

<img src="https://img.shields.io/github/stars/tipuraihanff-art/anidexz-episode-id?style=social"/> &nbsp;
<img src="https://img.shields.io/github/watchers/tipuraihanff-art/anidexz-episode-id?style=social"/> &nbsp;
<img src="https://img.shields.io/github/forks/tipuraihanff-art/anidexz-episode-id?style=social"/>

<br/><br/>

```
🎌  Search Anime  →  🎯  Get Episode ID  →  🚀  Build Something Cool
```

</div>

---

<div align="center">

## 🚨 IMPORTANT — DO NOT FORK 🚨

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2lqd2ZwMGw3NG13NmR0eTVnNHRiemx2czYwNXJ3aWxsMTkxb2MzMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LRVnPYqM8DLag/giphy.gif" width="120"/>

</div>

| ❌ Forking | ✅ Direct Connect |
|-----------|-----------------|
| You miss all future updates | Auto-redeploys on every update |
| You maintain your own copy | We maintain it for you |
| Bugs stay with you | Fixes come to you instantly |

> 💡 **How to do it right:** On Render, when connecting a repo — search for `tipuraihanff-art/anidexz-episode-id` and connect it directly. Do **not** fork first.

---

<div align="center">

## 🌸 What is AniDexz?

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzk5aGN5ejZlMWtlYzQ0NXQ5NXlxMzhzbWs2dXoxbjZrNmE3dXBsMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l3q2zbskZp2j8wniE/giphy.gif" width="130"/>

</div>

A **dead-simple REST API** built in pure Node.js with **zero dependencies** that lets you look up anime episode IDs by title and episode number.

- 🔎 **Fuzzy title matching** — typos and partial names work
- 🧠 **Smart season detection** — auto-picks Season 1 when unspecified
- ⚡ **Two-stage search** — AJAX suggest + page scrape fallback
- 🆓 **Completely free** to host and use
- 📦 **Zero npm packages** — just Node.js built-ins

---

## ⚡ Live Demo

> Hit this right now 👇

```bash
curl "https://yourweb.onrender.com/api/episode?title=Solo+Leveling&ep=1"
```

```json
{
  "episodeId": 134524,
  "episodeNumber": 1,
  "totalEpisodes": 13,
  "url": "https://aniwatchtv.to/watch/solo-leveling-19413?ep=134524"
}
```

---

## 🚀 Deploy Your Own

<details>
<summary><b>🟢 Render — Free, One Click</b></summary>
<br/>

1. Click deploy 👇
2. Connect GitHub → search `tipuraihanff-art/anidexz-episode-id` **(don't fork!)**
3. Build command: `npm install`
4. Start command: `node index.js`
5. Instance: **Free**
6. Deploy 🎉

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

</details>

<details>
<summary><b>💻 Run Locally</b></summary>
<br/>

```bash
# Clone the original repo (not a fork)
git clone https://github.com/tipuraihanff-art/anidexz-episode-id
cd anidexz-episode-id

# No install needed — zero dependencies!
node index.js

# Running on port 3000 ✅
```

</details>

<details>
<summary><b>🐳 Environment Variables</b></summary>
<br/>

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |

Render sets `PORT` automatically — you don't need to touch it.

</details>

---

## 📡 API Reference

### `GET /api/episode`

```
https://your-app.onrender.com/api/episode?title={anime}&ep={number}
```

**Parameters**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | `string` | ✅ | Full or partial anime title |
| `ep` | `number` | ✅ | Episode number (1–9999) |

**Try it**

```bash
# Works with partial titles
/api/episode?title=Solo+Leveling&ep=5

# Auto picks Season 1
/api/episode?title=Attack+on+Titan&ep=1

# Specify a season explicitly
/api/episode?title=Attack+on+Titan+Season+4&ep=1

# Culling game arc
/api/episode?title=Jujutsu+Kaisen+Culling+Game&ep=10

# Movie-length episodes
/api/episode?title=Demon+Slayer&ep=1
```

**Responses**

<details>
<summary>✅ <b>200 Success</b></summary>

```json
{
  "episodeId": 134524,
  "episodeNumber": 5,
  "totalEpisodes": 13,
  "url": "https://aniwatchtv.to/watch/solo-leveling-19413?ep=134524"
}
```
</details>

<details>
<summary>❌ <b>404 Not Found</b></summary>

```json
{ "error": "Anime not found: \"xyz\"" }
```
</details>

<details>
<summary>⚠️ <b>400 Bad Request</b></summary>

```json
{ "error": "Missing param: title" }
```
</details>

<details>
<summary>💥 <b>500 Server Error</b></summary>

```json
{ "error": "Internal error: ..." }
```
</details>

---

## 🔌 What can I do with the Episode ID?

The `episodeId` is a universal key — you can pass it to **any anime streaming API or embed player** that accepts HiAnime / AniWatch episode IDs. There are several public and community-built APIs out there that support this format.

> 🔍 Search for **"hianime episode embed API"** or **"aniwatch stream API"** to find compatible players and services.

---

## 🧠 How It Works

```
 You                     AniDexz                   AniWatch
  │                          │                          │
  │  GET /api/episode        │                          │
  │  ?title=Solo Leveling    │                          │
  │  &ep=1                   │                          │
  │─────────────────────────►│                          │
  │                          │  /ajax/search/suggest    │
  │                          │  ?keyword=Solo+Leveling  │
  │                          │─────────────────────────►│
  │                          │◄─────────────────────────│
  │                          │  Smart rank results      │
  │                          │  Penalize sequels -80pts │
  │                          │  Pick best match ✅      │
  │                          │                          │
  │                          │  /ajax/v2/episode/list   │
  │                          │  /19413                  │
  │                          │─────────────────────────►│
  │                          │◄─────────────────────────│
  │                          │  Parse episode list      │
  │                          │  Find ep number 1        │
  │◄─────────────────────────│                          │
  │  { episodeId: 134524 }   │                          │
```

---

## 🏗️ Project Structure

```
📦 anidexz-episode-id
 ┣ 📄 index.js       ← the entire API — one file, no bloat
 ┣ 📄 package.json   ← minimal config, zero dependencies
 ┗ 📄 README.md      ← you are here 👋
```

---

## 📊 Tech Stack

<div align="center">

| Layer | Tech |
|-------|------|
| Runtime | Node.js 18+ |
| Language | JavaScript (ESM) |
| HTTP | `node:http` built-in |
| Fetching | `fetch` built-in (Node 18+) |
| Parsing | Regex — no HTML parser needed |
| Hosting | Render (free tier) |
| Dependencies | **Zero** |

</div>

---

## 🤝 Contributing

All contributions are welcome!

```bash
# 1. Clone directly (no fork!)
git clone https://github.com/tipuraihanff-art/anidexz-episode-id

# 2. Make your changes to index.js

# 3. Test
node index.js
curl "localhost:3000/api/episode?title=Naruto&ep=1"

# 4. Open a pull request ❤️
```

**Ideas welcome:**
- 🌐 More fallback search strategies
- 🎭 Better season/part detection
- 📺 Additional anime sources
- 🐛 Bug fixes

---

## ❓ FAQ

<details>
<summary><b>Why does it sometimes return the wrong season?</b></summary>

Try being more specific: `Solo+Leveling+Season+2` instead of just `Solo+Leveling`. The API auto-picks Season 1 when no season is mentioned, but some anime titles make this tricky.

</details>

<details>
<summary><b>Why does the free Render instance sometimes respond slowly?</b></summary>

Free Render instances spin down after inactivity. The first request after a sleep period takes ~30 seconds to wake up. Subsequent requests are fast.

</details>

<details>
<summary><b>Can I use this in my project?</b></summary>

Yes! MIT licensed. Use it anywhere. Credit appreciated but not required. ⭐

</details>

<details>
<summary><b>Is this against AniWatch's ToS?</b></summary>

This API only reads publicly accessible search and episode list pages — the same data your browser loads. No login, no bypassing paywalls, no downloading.

</details>

---

<div align="center">

## 🌟 Show Some Love

If this project saved you time, drop a ⭐ — it keeps the project alive!

[![Star](https://img.shields.io/github/stars/tipuraihanff-art/anidexz-episode-id?style=for-the-badge&logo=github&color=yellow)](https://github.com/tipuraihanff-art/anidexz-episode-id)
[![Watch](https://img.shields.io/github/watchers/tipuraihanff-art/anidexz-episode-id?style=for-the-badge&logo=github&color=blue)](https://github.com/tipuraihanff-art/anidexz-episode-id)

<br/>

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXIweHB0MGN6NHVocWZ3bWR3eWwxOGRsNzN6NHV6MW9iNzd6ZmZpNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/26BRuo6sLetdllPAQ/giphy.gif" width="180"/>

<br/>

**made with 🍜 and way too much anime**

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer&animation=twinkling" width="100%"/>

</div>
