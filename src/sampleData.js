// Built-in sample catalogs so the dashboard works the moment you clone it,
// before you've added any API keys. Once TRAKT_CLIENT_ID + TMDB_API_KEY are
// set, live data replaces all of this automatically.
//
// Two catalogs mirror the two live sections:
//   NEW_CATALOG       -> "New Shows" (brand-new, unreleased series)
//   RETURNING_CATALOG -> "Returning Seasons" (upcoming season premieres)
//
// Poster URLs point at real TMDB artwork; if they ever fail to load the UI
// falls back to a styled placeholder, so the report still looks complete.

// Brand-new series (the "New Shows" tab). `base` drives the watchlist count.
const NEW_CATALOG = [
  { title: 'Harry Potter', year: 2026, network: 'HBO', tmdb: 250307, imdb: 'tt23071730',
    genres: ['drama', 'fantasy'], base: 13600, poster: '/yFRcF9zUcViYTViMYZQpUdjbm9u.jpg',
    overview: 'A faithful new adaptation of J.K. Rowling’s books, with each season bringing one beloved story to life.' },
  { title: 'Lanterns', year: 2026, network: 'HBO', tmdb: 110492, imdb: 'tt31132012',
    genres: ['drama', 'crime', 'science-fiction'], base: 10200, poster: '/hE3LRZAY84fG19a18pzpkZERjTE.jpg',
    overview: 'Green Lanterns Hal Jordan and John Stewart investigate a dark mystery on Earth in this grounded DC saga.' },
  { title: 'IT: Welcome to Derry', year: 2025, network: 'HBO', tmdb: 125907, imdb: 'tt17207110',
    genres: ['horror', 'drama'], base: 8700, poster: '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg',
    overview: 'A prequel to the IT films, descending into the cursed town of Derry decades before Pennywise’s return.' },
  { title: 'Blade Runner 2099', year: 2026, network: 'Prime Video', tmdb: 157741, imdb: 'tt27668255',
    genres: ['science-fiction', 'drama'], base: 7400, poster: '/declVTLqWSADfBkQbahArSXjVhE.jpg',
    overview: 'Set fifty years after Blade Runner 2049, an aging replicant is pulled back into a world she tried to escape.' },
  { title: 'Pluribus', year: 2025, network: 'Apple TV+', tmdb: 248890, imdb: 'tt31510819',
    genres: ['drama', 'science-fiction'], base: 6300, poster: '/lFf6LLrQjYldcZItzOkGmMMigP7.jpg',
    overview: 'From the creator of Breaking Bad: the most miserable person on Earth must save the world from happiness.' },
  { title: 'Lazarus', year: 2026, network: 'Prime Video', tmdb: 211851, imdb: 'tt27911000',
    genres: ['drama', 'mystery', 'thriller'], base: 5100, poster: '/7vjaCdMw15FEbXyLQTVa04URsPm.jpg',
    overview: 'A man learns the dead may not be as gone as he believed, in a twisting thriller from Harlan Coben.' },
  { title: 'Star Wars: Maul – Shadow Lord', year: 2026, network: 'Disney+', tmdb: 240411, imdb: 'tt32359447',
    genres: ['science-fiction', 'animation', 'action'], base: 4200, poster: '/2zmtNBksTQRRDhNmoFs9GVT7CK0.jpg',
    overview: 'Darth Maul builds his criminal empire from the shadows in this animated Star Wars series.' },
  { title: 'The Boroughs', year: 2026, network: 'Netflix', tmdb: 249039, imdb: 'tt30444112',
    genres: ['science-fiction', 'mystery', 'drama'], base: 3300, poster: '/AnsSKR9LuK0vReFLLEbbsHJ7d8X.jpg',
    overview: 'A group of retirees in a desert community confront a supernatural force lurking beneath their town.' },
];

