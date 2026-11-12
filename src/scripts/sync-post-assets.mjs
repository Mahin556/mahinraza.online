import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const POSTS_DIR = path.join(ROOT_DIR, 'posts');
const OUT_DIR = path.join(ROOT_DIR, 'public', 'post-assets');

const ASSET_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.avif',
]);

function syncAssets() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No posts/ directory found; skipping asset sync.');
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
  let copiedCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const postDir = path.join(POSTS_DIR, entry.name);
    const files = fs.readdirSync(postDir, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile()) continue;
      const ext = path.extname(file.name).toLowerCase();
      if (!ASSET_EXTENSIONS.has(ext)) continue;

      const srcFile = path.join(postDir, file.name);
      const destFolder = path.join(OUT_DIR, entry.name);
      const destFile = path.join(destFolder, file.name);

      fs.mkdirSync(destFolder, { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      copiedCount++;
    }
  }

  console.log(`Synced ${copiedCount} post asset(s) to public/post-assets/.`);
}

syncAssets();
