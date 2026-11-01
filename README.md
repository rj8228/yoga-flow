# Yoga Flow

A web app for yoga trainers: an asana library by body part, therapy sequences and breath-led flows, pre and postnatal guidance, and built-in tools that turn your own practice into content.

**Open the app:** https://rj8228.github.io/yoga-flow/

## Put it on your iPhone

1. Open the link above in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. Open Yoga Flow from the home screen icon. It runs full screen like an app.

## What's in this first version (MVP)

- **Library:** 15 body parts × Stretch / Strengthen / Mobility × Beginner / Intermediate / Advanced, with muscles, steps, cues, safety and pregnancy notes. Search by name. Add and edit your own asanas.
- **Your own media:** every pose starts as a line drawing; record a video or add a photo to replace it. Share it straight to Instagram from the pose card.
- **Practice:** sequences for chest, hips, lower back, knees, neck and full body; flows (Surya Namaskar and one per area) shown as a breath wheel; Teach mode with breath cues, voice and timer.
- **Create:** daily prompt, recording day with a 4-shot list per pose, points and levels (Seed → Sprout → Bloom → Guru), streaks, badges, monthly before/after progress videos, next 3 post ideas with captions, and a tracker for where each clip is used.
- **Mother:** trimester 1, 2, 3 and postnatal: use, modify/avoid, conditions and stop signs.

## Important for now

- Photos, videos and progress are saved **on this device only** (in the browser). Cloud backup and login are planned next.
- All yoga and health content is a draft for the trainer to review against their training and current medical guidance.

## How it's built

Plain HTML, CSS and JavaScript modules, no build step. Hosted free on GitHub Pages from the `main` branch.

- `js/data.js` — asanas, body parts, sequences, flows, pre/postnatal content
- `js/figures.js` — line drawings of each pose
- `js/store.js` — saved progress, photos/videos (IndexedDB), points, streaks, badges, prompts, post ideas
- `js/app.js` — screens and navigation
- `sw.js`, `manifest.webmanifest`, `icons/` — home-screen install and offline support

To run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
