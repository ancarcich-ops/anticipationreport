// Builds one weekly report snapshot and saves it.
//
//   * With API keys  -> live data: Trakt anticipated ranking, enriched by TMDB.
//   * Without keys   -> the built-in sample catalog, so the app always works.
//
// Run directly with `npm run fetch`, or call buildReport() from the server.

import 'dotenv/config';
import { fetchAnticipatedShows, hasTraktCredentials } from './sources/trakt.js';
import { fetchShowDetails, hasTmdbCredentials } from './sources/tmdb.js';
import { buildSampleShows } from './sampleData.js';
import { saveSnapshot, isoWeek } from './store.js';

const REPORT_LIMIT = Number(process.env.REPORT_LIMIT || 25);

/** Attach a normalised 0–100 anticipation score (relative to the top show). */
function withScores(shows) {
  const max = Math.max(...shows.map((s) => s.listCount || 0), 1);
  return shows.map((s) => ({
    ...s,
    anticipationScore: Math.round(((s.listCount || 0) / max) * 100),
  }));
}

/**
 * Builds the report data (without saving). Returns { week, generatedAt,
 * source, shows }.
 */
export async function buildReport({ limit = REPORT_LIMIT, now = new Date() } = {}) {
  const week = isoWeek(now);
  const live = hasTraktCredentials();

  if (!live) {
    const shows = withScores(buildSampleShows(week, limit));
    return {
      week,
      generatedAt: now.toISOString(),
      source: 'sample',
      note: 'Add TRAKT_CLIENT_ID and TMDB_API_KEY to .env for live data.',
      shows,
    };
  }

  console.log(`Fetching top ${limit} anticipated shows from Trakt…`);
  let shows = await fetchAnticipatedShows(limit);

  if (hasTmdbCredentials()) {
    console.log('Enriching with TMDB artwork and air dates…');
    // Sequential with a tiny gap to stay polite to TMDB's rate limits.
    for (const show of shows) {
      const details = await fetchShowDetails(show.ids.tmdb);
      Object.assign(show, details || {});
      await new Promise((r) => setTimeout(r, 60));
    }
  } else {
    console.warn('No TMDB_API_KEY set — report will have rankings but no posters.');
  }

  return {
    week,
    generatedAt: now.toISOString(),
    source: hasTmdbCredentials() ? 'trakt+tmdb' : 'trakt',
    shows: withScores(shows),
  };
}

/** Builds and persists a snapshot for the current week. */
export async function refreshReport(opts = {}) {
  const report = await buildReport(opts);
  const file = await saveSnapshot(report);
  console.log(`Saved ${report.shows.length} shows for ${report.week} (${report.source}) -> ${file}`);
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
