import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const FONTS_DIR = path.join(ROOT_DIR, 'src', 'fonts');

GlobalFonts.loadFontsFromDir(FONTS_DIR);

function drawBrandHeader(ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>) {
  // Pure white light-theme canvas matching original 1280x720 design
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1280, 720);

  // Black brand badge (x=72, y=58, 136x136)
  ctx.fillStyle = '#000000';
  ctx.fillRect(72, 58, 136, 136);

  // Badge text: Mahin / Raza + green status dot (#10b981)
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px "Poppins"';
  ctx.textBaseline = 'top';
  ctx.fillText('Mahin', 88, 94);
  ctx.fillText('Raza', 88, 128);

  // Original emerald accent square next to name
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(169, 143, 9, 9);

  // Header title & subtitle matching original typography and colors
  ctx.fillStyle = '#000000';
  ctx.font = '700 40px "Poppins"';
  ctx.fillText('Engineering Cloud & DevOps', 228, 72);

  ctx.fillStyle = '#52525b';
  ctx.font = '700 36px "Poppins"';
  ctx.fillText('by Mahin Raza.', 228, 132);
}

function generateTemplates() {
  // 1. Base template for per-post social-media.png generation
  const templateCanvas = createCanvas(1280, 720);
  const tCtx = templateCanvas.getContext('2d');
  drawBrandHeader(tCtx);

  const templatePath = path.join(ROOT_DIR, 'social-media-image-template.png');
  fs.writeFileSync(templatePath, templateCanvas.toBuffer('image/png'));
  console.log(`Generated template: ${templatePath}`);

  // 2. Default site-wide OG image (public/og-default.png)
  const defaultCanvas = createCanvas(1280, 720);
  const dCtx = defaultCanvas.getContext('2d');
  drawBrandHeader(dCtx);

  dCtx.fillStyle = '#111827';
  dCtx.font = '700 62px "Poppins"';
  dCtx.textBaseline = 'top';
  dCtx.fillText('Practical Guides on AWS,', 75, 275);
  dCtx.fillText('Kubernetes, Observability & SRE', 75, 360);

  dCtx.fillStyle = '#6b7280';
  dCtx.font = '700 28px "Poppins"';
  dCtx.fillText('blog.mahinraza.online', 75, 595);

  const publicDir = path.join(ROOT_DIR, 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  const defaultOgPath = path.join(publicDir, 'og-default.png');
  fs.writeFileSync(defaultOgPath, defaultCanvas.toBuffer('image/png'));
  console.log(`Generated default OG image: ${defaultOgPath}`);
}

generateTemplates();
