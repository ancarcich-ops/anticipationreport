# The Anticipation Report

A self-hosted, auto-updating dashboard that ranks the **most anticipated TV shows** —
a public-data take on [Whip Media's Anticipation Report](https://whipmedia.com/resources/anticipation-report/),
which is powered by [TV Time](https://www.tvtime.com/).

Because TV Time / Whip Media data is proprietary (no public API), this project uses the
closest free public signals instead:

- **[Trakt](https://trakt.tv) – "anticipated shows"** ranks titles by how many user
  watchlists they appear on. That's our demand signal.
- **[TMDB](https://www.themoviedb.org)** supplies posters, networks and air dates.

It works **out of the box with built-in sample data**, and switches to **live data**
the moment you add two free API keys.

![rank · poster · title/network/genres · anticipation score with week-over-week ▲▼ movement]

---

## Features

- Ranked, poster-driven report styled after a real anticipation chart
- **Week-over-week movement** (▲ / ▼ / NEW) computed from saved history
- A **week picker** to browse past reports
- **Auto-refresh** on a schedule — in-process (node-cron) *and/or* a GitHub Action
- One-click **Refresh data** button in the UI
- No database required — snapshots are plain JSON files in `data/snapshots/`

---

## Quick start

```bash
npm install
npm start
```

Open **http://localhost:3000**. On first run it seeds a report (sample data until you
add keys) and starts the weekly scheduler.

---

## Going live (free API keys)

1. **Trakt Client ID** — create a free app at <https://trakt.tv/oauth/applications>
   (redirect uri `urn:ietf:wg:oauth:2.0:oob`), then copy the **Client ID**.
2. **TMDB API key** — request an *API Key (v3 auth)* at
   <https://www.themoviedb.org/settings/api>.
3. Copy the example env file and paste your keys in:

   ```bash
   cp .env.example .env
   # edit .env -> TRAKT_CLIENT_ID=... and TMDB_API_KEY=...
   ```

4. Pull live data and restart:

   ```bash
   npm run fetch   # builds this week's snapshot from live APIs
   npm start
   ```

> No keys yet? Everything still runs on the bundled sample catalog, clearly labelled
> "Sample data" in the header.

---

## Automatic weekly updates

**Option A — keep the server running.** `npm start` schedules a refresh via
`REFRESH_CRON` (default: Mondays 09:00). Set `REFRESH_CRON=off` to disable.

**Option B — GitHub Action (no server needed).** `.github/workflows/update-report.yml`
runs every Monday, rebuilds the report and commits the new snapshot. To use live data,
add repository **secrets** `TRAKT_CLIENT_ID` and `TMDB_API_KEY` (Settings → Secrets and
variables → Actions). You can also trigger it manually from the **Actions** tab.

Snapshots are committed to git on purpose, so the rank-movement history survives
restarts and redeploys.

---

## How it works

```
Trakt /shows/anticipated  ──►  rank by watchlist count
                                      │
TMDB /tv/{id}  ──►  posters, network, air dates
                                      │
                                      ▼
                  data/snapshots/<YYYY-Www>.json   (one per week)
                                      │
        Express API  ◄───────────────┘   (adds ▲▼ deltas vs prior week)
                                      │
                          public/ dashboard (the report UI)
```

| Path | What it is |
| --- | --- |
| `src/sources/trakt.js` | Trakt anticipated-shows client |
| `src/sources/tmdb.js` | TMDB enrichment (artwork, dates, networks) |
| `src/fetchReport.js` | Builds + saves a weekly snapshot (live or sample) |
| `src/store.js` | Snapshot storage, ISO-week labels, delta calculation |
| `src/server.js` | Express server, JSON API, in-process scheduler |
| `public/` | The dashboard (HTML/CSS/JS) |
| `data/snapshots/` | Saved weekly reports (history) |

### API

| Endpoint | Description |
| --- | --- |
| `GET /api/report` | Latest report with week-over-week deltas |
| `GET /api/report/:week` | A specific week (e.g. `2026-W26`) |
| `GET /api/history` | List of available weeks |
| `POST /api/refresh` | Rebuild the current week now |

---

## Configuration (`.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `TRAKT_CLIENT_ID` | — | Trakt API client id (enables live rankings) |
| `TMDB_API_KEY` | — | TMDB key (enables posters / air dates) |
| `REPORT_LIMIT` | `25` | Number of shows in the report |
| `PORT` | `3000` | Web server port |
| `REFRESH_CRON` | `0 9 * * 1` | Refresh schedule, or `off` |

---

*Inspired by Whip Media's Anticipation Report. Not affiliated with, or endorsed by,
Whip Media or TV Time. Show data © Trakt and TMDB; this product uses the TMDB API but
is not endorsed or certified by TMDB.*
