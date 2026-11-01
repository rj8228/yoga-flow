// Before/after progress video: plays two clips side by side on a canvas and records the canvas
// into one video file (MP4 on iPhone Safari, WebM where MP4 recording is not available).

const TYPES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
const FONT = 'Outfit, Inter, system-ui, sans-serif';
const BG = '#0E1411'; const STRIP = '#1E2A24'; const GOLD = '#F2C46D';
const BLOCKED = 'Your phone blocked video playback. Turn off Low Power Mode and try again.';
let busy = false;

const fail = (msg) => new Error(msg);
const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const timeout = (p, ms, msg) => Promise.race([p, wait(ms).then(() => { throw fail(msg); })]);

function pickType() {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
    throw fail('This browser cannot make videos. Please update your iPhone (iOS 14.5 or newer) or use Safari or Chrome.');
  }
  return TYPES.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
}

function addVideo(box) {
  const v = document.createElement('video');
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
  v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
  v.style.cssText = 'width:2px;height:2px';
  box.appendChild(v);
  // Calling play() while the tap is still being handled lets iOS play this element later
  // (Low Power Mode, off-screen video). It has no source yet, so the call is expected to be cut short.
  v.play()?.catch(() => {});
  return v;
}

// play() also makes iOS Safari start loading, so it doubles as the "is this video usable" check.
async function start(v, name) {
  try {
    await timeout(v.play(), 15000, `The ${name} video took too long to open. Please try again.`);
  } catch (err) {
    if (err.name === 'NotAllowedError') throw fail(BLOCKED);
    if (err.name === 'NotSupportedError' || v.error) throw fail(`The ${name} video cannot be played in this browser.`);
    throw err;
  }
}

function seekStart(v) {
  return timeout(new Promise((res) => { v.addEventListener('seeked', res, { once: true }); v.currentTime = 0; }), 3000, 'seek').catch(() => {});
}

function fitFont(ctx, text, maxW, size, weight) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (s > 14 && ctx.measureText(text).width > maxW) { s -= 2; ctx.font = `${weight} ${s}px ${FONT}`; }
}

function fillBox(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  ctx.fill();
}

// One frame: title strip on top, each video letterboxed in its half, a label over each half.
function drawFrame(ctx, W, H, vids, labels, title) {
  const k = W / 1080; const top = Math.round(112 * k); const gap = Math.round(6 * k); const pad = Math.round(20 * k);
  const half = (W - gap) / 2; const h = H - top;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = STRIP; ctx.fillRect(0, 0, W, top);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = GOLD; ctx.font = `600 ${Math.round(24 * k)}px ${FONT}`;
  ctx.fillText('BEFORE  /  AFTER', W / 2, title ? top * 0.32 : top / 2);
  if (title) { ctx.fillStyle = '#FFFFFF'; fitFont(ctx, title, W - pad * 2, Math.round(42 * k), 600); ctx.fillText(title, W / 2, top * 0.68); }

  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  vids.forEach((v, i) => {
    const x = i * (half + gap);
    if (v.readyState >= 2 && v.videoWidth) {
      const s = Math.min(half / v.videoWidth, h / v.videoHeight); const dw = v.videoWidth * s; const dh = v.videoHeight * s;
      ctx.drawImage(v, x + (half - dw) / 2, top + (h - dh) / 2, dw, dh);
    }
    const [big, small] = labels[i];
    const b = Math.round(32 * k); const sm = Math.round(24 * k); const px = Math.round(18 * k); const py = Math.round(12 * k); const lg = Math.round(6 * k);
    const maxW = half - pad * 2 - px * 2;
    ctx.font = `600 ${b}px ${FONT}`; const w1 = ctx.measureText(big).width;
    ctx.font = `500 ${sm}px ${FONT}`; const w2 = small ? ctx.measureText(small).width : 0;
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    fillBox(ctx, x + pad, top + pad, Math.min(Math.max(w1, w2), maxW) + px * 2, py * 2 + b + (small ? sm + lg : 0), Math.round(14 * k));
    ctx.fillStyle = '#FFFFFF'; ctx.font = `600 ${b}px ${FONT}`; ctx.fillText(big, x + pad + px, top + pad + py, maxW);
    if (small) { ctx.fillStyle = '#DCE0D8'; ctx.font = `500 ${sm}px ${FONT}`; ctx.fillText(small, x + pad + px, top + pad + py + b + lg, maxW); }
  });
}

/**
 * Renders the first and latest progress clips side by side into one video.
 * Both clips play from the start; recording stops when the longer one ends (capped at maxSeconds).
 * It records in real time, so the app must stay open while it runs.
 * Call it straight from a tap handler, before any await: the blobs may be passed as promises so the
 * video elements are set up while the tap still counts (iOS needs that to play them).
 * @param {Blob|Promise<Blob>} firstBlob
 * @param {Blob|Promise<Blob>} lastBlob
 * @returns {Promise<Blob>} video/mp4 where the browser can record MP4 (iPhone Safari), otherwise video/webm.
 */
