// Trakt API client — fetches the "most anticipated shows" list.
//
// Trakt's anticipated endpoint ranks shows by how many user watchlists they
// appear on. That "list_count" is our public stand-in for the demand signal
// Whip Media derives from TV Time watchlist activity.
//
// Docs: https://trakt.docs.apiary.io/#reference/shows/anticipated

const TRAKT_BASE = 'https://api.trakt.tv';

export function hasTraktCredentials() {
  return Boolean(process.env.TRAKT_CLIENT_ID);
}

async function traktGet(path) {
  const res = await fetch(`${TRAKT_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': process.env.TRAKT_CLIENT_ID,
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    throw new Error(`Trakt request failed (${res.status} ${res.statusText}) for ${path}`);
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
