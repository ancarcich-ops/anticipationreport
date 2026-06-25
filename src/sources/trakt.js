// Trakt API client — fetches the "most anticipated shows" list.
//
// Trakt's anticipated endpoint ranks shows by how many user watchlists they
// appear on. That "list_count" is our public stand-in for the demand signal
// Whip Media derives from TV Time watchlist activity.
//
// Docs: https://trakt.docs.apiary.io/#reference/shows/anticipated

const TRAKT_BASE = 'https://api.trakt.tv';

// Trakt is fronted by Cloudflare, which rejects requests with no User-Agent
// (a 403 that looks like an auth failure but isn't). A descriptive UA fixes it.
const USER_AGENT = 'AnticipationReport/1.0 (+https://github.com/ancarcich-ops/anticipationreport)';

export function hasTraktCredentials() {
  return Boolean(process.env.TRAKT_CLIENT_ID && process.env.TRAKT_CLIENT_ID.trim());
}

async function traktGet(path) {
  const res = await fetch(`${TRAKT_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      'trakt-api-version': '2',
      // .trim() guards against a stray newline if the key was pasted/stored with one.
      'trakt-api-key': (process.env.TRAKT_CLIENT_ID || '').trim(),
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    // Include a snippet of the body so the logs say *why* (Cloudflare HTML vs
    // a Trakt JSON error like "invalid API key") instead of a bare status.
    const body = await res.text().catch(() => '');
    const hint = res.status === 403
      ? ' — 403 usually means a missing User-Agent (Cloudflare) or an invalid trakt-api-key.'
      : '';
    throw new Error(
      `Trakt request failed (${res.status} ${res.statusText}) for ${path}.${hint} ` +
      `Response: ${body.slice(0, 300).replace(/\s+/g, ' ')}`
    );
  }
  return res.json();
}

/**
 * Returns the most anticipated shows, already ordered by Trakt (most demand
 * first). Each entry is normalised into the shape the report builder expects.
 *
 * @param {number} limit how many shows to return
 */
export async function fetchAnticipatedShows(limit = 25) {
  // extended=full gives us overview, network, status, genres, first_aired, etc.
  const raw = await traktGet(`/shows/anticipated?extended=full&limit=${limit}`);

  return raw.map((entry, index) => {
    const show = entry.show || {};
    const ids = show.ids || {};
    return {
      rank: index + 1,
      listCount: entry.list_count ?? 0, // the anticipation signal
      title: show.title ?? 'Untitled',
      year: show.year ?? null,
      overview: show.overview ?? '',
      network: show.network ?? null,
      status: show.status ?? null,
      genres: Array.isArray(show.genres) ? show.genres : [],
      firstAired: show.first_aired ?? null,
      runtime: show.runtime ?? null,
      certification: show.certification ?? null,
      ids: {
        trakt: ids.trakt ?? null,
        slug: ids.slug ?? null,
        tmdb: ids.tmdb ?? null,
        imdb: ids.imdb ?? null,
      },
    };
  });
}

/**
 * Returns upcoming SEASON premieres of existing shows (Season 2+), i.e. the
 * "returning seasons" the anticipated list deliberately leaves out (a show
 * drops off /shows/anticipated once it has aired at all). Pulled from Trakt's
 * public calendar and ranked by how many users have rated the show (`votes`),
 * a reasonable public proxy for "how many people care about this show".
 *
 * Trakt caps a calendar request at 33 days, so we walk the window in chunks.
 *
 * @param {string} startDate  'YYYY-MM-DD' to start from
 * @param {number} totalDays  how far ahead to look
 * @param {number} limit      how many shows to return
 */
export async function fetchReturningSeasonPremieres(startDate, totalDays = 120, limit = 25) {
  const CHUNK = 33; // Trakt's max days per calendar request
  const start = new Date(`${startDate}T00:00:00Z`);
  const seen = new Map(); // keyed by show -> earliest premiere wins

  for (let offset = 0; offset < totalDays; offset += CHUNK) {
    const from = new Date(start.getTime() + offset * 86400000).toISOString().slice(0, 10);
    const days = Math.min(CHUNK, totalDays - offset);
    let raw;
    try {
      raw = await traktGet(`/calendars/all/shows/premieres/${from}/${days}?extended=full`);
    } catch (err) {
      console.warn(`  ! Calendar chunk ${from}+${days}d failed: ${err.message}`);
      continue;
    }
    for (const entry of raw) {
      const ep = entry.episode || {};
      if ((ep.season ?? 0) < 2) continue; // season premieres only — skip brand-new series
      const show = entry.show || {};
      const ids = show.ids || {};
      const key = ids.trakt ?? show.title;
      if (seen.has(key)) continue;
      seen.set(key, {
        title: show.title ?? 'Untitled',
        year: show.year ?? null,
        overview: show.overview ?? '',
        network: show.network ?? null,
        status: show.status ?? null,
        genres: Array.isArray(show.genres) ? show.genres : [],
        seasonNumber: ep.season ?? null,
        premiereDate: entry.first_aired ?? null,
        votes: show.votes ?? 0, // popularity proxy for ranking
        rating: show.rating ?? null,
        ids: {
          trakt: ids.trakt ?? null,
          slug: ids.slug ?? null,
          tmdb: ids.tmdb ?? null,
          imdb: ids.imdb ?? null,
        },
      });
    }
  }

  return [...seen.values()]
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, limit)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}