export async function makeBeforeAfter(firstBlob, lastBlob, { firstLabel = '', lastLabel = '', title = '', width = 1080, height = 960, fps = 30, maxSeconds = 30 } = {}) {
  if (busy) throw fail('Your video is still being made. Please wait.');
  const type = pickType();
  busy = true;

  // Videos and canvas sit in the page (tiny and invisible): iOS Safari may not decode detached videos.
  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;overflow:hidden;opacity:.01;pointer-events:none';
  document.body.appendChild(holder);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; canvas.style.cssText = 'width:2px;height:2px';
  holder.appendChild(canvas);
  const vids = [addVideo(holder), addVideo(holder)];
  const labels = [['Before', firstLabel], ['After', lastLabel]];
  const urls = [];
  let stream; let raf = 0; let onHide; let guard = 0;

  try {
    const blobs = await Promise.all([firstBlob, lastBlob]).catch(() => []);
    if (!blobs[0]?.size || !blobs[1]?.size) throw fail('Both progress videos are needed to make a before/after video.');
    vids.forEach((v, i) => { urls[i] = URL.createObjectURL(blobs[i]); v.src = urls[i]; });
    if (document.fonts?.load) await timeout(Promise.all([document.fonts.load(`600 32px ${FONT}`), document.fonts.load(`500 24px ${FONT}`)]), 1500, 'fonts').catch(() => {});
    await start(vids[0], 'before'); await start(vids[1], 'after');
    vids.forEach((v) => v.pause());
    await Promise.all(vids.map(seekStart));

    const ctx = canvas.getContext('2d');
    drawFrame(ctx, width, height, vids, labels, title);
    stream = canvas.captureStream(fps);
    let rec;
    try { rec = new MediaRecorder(stream, { ...(type && { mimeType: type }), videoBitsPerSecond: 6_000_000 }); } catch { throw fail('This browser cannot record video.'); }
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };

    await new Promise((res, rej) => {
      let why = null; let stopping = false;
      const stop = (err) => {
        if (stopping) return; stopping = true; why = err || null;
        cancelAnimationFrame(raf); vids.forEach((v) => v.pause());
        if (rec.state !== 'inactive') rec.stop(); else if (why) rej(why); else res();
      };
      rec.onstop = () => (why ? rej(why) : res());
      rec.onerror = (e) => stop(fail('Recording failed: ' + (e.error?.message || 'unknown error')));
      onHide = () => { if (document.hidden) stop(fail('Keep Yoga Flow open until your video is ready, then try again.')); };
      document.addEventListener('visibilitychange', onHide);
      vids.forEach((v) => v.addEventListener('error', () => stop(fail('A progress video stopped playing. Please try again.')), { once: true }));
      let t0 = 0;
      // Safety net in case playback stalls and the clips never report that they ended.
      guard = setTimeout(() => stop(t0 ? null : fail('The videos did not start playing. Please try again.')), (maxSeconds + 5) * 1000);
      const loop = (now) => {
        t0 ||= now;
        drawFrame(ctx, width, height, vids, labels, title);
        if ((vids[0].ended && vids[1].ended) || (now - t0) / 1000 >= maxSeconds) return stop();
        raf = requestAnimationFrame(loop);
      };
      rec.start();
      Promise.all(vids.map((v) => v.play())).then(() => { raf = requestAnimationFrame(loop); }, () => stop(fail(BLOCKED)));
    });

    const out = new Blob(chunks, { type: (rec.mimeType || type || 'video/webm').split(';')[0] });
    if (!out.size) throw fail('The video came out empty. Please try again.');
    return out;
  } finally {
    cancelAnimationFrame(raf); clearTimeout(guard);
    if (onHide) document.removeEventListener('visibilitychange', onHide);
    stream?.getTracks().forEach((t) => t.stop());
    vids.forEach((v) => { v.pause(); v.removeAttribute('src'); v.load(); });
    urls.forEach((u) => URL.revokeObjectURL(u));
    holder.remove();
    busy = false;
  }
}

/**
 * Shows the finished video with a Share button (iPhone share sheet, e.g. to Instagram) when the
 * browser can share files, and a Save link otherwise. Sharing needs its own tap: by the time the
 * video is ready, the tap that started it no longer counts for navigator.share.
 */
export function offerVideo(file) {
  document.querySelector('.ba-sheet')?.remove();
  const url = URL.createObjectURL(file);
  const canShare = !!navigator.canShare?.({ files: [file] });
  const el = document.createElement('div');
  el.className = 'ba-sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'ba-h');
  el.innerHTML = `<div class="ba-card stack"><h2 id="ba-h">Your before/after video is ready</h2>
    <video controls muted playsinline loop autoplay></video>
    <p class="small muted" data-ba="msg">${canShare ? 'Tap Share and pick Instagram, or save it to your phone.' : 'Save it, then post it from your photos or files.'}</p>
    <div class="row-gap">${canShare ? '<button class="btn primary grow" data-ba="share">Share</button>' : ''}<a class="btn grow${canShare ? '' : ' primary'}" data-ba="save">Save video</a></div>
    <button class="btn" data-ba="close">Close</button></div>`;
  el.querySelector('video').src = url;
  const save = el.querySelector('[data-ba="save"]'); save.href = url; save.download = file.name;
  const close = () => { el.remove(); URL.revokeObjectURL(url); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  el.addEventListener('click', (e) => {
    const k = e.target.closest('[data-ba]')?.dataset.ba;
    if (e.target === el || k === 'close') close();
    if (k === 'share') {
      navigator.share({ files: [file] }).catch((err) => {
        if (err.name !== 'AbortError') el.querySelector('[data-ba="msg"]').textContent = 'Sharing did not work here. Tap Save video instead.';
      });
    }
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(el);
  el.querySelector('[data-ba="share"], [data-ba="save"]').focus();
}
