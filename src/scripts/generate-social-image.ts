#!/usr/bin/env npx tsx

/**
 * Social Media Image Generator (1280x720)
 *
 * Usage:
 *   npm run generate-social-image                    # Generate all missing
 *   npm run generate-social-image -- --force         # Regenerate all posts
 *   npm run generate-social-image -- posts/2026-09-29-my-post
 */

import { createCanvas, loadImage, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';
import matter from 'gray-matter';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const SCRIPT_DIR_FONTS = path.join(ROOT_DIR, 'src', 'fonts');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'social-media-image-template.png');
const FONT_FAMILY = 'Poppins';

if (fs.existsSync(SCRIPT_DIR_FONTS)) {
  GlobalFonts.loadFontsFromDir(SCRIPT_DIR_FONTS);
}

const TITLE_CONFIG = {
  x: 96,
  y: 232,
  maxWidth: 1088,
  lineHeight: 74,
  fontSize: 54,
  fontFamily: FONT_FAMILY,
  color: '#0f172a',
};

function extractTitle(mdPath: string): string {
  const raw = fs.readFileSync(mdPath, 'utf-8');
  const parsed = matter(raw);
  if (typeof parsed.data?.title === 'string' && parsed.data.title.trim()) {
    return parsed.data.title.trim();
  }
  for (const line of parsed.content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }
  throw new Error(`No title found in ${mdPath}`);
}

function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function generateSocialImage(blogFolderPath: string): Promise<void> {
  const absolutePath = path.isAbsolute(blogFolderPath)
    ? blogFolderPath
    : path.join(ROOT_DIR, blogFolderPath);

  const readmePath = fs.existsSync(path.join(absolutePath, 'README.md'))
    ? path.join(absolutePath, 'README.md')
    : path.join(absolutePath, 'index.md');

  if (!fs.existsSync(readmePath)) {
    throw new Error(`Markdown file not found in ${absolutePath}`);
  }

  const title = extractTitle(readmePath);
  const template = await loadImage(TEMPLATE_PATH);
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(template, 0, 0);
  ctx.font = `700 ${TITLE_CONFIG.fontSize}px "${TITLE_CONFIG.fontFamily}"`;
  ctx.fillStyle = TITLE_CONFIG.color;
  ctx.textBaseline = 'top';

  const lines = wrapText(ctx, title, TITLE_CONFIG.maxWidth).slice(0, 4);
  lines.forEach((line, index) => {
    ctx.fillText(line, TITLE_CONFIG.x, TITLE_CONFIG.y + index * TITLE_CONFIG.lineHeight);
  });

  const outputPath = path.join(absolutePath, 'social-media.png');
  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const folderArg = args.find((a) => !a.startsWith('--'));

  if (folderArg) {
    await generateSocialImage(folderArg);
    console.log(`Generated social image for ${folderArg}`);
    return;
  }

  const postsDir = path.join(ROOT_DIR, 'posts');
  const folders = fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  let generated = 0;
  let skipped = 0;

  for (const folder of folders) {
    const folderPath = path.join(postsDir, folder);
    const outPath = path.join(folderPath, 'social-media.png');
    if (!force && fs.existsSync(outPath)) {
      skipped++;
      continue;
    }
    await generateSocialImage(folderPath);
    generated++;
  }

  console.log(`Social images complete — Generated: ${generated}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error('Error generating social images:', err);
  process.exit(1);
});
