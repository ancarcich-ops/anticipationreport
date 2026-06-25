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
