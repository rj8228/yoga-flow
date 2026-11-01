// Line drawings of poses on a 64×64 grid. [headX, headY, path]; headX null = no head.
export const FIGS = {
  mountain: [32, 15, 'M30 54 L32 36 L34 54 M32 36 L32 22 M32 23 L33 38'],
  prayer: [32, 15, 'M30 54 L32 36 L34 54 M32 36 L32 22 M32 23 L37 30 L33 31'],
  raise: [32, 14, 'M30 54 L32 36 L34 54 M32 36 L32 22 M32 22 L29 6 M32 22 L35 6'],
  raiseback: [27, 16, 'M31 54 L33 36 L35 54 M33 36 L29 23 M29 23 L22 8 M29 23 L26 6'],
  fold: [38, 51, 'M30 54 L35 44 L28 34 L36 45 M36 45 L44 55'],
  halflift: [47, 30, 'M30 54 L30 34 L42 32 M42 33 L40 50'],
  calfraise: [32, 13, 'M31 52 L32 34 L33 52 M28 52 L36 52 M32 34 L32 20 M32 21 L33 36'],
  chair: [35, 16, 'M34 54 L40 54 M34 54 L42 44 L26 40 L33 23 M33 23 L42 8'],
  lunge: [29, 14, 'M44 54 L50 54 M44 54 L44 40 L30 42 L18 54 L6 54 M30 42 L29 22 M29 22 L24 6 M29 22 L34 6'],
  lungedown: [47, 23, 'M44 54 L50 54 M44 54 L44 40 L30 42 L18 54 L6 54 M30 42 L42 29 M42 30 L46 54'],
  warrior1: [30, 14, 'M44 54 L44 40 L30 40 L10 54 L4 54 M30 40 L30 22 M30 22 L26 6 M30 22 L34 6'],
  warrior2: [30, 13, 'M8 54 L30 38 L46 40 L50 54 M30 38 L30 20 M8 20 L56 20'],
  warrior3: [56, 33, 'M36 54 L36 36 L8 33 M36 36 L50 34 M50 35 L42 42'],
  triangle: [50, 27, 'M12 54 L30 36 L52 54 M30 36 L44 30 L48 44 M44 30 L40 10'],
  pyramid: [50, 46, 'M10 54 L30 34 L46 54 M30 34 L46 40 M46 41 L44 54'],
  tree: [32, 13, 'M32 54 L32 36 L44 42 L33 46 M32 36 L32 21 M32 21 L26 10 L32 3 M32 21 L38 10 L32 3'],
  garuda: [33, 15, 'M36 54 L40 44 L28 40 L41 41 L33 50 M28 40 L32 23 M32 24 L38 19 L33 29'],
  kneecircle: [42, 22, 'M30 54 L36 44 L28 36 L38 26 M38 27 L36 43'],
  easy: [32, 19, 'M32 48 L32 26 M32 29 L22 38 L17 45 M32 29 L42 38 L47 45 M17 46 L36 53 M47 46 L28 53'],
  twistseat: [34, 19, 'M32 48 L32 26 M32 30 L46 42 M32 30 L22 46 M17 46 L36 53 M47 46 L28 53'],
  baddha: [32, 19, 'M32 26 L32 46 M32 30 L25 40 L31 49 M32 30 L39 40 L33 49 M26 46 L14 42 L32 51 L50 42 L38 46 L26 46'],
  dandasana: [23, 20, 'M22 50 L56 52 M22 50 L22 28 M22 30 L24 50'],
  upavistha: [32, 19, 'M32 48 L8 52 M32 48 L56 52 M32 48 L32 26 M32 30 L20 44 M32 30 L44 44'],
  virasana: [26, 20, 'M16 54 L40 54 M24 50 L40 54 M24 50 L25 28 M25 30 L34 46'],
  cowface: [26, 20, 'M24 50 L42 47 L28 53 M24 50 L25 28 M25 29 L31 15 L21 31 M25 30 L19 40 L21 31'],
  malasana: [37, 18, 'M28 48 L42 36 L36 54 L44 54 M28 48 L34 26 M34 28 L41 36 L37 31'],
  pigeon: [31, 17, 'M28 46 L42 52 L32 54 M28 46 L6 54 M28 46 L30 24 M30 26 L37 50'],
  lizard: [49, 44, 'M46 54 L46 42 L30 42 L16 54 L4 54 M30 42 L42 47 M42 48 L40 54'],
  split: [28, 21, 'M4 54 L28 52 L58 54 M28 52 L28 30 M28 30 L23 10 M28 30 L33 10'],
  halfsplit: [44, 31, 'M8 54 L22 54 L22 38 L52 54 L54 50 M22 38 L38 32 M38 33 L36 54'],
  cat: [51, 41, 'M8 54 L22 54 L22 36 Q34 26 46 36 L46 54'],
  cow: [51, 31, 'M8 54 L22 54 L22 36 Q34 44 46 36 L46 54'],
  child: [46, 51, 'M16 54 L36 54 M18 46 L16 54 M18 46 L40 48 M38 50 L58 54'],
  puppy: [13, 46, 'M50 54 L36 54 L36 36 L18 48 M18 48 L2 52'],
  birddog: [53, 40, 'M22 54 L22 38 L46 38 L46 54 M22 38 L4 36 M46 38 L62 32'],
  threadneedle: [16, 50, 'M44 54 L44 38 L22 44 L20 54 M22 44 L36 54'],
  downdog: [42, 44, 'M8 54 L12 54 M12 54 L28 24 L48 54'],
  plank: [50, 33, 'M6 50 L44 36 L44 54'],
  chaturanga: [50, 42, 'M6 50 L44 44 M44 44 L36 46 L38 54'],
  ashtanga: [50, 50, 'M6 54 L20 54 L30 42 L44 52 M44 52 L38 54'],
  cobra: [50, 30, 'M4 54 L34 54 L46 36 M46 37 L44 54'],
  locust: [54, 42, 'M4 46 L30 54 L50 46 M46 47 L36 50'],
  bow: [51, 33, 'M32 52 L46 38 M32 52 L18 42 L24 30 M46 39 L24 30'],
  camel: [21, 20, 'M16 54 L36 54 L36 34 Q36 22 26 22 M26 23 L18 52'],
  wheel: [19, 44, 'M12 54 L18 34 Q32 18 44 34 L52 54'],
  crow: [45, 40, 'M38 38 L36 54 M38 38 L22 28 L32 40 L18 38'],
  boat: [15, 25, 'M28 52 L48 30 M28 52 L18 32 M18 33 L34 38'],
  bridge: [8, 50, 'M14 52 L34 34 L46 36 L46 54 M14 53 L36 54'],
  onelegbridge: [8, 50, 'M14 52 L34 34 L46 36 L46 54 M34 34 L50 16 M14 53 L36 54'],
  fish: [14, 49, 'M60 52 L34 52 L22 42 M22 43 L28 52'],
  supinetwist: [8, 47, 'M13 50 L34 50 L44 42 L54 50 M18 50 L22 38'],
  apanasana: [8, 47, 'M13 50 L32 50 L30 34 L42 32 M18 50 L30 38'],
  pelvictilt: [8, 47, 'M13 50 L32 48 L42 36 L46 54 M18 50 L30 53'],
  deadbug: [8, 47, 'M13 50 L34 50 L34 36 L46 36 M18 50 L18 32'],
  legraise: [8, 47, 'M13 50 L34 50 L58 50 M34 50 L54 30 M18 50 L28 53'],
  strap: [8, 47, 'M13 50 L34 50 L58 50 M34 50 L36 10 M16 50 L35 14'],
  needle: [8, 47, 'M13 50 L32 50 L32 32 L44 32 M32 50 L42 38 L28 30 M16 50 L30 34'],
  hipcircle: [8, 47, 'M13 50 L36 50 L58 51 M36 50 L36 34 L46 38 M14 50 L33 36'],
  reclined: [8, 47, 'M13 50 L32 50 L44 38 L40 51 M18 50 L30 44'],
  legswall: [8, 47, 'M13 50 L34 50 L34 12 M18 50 L28 53 M38 8 L38 56'],
  savasana: [8, 47, 'M13 50 L58 50 M16 50 L30 53'],
  sideleg: [8, 46, 'M13 49 L34 50 L58 52 M34 50 L56 38 M14 50 L8 54'],
  neckcenter: [32, 29, 'M16 46 L48 46 M32 46 L32 56 M32 46 L32 36'],
  neckdown: [32, 34, 'M16 46 L48 46 M32 46 L32 56 M32 46 L32 40'],
  necktilt: [39, 31, 'M16 46 L48 46 M32 46 L32 56 M32 46 L35 38'],
  neckpress: [32, 29, 'M16 46 L48 46 M32 46 L32 56 M32 46 L32 36 M16 46 L18 34 L27 28'],
  shoulderroll: [32, 24, 'M16 40 L48 40 M32 40 L32 58 M32 40 L32 31 M16 40 Q10 30 18 26 M48 40 Q54 30 46 26'],
  wrist: [null, null, 'M6 40 L34 40 M34 40 L46 30 M34 40 L46 50 M52 24 A12 12 0 0 1 52 56'],
  ankle: [null, null, 'M10 24 L10 50 L40 50 L44 42 M50 36 A9 9 0 1 1 46 54'],
  eyes: [null, null, 'M18 30 A14 14 0 1 0 46 30 A14 14 0 1 0 18 30 M24 27 L29 27 M35 27 L40 27 M28 37 L36 37 M6 30 L11 30 M53 30 L58 30']
};

// Body silhouette for body-part tiles (front view).
const BODY = 'M32 15 L32 38 M22 20 L42 20 M22 20 L19 34 L18 44 M42 20 L45 34 L46 44 M27 38 L37 38 M27 38 L26 49 L26 60 M37 38 L38 49 L38 60';

export function fig(key, size = 64, sw = 3) {
  const f = FIGS[key] || FIGS.mountain;
  const head = f[0] == null ? '' : `<circle cx="${f[0]}" cy="${f[1]}" r="4.5" fill="currentColor"/>`;
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M4 57 L60 57" stroke="currentColor" stroke-opacity=".25" stroke-width="1.5" fill="none"/>${head}<path d="${f[2]}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function bodyFig(e, size = 56) {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><ellipse cx="${e[0]}" cy="${e[1]}" rx="${e[2]}" ry="${e[3]}" fill="var(--accent)" fill-opacity=".3"/><circle cx="32" cy="9" r="4.5" fill="var(--muted)"/><path d="${BODY}" fill="none" stroke="var(--muted)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
