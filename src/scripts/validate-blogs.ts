#!/usr/bin/env npx tsx

/**
 * Lightweight Blog Post Validator
 *
 * Validates Markdown posts in `posts/` without requiring any central JSON registry.
 * Supports both:
 *  - `posts/YYYY-MM-DD-slug/README.md` (legacy header or YAML frontmatter)
 *  - `posts/YYYY-MM-DD-slug.md` or `posts/slug.md` (YAML frontmatter or `# Title` header)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllPosts } from '../lib/posts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

function validate() {
  const posts = loadAllPosts();
  if (posts.length === 0) {
    console.error('ERROR: No blog posts found in posts/ directory.');
    process.exit(1);
  }

  const errors: string[] = [];
  const slugs = new Set<string>();

  for (const post of posts) {
    if (slugs.has(post.slug)) {
      errors.push(`[${post.sourcePath}] Duplicate post slug: "${post.slug}"`);
    }
    slugs.add(post.slug);

    if (!post.title || post.title.length < 3) {
      errors.push(`[${post.sourcePath}] Missing or empty post title.`);
    }

    if (!post.description || post.description.length < 10) {
      errors.push(`[${post.sourcePath}] Missing or too-short description (min 10 chars).`);
    }

    if (Number.isNaN(post.date.getTime())) {
      errors.push(`[${post.sourcePath}] Invalid publication date.`);
    }

    if (post.tags.length === 0) {
      errors.push(`[${post.sourcePath}] Post should have at least one tag.`);
    }

    // Check balanced code fences
    const fenceMatches = post.body.match(/^[ \t]*(`{3,}|~{3,})/gm) || [];
    if (fenceMatches.length % 2 !== 0) {
      errors.push(`[${post.sourcePath}] Unclosed fenced code block detected.`);
    }

    // Check relative image paths when post lives in a directory
    if (post.isDirectoryPost) {
      const postDir = path.dirname(path.join(ROOT_DIR, post.sourcePath));
      const imgRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
      let match: RegExpExecArray | null;
      while ((match = imgRegex.exec(post.body)) !== null) {
        const rawTarget = match[1].trim().split(/\s+/)[0];
        if (
          rawTarget &&
          !rawTarget.startsWith('http://') &&
          !rawTarget.startsWith('https://') &&
          !rawTarget.startsWith('/') &&
          !rawTarget.startsWith('data:')
        ) {
          const resolvedImg = path.resolve(postDir, rawTarget);
          if (!fs.existsSync(resolvedImg)) {
            errors.push(`[${post.sourcePath}] Missing referenced image: ${rawTarget}`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\nValidation failed with ${errors.length} error(s):\n`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`Validated ${posts.length} blog posts successfully. Ready to publish!`);
}

validate();
