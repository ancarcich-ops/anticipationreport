// Built-in sample catalog so the dashboard works the moment you clone it,
// before you've added any API keys. Once TRAKT_CLIENT_ID + TMDB_API_KEY are
// set, live data replaces all of this automatically.
//
// Poster URLs point at real TMDB artwork; if they ever fail to load the UI
// falls back to a styled placeholder, so the report still looks complete.

const CATALOG = [
  { title: 'Stranger Things', year: 2025, network: 'Netflix', tmdb: 66732, imdb: 'tt4574334',
    genres: ['drama', 'horror', 'science-fiction'], base: 41200, poster: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    overview: 'The final season. As the Upside Down bleeds into Hawkins, the gang reunites for one last fight to save their world.' },
  { title: 'Wednesday', year: 2025, network: 'Netflix', tmdb: 119051, imdb: 'tt13443470',
    genres: ['comedy', 'crime', 'fantasy'], base: 38800, poster: '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg',
    overview: 'Wednesday Addams returns to Nevermore Academy, where a new wave of mysteries puts her deadpan detective skills to the test.' },
  { title: 'Severance', year: 2025, network: 'Apple TV+', tmdb: 95396, imdb: 'tt11280740',
    genres: ['drama', 'mystery', 'science-fiction'], base: 35100, poster: '/lFf6LLrQjYldcZItzOkGmMMigP7.jpg',
    overview: 'The innies push deeper into Lumon’s secrets as the line between work-self and home-self collapses.' },
  { title: 'House of the Dragon', year: 2026, network: 'HBO', tmdb: 94997, imdb: 'tt11198330',
    genres: ['drama', 'fantasy', 'action'], base: 33400, poster: '/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg',
    overview: 'The Dance of the Dragons rages on as Rhaenyra and Aegon commit the Seven Kingdoms to all-out war.' },
  { title: 'The Last of Us', year: 2026, network: 'HBO', tmdb: 100088, imdb: 'tt3581920',
    genres: ['drama', 'horror', 'action'], base: 31900, poster: '/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg',
    overview: 'Years after the events in Salt Lake City, a fragile peace is shattered and Ellie sets out on a path of revenge.' },
  { title: 'The Witcher', year: 2026, network: 'Netflix', tmdb: 71912, imdb: 'tt5180504',
    genres: ['drama', 'action', 'fantasy'], base: 27500, poster: '/7vjaCdMw15FEbXyLQTVa04URsPm.jpg',
    overview: 'A new Geralt takes up the silver sword as Ciri’s destiny draws the Continent toward its breaking point.' },
  { title: 'Euphoria', year: 2026, network: 'HBO', tmdb: 85552, imdb: 'tt8772296',
    genres: ['drama'], base: 24800, poster: '/jtnfNzqZwN4E32FGGxx1YZaBWWf.jpg',
    overview: 'Rue and the students of East Highland return for a turbulent new chapter of addiction, love and identity.' },
  { title: 'Andor', year: 2025, network: 'Disney+', tmdb: 83867, imdb: 'tt9253284',
    genres: ['science-fiction', 'drama', 'action'], base: 22600, poster: '/declVTLqWSADfBkQbahArSXjVhE.jpg',
    overview: 'The final stretch of Cassian Andor’s journey from thief to revolutionary, leading straight to the brink of rebellion.' },
  { title: 'The Boys', year: 2026, network: 'Prime Video', tmdb: 76479, imdb: 'tt1190634',
    genres: ['action', 'comedy', 'science-fiction'], base: 21300, poster: '/2zmtNBksTQRRDhNmoFs9GVT7CK0.jpg',
    overview: 'The fight against Homelander reaches its endgame as Butcher and the Boys run out of time and allies.' },
  { title: 'Fallout', year: 2026, network: 'Prime Video', tmdb: 106379, imdb: 'tt12637874',
    genres: ['science-fiction', 'drama', 'action'], base: 19800, poster: '/AnsSKR9LuK0vReFLLEbbsHJ7d8X.jpg',
    overview: 'Lucy and the Ghoul press on across the irradiated wasteland of New Vegas in search of answers about the old world.' },
  { title: 'Squid Game', year: 2025, network: 'Netflix', tmdb: 93405, imdb: 'tt10919420',
    genres: ['action', 'mystery', 'drama'], base: 18400, poster: '/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
    overview: 'Gi-hun re-enters the deadly games, determined to tear them down from the inside.' },
  { title: 'Daredevil: Born Again', year: 2026, network: 'Disney+', tmdb: 202555, imdb: 'tt18923754',
    genres: ['action', 'crime', 'drama'], base: 16900, poster: '/khYxPGKxFw9SbjG3l6gA4nQqyQt.jpg',
    overview: 'Matt Murdock and Wilson Fisk are pulled back into their violent orbit as Hell’s Kitchen edges toward chaos.' },
  { title: 'Peacemaker', year: 2025, network: 'HBO Max', tmdb: 110492, imdb: 'tt13146488',
    genres: ['action', 'comedy', 'science-fiction'], base: 15200, poster: '/hE3LRZAY84fG19a18pzpkZERjTE.jpg',
    overview: 'Christopher Smith confronts a multiverse of alternate lives — and the temptation to abandon the one he has.' },
  { title: 'One Piece', year: 2026, network: 'Netflix', tmdb: 37854, imdb: 'tt11737520',
    genres: ['action', 'adventure', 'comedy'], base: 13700, poster: '/cZ86g0xL1uXGGn4Bp2chPpGNDJL.jpg',
    overview: 'The Straw Hats sail into the Grand Line as Luffy’s hunt for the One Piece draws new enemies and allies.' },
  { title: 'Alien: Earth', year: 2025, network: 'FX', tmdb: 157239, imdb: 'tt10677788',
    genres: ['science-fiction', 'horror', 'drama'], base: 12500, poster: '/wWba3TaojhK7NdycRhoQpsG0FaH.jpg',
    overview: 'When a deep-space vessel crashes to Earth, a young woman and a band of soldiers make a terrifying discovery.' },
];

/**
 * Builds a deterministic-but-varying sample report for a given week label so
 * repeated runs show plausible rank movement (and therefore delta arrows).
 */
export function buildSampleShows(weekLabel = '', limit = 25) {
  // Derive a small per-week jitter from the week label so ordering shifts
  // gently week to week instead of being identical every time.
  const seed = [...weekLabel].reduce((a, c) => a + c.charCodeAt(0), 0);

  const scored = CATALOG.map((show, i) => {
    // Amplitude is intentionally larger than the typical gap between adjacent
    // shows so the sample actually reorders week to week (visible ▲▼ arrows).
    const wobble = Math.round(Math.sin(seed * 0.7 + i * 2.3) * 3200);
    const listCount = Math.max(500, show.base + wobble);
    return {
      listCount,
      title: show.title,
      year: show.year,
      overview: show.overview,
      network: show.network,
      status: 'returning series',
      genres: show.genres,
      firstAired: null,
      runtime: null,
      certification: null,
      ids: { trakt: 100000 + show.tmdb, slug: null, tmdb: show.tmdb, imdb: show.imdb },
      // Pre-baked TMDB enrichment so the sample looks complete offline:
      posterUrl: `https://image.tmdb.org/t/p/w500${show.poster}`,
      backdropUrl: null,
      networks: [show.network],
      tmdbStatus: 'Returning Series',
      firstAirDate: null,
      voteAverage: null,
      tmdbGenres: show.genres,
      homepage: null,
    };
  });

  scored.sort((a, b) => b.listCount - a.listCount);
  return scored.slice(0, limit).map((s, i) => ({ ...s, rank: i + 1 }));
}