// Existing shows with an upcoming season premiere (the "Returning Seasons" tab).
// `votes` drives popularity ranking; `weeks` is how many weeks out the premiere is.
const RETURNING_CATALOG = [
  { title: 'Stranger Things', year: 2016, season: 5, network: 'Netflix', tmdb: 66732, imdb: 'tt4574334',
    genres: ['drama', 'horror', 'science-fiction'], votes: 412000, weeks: 3, poster: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    overview: 'The final season. As the Upside Down bleeds into Hawkins, the gang reunites for one last fight.' },
  { title: 'House of the Dragon', year: 2022, season: 3, network: 'HBO', tmdb: 94997, imdb: 'tt11198330',
    genres: ['drama', 'fantasy', 'action'], votes: 388000, weeks: 8, poster: '/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg',
    overview: 'The Dance of the Dragons rages on as Rhaenyra and Aegon commit the realm to all-out war.' },
  { title: 'The Last of Us', year: 2023, season: 2, network: 'HBO', tmdb: 100088, imdb: 'tt3581920',
    genres: ['drama', 'horror', 'action'], votes: 356000, weeks: 5, poster: '/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg',
    overview: 'A fragile peace is shattered, and Ellie sets out on a path of revenge across a broken country.' },
  { title: 'Wednesday', year: 2022, season: 3, network: 'Netflix', tmdb: 119051, imdb: 'tt13443470',
    genres: ['comedy', 'crime', 'fantasy'], votes: 333000, weeks: 11, poster: '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg',
    overview: 'Wednesday Addams returns to Nevermore, where new mysteries test her deadpan detective skills.' },
  { title: 'Severance', year: 2022, season: 3, network: 'Apple TV+', tmdb: 95396, imdb: 'tt11280740',
    genres: ['drama', 'mystery', 'science-fiction'], votes: 298000, weeks: 14, poster: '/lFf6LLrQjYldcZItzOkGmMMigP7.jpg',
    overview: 'The innies push deeper into Lumon’s secrets as work-self and home-self collapse together.' },
  { title: 'The Witcher', year: 2019, season: 4, network: 'Netflix', tmdb: 71912, imdb: 'tt5180504',
    genres: ['drama', 'action', 'fantasy'], votes: 276000, weeks: 6, poster: '/7vjaCdMw15FEbXyLQTVa04URsPm.jpg',
    overview: 'A new Geralt takes up the silver sword as Ciri’s destiny draws the Continent toward breaking.' },
  { title: 'The Boys', year: 2019, season: 5, network: 'Prime Video', tmdb: 76479, imdb: 'tt1190634',
    genres: ['action', 'comedy', 'science-fiction'], votes: 254000, weeks: 9, poster: '/2zmtNBksTQRRDhNmoFs9GVT7CK0.jpg',
    overview: 'The fight against Homelander reaches its endgame as Butcher and the Boys run out of time.' },
  { title: 'Andor', year: 2022, season: 2, network: 'Disney+', tmdb: 83867, imdb: 'tt9253284',
    genres: ['science-fiction', 'drama', 'action'], votes: 198000, weeks: 4, poster: '/declVTLqWSADfBkQbahArSXjVhE.jpg',
    overview: 'The final stretch of Cassian Andor’s journey from thief to revolutionary.' },
  { title: 'Euphoria', year: 2019, season: 3, network: 'HBO', tmdb: 85552, imdb: 'tt8772296',
    genres: ['drama'], votes: 187000, weeks: 16, poster: '/jtnfNzqZwN4E32FGGxx1YZaBWWf.jpg',
    overview: 'Rue and the students of East Highland return for a turbulent new chapter of love and identity.' },
  { title: 'Fallout', year: 2024, season: 2, network: 'Prime Video', tmdb: 106379, imdb: 'tt12637874',
    genres: ['science-fiction', 'drama', 'action'], votes: 165000, weeks: 7, poster: '/AnsSKR9LuK0vReFLLEbbsHJ7d8X.jpg',
    overview: 'Lucy and the Ghoul press on toward New Vegas in search of answers about the old world.' },
];

function jitter(seed, i, amplitude) {
  return Math.round(Math.sin(seed * 0.7 + i * 2.3) * amplitude);
}
function seedFor(weekLabel) {
  return [...weekLabel].reduce((a, c) => a + c.charCodeAt(0), 0);
}

/** Sample "New Shows" list, with gentle week-to-week movement. */
export function buildSampleNewShows(weekLabel = '', limit = 25) {
  const seed = seedFor(weekLabel);
  const scored = NEW_CATALOG.map((show, i) => ({
    listCount: Math.max(300, show.base + jitter(seed, i, 1600)),
    title: show.title,
    year: show.year,
    overview: show.overview,
    network: show.network,
    status: 'in production',
    genres: show.genres,
    ids: { trakt: 200000 + show.tmdb, slug: null, tmdb: show.tmdb, imdb: show.imdb },
    posterUrl: `https://image.tmdb.org/t/p/w500${show.poster}`,
    networks: [show.network],
    tmdbGenres: show.genres,
  }));
  scored.sort((a, b) => b.listCount - a.listCount);
  return scored.slice(0, limit).map((s, i) => ({ ...s, rank: i + 1 }));
}

/** Sample "Returning Seasons" list, ranked by popularity, with premiere dates. */
export function buildSampleReturning(weekLabel = '', limit = 25, now = new Date()) {
  const seed = seedFor(weekLabel);
  const scored = RETURNING_CATALOG.map((show, i) => {
    const premiere = new Date(now.getTime() + show.weeks * 7 * 86400000);
    return {
      votes: Math.max(1000, show.votes + jitter(seed, i, 12000)),
      title: show.title,
      year: show.year,
      seasonNumber: show.season,
      premiereDate: premiere.toISOString(),
      overview: show.overview,
      network: show.network,
      status: 'returning series',
      genres: show.genres,
      ids: { trakt: 300000 + show.tmdb, slug: null, tmdb: show.tmdb, imdb: show.imdb },
      posterUrl: `https://image.tmdb.org/t/p/w500${show.poster}`,
      networks: [show.network],
      tmdbGenres: show.genres,
    };
  });
  scored.sort((a, b) => b.votes - a.votes);
  return scored.slice(0, limit).map((s, i) => ({ ...s, rank: i + 1 }));
}
