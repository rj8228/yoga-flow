// Daily reminder without a server: a repeating calendar event (.ics) with an alert at the
// time the trainer picks, linking back to today's prompt. Real push notifications: issue #7.
import * as $ from './store.js';

export const DEFAULT_TIME = '07:30';
export const APP_URL = 'https://rj8228.github.io/yoga-flow/#/create';
const TITLE = "Yoga Flow: today's prompt";
const FILE_NAME = 'yoga-flow-reminder.ics';
const isTime = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(t || ''));

export const reminderTime = () => (isTime($.st().ui.reminderTime) ? $.st().ui.reminderTime : DEFAULT_TIME);
function saveTime(t) { if (isTime(t)) { $.st().ui.reminderTime = t; $.save(); } return reminderTime(); }

export function reminderSection() {
  return `<section class="card stack" id="reminder">
    <div class="stack-4"><h2>Daily reminder</h2><p class="small muted">A repeating event in your phone’s calendar, with an alert at this time every day and a link to today’s prompt.</p></div>
    <label class="field">Remind me at<input id="reminder-time" type="time" value="${reminderTime()}" required></label>
    <button class="btn primary" data-act="reminder">Add a daily reminder to my calendar</button>
    <p class="small muted">On iPhone, pick Calendar in the share list. If it is not there, pick Mail, send it to yourself and tap the attachment. To change the time later, delete the old event first.</p>
  </section>`;
}

// ---------- iCalendar file (RFC 5545) ----------
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const utc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const text = (s) => s.replace(/[\\;,]/g, (c) => '\\' + c).replace(/\r?\n/g, '\\n');
const enc = new TextEncoder();
function fold(line) { // lines longer than 75 bytes continue on the next line, which starts with a space
  let out = ''; let n = 0;
  for (const ch of line) { const b = enc.encode(ch).length; if (n + b > 75) { out += '\r\n '; n = 1; } out += ch; n += b; }
  return out;
}

export function buildICS(timeHHMM = DEFAULT_TIME, now = new Date()) {
  const t = isTime(timeHHMM) ? timeHHMM : DEFAULT_TIME; const [h, m] = t.split(':').map(Number);
  const day = new Date(now); day.setHours(h, m, 0, 0);
  if (day <= now) day.setDate(day.getDate() + 1); // first reminder is the next one ahead
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Yoga Flow//Daily reminder//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:yoga-flow-daily-${now.getTime().toString(36)}@rj8228.github.io`,
    `DTSTAMP:${utc(now)}`,
    `DTSTART:${ymd(day)}T${pad(h)}${pad(m)}00`, // floating local time: no time zone, the phone's own clock decides
    'DURATION:PT15M',
    'RRULE:FREQ=DAILY',
    `SUMMARY:${text(TITLE)}`,
    `DESCRIPTION:${text(`Open today's prompt in Yoga Flow: ${APP_URL}`)}`,
    `URL:${APP_URL}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${text(TITLE)}`, 'TRIGGER:PT0S', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].map(fold).join('\r\n') + '\r\n';
}

// Hands the file over: the share sheet on iPhone (Calendar or Mail), else a normal download.
// Returns 'shared', 'cancelled' or 'downloaded'.
export async function downloadReminderICS(timeHHMM) {
  const file = new File([buildICS(saveTime(timeHHMM))], FILE_NAME, { type: 'text/calendar' });
  if (navigator.canShare?.({ files: [file] })) { // no await before share(): Safari needs it right after the tap
    try { await navigator.share({ files: [file] }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  return 'downloaded';
}

globalThis.document?.addEventListener('change', (e) => { if (e.target.id === 'reminder-time') saveTime(e.target.value); });
