// In-app camera: live preview with the pose outline on top, 3-second countdown, record or snap.
// Falls back to the phone's normal camera picker when the browser can't record here.
let stream = null; let rec = null; let chunks = []; let started = 0; let tick = null; let countdown = null;

export const supported = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

export async function start(videoEl, facing = 'user', withAudio = true) {
  stop();
  const video = { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } };
  try { stream = await navigator.mediaDevices.getUserMedia({ video, audio: withAudio }); }
  catch (e) { if (!withAudio) throw e; stream = await navigator.mediaDevices.getUserMedia({ video, audio: false }); }
  videoEl.srcObject = stream; videoEl.muted = true; videoEl.playsInline = true;
  videoEl.classList.toggle('mirror', facing === 'user');
  await videoEl.play().catch(() => {});
}

export function stop() {
  clearInterval(tick); clearInterval(countdown); tick = countdown = null;
  if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch { /* already stopped */ } }
  rec = null; chunks = [];
  stream?.getTracks().forEach((t) => t.stop()); stream = null;
}

export const recording = () => !!rec && rec.state === 'recording';

// Counts down from 3 on `el`, then resolves.
export function count(el, from = 3) {
  return new Promise((res) => {
    let n = from; el.textContent = n; el.hidden = false;
    countdown = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(countdown); countdown = null; el.hidden = true; res(); } else el.textContent = n;
    }, 1000);
  });
}

export function record(onTime) {
  const type = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
  chunks = []; rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.start(500); started = Date.now();
  tick = setInterval(() => onTime?.(Math.floor((Date.now() - started) / 1000)), 250);
}

export function finish() {
  return new Promise((res) => {
    if (!rec) return res(null);
    const r = rec; clearInterval(tick); tick = null;
    r.onstop = () => res(new Blob(chunks, { type: (r.mimeType || 'video/mp4').split(';')[0] }));
    r.stop();
  });
}

export function snap(videoEl) {
  const c = document.createElement('canvas'); c.width = videoEl.videoWidth; c.height = videoEl.videoHeight;
  const g = c.getContext('2d');
  if (videoEl.classList.contains('mirror')) { g.translate(c.width, 0); g.scale(-1, 1); }
  g.drawImage(videoEl, 0, 0);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.9));
}
