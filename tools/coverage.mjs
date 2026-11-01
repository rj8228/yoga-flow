// Dev-only: count asanas for every body part × goal × level and check the data.
// Usage: node tools/coverage.mjs [--md]
//   --md   print the table as Markdown (for PRs and issues)
// Exits with code 1 if any data check fails.
import { PARTS, GOALS, LEVELS, PREG, ASANAS } from '../js/data.js';
import { FIGS } from '../js/figures.js';

const md = process.argv.includes('--md');
const LV = Object.keys(LEVELS);
const count = (p, g, l) => ASANAS.filter((a) => a.parts.includes(p) && a.goals.includes(g) && a.lv === l).length;

// ---------- Coverage table ----------
const head = ['Body part', ...GOALS.map((g) => `${g[0].toUpperCase() + g.slice(1)} ${LV.join('/')}`)];
const rows = PARTS.map((p) => [p.name, ...GOALS.map((g) => LV.map((l) => count(p.id, g, l)).join(' / '))]);
const gapsB = []; const gapsI = [];
for (const p of PARTS) for (const g of GOALS) {
  if (!count(p.id, g, 'B')) gapsB.push(`${p.id} × ${g}`);
  if (!count(p.id, g, 'I')) gapsI.push(`${p.id} × ${g}`);
}

if (md) {
  console.log(`| ${head.join(' | ')} |`);
  console.log(`|${head.map((_, i) => (i ? ':-:' : ':--')).join('|')}|`);
  rows.forEach((r) => console.log(`| ${r.join(' | ')} |`));
} else {
  const w = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const line = (r) => r.map((c, i) => (i ? c.padStart(Math.ceil((w[i] + c.length) / 2)).padEnd(w[i]) : c.padEnd(w[i]))).join('  ');
  console.log(line(head)); console.log(w.map((n) => '-'.repeat(n)).join('  '));
  rows.forEach((r) => console.log(line(r)));
}
const lvTotals = LV.map((l) => `${LEVELS[l]} ${ASANAS.filter((a) => a.lv === l).length}`).join(', ');
console.log(`\nAsanas: ${ASANAS.length} (${lvTotals}). Cells are counts at ${LV.join(' / ')}.`);
console.log(`Part × goal with no Beginner pose (${gapsB.length}): ${gapsB.join(', ') || 'none'}`);
console.log(`Part × goal with no Intermediate pose (${gapsI.length}): ${gapsI.join(', ') || 'none'}`);

// ---------- Data checks ----------
const errs = []; const seen = new Set();
const partIds = new Set(PARTS.map((p) => p.id));
for (const a of ASANAS) {
  const at = `asana "${a.id}"`;
  if (!/^[a-z0-9]+$/.test(a.id)) errs.push(`${at}: id must be lowercase letters/digits`);
  if (seen.has(a.id)) errs.push(`${at}: duplicate id`); seen.add(a.id);
  if (!FIGS[a.fig]) errs.push(`${at}: fig "${a.fig}" not in FIGS`);
  if (!LEVELS[a.lv]) errs.push(`${at}: bad level "${a.lv}"`);
  if (!PREG[a.preg]) errs.push(`${at}: bad preg "${a.preg}"`);
  a.parts.forEach((p) => partIds.has(p) || errs.push(`${at}: bad part "${p}"`));
  a.goals.forEach((g) => GOALS.includes(g) || errs.push(`${at}: bad goal "${g}"`));
  for (const k of ['sa', 'en', 'mus', 'hold', 'props', 'safe']) if (!String(a[k] || '').trim()) errs.push(`${at}: empty ${k}`);
  if (a.steps.length !== 3 || a.steps.some((s) => !s.trim())) errs.push(`${at}: needs 3 steps`);
  if (a.cues.length !== 2 || a.cues.some((s) => !s.trim())) errs.push(`${at}: needs 2 cues`);
}
for (const [k, f] of Object.entries(FIGS)) {
  if (!Array.isArray(f) || f.length !== 3 || typeof f[2] !== 'string') errs.push(`fig "${k}": must be [headX, headY, path]`);
  else if (/[^MLQACZmlqacz0-9 .\-]/.test(f[2])) errs.push(`fig "${k}": unexpected characters in path`);
}
if (errs.length) { console.error(`\n${errs.length} data problem(s):\n- ${errs.join('\n- ')}`); process.exit(1); }
console.log('Data checks passed (ids, figs, levels, parts, goals, pregnancy, 3 steps, 2 cues).');
