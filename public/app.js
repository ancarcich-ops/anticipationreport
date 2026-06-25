// Front-end logic for the Anticipation Report dashboard.

const el = (id) => document.getElementById(id);
const reportEl = el('report');
const metaBar = el('metaBar');
const weekSelect = el('weekSelect');
const refreshBtn = el('refreshBtn');

let currentWeek = null;
// Static mode = no running Express server (e.g. deployed to Vercel). Detected
// the first time the /api endpoint isn't reachable; we then read the committed
// JSON snapshots directly and compute deltas in the browser.
let staticMode = false;

async function loadReport(week) {
  reportEl.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const data = staticMode ? await loadViaStatic(week) : await loadAuto(week);
    currentWeek = data.week;
    renderMeta(data);
    renderWeeks(data.availableWeeks, data.week);
    renderShows(data.shows);
    refreshBtn.style.display = staticMode ? 'none' : '';
  } catch (err) {
    reportEl.innerHTML = `<div class="error">Couldn’t load the report: ${escapeHtml(err.message)}</div>`;
  }
}

// Try the API first; if it's not there, switch to static mode for good.
async function loadAuto(week) {
  try {
    const res = await fetch(week ? `/api/report/${week}` : '/api/report');
    if (!res.ok) throw new Error(`api ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error('api returned non-json');
    return await res.json();
  } catch {
    staticMode = true;
    return loadViaStatic(week);
  }
}

// Read snapshots straight from /data and compute deltas client-side. Mirrors
// the server's logic so the report looks identical with or without a backend.
async function loadViaStatic(week) {
  const manifest = await (await fetch('/data/index.json')).json();
  const weeks = manifest.weeks || [];
  if (!weeks.length) throw new Error('No report data has been generated yet.');

  const target = week && weeks.includes(week) ? week : weeks.at(-1);
  const idx = weeks.indexOf(target);
  const current = await fetchSnapshot(target);
  const previous = idx > 0 ? await fetchSnapshot(weeks[idx - 1]) : null;

  const prevRank = new Map();
  if (previous) for (const s of previous.shows) prevRank.set(keyFor(s), s.rank);

  const shows = current.shows.map((s) => {
    const pr = prevRank.get(keyFor(s));
    return { ...s, previousRank: pr ?? null, delta: pr == null ? null : pr - s.rank, isNew: previous ? pr == null : false };
  });

  return { ...current, shows, availableWeeks: weeks, comparedTo: previous ? weeks[idx - 1] : null };
}

async function fetchSnapshot(week) {
  const res = await fetch(`/data/snapshots/${week}.json`);
  if (!res.ok) throw new Error(`Missing snapshot for ${week}`);
  return res.json();
}

function keyFor(show) {
  return show.ids?.trakt ?? show.ids?.tmdb ?? show.title;
}

function renderMeta(data) {
  const generated = new Date(data.generatedAt);
  const sourceLabel = {
    sample: 'Sample data',
    trakt: 'Trakt (live)',
    'trakt+tmdb': 'Trakt + TMDB (live)',
  }[data.source] || data.source;

  const pills = [
    `<span class="pill"><strong>${escapeHtml(prettyWeek(data.week))}</strong></span>`,
    `<span class="pill ${data.source === 'sample' ? 'pill--sample' : ''}">Source: <strong>${escapeHtml(sourceLabel)}</strong></span>`,
    `<span class="pill">Updated <strong>${generated.toLocaleString()}</strong></span>`,
    data.comparedTo ? `<span class="pill">Movement vs <strong>${escapeHtml(prettyWeek(data.comparedTo))}</strong></span>` : '',
    `<span class="pill"><strong>${data.shows.length}</strong> shows</span>`,
  ];
  metaBar.innerHTML = pills.join('');
}

function renderWeeks(weeks = [], selected) {
  if (!weeks.length) { weekSelect.innerHTML = ''; return; }
  weekSelect.innerHTML = weeks
    .slice()
    .reverse()
    .map((w) => `<option value="${w}" ${w === selected ? 'selected' : ''}>${escapeHtml(prettyWeek(w))}</option>`)
    .join('');
}

function renderShows(shows) {
  reportEl.innerHTML = shows.map(rowHtml).join('');
}

function rowHtml(s) {
  const net = s.networks?.[0] || s.network;
  const genres = (s.tmdbGenres?.length ? s.tmdbGenres : s.genres) || [];
  const badges = [
    net ? `<span class="badge badge--net">${escapeHtml(net)}</span>` : '',
    ...genres.slice(0, 3).map((g) => `<span class="badge">${escapeHtml(titleCase(g))}</span>`),
  ].join('');

  return `
    <article class="row">
      <div class="rank">
        <div class="rank__num">${s.rank}</div>
        <div class="rank__delta">${deltaHtml(s)}</div>
      </div>
      <div class="poster">${posterHtml(s)}</div>
      <div class="info">
        <h2 class="info__title">${escapeHtml(s.title)} ${s.year ? `<span class="yr">(${s.year})</span>` : ''}</h2>
        <div class="badges">${badges}</div>
        <p class="info__overview">${escapeHtml(s.overview || '')}</p>
      </div>
      <div class="score">
        <div class="score__label">Anticipation</div>
        <div class="score__val">${s.anticipationScore ?? '—'}</div>
        <div class="score__bar"><div class="score__fill" style="width:${s.anticipationScore ?? 0}%"></div></div>
        <div class="score__count">${formatCount(s.listCount)} watchlists</div>
      </div>
    </article>`;
}

function posterHtml(s) {
  if (s.posterUrl) {
    return `<img src="${escapeAttr(s.posterUrl)}" alt="${escapeAttr(s.title)} poster" loading="lazy"
      onerror="this.parentNode.innerHTML='<div class=&quot;poster__fallback&quot;>${escapeAttr(s.title)}</div>'" />`;
  }
  return `<div class="poster__fallback">${escapeHtml(s.title)}</div>`;
}

function deltaHtml(s) {
  if (s.isNew) return '<span class="delta--new">NEW</span>';
  if (s.delta == null) return '<span class="delta--flat">—</span>';
  if (s.delta > 0) return `<span class="delta--up">▲ ${s.delta}</span>`;
  if (s.delta < 0) return `<span class="delta--down">▼ ${Math.abs(s.delta)}</span>`;
  return '<span class="delta--flat">—</span>';
}

// ---------- helpers ----------
function prettyWeek(w) {
  if (!w) return '';
  const m = /^(\d{4})-W(\d{2})$/.exec(w);
  return m ? `Week ${Number(m[2])}, ${m[1]}` : w;
}
function titleCase(s) {
  return String(s).replace(/(^|[\s-])\w/g, (c) => c.toUpperCase()).replace(/-/g, ' ');
}
function formatCount(n) {
  if (n == null) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/`/g, '&#96;'); }

// ---------- events ----------
weekSelect.addEventListener('change', () => loadReport(weekSelect.value));

refreshBtn.addEventListener('click', async () => {
  refreshBtn.disabled = true;
  refreshBtn.textContent = 'Refreshing…';
  try {
    const res = await fetch('/api/refresh', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server responded ${res.status}`);
    await loadReport(data.week);
  } catch (err) {
    alert(`Refresh failed: ${err.message}`);
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'Refresh data';
  }
});

loadReport();
