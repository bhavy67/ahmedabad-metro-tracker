/**
 * Generates the PWA icon set from the Pulse mark: four line-coloured arcs
 * (Blue/Red/Yellow/Violet) orbiting one bright core — the network as a single
 * pulse. Mirrors src/features/shell/PulseLogo.tsx.
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT_DIR = new URL('../public/', import.meta.url);
mkdirSync(OUT_DIR, { recursive: true });

const BG = '#050507';
const BLUE = '#3D8BFF';
const RED = '#FF4D5E';
const YELLOW = '#FFC83D';
const VIOLET = '#A270FF';
const CORE = '#F4F4F6';

/** Content-only mark (no background), used for the transparent "any" icons and favicon. */
function markSvg(size: number): string {
  const c = size / 2;
  const r = size * 0.34;
  const sw = size * 0.09;
  const circumference = 2 * Math.PI * r;
  const quarter = circumference / 4;
  const gap = quarter * 0.1;
  const dashLen = quarter - gap;
  // One arc segment per circle: draw `dashLen`, then gap for the rest of the loop.
  const dasharray = `${dashLen} ${circumference - dashLen}`;
  const arc = (color: string, index: number) =>
    `<circle r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"
       stroke-dasharray="${dasharray}" stroke-dashoffset="${-(index * quarter)}"
       transform="rotate(-90)"/>`;
  return `
    <g transform="translate(${c} ${c})">
      ${arc(BLUE, 0)}
      ${arc(RED, 1)}
      ${arc(YELLOW, 2)}
      ${arc(VIOLET, 3)}
      <circle r="${size * 0.13}" fill="${CORE}"/>
    </g>
  `;
}

function fullSvg(size: number, { transparent }: { transparent: boolean }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${transparent ? '' : `<rect width="${size}" height="${size}" fill="${BG}"/>`}
    ${markSvg(size)}
  </svg>`;
}

/** Maskable variant: solid background, content confined to the inner 80% safe zone. */
function maskableSvg(size: number): string {
  const inner = size * 0.72; // leaves generous margin inside the 80% safe zone
  const offset = (size - inner) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${BG}"/>
    <g transform="translate(${offset} ${offset})">${markSvg(inner)}</g>
  </svg>`;
}

async function render(svg: string, size: number, outPath: string) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log('wrote', outPath);
}

const tasks: Array<[string, number, () => string]> = [
  ['pwa-192x192.png', 192, () => fullSvg(192, { transparent: false })],
  ['pwa-512x512.png', 512, () => fullSvg(512, { transparent: false })],
  ['pwa-maskable-512x512.png', 512, () => maskableSvg(512)],
  ['apple-touch-icon.png', 180, () => fullSvg(180, { transparent: false })],
  ['favicon-32.png', 32, () => fullSvg(32, { transparent: false })],
];

for (const [name, size, svg] of tasks) {
  await render(svg(), size, new URL(name, OUT_DIR).pathname);
}

// A crisp SVG favicon too (transparent, browsers handle their own chrome bg).
writeFileSync(new URL('favicon.svg', OUT_DIR).pathname, fullSvg(64, { transparent: true }));
console.log('wrote favicon.svg');
