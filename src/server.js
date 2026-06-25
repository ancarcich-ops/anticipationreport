// Web server for the Anticipation Report dashboard.
//
//   GET  /                  -> the dashboard (public/index.html)
//   GET  /api/report        -> latest report with week-over-week deltas
//   GET  /api/report/:week  -> a specific week's report
//   GET  /api/history       -> list of available weeks
//   POST /api/refresh       -> rebuild the current week's snapshot now
//
// On boot it seeds a snapshot if none exist, and (unless disabled) schedules
// an automatic weekly refresh via node-cron.

import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { refreshReport } from './fetchReport.js';
import { getReportWithDeltas, listWeeks } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const app = express();

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/report/:week?', async (req, res) => {
  try {
    const report = await getReportWithDeltas(req.params.week);
    if (!report) return res.status(404).json({ error: 'No report available yet.' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/history', async (_req, res) => {
  try {
    res.json({ weeks: await listWeeks() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let refreshing = false;
app.post('/api/refresh', async (_req, res) => {
  if (refreshing) return res.status(409).json({ error: 'A refresh is already running.' });
  refreshing = true;
  try {
    const report = await refreshReport();
    res.json({ ok: true, week: report.week, source: report.source, count: report.shows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    refreshing = false;
  }
});

async function start() {
  // Seed an initial snapshot so the dashboard is never empty on first run.
  const weeks = await listWeeks();
  if (weeks.length === 0) {
    console.log('No snapshots found — building an initial report…');
    try {
      await refreshReport();
    } catch (err) {
      console.error('Initial report build failed:', err.message);
    }
  }

  const schedule = (process.env.REFRESH_CRON || '0 9 * * 1').trim();
  if (schedule.toLowerCase() !== 'off' && cron.validate(schedule)) {
    cron.schedule(schedule, () => {
      console.log('Scheduled refresh starting…');
      refreshReport().catch((err) => console.error('Scheduled refresh failed:', err.message));
    });
    console.log(`Automatic refresh scheduled: "${schedule}"`);
  } else if (schedule.toLowerCase() !== 'off') {
    console.warn(`Invalid REFRESH_CRON "${schedule}" — automatic refresh disabled.`);
  }

  app.listen(PORT, () => {
    console.log(`\n  Anticipation Report running:  http://localhost:${PORT}\n`);
  });
}

start();
