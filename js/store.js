import { ASANAS, TRACKS, SHOTS } from './data.js';

// ---------- Saved progress (this device) ----------
const KEY = 'yogaflow.v1';
const DEF = { log: [], days: [], shots: {}, main: {}, posted: {}, scripts: {}, notes: {}, progress: {}, reuse: {}, prompts: {}, edits: {}, custom: [], ui: {} };
let S = load();
function load() {
  try { return { ...structuredClone(DEF), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return structuredClone(DEF); }
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage full or blocked */ } }
export const st = () => S;

// ---------- Photos and videos (IndexedDB) ----------
let dbp;
function db() {
  dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('yogaflow', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('media');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
function tx(mode, fn) {
  return db().then((d) => new Promise((res, rej) => {
    const t = d.transaction('media', mode); const out = fn(t.objectStore('media'));
    t.oncomplete = () => res(out.result); t.onerror = () => rej(t.error);
  }));
}
export const putMedia = (k, blob) => { dropURL(k); return tx('readwrite', (s) => s.put({ blob, type: blob.type || '', at: Date.now() }, k)); };
export const getMedia = (k) => tx('readonly', (s) => s.get(k));
export const delMedia = (k) => { dropURL(k); return tx('readwrite', (s) => s.delete(k)); };
const urls = new Map();
export async function mediaURL(k) {
  if (urls.has(k)) return urls.get(k);
  const m = await getMedia(k).catch(() => null);
  if (!m) return null;
  const u = { url: URL.createObjectURL(m.blob), video: (m.type || '').startsWith('video'), blob: m.blob };
  urls.set(k, u); return u;
}
function dropURL(k) { const u = urls.get(k); if (u) { URL.revokeObjectURL(u.url); urls.delete(k); } }
export function askPersist() { try { navigator.storage?.persist?.(); } catch { /* not supported */ } }

// ---------- Asanas (built-in + your edits + your own) ----------
export function allAsanas() { return [...ASANAS.map((a) => ({ ...a, ...(S.edits[a.id] || {}) })), ...S.custom]; }
export function asana(id) { return allAsanas().find((a) => a.id === id); }
export function saveAsana(a, isNew) {
  if (isNew) S.custom.push(a);
  else if (S.custom.some((c) => c.id === a.id)) S.custom = S.custom.map((c) => (c.id === a.id ? a : c));
  else S.edits[a.id] = a;
  save();
}
export const shotsOf = (id) => S.shots[id] || {};
export const shotCount = (id) => SHOTS.filter(([k]) => shotsOf(id)[k]).length;
export function status(id) {
  if (S.posted[id]) return 'Posted';
  if (shotCount(id) || S.main[id] === 'video') return 'Recorded';
  if (S.scripts[id]) return 'Scripted';
  return 'Not scripted';
}

// ---------- Points, streaks, levels ----------
export const PTS = { script: 5, clip: 10, photo: 10, prompt: 10, progress: 15, post: 20, day: 2 };
const today = () => new Date().toLocaleDateString('en-CA');
export function touchDay() {
  const d = today();
  if (S.days.includes(d)) return 0;
  S.days.push(d); S.log.push({ k: 'day:' + d, pts: PTS.day, t: Date.now() }); save();
  return PTS.day;
}
// Returns points earned (0 if this exact action was already rewarded).
export function award(type, ref) {
  const k = type + ':' + ref;
  if (S.log.some((l) => l.k === k)) return touchDay();
  S.log.push({ k, pts: PTS[type] || 0, t: Date.now() }); save();
  return (PTS[type] || 0) + touchDay();
}
export const points = () => S.log.reduce((s, l) => s + l.pts, 0);
export function streak() {
  const set = new Set(S.days); let n = 0; const d = new Date();
  if (!set.has(d.toLocaleDateString('en-CA'))) d.setDate(d.getDate() - 1);
  while (set.has(d.toLocaleDateString('en-CA'))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export const LEVELS_UP = [['Seed', 0], ['Sprout', 200], ['Bloom', 500], ['Guru', 1000]];
export function level() {
  const p = points(); let i = 0;
  LEVELS_UP.forEach(([, min], j) => { if (p >= min) i = j; });
  const next = LEVELS_UP[i + 1];
  return { name: LEVELS_UP[i][0], i, next: next?.[0], toNext: next ? next[1] - p : 0, pct: next ? Math.round(((p - LEVELS_UP[i][1]) / (next[1] - LEVELS_UP[i][1])) * 100) : 100 };
}
export const mineCount = () => allAsanas().filter((a) => S.main[a.id]).length;
const recordable = () => allAsanas().filter((a) => a.parts.length);
export const totalPoses = () => recordable().length;

export function badges() {
  const clips = Object.values(S.shots).reduce((n, s) => n + Object.values(s).filter(Boolean).length, 0);
  const full = Object.keys(S.shots).filter((id) => shotCount(id) === 4).length;
  const prog = Object.values(S.progress).reduce((n, l) => n + l.length, 0);
  const posts = Object.keys(S.posted).length;
  const mine = mineCount();
  const trackDone = TRACKS.some((t) => [...t.levels.B.warm, ...t.levels.B.main, ...t.levels.B.cool].every(([id]) => S.main[id] || !asana(id)?.parts.length));
  const b = (name, have, need, unit) => ({ name, earned: have >= need, left: have >= need ? 'Earned' : `${need - have} ${unit} to go` });
  return [
    b('First clip', clips, 1, 'clip'), b('First post', posts, 1, 'post'), b('7-day streak', streak(), 7, 'days'),
    b('10 poses yours', mine, 10, 'poses'), { name: 'Track made yours', earned: trackDone, left: trackDone ? 'Earned' : 'Photo every pose in one track' },
    b('All 4 shots × 10', full, 10, 'poses'), b('3 progress videos', prog, 3, 'videos'), b('30-day streak', streak(), 30, 'days'), b('50 poses yours', mine, 50, 'poses')
  ];
}

// ---------- Daily prompt and post ideas ----------
const PROMPTS = [
  (a) => `Film the most common mistake in ${a.en}, then the fix.`,
  (a) => `Record ${a.sa} from the side view.`,
  (a) => `30-second tip: the one cue you always give in ${a.en}.`,
  (a) => `Show the beginner version of ${a.en} with props.`,
  (a) => `Explain which muscles ${a.en} works (${a.mus}).`,
  (a) => `Film ${a.en} for someone with tight ${a.parts[0] === 'lowerback' ? 'lower back' : a.parts[0]}.`
];
function seed() { const d = today(); let h = 0; for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
export function prompt() {
  const list = recordable(); const h = seed();
  const a = list[h % list.length];
  return { a, text: PROMPTS[h % PROMPTS.length](a), done: !!S.prompts[today()], key: today() };
}
export function donePrompt() { S.prompts[today()] = true; save(); return award('prompt', today()); }

const PART_WORD = { lowerback: 'lower back', upperback: 'upper back', lowerbelly: 'lower belly', abs: 'core' };
const pw = (p) => PART_WORD[p] || p;
export function postIdeas() {
  const all = recordable().filter((a) => !S.posted[a.id]);
  const has = all.filter((a) => S.main[a.id] || shotCount(a.id));
  const pick = [...has, ...all.filter((a) => !has.includes(a)).sort((x, y) => (S.scripts[y.id] ? 1 : 0) - (S.scripts[x.id] ? 1 : 0))].slice(0, 3);
  const types = ['Reel', 'Carousel', 'Story'];
  return pick.map((a, i) => {
    const hook = [
      `Tight ${pw(a.parts[0])}? Try ${a.en} for ${a.hold}.`,
      `${a.sa}: 3 cues that change everything.`,
      `The mistake I see most in ${a.en}, and the fix.`
    ][i];
    const caption = `${hook}\n\n${a.steps.map((s, n) => `${n + 1}. ${s}`).join('\n')}\n\nHold: ${a.hold}. Props: ${a.props}.\nWorks: ${a.mus}.\n\nSave this for your next practice.\n\n#yoga #${a.sa.replace(/[^A-Za-z]/g, '').toLowerCase()} #yogateacher #mobility`;
    const src = S.main[a.id] || shotCount(a.id) ? 'Your clip ready' : 'Film it first';
    return { a, type: types[i], hook, caption, src };
  });
}
