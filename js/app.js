import { fig, bodyFig, FIGS } from './figures.js';
import { PARTS, GOALS, LEVELS, PREG, TRACKS, FLOWS, MOTHER, STOP_PRENATAL, STOP_POSTNATAL, SHOTS } from './data.js';
import * as $ from './store.js';
import './feedback.js';
import * as BK from './backup.js';
import * as CAM from './camera.js';
import { reminderSection, downloadReminderICS } from './reminders.js';
import { makeBeforeAfter, offerVideo } from './compare.js';

const S = $.st();
const view = document.getElementById('view');
const tabsEl = document.getElementById('tabs');
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const LV = { B: 'lv-b', I: 'lv-i', A: 'lv-a' };
const partName = (id) => PARTS.find((p) => p.id === id)?.name || id;
const mediaAttr = (id, hero) => (S.main[id] ? `data-media="main:${id}"${hero ? ' data-hero="1"' : ''}` : '');
const stSlug = (s) => s.toLowerCase().replace(' ', '-');
const SHORT_SHOT = { front: 'Front', side: 'Side', mistake: 'Mistake', props: 'Props' };
const SHORT_TRACK = { chest: 'Chest', hips: 'Hips', lowerback: 'Back', knees: 'Knees', neck: 'Neck', fullbody: 'Full body' };
const ARROW = { In: '↑ In', Ex: '↓ Ex', Hold: '• Hold' };
const WORD = { In: 'Inhale', Ex: 'Exhale', Hold: 'Hold' };

