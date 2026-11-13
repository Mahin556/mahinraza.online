import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const FONTS_DIR = path.join(ROOT_DIR, 'src', 'fonts');

GlobalFonts.loadFontsFromDir(FONTS_DIR);

function drawRoundedRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBrandFrame(ctx: SKRSContext2D) {
  // Outer slate backdrop
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 1280, 720);

  // Subtle dot-grid texture
  ctx.fillStyle = '#cbd5e1';
  for (let gx = 24; gx < 1280; gx += 28) {
    for (let gy = 24; gy < 720; gy += 28) {
      ctx.fillRect(gx, gy, 2, 2);
    }
  }

  // Main elevated white card
  drawRoundedRect(ctx, 44, 44, 1192, 632, 24);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  // Top teal accent strip clipped to card top
  ctx.save();
  drawRoundedRect(ctx, 44, 44, 1192, 632, 24);
  ctx.clip();
  const grad = ctx.createLinearGradient(44, 44, 1236, 44);
  grad.addColorStop(0, '#0f766e');
  grad.addColorStop(0.6, '#0d9488');
  grad.addColorStop(1, '#0891b2');
  ctx.fillStyle = grad;
  ctx.fillRect(44, 44, 1192, 10);
  ctx.restore();

  // Terminal prompt icon badge (>_ matching favicon.svg)
  drawRoundedRect(ctx, 96, 96, 68, 68, 16);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  ctx.strokeStyle = '#14b8a6';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(114, 118);
  ctx.lineTo(128, 130);
  ctx.lineTo(114, 142);
  ctx.stroke();

  ctx.strokeStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(134, 142);
  ctx.lineTo(147, 142);
  ctx.stroke();

  // Author & blog identity
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 30px "Poppins"';
  ctx.textBaseline = 'top';
  ctx.fillText('Mahin Raza', 184, 98);

  ctx.fillStyle = '#0f766e';
  ctx.font = '700 20px "Poppins"';
  ctx.fillText('DEVOPS & CLOUD ENGINEERING', 184, 136);

  // Bottom divider inside card
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(96, 578);
  ctx.lineTo(1184, 578);
  ctx.stroke();

  // Footer metadata
  ctx.fillStyle = '#475569';
  ctx.font = '700 22px "Poppins"';
  ctx.fillText('blog.mahinraza.online', 96, 604);

  ctx.fillStyle = '#0f766e';
  ctx.font = '700 22px "Poppins"';
  const handle = '@Mahin556';
  const handleWidth = ctx.measureText(handle).width;
  ctx.fillText(handle, 1184 - handleWidth, 604);
}

function generateTemplates() {
  // 1. Base template for per-post social-media.png generation
  const templateCanvas = createCanvas(1280, 720);
  const tCtx = templateCanvas.getContext('2d');
  drawBrandFrame(tCtx);

  const templatePath = path.join(ROOT_DIR, 'social-media-image-template.png');
  fs.writeFileSync(templatePath, templateCanvas.toBuffer('image/png'));
  console.log(`Generated template: ${templatePath}`);

  // 2. Default site-wide OG image (public/og-default.png)
  const defaultCanvas = createCanvas(1280, 720);
  const dCtx = defaultCanvas.getContext('2d');
  drawBrandFrame(dCtx);

  dCtx.fillStyle = '#0f172a';
  dCtx.font = '700 56px "Poppins"';
  dCtx.textBaseline = 'top';
  dCtx.fillText('Practical Engineering Blogs on', 96, 245);
  dCtx.fillText('AWS, Kubernetes, Observability', 96, 322);
  dCtx.fillStyle = '#0f766e';
  dCtx.fillText('& Site Reliability Engineering', 96, 399);

  const publicDir = path.join(ROOT_DIR, 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  const defaultOgPath = path.join(publicDir, 'og-default.png');
  fs.writeFileSync(defaultOgPath, defaultCanvas.toBuffer('image/png'));
  console.log(`Generated default OG image: ${defaultOgPath}`);
}

generateTemplates();
