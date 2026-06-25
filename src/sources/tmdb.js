// TMDB API client — enriches each show with artwork, network and air dates.
//
// Trakt gives us the ranking; TMDB gives us the visuals (posters/backdrops)
// and reliable premiere-date / network metadata that make the report look
// like a real "anticipation report".
//
// Docs: https://developer.themoviedb.org/reference/tv-series-details

const TMDB_BASE = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const USER_AGENT = 'AnticipationReport/1.0 (+https://github.com/ancarcich-ops/anticipationreport)';

export function hasTmdbCredentials() {
  return Boolean(process.env.TMDB_API_KEY && process.env.TMDB_API_KEY.trim());
}

function posterUrl(path, size = 'w500') {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}
function backdropUrl(path, size = 'w780') {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

async function tmdbGet(path) {
  const sep = path.includes('?') ? '&' : '?';
  const key = (process.env.TMDB_API_KEY || '').trim();
  const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${key}`, {
    headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `TMDB request failed (${res.status} ${res.statusText}) for ${path}. ` +
      `Response: ${body.slice(0, 200).replace(/\s+/g, ' ')}`
    );
  }
  return res.json();
}

/**
 * Fetches TMDB details for one TV show id and returns the fields we display.
 * Returns null (rather than throwing) so a single missing show never breaks
 * the whole report.
 */
export async function fetchShowDetails(tmdbId) {
  if (!tmdbId) return null;
  try {
    const data = await tmdbGet(`/tv/${tmdbId}`);
    const nextEp = data.next_episode_to_air;
    const lastEp = data.last_episode_to_air;
    return {
      tmdbId,
      posterUrl: posterUrl(data.poster_path),
      backdropUrl: backdropUrl(data.backdrop_path),
      networks: (data.networks || []).map((n) => n.name),
      tmdbStatus: data.status ?? null,
      firstAirDate: data.first_air_date || null,
      nextAirDate: nextEp?.air_date || null,
      lastAirDate: lastEp?.air_date || null,
      voteAverage: data.vote_average ?? null,
      popularity: data.popularity ?? null,
      tmdbGenres: (data.genres || []).map((g) => g.name),
      homepage: data.homepage || null,
    };
  } catch (err) {
    console.warn(`  ! TMDB enrichment failed for id ${tmdbId}: ${err.message}`);
    return null;
  }
}