const I = (d, s = 22) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  home: I('<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>'),
  book: I('<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>'),
  list: I('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  plus: I('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
  heart: I('<path d="M12 20s-7-4.4-9-8.8A5 5 0 0 1 12 6.5a5 5 0 0 1 9 4.7C19 15.6 12 20 12 20z"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 20),
  back: I('<path d="M15 18l-6-6 6-6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  cam: I('<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/>', 18),
  img: I('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/>', 18),
  play: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
  pause: '<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>',
  playBig: '<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
  prev: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
  next: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
  flame: I('<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>'),
  check: I('<path d="M5 12l5 5L20 7"/>', 16),
  star: I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>', 24),
  lock: I('<path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>', 24)
};

// ---------- Shared bits ----------
const pill = (id) => { const s = $.status(id); return `<span class="pill st-${stSlug(s)}">${s}</span>`; };
const seg = (items, cur, href, cls = '') => `<div class="seg ${cls}" role="group">${items.map(([k, label]) => `<a href="${href(k)}" class="${k === cur ? 'on' : ''}" ${k === cur ? 'aria-current="true"' : ''}>${label}</a>`).join('')}</div>`;
const chips = (items, cur, href) => `<div class="chips">${items.map(([k, label]) => `<a class="chip ${k === cur ? 'on' : ''}" href="${href(k)}">${label}</a>`).join('')}</div>`;
const levelSeg = (cur, href) => seg(Object.entries(LEVELS), cur, href);
const row = (a, right) => `<a class="row" href="#/asana/${a.id}"><span class="thumb ${LV[a.lv]}"><span class="media" ${mediaAttr(a.id)}>${fig(a.fig, 44, 3.5)}</span></span><span class="grow"><b>${esc(a.sa)}</b><small>${esc(a.en)} · ${LEVELS[a.lv]}</small></span>${right ?? pill(a.id)}</a>`;
const poseCard = (a) => `<a class="card pose" href="#/asana/${a.id}"><span class="tile ${LV[a.lv]}"><span class="media" ${mediaAttr(a.id)}>${fig(a.fig, 92)}</span><span class="pill float st-${stSlug($.status(a.id))}">${$.status(a.id)}</span></span><b>${esc(a.sa)}</b><small>${esc(a.en)}</small><small class="mus">${esc(a.mus)}</small></a>`;
const backBtn = (label = 'Back') => `<button class="icon-btn" data-act="back" aria-label="${label}">${ICON.back}</button>`;

// ---------- Screens ----------
function home() {
  const L = $.level(); const p = $.prompt();
  const next = [p.a, ...$.allAsanas().filter((a) => a.parts.length && $.status(a.id) === 'Scripted'), ...$.allAsanas().filter((a) => a.parts.length && a.lv === 'B' && !S.main[a.id])]
    .filter((a, i, l) => l.indexOf(a) === i).slice(0, 3);
  return `<div class="page">
  <header class="stack-6"><p class="eyebrow">Your yoga studio</p><h1 class="title">What are you planning today?</h1></header>
  <a class="streak" href="#/create"><span class="streak-ic">${ICON.flame}</span><span class="grow"><b>${$.streak() ? `${$.streak()}-day streak` : 'Start your streak today'} · ${L.name}</b><small>Today: ${esc(p.text)}</small></span><span class="gold">${$.points()} pts</span></a>
  <a class="search" href="#/library">${ICON.search}<span>Search by body part or pose</span></a>
  <section class="stack"><h2>Therapy tracks</h2><div class="grid2">
    ${TRACKS.map((t) => `<a class="card track" href="#/seq/${t.id}/B"><b>${t.name}</b><small>${t.sub}</small><em>Sequence + flow</em></a>`).join('')}
    <a class="card track" href="#/flow/surya/B"><b>Surya Namaskar</b><small>12 poses with breath</small><em>Flow</em></a>
  </div></section>
  <section class="stack"><h2>Mother and baby</h2><div class="grid2">
    <a class="card plum" href="#/mother/t1"><b>Prenatal</b><small>Trimester 1, 2 and 3 + conditions</small></a>
    <a class="card plum" href="#/mother/post"><b>Postnatal</b><small>Recover, rebuild, return</small></a>
  </div></section>
  <section class="stack"><h2>Next to record</h2><div class="list">${next.map((a) => row(a)).join('')}</div></section>
  </div>`;
}

function library(_, q) {
  const goal = q.goal || S.ui.goal || 'strengthen'; S.ui.goal = goal; $.save();
  const list = $.allAsanas();
  const groups = [...new Set(PARTS.map((p) => p.group))];
  after = () => {
    const inp = document.getElementById('q'); const out = document.getElementById('results'); const rest = document.getElementById('parts');
    inp.addEventListener('input', () => {
      const v = inp.value.trim().toLowerCase();
      out.hidden = !v; rest.hidden = !!v;
      out.innerHTML = v ? (list.filter((a) => (a.sa + ' ' + a.en).toLowerCase().includes(v)).map(poseCard).join('') || '<p class="muted">No pose found. Add it with the button below.</p>') : '';
      hydrate();
    });
  };
  return `<div class="page">
  <header class="row-between"><div class="stack-6"><h1 class="title">Asana library</h1><p class="muted">Pick a body part, then your goal</p></div><a class="btn primary sm" href="#/edit/new">+ Add</a></header>
  <label class="search">${ICON.search}<input id="q" type="search" placeholder="Search Sanskrit or English name" aria-label="Search asanas"></label>
  <div id="results" class="grid2" hidden></div>
  <div id="parts" class="stack-16">
  ${seg(GOALS.map((g) => [g, cap(g)]), goal, (g) => `#/library?goal=${g}`)}
  ${groups.map((g) => `<section class="stack"><h2>${g}</h2><div class="grid3">${PARTS.filter((p) => p.group === g).map((p) => {
    const n = list.filter((a) => a.parts.includes(p.id) && a.goals.includes(goal)).length;
    return `<a class="card part" href="#/part/${p.id}?goal=${goal}">${bodyFig(p.e)}<b>${p.name}</b><small>${p.mus}</small><em>${n} pose${n === 1 ? '' : 's'}</em></a>`;
  }).join('')}</div></section>`).join('')}
  </div></div>`;
}

function part([id], q) {
  const goal = q.goal || S.ui.goal || 'strengthen'; const lv = q.lv || 'all';
  const order = { B: 0, I: 1, A: 2 };
  const list = $.allAsanas().filter((a) => a.parts.includes(id) && a.goals.includes(goal) && (lv === 'all' || a.lv === lv)).sort((a, b) => order[a.lv] - order[b.lv]);
  const name = partName(id);
  return `<div class="page">
  <div class="row-gap"><a class="pill-link" href="#/library?goal=${goal}">${ICON.back}${name}</a>${seg(GOALS.map((g) => [g, cap(g)]), goal, (g) => `#/part/${id}?goal=${g}&lv=${lv}`, 'grow sm')}</div>
  ${chips([['all', 'All levels'], ...Object.entries(LEVELS)], lv, (l) => `#/part/${id}?goal=${goal}&lv=${l}`)}
  <p class="muted small">${name} · ${cap(goal)} · ${list.length} asana${list.length === 1 ? '' : 's'}</p>
  ${list.length ? `<div class="grid2">${list.map(poseCard).join('')}</div>` : `<div class="empty">No ${goal} poses for ${name.toLowerCase()} at this level yet.</div>`}
  <a class="btn" href="#/edit/new?part=${id}&goal=${goal}">+ Add your own ${name.toLowerCase()} pose</a>
  </div>`;
}

function asanaView([id]) {
  const a = $.asana(id);
  if (!a) return `<div class="page"><p>Pose not found.</p><a class="btn" href="#/library">Back to library</a></div>`;
  const shots = $.shotsOf(id); const done = $.shotCount(id);
  const rel = $.allAsanas().filter((x) => a.parts.length && x.parts.includes(a.parts[0]) && x.goals.some((g) => a.goals.includes(g)));
  const lvPick = Object.keys(LEVELS).map((l) => (a.lv === l ? a : rel.find((x) => x.lv === l)));
  const reuse = S.reuse[id] || {}; const prog = S.progress[id] || []; const notes = S.notes[id] || {};
  return `<div class="hero ${LV[a.lv]}">
    <span class="media" ${mediaAttr(id, true)}>${fig(a.fig, 190, 2.5)}</span>
    <button class="round back" data-act="back" aria-label="Back">${ICON.back}</button>
    <a class="round edit" href="#/edit/${id}">Edit</a>
    <div class="hero-btns">${S.main[id]
      ? `<button class="btn" data-act="media:${id}:video">${ICON.cam}Replace</button><button class="btn" data-act="share:${id}">Share</button><button class="btn ghost" data-act="clearmedia:${id}">Use drawing</button>`
      : `<button class="btn primary" data-act="media:${id}:video">${ICON.cam}Record video</button><button class="btn" data-act="media:${id}:image">${ICON.img}Add photo</button>`}</div>
  </div>
  <div class="page">
    <div class="stack-6"><h1 class="title">${esc(a.sa)}</h1><p class="muted">${esc(a.en)} · ${esc(a.hold)} · ${esc(a.props)}</p>
      <div class="tags"><span class="tag ${LV[a.lv]}">${LEVELS[a.lv]}</span>${a.parts.map((p) => `<span class="tag">${partName(p)}</span>`).join('')}<span class="tag plum">${PREG[a.preg] || ''}</span>${pill(id)}</div>
      <p class="small"><b>Works:</b> ${esc(a.mus)}${a.goals.length ? ` · <b>Goal:</b> ${a.goals.map(cap).join(', ')}` : ''}</p></div>
    ${a.parts.length ? `<section class="stack"><h2>Levels</h2><div class="grid3">${lvPick.map((x, i) => {
      const l = Object.keys(LEVELS)[i];
      return x ? `<a class="lvl" href="#/asana/${x.id}"><span class="tile ${LV[l]} ${x.id === id ? 'cur' : ''}">${fig(x.fig, 64)}</span><b>${LEVELS[l]}</b><small>${esc(x.id === id ? 'This pose' : x.sa)}</small></a>`
        : `<span class="lvl"><span class="tile none">—</span><b>${LEVELS[l]}</b><small>Not added yet</small></span>`;
    }).join('')}</div></section>` : ''}
    <section class="stack"><div class="row-between"><h2>Shot list</h2><span class="small gold-t">${done} of 4 done</span></div>
      <div class="bar"><span style="width:${done * 25}%"></span></div>
      <div class="grid2">${SHOTS.map(([k, label]) => `<button class="shot ${shots[k] ? 'done' : ''}" data-act="shot:${id}:${k}">${shots[k] ? ICON.check : ''}<b>${label}</b><small>${shots[k] ? 'Recorded · tap to redo' : 'Tap to record'}</small></button>`).join('')}</div></section>
    <section class="stack"><h2>Script</h2>
      <textarea data-note="${id}:script" rows="3" placeholder="Hook, 3 cues, call to action">${esc(notes.script || '')}</textarea>
      ${S.scripts[id] ? '<p class="small ok">Script ready ✓</p>' : `<button class="btn" data-act="script:${id}">Mark script ready · +${$.PTS.script} pts</button>`}</section>
    <section class="stack"><h2>Teach</h2>
      <ol class="steps">${a.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <ul class="cues">${a.cues.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <p class="warn"><b>Safety:</b> ${esc(a.safe)} <br><b>Pregnancy:</b> ${PREG[a.preg] || ''}</p></section>
    <section class="stack"><h2>Used in</h2><div class="chips wrap">
      ${[['post', 'Instagram post'], ['client', 'Client plan'], ['class', 'Group class']].map(([k, l]) => `<button class="chip ${reuse[k] ? 'on' : ''}" data-act="reuse:${id}:${k}">${reuse[k] ? '✓ ' : ''}${l}</button>`).join('')}</div></section>
    <section class="stack"><div class="row-between"><h2>Monthly progress</h2><span class="small muted">${prog.length} video${prog.length === 1 ? '' : 's'}</span></div>
      ${prog.length >= 2 ? `<div class="grid2 compare"><div><small>${new Date(prog[0]).toLocaleDateString()}</small><span class="media vid" data-media="prog:${id}:${prog[0]}"></span></div><div><small>${new Date(prog.at(-1)).toLocaleDateString()}</small><span class="media vid" data-media="prog:${id}:${prog.at(-1)}"></span></div></div>` : '<p class="small muted">Film this pose once a month; with two videos you get a before/after side by side.</p>'}
      ${prog.length >= 2 ? `<button class="btn" data-act="beforeafter:${id}">Make before/after video</button>` : ''}
      <button class="btn" data-act="progress:${id}">${ICON.cam}Record this month · +${$.PTS.progress} pts</button></section>
    <section class="stack"><h2>My notes</h2><textarea data-note="${id}:mine" rows="3" placeholder="Acupressure points, client cues, variations">${esc(notes.mine || '')}</textarea></section>
  </div>`;
}

function edit([id], q) {
  const isNew = id === 'new';
  const a = isNew ? { sa: '', en: '', lv: 'B', parts: q.part ? [q.part] : [], goals: q.goal ? [q.goal] : [], mus: '', hold: '', props: '', steps: [], cues: [], safe: '', preg: 'safe', fig: 'mountain' } : $.asana(id);
  if (!a) return '<div class="page"><p>Pose not found.</p></div>';
  const inp = (n, label, v) => `<label class="field">${label}<input name="${n}" value="${esc(v)}"></label>`;
  const area = (n, label, v, r = 3) => `<label class="field">${label}<textarea name="${n}" rows="${r}">${esc(v)}</textarea></label>`;
  return `<header class="bar-top"><button class="link" data-act="back">Cancel</button><h1>${isNew ? 'Add asana' : 'Edit asana'}</h1><button class="btn primary sm" data-act="saveasana:${id}">Save</button></header>
  <form id="edit" class="page" onsubmit="return false">
    ${inp('sa', 'Sanskrit name', a.sa)}${inp('en', 'English name', a.en)}
    <div class="grid2"><label class="field">Level<select name="lv">${Object.entries(LEVELS).map(([k, l]) => `<option value="${k}" ${a.lv === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="field">Drawing<select name="fig">${Object.keys(FIGS).map((k) => `<option ${a.fig === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
    <fieldset class="field"><legend>Body parts</legend><div class="chips wrap">${PARTS.map((p) => `<label class="chip check"><input type="checkbox" name="parts" value="${p.id}" ${a.parts.includes(p.id) ? 'checked' : ''}>${p.name}</label>`).join('')}</div></fieldset>
    <fieldset class="field"><legend>Goal</legend><div class="chips wrap">${GOALS.map((g) => `<label class="chip check"><input type="checkbox" name="goals" value="${g}" ${a.goals.includes(g) ? 'checked' : ''}>${cap(g)}</label>`).join('')}</div></fieldset>
    <div class="grid2">${inp('hold', 'Hold', a.hold)}${inp('props', 'Props', a.props)}</div>
    ${inp('mus', 'Muscles worked', a.mus)}
    ${area('steps', 'Steps (one per line)', a.steps.join('\n'), 4)}${area('cues', 'Key cues (one per line)', a.cues.join('\n'))}${area('safe', 'Safety notes', a.safe, 2)}
    <label class="field">Pregnancy<select name="preg">${Object.entries(PREG).map(([k, l]) => `<option value="${k}" ${a.preg === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
  </form>`;
}

function practiceHead(kind, id, lv) {
  S.ui.practice = location.hash; $.save();
  const flowId = FLOWS.some((f) => f.id === id) ? id : 'surya';
  const seqId = TRACKS.some((t) => t.id === id) ? id : 'hips';
  return `<header class="row-between"><h1 class="title">Practice</h1>${seg([['seq', 'Sequence'], ['flow', 'Flow']], kind, (k) => (k === 'seq' ? `#/seq/${seqId}/${lv}` : `#/flow/${flowId}/${lv}`), 'dark')}</header>`;
}

function seq([tid = 'hips', lv = 'B']) {
  const t = TRACKS.find((x) => x.id === tid) || TRACKS[1]; const d = t.levels[lv];
  const phases = d ? [['Warm-up', d.warm, 'ph-warm'], ['Main sequence', d.main, 'ph-main'], ['Cool-down', d.cool, 'ph-cool']] : [];
  const mins = phases.map(([, l]) => l.reduce((s, x) => s + x[1], 0)); const total = mins.reduce((a, b) => a + b, 0);
  return `<div class="page">${practiceHead('seq', t.id, lv)}
  ${chips(TRACKS.map((x) => [x.id, x.name]), t.id, (k) => `#/seq/${k}/${lv}`)}
  ${levelSeg(lv, (l) => `#/seq/${t.id}/${l}`)}
  ${d ? `<div class="row-between"><div><h2 class="h-lg">${t.name}</h2><p class="muted small">${total} min · ${phases.reduce((n, [, l]) => n + l.length, 0)} poses</p></div><a class="btn primary sm" href="#/play/seq/${t.id}/${lv}">${ICON.play}Teach mode</a></div>
  <div class="timebar">${phases.map(([n, , c], i) => `<span class="${c}" style="flex:${mins[i]}"></span>`).join('')}</div>
  <div class="timebar-l">${phases.map(([n], i) => `<span style="flex:${mins[i]}">${['Warm-up', 'Main', 'Cool'][i]} ${mins[i]}′</span>`).join('')}</div>
  ${phases.map(([n, list, c]) => `<section class="stack"><h2><span class="dot ${c}"></span>${n}</h2><div class="stack-8">${list.map(([aid, m, det]) => {
    const a = $.asana(aid); if (!a) return '';
    return `<a class="row card" href="#/asana/${aid}"><span class="thumb ${c}"><span class="media" ${mediaAttr(aid)}>${fig(a.fig, 52, 3.5)}</span></span><span class="grow"><b>${esc(a.sa)}</b><small>${esc(det || a.en)}</small></span><span class="time">${m}′</span></a>`;
  }).join('')}</div></section>`).join('')}
  <div class="marker"><b>Next level when:</b> ${esc(d.marker)}</div>` : `<div class="empty">${LEVELS[lv]} ${t.name.toLowerCase()} is not written yet. Beginner is ready; tell Claude what to add.</div>`}
  </div>`;
}

function flow([fid = 'surya', lv = 'B']) {
  const f = FLOWS.find((x) => x.id === fid) || FLOWS[0]; const v = f.levels[lv] || f.levels.B;
  const n = v.steps.length; const W = 320; const T = n > 12 ? 40 : n > 8 ? 48 : 58; const R = n > 12 ? 136 : n > 8 ? 130 : 120;
  const tiles = v.steps.map((s, i) => {
    const a = $.asana(s[0]); const ang = ((-90 + (i * 360) / n) * Math.PI) / 180;
    const x = W / 2 + R * Math.cos(ang) - T / 2; const y = W / 2 + R * Math.sin(ang) - T / 2;
    return `<a class="wtile" href="#/asana/${s[0]}" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;width:${T}px;height:${T}px" aria-label="${i + 1}. ${esc(a?.sa)}"><span class="num">${i + 1}</span>${fig(s[3] || a?.fig, T - 10, 3.5)}<span class="breath b-${s[1]}">${n > 12 ? ARROW[s[1]].split(' ')[0] : ARROW[s[1]]}</span></a>`;
  }).join('');
  return `<div class="page">${practiceHead('flow', f.id, lv)}
  ${chips(FLOWS.map((x) => [x.id, x.id === 'surya' ? 'Surya Namaskar' : x.name.replace(' flow', '')]), f.id, (k) => `#/flow/${k}/${lv}`)}
  ${levelSeg(lv, (l) => `#/flow/${f.id}/${l}`)}
  ${n > 12 ? `<div class="card stack-4"><b class="h-md">${f.name}</b><small>${v.sub}</small><small class="green"><b>${v.rounds}</b></small></div>
  <div class="fgrid">${v.steps.map((s, i) => { const a = $.asana(s[0]); return `<a class="ftile" href="#/asana/${s[0]}" aria-label="${i + 1}. ${esc(a?.sa)}"><span class="num">${i + 1}</span>${fig(s[3] || a?.fig, 42, 3.5)}<span class="breath b-${s[1]}">${ARROW[s[1]].split(' ')[0]}</span></a>`; }).join('')}</div>`
    : `<div class="wheel" style="width:${W}px;height:${W + 12}px"><div class="ring"></div><div class="wcenter"><b>${f.name}</b><small>${v.sub}</small><em>${v.rounds}</em></div>${tiles}</div>`}
  <div class="row-gap"><a class="btn primary grow" href="#/play/flow/${f.id}/${lv}">${ICON.play}Play with breath cues</a><button class="btn square" data-act="flowvid:${f.id}" aria-label="Record this flow">${ICON.cam}</button></div>
  <section class="list"><h2 class="list-h">One round</h2>${v.steps.map((s, i) => { const a = $.asana(s[0]); return `<a class="row" href="#/asana/${s[0]}"><span class="num-l">${i + 1}</span><span class="grow"><b>${esc(a?.sa)}</b><small>${esc(s[2])}</small></span><span class="breath-p b-${s[1]}">${WORD[s[1]]}</span></a>`; }).join('')}</section>
  </div>`;
}

// ---------- Teach mode ----------
let P = null; let timer = null;
function play([kind, id, lv = 'B']) {
  let steps; let rounds = 1; let title;
  if (kind === 'flow') {
    const f = FLOWS.find((x) => x.id === id) || FLOWS[0]; const v = f.levels[lv] || f.levels.B; title = f.name; rounds = parseInt(v.rounds, 10) || 4;
    steps = v.steps.map((s) => { const a = $.asana(s[0]); return { id: s[0], fig: s[3] || a.fig, title: a.sa, sub: s[2], breath: s[1], secs: 0 }; });
  } else {
    const t = TRACKS.find((x) => x.id === id) || TRACKS[1]; const d = t.levels[lv] || t.levels.B; title = t.name;
    steps = [...d.warm, ...d.main, ...d.cool].map(([aid, m, det]) => { const a = $.asana(aid); return { id: aid, fig: a.fig, title: a.sa, sub: det || a.en, breath: null, secs: m * 60 }; });
  }
  P = { kind, steps, rounds, title, lv, i: 0, round: 1, left: 0, playing: false, voice: S.ui.voice !== false, pace: S.ui.pace || 5, done: false };
  P.left = secsOf(P.steps[0]);
  after = () => { drawPlayer(); timer = setInterval(tick, 250); };
  return `<div class="player">
    <header class="row-between"><a class="icon-btn" href="${kind === 'flow' ? `#/flow/${id}/${lv}` : `#/seq/${id}/${lv}`}" aria-label="Close teach mode">${ICON.close}</a>
      <span class="center"><b>${esc(title)} · ${LEVELS[lv]}</b><small id="p-round"></small></span>
      <button class="chip" data-act="voice" id="p-voice"></button></header>
    <div class="dots" id="p-dots"></div>
    <div class="p-main"><div class="p-ring" id="p-ring"><span class="p-inner" id="p-fig"></span></div>
      <p class="p-breath" id="p-breath"></p><h1 class="title center" id="p-title"></h1><p class="muted center" id="p-sub"></p><p class="p-time" id="p-time"></p></div>
    <div class="p-foot"><div class="row card" id="p-next"></div>
      ${kind === 'flow' ? `<div class="row-gap center-x small"><button class="chip" data-act="pace:-1">− slower</button><span id="p-pace"></span><button class="chip" data-act="pace:1">+ faster</button></div>` : ''}
      <div class="p-ctrl"><button class="circle" data-act="pstep:-1" aria-label="Previous">${ICON.prev}</button><button class="circle big" data-act="pp" id="p-pp" aria-label="Play or pause"></button><button class="circle" data-act="pstep:1" aria-label="Next">${ICON.next}</button></div></div>
  </div>`;
}
function secsOf(s) { return s.secs || Math.max(2, 9 - P.pace); }
function drawPlayer(speak) {
  if (!P) return; const s = P.steps[P.i]; const nx = P.steps[(P.i + 1) % P.steps.length];
  const g = (id) => document.getElementById(id);
  if (P.done) {
    g('p-fig').innerHTML = fig('savasana', 160, 2.5); g('p-title').textContent = 'Practice complete'; g('p-sub').textContent = 'Well done. Your streak is updated.';
    g('p-breath').textContent = ''; g('p-time').textContent = ''; g('p-pp').innerHTML = ICON.playBig; return;
  }
  g('p-round').textContent = P.kind === 'flow' ? `Round ${P.round} of ${P.rounds}` : `Pose ${P.i + 1} of ${P.steps.length}`;
  g('p-voice').textContent = P.voice ? 'Voice on' : 'Voice off';
  g('p-dots').innerHTML = P.steps.map((_, j) => `<span class="${j < P.i ? 'past' : j === P.i ? 'now' : ''}"></span>`).join('');
  g('p-fig').innerHTML = fig(s.fig, 170, 2.5);
  g('p-title').textContent = s.title; g('p-sub').textContent = s.sub;
  g('p-breath').textContent = s.breath ? (s.breath === 'In' ? '↑ Inhale' : s.breath === 'Ex' ? '↓ Exhale' : '• Hold') : '';
  g('p-breath').className = 'p-breath ' + (s.breath ? 'b-' + s.breath : '');
  const ring = g('p-ring'); ring.style.transitionDuration = secsOf(s) + 's'; ring.className = 'p-ring ' + (P.playing && s.breath === 'In' ? 'inhale' : P.playing && s.breath === 'Ex' ? 'exhale' : '');
  g('p-pp').innerHTML = P.playing ? ICON.pause : ICON.playBig;
  const na = $.asana(nx.id);
  g('p-next').innerHTML = `<small class="muted">Next</small><span class="grow"><b>${esc(na?.sa)}</b></span>${nx.breath ? `<span class="breath-p b-${nx.breath}">${WORD[nx.breath]}</span>` : `<span class="time">${Math.round(nx.secs / 60)}′</span>`}`;
  const pace = g('p-pace'); if (pace) pace.textContent = `${secsOf(s)} s per move`;
  drawTime();
  if (speak && P.voice && 'speechSynthesis' in window) {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(s.breath ? `${WORD[s.breath]}. ${s.sub}` : `${s.title}. ${s.sub}`));
  }
}
function drawTime() { const el = document.getElementById('p-time'); if (el && P && !P.done) el.textContent = P.playing || P.left < secsOf(P.steps[P.i]) ? `${Math.ceil(P.left)} s` : 'Tap play to start'; }
function tick() {
  if (!P || !P.playing) return;
  P.left -= 0.25;
  if (P.left <= 0) step(1, true); else drawTime();
}
function step(d, auto) {
  P.i += d;
  if (P.i >= P.steps.length) { P.i = 0; P.round++; if (P.round > P.rounds) { P.done = true; P.playing = false; P.i = P.steps.length - 1; $.touchDay(); drawPlayer(); return; } }
  if (P.i < 0) { P.i = 0; }
  P.left = secsOf(P.steps[P.i]); drawPlayer(auto || P.playing);
}
function stopPlayer() { clearInterval(timer); timer = null; P = null; if ('speechSynthesis' in window) speechSynthesis.cancel(); }

// ---------- Create & gamification ----------
function create(_, q) {
  const L = $.level(); const p = $.prompt(); const ideas = $.postIdeas(); const rt = q.rt || S.ui.rt || 'hips'; S.ui.rt = rt;
  const queue = recQueue(rt); const mine = $.mineCount(); const tot = $.totalPoses();
  const prog = $.allAsanas().find((a) => S.main[a.id] && !(S.progress[a.id] || []).some((t) => new Date(t).getMonth() === new Date().getMonth())) || p.a;
  const earned = $.badges().filter((b) => b.earned).length;
  return `<div class="page">
  <header class="row-between"><h1 class="title">Create</h1><a class="pill-dark" href="#/badges">${L.name} · Level ${L.i + 1}</a></header>
  <a class="grid3 stats" href="#/badges"><span class="card"><b class="n orange">${$.streak()}</b><small>day streak</small></span><span class="card"><b class="n green">${$.points()}</b><small>points</small></span><span class="card"><b class="n blue">${mine}</b><small>poses yours</small></span></a>
  <div class="stack-6"><div class="row-between small"><b>${L.next ? `${L.name} → ${L.next}` : 'Top level reached'}</b><span class="muted">${L.next ? `${L.toNext} pts to go` : ''}</span></div><div class="bar"><span style="width:${L.pct}%"></span></div></div>
  <section class="prompt"><div class="row-between eyebrow-d"><span>Today’s prompt</span><span class="gold">+${$.PTS.prompt} pts</span></div>
    <p>${esc(p.text)}</p>
    <div class="row-gap"><a class="btn light" href="#/asana/${p.a.id}">${ICON.cam}Record now</a>${p.done ? '<span class="ok-d">Done ✓</span>' : '<button class="btn ghost-d" data-act="prompt">Mark done</button>'}</div></section>
  <section class="card stack"><div class="row-between"><h2>Recording day</h2><span class="small muted">${queue.length} poses · ~${queue.length * 5} min</span></div>
    ${chips(TRACKS.map((t) => [t.id, SHORT_TRACK[t.id]]), rt, (k) => `#/create?rt=${k}`)}
    <div class="qstrip">${queue.slice(0, 5).map((a) => `<span class="${LV[a.lv]}">${fig(a.fig, 44, 3.5)}</span>`).join('')}${queue.length > 5 ? `<span class="more">+${queue.length - 5}</span>` : ''}</div>
    ${queue.length ? `<a class="btn primary" href="#/record/${rt}">Start recording day</a>` : '<p class="small ok">Every pose in this track has all 4 shots ✓</p>'}</section>
  <a class="card stack-6" href="#/library"><span class="row-between"><b class="h-md">Make it yours</b><small class="muted">${mine} of ${tot} poses</small></span><span class="bar"><span style="width:${Math.round((mine / tot) * 100)}%" class="blue-bg"></span></span><small class="muted">Replace each drawing with your own photo or video.</small></a>
  <a class="card plum row-gap" href="#/asana/${prog.id}"><span class="pair"><i></i><i></i></span><span class="stack-4"><b>Monthly progress video</b><small>Re-film ${esc(prog.sa)} · see your before/after</small></span></a>
  <section class="stack"><h2>Next 3 posts</h2>${ideas.map((x, i) => `<div class="card stack-6"><div class="row-between small"><b class="blue-t">${x.type}</b><span class="muted">${x.src}</span></div><b class="hook">“${esc(x.hook)}”</b>
    <div class="row-gap"><a class="small link" href="#/asana/${x.a.id}">${esc(x.a.sa)}</a><span class="grow"></span><button class="btn sm" data-act="copy:${i}">Copy caption</button><button class="btn sm" data-act="post:${x.a.id}">Mark posted</button></div></div>`).join('')}</section>
  <a class="card row-gap" href="#/badges"><span class="badges-mini">${$.badges().slice(0, 4).map((b) => `<i class="${b.earned ? 'on' : ''}"></i>`).join('')}</span><b class="grow">${earned} badge${earned === 1 ? '' : 's'} earned</b><span class="link small">See all</span></a>
  ${reminderSection()}
  <a class="card row-gap" href="#/backup"><span class="grow"><b>Backup</b><small>Photos and videos are saved on this phone only. Last backup: ${S.ui.lastBackup ? new Date(S.ui.lastBackup).toLocaleDateString() : 'never'}</small></span><span class="link small">Back up</span></a>
  </div>`;
}
function recQueue(tid) {
  const t = TRACKS.find((x) => x.id === tid) || TRACKS[1]; const d = t.levels.B;
  return [...new Set([...d.warm, ...d.main, ...d.cool].map((x) => x[0]))].map((id) => $.asana(id)).filter((a) => a && a.parts.length && $.shotCount(a.id) < 4);
}
function record([tid = 'hips']) {
  const q = recQueue(tid); const idx = Math.min(S.ui.recIdx || 0, Math.max(q.length - 1, 0));
  const head = `<header class="row-between"><a class="icon-btn" href="#/create" aria-label="Close recording">${ICON.close}</a>`;
  if (!q.length) return `<div class="rec">${head}<span></span></header><div class="page"><p>Every pose in this track has all 4 shots.</p>${chips(TRACKS.map((t) => [t.id, t.name]), tid, (k) => `#/record/${k}`)}</div></div>`;
  const a = q[idx]; const sh = $.shotsOf(a.id); const cur = S.ui.recShot && !sh[S.ui.recShot] ? S.ui.recShot : (SHOTS.find(([k]) => !sh[k]) || SHOTS[0])[0];
  const label = SHOTS.find(([k]) => k === cur)[1];
  return `<div class="rec">${head}<span class="center"><b>${esc(a.sa)}</b><small>Recording day · pose ${idx + 1} of ${q.length}</small></span><a class="link-d" href="#/asana/${a.id}">Card</a></header>
  <div class="frame"><span class="ghost">${fig(a.fig, 230, 1.5)}</span><span class="tagw">${label}</span><span class="cue">Cue: “${esc(a.cues[0])}” Line up with the outline, then tap record.</span></div>
  <div class="rec-foot">
    <div class="grid4">${SHOTS.map(([k, l]) => `<button class="rchip ${sh[k] ? 'done' : ''} ${k === cur ? 'cur' : ''}" data-act="recsel:${k}">${sh[k] ? '✓ ' : ''}${SHORT_SHOT[k]}</button>`).join('')}</div>
    <div class="row-between"><button class="sq" data-act="recmove:-1" ${idx === 0 ? 'disabled' : ''}>Prev</button>
      <button class="recbtn" data-act="shot:${a.id}:${cur}" aria-label="Record ${label}"><span></span></button>
      <button class="sq" data-act="recmove:1" ${idx >= q.length - 1 ? 'disabled' : ''}>Next</button></div>
    <p class="row-between small"><span>Saves as ${tid.toUpperCase()}_${a.lv}_${a.sa.replace(/[^A-Za-z]/g, '')}_${cur.toUpperCase()}</span><span class="gold">+${$.PTS.clip} pts per clip</span></p>
  </div></div>`;
}
function badges() {
  const L = $.level(); const reuse = Object.values(S.reuse);
  const cnt = (k) => reuse.filter((r) => r[k]).length;
  return `<div class="page">
  <div class="row-gap">${backBtn()}<h1 class="title">Badges and levels</h1></div>
  <section class="levels"><div class="row-between"><b class="h-md">${L.name} · ${$.points()} pts</b><small>${L.next ? `${L.toNext} to ${L.next}` : 'Top level'}</small></div>
    <div class="path">${$.LEVELS_UP.map(([n, min], i) => `<span class="${i <= L.i ? 'on' : ''} ${i === L.i ? 'cur' : ''}"><i></i><small>${n}${i > L.i ? ' ' + min : ''}</small></span>`).join('')}</div></section>
  <section class="stack"><h2>Badges</h2><div class="grid3">${$.badges().map((b) => `<div class="card badge ${b.earned ? 'on' : ''}"><span class="bi">${b.earned ? ICON.star : ICON.lock}</span><b>${b.name}</b><small>${b.left}</small></div>`).join('')}</div></section>
  <section class="stack"><h2>How you earn points</h2><div class="list">${[['Write a script', 'script'], ['Record a clip or photo', 'clip'], ['Finish today’s prompt', 'prompt'], ['Monthly progress video', 'progress'], ['Post on Instagram', 'post'], ['Each active day', 'day']].map(([l, k]) => `<div class="row"><span class="grow">${l}</span><b class="green">+${$.PTS[k]}</b></div>`).join('')}</div></section>
  <section class="stack"><h2>Where your clips are used</h2><div class="grid3 stats"><span class="card"><b class="n">${cnt('post')}</b><small>Instagram posts</small></span><span class="card"><b class="n">${cnt('client')}</b><small>client plans</small></span><span class="card"><b class="n">${cnt('class')}</b><small>group classes</small></span></div></section>
  </div>`;
}


// ---------- In-app camera ----------
let CAMSTATE = {};
async function startCam() {
  const v = document.getElementById('cam'); if (!v) return;
  try { await CAM.start(v, S.ui.facing || 'user', !CAMSTATE.photo); camMsg(''); }
  catch { camMsg('The camera is not available here. Allow camera access in Settings, or use “Upload instead”.'); }
}
// Shows or hides the message over the camera preview; does nothing if you already left the screen.
function camMsg(text) { const m = document.getElementById('cam-msg'); if (!m) return; m.hidden = !text; m.textContent = text; }
function cameraView([target = 'main', id], q) {
  const flowObj = target === 'flow' ? FLOWS.find((f) => f.id === id) : null;
  const a = flowObj ? $.asana(flowObj.levels.B.steps[0][0]) : $.asana(id);
  if (!a) return '<div class="page"><p>Not found.</p></div>';
  const ret = q.ret || `#/asana/${id}`; const photo = q.photo === '1';
  CAMSTATE = { target, id, ret, photo };
  const label = flowObj ? flowObj.name : target === 'main' ? (photo ? 'Pose photo' : 'Pose video') : target === 'prog' ? 'Monthly progress' : (SHOTS.find(([k]) => k === target.slice(5)) || [, 'Clip'])[1];
  after = () => { if (CAM.supported()) startCam(); else camMsg('This browser cannot record inside the app. Use “Upload instead” to open the phone camera.'); };
  return `<div class="rec">
  <header class="row-between"><a class="icon-btn" href="${esc(ret)}" aria-label="Close camera">${ICON.close}</a><span class="center"><b>${esc(flowObj ? flowObj.name : a.sa)}</b><small>${esc(label)}</small></span><button class="link-d" data-act="camupload">Upload instead</button></header>
  <div class="frame cam-frame"><video id="cam" playsinline muted></video>
    <span class="ghost" id="cam-ghost">${fig(a.fig, 240, 1.5)}</span>
    <span class="tagw">${esc(label)}</span><span class="cam-time" id="cam-time"></span>
    <span class="cam-count" id="cam-count" hidden></span>
    <span class="cue">Cue: “${esc(a.cues[0] || '')}”</span>
    <p class="cam-msg" id="cam-msg" hidden></p></div>
  <div class="rec-foot"><div class="row-between">
    <button class="sq" data-act="camoutline">Outline</button>
    <button class="recbtn ${photo ? 'photo' : ''}" id="cam-go" data-act="camgo" aria-label="${photo ? 'Take photo' : 'Start recording'}"><span></span></button>
    <button class="sq" data-act="camflip">Flip</button></div>
    <p class="small center">${photo ? 'Tap to take the photo.' : 'Tap to start: 3-second countdown. Tap again to stop and save.'}</p></div>
  </div>`;
}

// ---------- Mother ----------
function mother([sid = 't2']) {
  const m = MOTHER.find((x) => x.id === sid) || MOTHER[1]; const post = m.id === 'post';
  const TAG = { Helps: 'ok', Modify: 'mod', 'Doctor first': 'stop' };
  return `<div class="page">
  <header class="stack-6"><p class="eyebrow plum-t">Mother and baby</p><h1 class="title">Pre and postnatal guide</h1></header>
  ${seg(MOTHER.map((x) => [x.id, x.name]), m.id, (k) => `#/mother/${k}`, 'plum')}
  <section class="card stack-6"><h2>${m.title} · Focus</h2><p>${m.focus}</p></section>
  <div class="grid2"><div class="box ok-bg"><h3>${post ? 'Phases' : 'Use'}</h3><ul>${m.use.map((x) => `<li>${x}</li>`).join('')}</ul></div><div class="box mod-bg"><h3>Modify or avoid</h3><ul>${m.avoid.map((x) => `<li>${x}</li>`).join('')}</ul></div></div>
  <section class="stack"><h2>Plan by condition</h2><div class="list">${m.cond.map(([n, t, note]) => `<div class="row"><span class="grow"><b>${n}</b><small>${note}</small></span><span class="pill t-${TAG[t]}">${t}</span></div>`).join('')}</div></section>
  <section class="box stop-bg"><h3>Stop and contact a doctor if</h3><p>${post ? STOP_POSTNATAL : STOP_PRENATAL}</p></section>
  <p class="small muted">Draft content for your review. Check every line against your training and current medical guidance before using it with clients.</p>
  </div>`;
}

// ---------- Actions ----------
function pick(accept) {
  return new Promise((res) => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.style.display = 'none';
    i.onchange = () => { res(i.files[0] || null); i.remove(); };
    document.body.appendChild(i); i.click();
  });
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
const pts = (n, msg = '') => toast(n ? `${msg}+${n} pts` : msg || 'Saved');
const SAVE = {
  async main(id, f) {
    $.askPersist(); await $.putMedia('main:' + id, f); S.main[id] = f.type.startsWith('video') ? 'video' : 'image'; $.save();
    pts($.award(S.main[id] === 'video' ? 'clip' : 'photo', 'main:' + id), 'Now yours! ');
  },
  async shot(id, f, k) {
    $.askPersist(); await $.putMedia(`shot:${id}:${k}`, f);
    S.shots[id] = { ...$.shotsOf(id), [k]: true }; S.ui.recShot = null; $.save();
    pts($.award('clip', `${id}:${k}`), 'Shot saved ');
    if ($.shotCount(id) === 4) setTimeout(() => toast('All 4 shots done for this pose ✓'), 2300);
  },
  async prog(id, f) {
    const t = Date.now(); $.askPersist(); await $.putMedia(`prog:${id}:${t}`, f); S.progress[id] = [...(S.progress[id] || []), t]; $.save();
    pts($.award('progress', `${id}:${t}`), 'Progress saved ');
  },
  async flow(fid, f) {
    const t = Date.now(); $.askPersist(); await $.putMedia(`flow:${fid}:${t}`, f);
    pts($.award('clip', `flow:${fid}:${t}`), 'Flow saved ');
  }
};
const saverOf = (target) => (target.startsWith('shot-') ? 'shot' : target);
function openCamera(target, id, photo) { location.hash = `#/camera/${target}/${id}?ret=${encodeURIComponent(location.hash || '#/home')}${photo ? '&photo=1' : ''}`; }

const ACT = {
  back: () => (history.length > 1 ? history.back() : (location.hash = '#/home')),
  async media(id, kind) {
    if (kind === 'video' && CAM.supported()) return openCamera('main', id);
    const f = await pick(kind === 'video' ? 'video/*' : 'image/*'); if (f) { await SAVE.main(id, f); render(); }
  },
  async clearmedia(id) { await $.delMedia('main:' + id); delete S.main[id]; $.save(); render(); },
  async share(id) {
    const m = await $.mediaURL('main:' + id); if (!m) return;
    const file = new File([m.blob], `${id}.${m.video ? 'mp4' : 'jpg'}`, { type: m.blob.type });
    if (navigator.canShare?.({ files: [file] })) navigator.share({ files: [file] }).catch(() => {});
    else toast('Sharing files is not supported in this browser');
  },
  async shot(id, k) {
    if (CAM.supported()) return openCamera('shot-' + k, id);
    const f = await pick('video/*,image/*'); if (f) { await SAVE.shot(id, f, k); render(); }
  },
  script(id) { S.scripts[id] = true; $.save(); pts($.award('script', id), 'Script ready '); render(); },
  post(id) { S.posted[id] = Date.now(); S.reuse[id] = { ...(S.reuse[id] || {}), post: true }; $.save(); pts($.award('post', id), 'Posted '); render(); },
  reuse(id, k) {
    const r = S.reuse[id] || {}; r[k] = !r[k]; S.reuse[id] = r;
    if (k === 'post' && r.post) return ACT.post(id);
    if (k === 'post' && !r.post) delete S.posted[id];
    $.save(); render();
  },
  async progress(id) {
    if (CAM.supported()) return openCamera('prog', id);
    const f = await pick('video/*'); if (f) { await SAVE.prog(id, f); render(); }
  },
  // No await before makeBeforeAfter: it must start inside the tap so iOS lets the clips play.
  beforeafter(id) {
    const prog = S.progress[id] || []; if (prog.length < 2) return; const a = $.asana(id);
    const blob = (t) => $.getMedia(`prog:${id}:${t}`).then((m) => m?.blob);
    const day = (t) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    const btn = document.querySelector(`[data-act="beforeafter:${id}"]`); if (btn) { btn.disabled = true; btn.textContent = 'Making your video…'; }
    toast('Making your video…');
    return makeBeforeAfter(blob(prog[0]), blob(prog.at(-1)), { firstLabel: day(prog[0]), lastLabel: day(prog.at(-1)), title: a ? `${a.sa} · ${a.en}` : '' })
      .then((v) => offerVideo(new File([v], `${id}-before-after.${v.type.includes('mp4') ? 'mp4' : 'webm'}`, { type: v.type })), (err) => toast(err.message))
      .finally(() => { if (btn) { btn.disabled = false; btn.textContent = 'Make before/after video'; } });
  },
  async flowvid(fid) {
    if (CAM.supported()) return openCamera('flow', fid);
    const f = await pick('video/*'); if (f) await SAVE.flow(fid, f);
  },
  async camgo() {
    const v = document.getElementById('cam'); const btn = document.getElementById('cam-go');
    const { target, id, ret, photo } = CAMSTATE; if (!v || btn.dataset.busy) return;
    if (photo) { const b = await CAM.snap(v); CAM.stop(); await SAVE[saverOf(target)](id, b, target.slice(5)); location.replace(ret); return; }
    if (CAM.recording()) {
      btn.dataset.busy = '1'; const blob = await CAM.finish(); CAM.stop();
      if (blob && blob.size) await SAVE[saverOf(target)](id, blob, target.slice(5));
      location.replace(ret); return;
    }
    btn.dataset.busy = '1'; await CAM.count(document.getElementById('cam-count')); delete btn.dataset.busy;
    btn.classList.add('on'); btn.setAttribute('aria-label', 'Stop recording');
    CAM.record((sec) => { const t = document.getElementById('cam-time'); if (t) t.textContent = `● ${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; });
  },
  async camflip() { if (CAM.recording()) return; S.ui.facing = S.ui.facing === 'environment' ? 'user' : 'environment'; $.save(); await startCam(); },
  camoutline() { document.getElementById('cam-ghost')?.classList.toggle('off'); },
  async camupload() {
    const { target, id, ret, photo } = CAMSTATE; const f = await pick(photo ? 'image/*' : 'video/*,image/*'); if (!f) return;
    CAM.stop(); await SAVE[saverOf(target)](id, f, target.slice(5)); location.replace(ret);
  },
  prompt() { pts($.donePrompt(), 'Prompt done '); render(); },
  async reminder() { const r = await downloadReminderICS(document.getElementById('reminder-time')?.value); if (r !== 'cancelled') toast(r === 'shared' ? 'Reminder ready' : 'Calendar file downloaded'); },
  async backup() {
    toast('Making your backup…');
    const f = await BK.makeBackup();
    const r = await BK.deliver(f);
    if (r !== 'cancelled') toast(r === 'downloaded' ? 'Backup file downloaded' : 'Backup saved');
    render();
  },
  async restore() {
    const f = await pick('.zip,application/zip'); if (!f) return;
    if (!confirm('Restore this backup? It is added to what is already on this device.')) return;
    toast('Restoring…'); const n = await BK.restore(f); toast(`Restored ${n} photos and videos`); render();
  },
  copy(i) {
    const x = $.postIdeas()[+i]; if (!x) return;
    navigator.clipboard?.writeText(x.caption).then(() => toast('Caption copied'), () => toast('Could not copy'));
  },
  recsel(k) { S.ui.recShot = k; $.save(); render(); },
  recmove(d) { S.ui.recIdx = Math.max(0, (S.ui.recIdx || 0) + +d); S.ui.recShot = null; $.save(); render(); },
  saveasana(id) {
    const fd = new FormData(document.getElementById('edit')); const isNew = id === 'new';
    const lines = (k) => String(fd.get(k) || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const sa = String(fd.get('sa') || '').trim(); if (!sa) return toast('Add a Sanskrit or main name');
    const a = {
      ...(isNew ? {} : $.asana(id)),
      id: isNew ? sa.toLowerCase().replace(/[^a-z]+/g, '-') + '-' + Date.now().toString(36) : id,
      sa, en: String(fd.get('en') || ''), lv: fd.get('lv'), fig: fd.get('fig'), parts: fd.getAll('parts'), goals: fd.getAll('goals'),
      hold: String(fd.get('hold') || ''), props: String(fd.get('props') || ''), mus: String(fd.get('mus') || ''),
      steps: lines('steps'), cues: lines('cues'), safe: String(fd.get('safe') || ''), preg: fd.get('preg')
    };
    $.saveAsana(a, isNew); toast('Saved'); location.replace('#/asana/' + a.id);
  },
  pp() {
    if (P.done) { P.done = false; P.i = 0; P.round = 1; P.left = secsOf(P.steps[0]); }
    P.playing = !P.playing; drawPlayer(P.playing);
  },
  pstep(d) { if (!P.done) step(+d, false); },
  voice() { P.voice = !P.voice; S.ui.voice = P.voice; $.save(); if (!P.voice) speechSynthesis?.cancel(); drawPlayer(); },
  pace(d) { P.pace = Math.min(7, Math.max(1, P.pace + +d)); S.ui.pace = P.pace; $.save(); P.left = Math.min(P.left, secsOf(P.steps[P.i])); drawPlayer(); }
};
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  e.preventDefault(); const [act, ...args] = t.dataset.act.split(':');
  Promise.resolve(ACT[act]?.(...args)).catch((err) => toast('Something went wrong: ' + err.message));
});
document.addEventListener('input', (e) => {
  const t = e.target.closest('[data-note]'); if (!t) return;
  const [id, k] = t.dataset.note.split(':'); S.notes[id] = { ...(S.notes[id] || {}), [k]: t.value }; $.save();
});

// ---------- Router ----------
function backupView() {
  after = async () => { const st = await BK.stats(); if (document.body.dataset.screen === 'backup') view.innerHTML = BK.screen(st); };
  return BK.screen({ files: '…', bytes: 0, last: S.ui.lastBackup });
}
const ROUTES = { home, library, part, asana: asanaView, edit, seq, flow, play, create, record, badges, mother, backup: backupView, camera: cameraView };
const TAB_OF = { home: 'home', library: 'library', part: 'library', asana: 'library', edit: 'library', seq: 'practice', flow: 'practice', play: 'practice', create: 'create', record: 'create', badges: 'create', backup: 'create', camera: 'create', mother: 'mother' };
let after = null;
async function hydrate() {
  for (const el of view.querySelectorAll('[data-media]')) {
    const m = await $.mediaURL(el.dataset.media); if (!m || !el.isConnected) continue;
    el.classList.add('has-media');
    el.innerHTML = m.video ? `<video src="${m.url}#t=0.1" ${el.dataset.hero ? 'controls' : 'muted'} playsinline preload="metadata"></video>` : `<img src="${m.url}" alt="">`;
  }
}
function tabs(cur) {
  const T = [['home', 'Home', '#/home', ICON.home], ['library', 'Library', '#/library', ICON.book], ['practice', 'Practice', S.ui.practice || '#/seq/hips/B', ICON.list], ['create', 'Create', '#/create', ICON.plus], ['mother', 'Mother', '#/mother/t2', ICON.heart]];
  tabsEl.innerHTML = T.map(([k, l, h, ic]) => `<a href="${h}" class="${k === cur ? 'on' : ''}" ${k === cur ? 'aria-current="page"' : ''}>${ic}<span>${l}</span></a>`).join('');
}
function draw() {
  stopPlayer(); CAM.stop(); after = null;
  const h = location.hash.slice(1) || '/home'; const [path, qs] = h.split('?');
  const parts = path.split('/').filter(Boolean); const name = ROUTES[parts[0]] ? parts[0] : 'home';
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  view.innerHTML = ROUTES[name](parts.slice(1), q);
  document.body.dataset.screen = name; tabs(TAB_OF[name]);
  hydrate(); after?.();
}
// Actions redraw in place without jumping to the top; navigation starts at the top.
function render() { const y = window.scrollY; draw(); window.scrollTo(0, y); }
window.addEventListener('hashchange', () => { draw(); window.scrollTo(0, 0); });
draw();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
