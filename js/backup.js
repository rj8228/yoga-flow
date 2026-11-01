// Backup and restore everything stored on this device: progress, notes, your own asanas,
// feedback notes, and every photo and video. One .zip file you can save to Files or iCloud.
import { zipSync, unzipSync, strToU8, strFromU8 } from './vendor/fflate.js';
import * as $ from './store.js';

const FB_KEY = 'yogaflow.feedback';
const EXT = (type) => ({ 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic', 'image/webp': 'webp' }[type] || 'bin');
const safe = (k) => k.replace(/[^a-zA-Z0-9-]+/g, '_');
const mb = (n) => (n / 1048576).toFixed(n > 10485760 ? 0 : 1) + ' MB';

export async function stats() {
  const list = await $.allMedia().catch(() => []);
  return { files: list.length, bytes: list.reduce((s, m) => s + (m.blob?.size || 0), 0), last: $.st().ui.lastBackup };
}

export function screen(st) {
  const last = st.last ? new Date(st.last).toLocaleString() : 'never';
  return `<div class="page">
  <div class="row-gap"><button class="icon-btn" data-act="back" aria-label="Back"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button><h1 class="title">Backup</h1></div>
  <p class="muted">Your photos, videos and progress are saved in this browser on this phone. Make a backup file after each recording day and save it to Files or iCloud Drive.</p>
  <div class="grid3 stats"><span class="card"><b class="n">${st.files}</b><small>photos and videos</small></span><span class="card"><b class="n">${mb(st.bytes)}</b><small>total size</small></span><span class="card"><b class="n green">${$.points()}</b><small>points</small></span></div>
  <p class="small">Last backup: <b>${last}</b></p>
  <button class="btn primary" data-act="backup">Back up my data</button>
  <section class="card stack"><h2>Restore</h2><p class="small muted">Pick a backup file made by Yoga Flow. It is merged with what is on this device; nothing here is deleted.</p><button class="btn" data-act="restore">Restore from a backup file</button></section>
  <p class="small muted">Large video libraries make large files. If a backup fails on the phone, back up after fewer recordings, or use a laptop browser. Cloud backup is planned.</p>
  </div>`;
}

export async function makeBackup(progress) {
  const media = await $.allMedia();
  const files = {}; const index = [];
  for (const m of media) {
    const name = `media/${safe(m.key)}.${EXT(m.type)}`;
    files[name] = [new Uint8Array(await m.blob.arrayBuffer()), { level: 0 }];
    index.push({ key: m.key, type: m.type, at: m.at, file: name });
    progress?.(index.length, media.length);
  }
  const data = { app: 'yoga-flow', version: 1, made: new Date().toISOString(), state: $.st(), feedback: JSON.parse(localStorage.getItem(FB_KEY) || '[]'), media: index };
  files['data.json'] = strToU8(JSON.stringify(data, null, 1));
  const zip = zipSync(files);
  const name = `yoga-flow-backup-${new Date().toISOString().slice(0, 10)}.zip`;
  $.st().ui.lastBackup = Date.now(); $.save();
  return new File([zip], name, { type: 'application/zip' });
}

export async function deliver(file) {
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Yoga Flow backup' }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  return 'downloaded';
}

export async function restore(file) {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
  if (!files['data.json']) throw new Error('This is not a Yoga Flow backup file');
  const data = JSON.parse(strFromU8(files['data.json']));
  if (data.app !== 'yoga-flow') throw new Error('This is not a Yoga Flow backup file');
  let n = 0;
  for (const m of data.media || []) {
    const bytes = files[m.file]; if (!bytes) continue;
    await $.putMedia(m.key, new Blob([bytes], { type: m.type })); n++;
  }
  $.mergeState(data.state);
  const fb = JSON.parse(localStorage.getItem(FB_KEY) || '[]'); const ids = new Set(fb.map((x) => x.id));
  localStorage.setItem(FB_KEY, JSON.stringify([...fb, ...(data.feedback || []).filter((x) => !ids.has(x.id))]));
  return n;
}
