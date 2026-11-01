// "Feedback week" checklist: one item per feature, ticked automatically as you use the app
// (or by hand), each linking to where you can try it.
import * as $ from './store.js';

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
const sentFeedback = () => { try { return JSON.parse(localStorage.getItem('yogaflow.feedback') || '[]').some((x) => x.sent); } catch { return false; } };
const n = (o) => Object.keys(o || {}).length;

// [key, title, how to try it, link, auto-detect]
export const ITEMS = [
  ['install', 'Add Yoga Flow to your Home Screen', 'In Safari tap Share → Add to Home Screen, then open it from the new icon.', '', () => standalone()],
  ['library', 'Browse the library by body part', 'Pick a body part, then switch Stretch / Strengthen / Mobility and the levels.', '#/library', (S) => S.ui.tried?.library],
  ['camera', 'Record a pose video with the in-app camera', 'Open a pose → Record video. Try Outline, Flip and the countdown.', '#/asana/malasana', (S) => S.ui.tried?.camera],
  ['photo', 'Replace a drawing with your own photo', 'Open a pose → Add photo, from the camera or your gallery.', '#/asana/baddhakona', (S) => Object.values(S.main).includes('image')],
  ['shots', 'Film all 4 shots of one pose', 'Front, side, common mistake, with props, from the shot list.', '#/asana/malasana', (S) => Object.values(S.shots).some((s) => Object.values(s).filter(Boolean).length >= 4)],
  ['script', 'Write a script and mark it ready', 'On a pose card, write the hook and cues, then Mark script ready.', '#/asana/malasana', (S) => n(S.scripts) > 0],
  ['seq', 'Teach a sequence in Teach mode', 'Practice → Sequence → Teach mode. Check the timer and voice.', '#/seq/hips/B', (S) => S.ui.tried?.seq],
  ['flow', 'Play a flow with breath cues', 'Try Surya Namaskar at all three levels; change the pace.', '#/flow/surya/A', (S) => S.ui.tried?.flow],
  ['recday', 'Do a recording day', 'Create → Start recording day, film a few shots in a row.', '#/create', (S) => S.ui.tried?.recday],
  ['prompt', 'Complete today’s prompt', 'Create → Record now, then Mark done.', '#/create', (S) => n(S.prompts) > 0],
  ['post', 'Copy a caption and mark a post as posted', 'Create → Next 3 posts → Copy caption → Mark posted.', '#/create', (S) => n(S.posted) > 0],
  ['beforeafter', 'Make a before/after video', 'Record 2 monthly progress videos on one pose, then Make before/after video.', '#/asana/malasana', (S) => S.ui.tried?.beforeafter],
  ['reminder', 'Add the daily reminder to your Calendar', 'Create → Daily reminder. Tell us if Calendar appeared in the share list.', '#/create', (S) => S.ui.tried?.reminder],
  ['custom', 'Add your own asana', 'Library → + Add. Fill it in and save.', '#/edit/new', (S) => S.custom.length > 0],
  ['mother', 'Read the pre and postnatal screens', 'Check every trimester and postnatal; correct anything that is off.', '#/mother/t1', (S) => S.ui.tried?.mother],
  ['badges', 'Check your badges and level', 'Create → level pill or See all.', '#/badges', (S) => S.ui.tried?.badges],
  ['backup', 'Make a backup', 'Create → Backup → Back up my data, then save it to Files.', '#/backup', (S) => !!S.ui.lastBackup],
  ['send', 'Send your feedback', 'Tap the round chat button on any screen → Send to GitHub or Copy all.', '', () => sentFeedback()]
];

export function mark(k) { const S = $.st(); S.ui.tried = { ...(S.ui.tried || {}), [k]: true }; $.save(); }
const isDone = (S, it) => !!(S.ui.ticked?.[it[0]] || it[4](S));
export const progress = (S) => ({ done: ITEMS.filter((it) => isDone(S, it)).length, total: ITEMS.length });
export function toggle(k) { const S = $.st(); S.ui.ticked = { ...(S.ui.ticked || {}), [k]: !S.ui.ticked?.[k] }; $.save(); }

export function homeCard(S) {
  const p = progress(S); if (p.done === p.total) return '';
  return `<a class="card stack-6 tryout-card" href="#/tryout"><span class="row-between"><b class="h-md">Feedback week</b><small class="muted">${p.done} of ${p.total} tried</small></span><span class="bar"><span style="width:${Math.round((p.done / p.total) * 100)}%"></span></span><small class="muted">Try every feature and tell us what to change.</small></a>`;
}

export function screen(S) {
  const p = progress(S);
  return `<div class="page">
  <header class="stack-6"><p class="eyebrow">Feedback week</p><h1 class="title">Try every feature</h1>
    <p class="muted">Work through this list on your iPhone. Whenever something feels wrong, unclear or missing, tap the round chat button and write a note: it remembers which screen you were on.</p></header>
  <div class="stack-6"><div class="row-between small"><b>${p.done} of ${p.total} tried</b><span class="muted">Ticks itself as you go</span></div><div class="bar"><span style="width:${Math.round((p.done / p.total) * 100)}%"></span></div></div>
  <div class="list">${ITEMS.map((it, i) => { const done = isDone(S, it);
    return `<div class="row try ${done ? 'done' : ''}"><button class="tick" data-act="tick:${it[0]}" aria-pressed="${done}" aria-label="Mark “${it[1]}” as tried">${done ? '✓' : i + 1}</button>
      <span class="grow"><b>${it[1]}</b><small>${it[2]}</small></span>${it[3] ? `<a class="btn sm" href="${it[3]}">Open</a>` : ''}</div>`; }).join('')}</div>
  <button class="btn primary" data-act="openfb">Write a feedback note</button>
  </div>`;
}
