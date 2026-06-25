// Snapshot storage + week-over-week history.
//
// Each refresh writes one JSON snapshot to public/data/snapshots/<week>.json
// plus a public/data/index.json manifest. They live under public/ so a static
// host (e.g. Vercel) can serve both the dashboard and its data, and so the
// browser can read them directly when there's no running server. Keeping them
// committed to git means the history — and the rank-change arrows that depend
// on it — survive restarts and redeploys.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
export const SNAPSHOT_DIR = path.join(DATA_DIR, 'snapshots');
const MANIFEST_FILE = path.join(DATA_DIR, 'index.json');

/** ISO week label like "2026-W26" for a given date. */
export function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function ensureDir() {
  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
}

/** All snapshot week labels, oldest first. */
export async function listWeeks() {
  await ensureDir();
  const files = await fs.readdir(SNAPSHOT_DIR);
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

export async function readSnapshot(week) {
  const file = path.join(SNAPSHOT_DIR, `${week}.json`);
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

export async function saveSnapshot(snapshot) {
  await ensureDir();
  const file = path.join(SNAPSHOT_DIR, `${snapshot.week}.json`);
  await fs.writeFile(file, JSON.stringify(snapshot, null, 2));
  await writeManifest();
  return file;
}

/**
 * Writes public/data/index.json listing every available week (plus the latest
 * and when it was generated). Static hosts can't list a directory, so the
 * browser reads this manifest to know which snapshots exist.
 */
export async function writeManifest() {
  const weeks = await listWeeks();
  let generatedAt = null;
  let source = null;
  if (weeks.length) {
    try {
      const latest = await readSnapshot(weeks.at(-1));
      generatedAt = latest.generatedAt ?? null;
      source = latest.source ?? null;
    } catch {
      /* ignore — manifest still useful without it */
    }
  }
  const manifest = { weeks, latest: weeks.at(-1) ?? null, generatedAt, source };
  await fs.writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  return manifest;
}

export async function latestWeek() {
  const weeks = await listWeeks();
  return weeks.at(-1) ?? null;
}

/**
 * Returns the latest report with each show annotated with `delta` (previous
 * rank minus current rank: positive = climbed, negative = fell) and `isNew`.
 * Comparison is against the immediately prior snapshot.
 */
export async function getReportWithDeltas(week) {
  const weeks = await listWeeks();
  if (weeks.length === 0) return null;

  const targetWeek = week && weeks.includes(week) ? week : weeks.at(-1);
  const idx = weeks.indexOf(targetWeek);
  const current = await readSnapshot(targetWeek);
  const previous = idx > 0 ? await readSnapshot(weeks[idx - 1]) : null;

  const prevRankById = new Map();
  if (previous) {
    for (const s of previous.shows) {
      prevRankById.set(keyFor(s), s.rank);
    }
  }

  const shows = current.shows.map((s) => {
    const prevRank = prevRankById.get(keyFor(s));
    return {
      ...s,
      previousRank: prevRank ?? null,
      delta: prevRank == null ? null : prevRank - s.rank,
      isNew: previous ? prevRank == null : false,
    };
  });

  return {
    ...current,
    shows,
    availableWeeks: weeks,
    comparedTo: previous ? weeks[idx - 1] : null,
  };
}

// A stable identity for matching a show across weeks.
function keyFor(show) {
  return show.ids?.trakt ?? show.ids?.tmdb ?? show.title;
}
