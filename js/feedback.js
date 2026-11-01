// In-app feedback: a small button on every screen. Notes are tied to the screen you are on,
// kept on this device, and can be sent as one GitHub issue or copied into a chat.
const KEY = 'yogaflow.feedback';
const REPO = 'rj8228/yoga-flow';
const KINDS = ['Bug', 'Change', 'Idea', 'Content'];
const NAMES = { home: 'Home', library: 'Library', part: 'Body part list', asana: 'Asana card', edit: 'Edit asana', seq: 'Sequence', flow: 'Flow', play: 'Teach mode', create: 'Create', record: 'Recording day', badges: 'Badges', mother: 'Mother', camera: 'Camera' };

const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const store = (l) => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch { /* full */ } };
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function screen() {
  const h = (location.hash.slice(1) || '/home').split('?')[0]; const p = h.split('/').filter(Boolean);
  return { name: NAMES[p[0]] || 'Home', where: '#' + (location.hash.slice(1) || '/home') };
}
let kind = 'Change';

const btn = document.createElement('button');
btn.className = 'fb-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Give feedback on this screen');
btn.innerHTML = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span class="sr">Feedback</span><b class="fb-count"></b>';
const sheet = document.createElement('div');
sheet.className = 'fb-wrap'; sheet.hidden = true;
document.body.append(btn, sheet);

function count() { const n = load().filter((x) => !x.sent).length; btn.querySelector('.fb-count').textContent = n || ''; }
function asMarkdown(list) {
  return list.map((x, i) => `${i + 1}. **${x.kind}** · ${x.screen} (\`${x.where}\`)\n   ${x.text.replace(/\n/g, '\n   ')}`).join('\n');
}
function draw() {
  const s = screen(); const list = load(); const open = list.filter((x) => !x.sent);
  sheet.innerHTML = `<div class="fb-back" data-fb="close"></div>
  <div class="fb-sheet" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <div class="row-between"><h2 id="fb-h">Feedback</h2><button class="icon-btn" data-fb="close" aria-label="Close">✕</button></div>
    <p class="small muted">On: <b>${esc(s.name)}</b></p>
    <div class="chips wrap">${KINDS.map((k) => `<button type="button" class="chip ${k === kind ? 'on' : ''}" data-fb="kind:${k}">${k}</button>`).join('')}</div>
    <label class="field">What should change here?<textarea id="fb-text" rows="4" placeholder="e.g. Make the pose names bigger; add Hindi names; this cue is wrong…"></textarea></label>
    <button class="btn primary" data-fb="save">Save note</button>
    ${open.length ? `<div class="stack-6"><div class="row-between"><b>${open.length} note${open.length === 1 ? '' : 's'} to send</b><button class="link small" data-fb="clear">Clear all</button></div>
      <ul class="fb-list">${open.map((x) => `<li><span class="pill">${x.kind}</span> <b>${esc(x.screen)}</b><br>${esc(x.text)} <button class="link small" data-fb="del:${x.id}">Delete</button></li>`).join('')}</ul>
      <div class="grid2"><button class="btn" data-fb="copy">Copy all</button><button class="btn primary" data-fb="send">Send to GitHub</button></div>
      <p class="small muted">“Send to GitHub” opens a new issue with all notes filled in; tap Submit there. “Copy all” lets you paste the notes into your chat with Claude.</p></div>` : ''}
  </div>`;
}
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
function openSheet() { draw(); sheet.hidden = false; setTimeout(() => document.getElementById('fb-text')?.focus(), 50); }
function closeSheet() { sheet.hidden = true; }

btn.addEventListener('click', openSheet);
sheet.addEventListener('click', (e) => {
  const t = e.target.closest('[data-fb]'); if (!t) return;
  const [a, arg] = t.dataset.fb.split(':');
  const list = load();
  if (a === 'close') return closeSheet();
  if (a === 'kind') { kind = arg; const txt = document.getElementById('fb-text').value; draw(); document.getElementById('fb-text').value = txt; return; }
  if (a === 'save') {
    const text = document.getElementById('fb-text').value.trim(); if (!text) return toast('Write a note first');
    const s = screen(); list.push({ id: Date.now().toString(36), kind, text, screen: s.name, where: s.where, at: new Date().toISOString() });
    store(list); count(); draw(); toast('Note saved'); return;
  }
  if (a === 'del') { store(list.filter((x) => x.id !== arg)); count(); return draw(); }
  if (a === 'clear') { if (confirm('Delete all unsent notes?')) { store(list.filter((x) => x.sent)); count(); draw(); } return; }
  const open = list.filter((x) => !x.sent); if (!open.length) return;
  const md = asMarkdown(open);
  if (a === 'copy') {
    navigator.clipboard?.writeText(`Yoga Flow feedback (${open.length} notes)\n\n${md}`).then(() => toast('Copied. Paste it into your chat.'), () => toast('Could not copy'));
    return;
  }
  if (a === 'send') {
    const title = `Feedback: ${open.length} note${open.length === 1 ? '' : 's'} (${new Date().toLocaleDateString('en-GB')})`;
    const body = `Feedback from the app, ${new Date().toLocaleString()}\n\n${md}\n\n_Device: ${navigator.userAgent}_`;
    let url = `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    if (url.length > 7500) { // GitHub URLs have a length limit; copy the notes instead and open a blank issue
      navigator.clipboard?.writeText(body);
      url = `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent('Paste the copied notes here.')}`;
      toast('Notes copied; paste them into the issue');
    }
    window.open(url, '_blank');
    store(list.map((x) => (x.sent ? x : { ...x, sent: true }))); count(); draw();
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
count();
