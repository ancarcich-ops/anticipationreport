// Builds one weekly report snapshot and saves it.
//
//   * With API keys  -> live data from Trakt, enriched by TMDB.
//   * Without keys   -> the built-in sample catalogs, so the app always works.
//
// The report has two sections:
//   shows     -> "New Shows": Trakt's anticipated list (watchlist demand)
//   returning -> "Returning Seasons": upcoming Season 2+ premieres of existing
//                shows, ranked by show popularity (votes)
//
// Run directly with `npm run fetch`, or call buildReport() from the server.

import 'dotenv/config';
import {
  fetchAnticipatedShows,
  fetchReturningSeasonPremieres,
  hasTraktCredentials,
} from './sources/trakt.js';
import { fetchShowDetails, hasTmdbCredentials } from './sources/tmdb.js';
import { buildSampleNewShows, buildSampleReturning } from './sampleData.js';
import { saveSnapshot, isoWeek } from './store.js';

const REPORT_LIMIT = Number(process.env.REPORT_LIMIT || 25);

/** Attach a normalised 0–100 score (relative to the top show in the list). */
function withScores(shows, magnitudeKey = 'listCount') {
  const max = Math.max(...shows.map((s) => s[magnitudeKey] || 0), 1);
  return shows.map((s) => ({
    ...s,
    anticipationScore: Math.round(((s[magnitudeKey] || 0) / max) * 100),
  }));
}

/** Enrich a list of shows with TMDB artwork/metadata, in place. */
async function enrich(shows) {
  for (const show of shows) {
    const details = await fetchShowDetails(show.ids.tmdb);
    Object.assign(show, details || {});
    await new Promise((r) => setTimeout(r, 60)); // be polite to TMDB rate limits
  }
}

/**
 * Builds the report data (without saving). Returns
 * { week, generatedAt, source, shows, returning }.
 */
export async function buildReport({ limit = REPORT_LIMIT, now = new Date() } = {}) {
  const week = isoWeek(now);
  const live = hasTraktCredentials();

  if (!live) {
    return {
      week,
      generatedAt: now.toISOString(),
      source: 'sample',
      note: 'Add TRAKT_CLIENT_ID and TMDB_API_KEY to .env for live data.',
      shows: withScores(buildSampleNewShows(week, limit), 'listCount'),
      returning: withScores(buildSampleReturning(week, limit, now), 'votes'),
    };
  }

  const tmdb = hasTmdbCredentials();
  if (!tmdb) console.warn('No TMDB_API_KEY set — report will have rankings but no posters.');

  console.log(`Fetching top ${limit} anticipated (new) shows from Trakt…`);
  const shows = await fetchAnticipatedShows(limit);
  if (tmdb) { console.log('Enriching new shows with TMDB…'); await enrich(shows); }

  console.log('Fetching upcoming returning-season premieres from Trakt…');
  let returning = [];
  try {
    returning = await fetchReturningSeasonPremieres(now.toISOString().slice(0, 10), 120, limit);
    if (tmdb) { console.log('Enriching returning seasons with TMDB…'); await enrich(returning); }
  } catch (err) {
    console.warn(`Returning-seasons fetch failed (continuing without it): ${err.message}`);
  }

  return {
    week,
    generatedAt: now.toISOString(),
    source: tmdb ? 'trakt+tmdb' : 'trakt',
    shows: withScores(shows, 'listCount'),
    returning: withScores(returning, 'votes'),
  };
}

/** Builds and persists a snapshot for the current week. */
export async function refreshReport(opts = {}) {
  const report = await buildReport(opts);
  const file = await saveSnapshot(report);
  console.log(
    `Saved ${report.shows.length} new + ${report.returning.length} returning shows ` +
    `for ${report.week} (${report.source}) -> ${file}`
  );
  return report;
}

// Allow running as a standalone script: `node src/fetchReport.js`
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  refreshReport().catch((err) => {
    console.error('Report build failed:', err.message);
    process.exit(1);
  });
}
