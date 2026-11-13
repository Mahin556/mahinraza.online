#!/usr/bin/env npx tsx

/**
 * DEV Community (dev.to) Cross-Posting Script
 *
 * Publishes or updates ONLY blog posts that explicitly opt in via `devto: true`
 * (or `devto: draft` to save as an unpublished draft on dev.to).
 *
 * Usage:
 *   npm run publish:devto                                    # Sync all posts with devto: true
 *   npm run publish:devto -- --dry-run                       # Preview opted-in posts without API calls
 *   npm run publish:devto -- posts/2026-11-13-my-post.md     # Sync a specific opted-in post
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadAllPosts, type BlogPost } from '../lib/posts';
import { SITE_CONFIG } from '../lib/site';
import { prepareSyndicatedMarkdown } from '../lib/syndication';

interface DevtoExistingArticle {
  id: number;
  title: string;
  url: string;
  canonical_url: string | null;
  published: boolean;
  description: string;
  body_markdown?: string;
  tag_list?: string[];
}

interface DevtoArticlePayload {
  article: {
    title: string;
    description: string;
    body_markdown: string;
    published: boolean;
    tags: string[];
    canonical_url: string;
    main_image?: string;
    series?: string;
  };
}

const DEVTO_API_BASE = 'https://dev.to/api';

const TAG_ALIASES: Record<string, string> = {
  'site reliability engineering': 'sre',
  'incident response': 'sre',
  'incident management': 'devops',
  'distributed tracing': 'opentelemetry',
  'cloud & storage': 'aws',
  'ci/cd': 'cicd',
  'c++': 'cpp',
  'c#': 'csharp',
  '.net': 'dotnet',
  'node.js': 'nodejs',
  'next.js': 'nextjs',
};

function loadDotEnvIfNeeded(): void {
  if (process.env.DEVTO_API_KEY) return;
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

function normalizeUrlForCompare(url: string | null | undefined): string {
  if (!url) return '';
  return url.trim().toLowerCase().replace(/\/+$/, '');
}

/**
 * Forem / dev.to allows at most 4 tags per article, each strictly [a-z0-9] (max 30 chars).
 */
export function sanitizeDevtoTags(rawTags: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawTags) {
    const lower = raw.trim().toLowerCase();
    if (!lower) continue;

    const mapped = TAG_ALIASES[lower] ?? lower;
    const cleaned = mapped.replace(/[^a-z0-9]/g, '').slice(0, 30);
    if (!cleaned || seen.has(cleaned)) continue;

    seen.add(cleaned);
    result.push(cleaned);
    if (result.length === 4) break;
  }

  return result.length > 0 ? result : ['devops'];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function devtoRequest<T>(
  apiKey: string,
  endpoint: string,
  init: RequestInit = {},
  attempt = 1
): Promise<T> {
  const res = await fetch(`${DEVTO_API_BASE}${endpoint}`, {
    ...init,
    headers: {
      'api-key': apiKey,
      Accept: 'application/vnd.forem.api-v1+json',
      'Content-Type': 'application/json',
      'User-Agent': 'mahin-raza-blog-publisher/1.0',
      ...(init.headers || {}),
    },
  });

  if (res.status === 429 && attempt <= 3) {
    const retryAfterSec = Number(res.headers.get('retry-after')) || 32;
    console.warn(`Rate-limited by dev.to (429). Retrying in ${retryAfterSec}s...`);
    await sleep(retryAfterSec * 1000);
    return devtoRequest<T>(apiKey, endpoint, init, attempt + 1);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`dev.to API ${init.method || 'GET'} ${endpoint} failed (${res.status}): ${errText}`);
  }

  return (await res.json()) as T;
}

async function fetchAllMyDevtoArticles(apiKey: string): Promise<DevtoExistingArticle[]> {
  const all: DevtoExistingArticle[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const batch = await devtoRequest<DevtoExistingArticle[]>(
      apiKey,
      `/articles/me/all?per_page=${perPage}&page=${page}`
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }

  return all;
}

function normalizeNewlines(s: string | undefined): string {
  return (s || '').replace(/\r\n/g, '\n').trim();
}

function isUnchanged(
  existing: DevtoExistingArticle,
  payload: DevtoArticlePayload['article']
): boolean {
  if (existing.title.trim() !== payload.title.trim()) return false;
  if (existing.published !== payload.published) return false;
  if ((existing.description || '').trim() !== payload.description.trim()) return false;
  if (
    existing.body_markdown !== undefined &&
    normalizeNewlines(existing.body_markdown) !== normalizeNewlines(payload.body_markdown)
  ) {
    return false;
  }
  if (Array.isArray(existing.tag_list)) {
    const existingTags = existing.tag_list.map((t) => t.toLowerCase()).join(',');
    const nextTags = payload.tags.join(',');
    if (existingTags !== nextTags) return false;
  }
  return existing.body_markdown !== undefined;
}

async function main() {
  loadDotEnvIfNeeded();

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const targetArg = args.find((a) => !a.startsWith('--'));

  const allPosts = loadAllPosts();
  let candidatePosts: BlogPost[];

  if (targetArg) {
    const normTarget = targetArg.replace(/\\/g, '/').replace(/\/+$/, '');
    const matched = allPosts.filter(
      (p) =>
        p.slug === normTarget ||
        p.sourcePath === normTarget ||
        p.sourcePath.startsWith(`${normTarget}/`) ||
        normTarget.endsWith(`/${p.slug}`) ||
        normTarget.endsWith(`/${p.slug}.md`)
    );

    if (matched.length === 0) {
      console.error(`No blog post matched "${targetArg}".`);
      process.exit(1);
    }

    candidatePosts = matched.filter((p) => p.devto || force);
    if (candidatePosts.length === 0) {
      console.log(
        `Skipped "${matched[0].title}" because \`devto: true\` is not set in its frontmatter (pass --force to override).`
      );
      return;
    }
  } else {
    candidatePosts = allPosts.filter((p) => p.devto);
  }

  const skippedCount = allPosts.length - candidatePosts.length;
  console.log(
    `DEV Community sync — Opted-in (devto: true): ${candidatePosts.length} | Skipped (devto: false): ${skippedCount}`
  );

  if (candidatePosts.length === 0) {
    console.log('Nothing to publish to dev.to. Add `devto: true` to a post frontmatter to cross-post it.');
    return;
  }

  const siteBase = SITE_CONFIG.siteUrl.replace(/\/+$/, '');

  // Sort oldest-first when publishing multiple posts so chronological order is preserved
  const orderedPosts = [...candidatePosts].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  if (dryRun) {
    console.log('\n[DRY RUN] Would sync the following posts to dev.to:\n');
    for (const post of orderedPosts) {
      const canonicalUrl = `${siteBase}/posts/${post.slug}/`;
      const mainImage = post.ogImage.startsWith('http')
        ? post.ogImage
        : `${siteBase}${post.ogImage}`;
      const tags = sanitizeDevtoTags(post.tags);
      console.log(`  • ${post.title}`);
      console.log(`    Slug:          ${post.slug}`);
      console.log(`    Status:        ${post.devtoDraft ? 'DRAFT' : 'PUBLISHED (LIVE)'}`);
      console.log(`    Tags:          ${tags.join(', ')}`);
      console.log(`    Canonical URL: ${canonicalUrl}`);
      console.log(`    Cover Image:   ${mainImage}\n`);
    }
    return;
  }

  const apiKey = process.env.DEVTO_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      'ERROR: DEVTO_API_KEY environment variable is not set.\n' +
        'Generate an API key at https://dev.to/settings/extensions and set DEVTO_API_KEY in .env or GitHub Actions Secrets.'
    );
    process.exit(1);
  }

  const existingArticles = await fetchAllMyDevtoArticles(apiKey);
  const byCanonical = new Map<string, DevtoExistingArticle>();
  const byTitle = new Map<string, DevtoExistingArticle>();

  for (const item of existingArticles) {
    const normCan = normalizeUrlForCompare(item.canonical_url);
    if (normCan) byCanonical.set(normCan, item);
    byTitle.set(item.title.trim().toLowerCase(), item);
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let didWrite = false;

  for (const post of orderedPosts) {
    const canonicalUrl = `${siteBase}/posts/${post.slug}/`;
    const mainImage = post.ogImage.startsWith('http')
      ? post.ogImage
      : `${siteBase}${post.ogImage}`;
    const tags = sanitizeDevtoTags(post.tags);
    const bodyMarkdown = prepareSyndicatedMarkdown(post, canonicalUrl);
    const shortDescription =
      post.description.length > 250
        ? `${post.description.slice(0, 247).trimEnd()}...`
        : post.description;

    const payload: DevtoArticlePayload = {
      article: {
        title: post.title,
        description: shortDescription,
        body_markdown: bodyMarkdown,
        published: !post.devtoDraft,
        tags,
        canonical_url: canonicalUrl,
        main_image: mainImage,
        ...(post.devtoSeries ? { series: post.devtoSeries } : {}),
      },
    };

    const existing =
      byCanonical.get(normalizeUrlForCompare(canonicalUrl)) ||
      byTitle.get(post.title.trim().toLowerCase());

    if (existing && !force && isUnchanged(existing, payload.article)) {
      console.log(`  [=] Unchanged on dev.to: "${post.title}" (${existing.url})`);
      unchanged++;
      continue;
    }

    if (didWrite) {
      // Polite pause to stay well within Forem API write rate limits
      await sleep(3500);
    }

    if (existing) {
      const res = await devtoRequest<{ url: string }>(
        apiKey,
        `/articles/${existing.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );
      console.log(
        `  [~] Updated on dev.to (${payload.article.published ? 'live' : 'draft'}): "${post.title}" -> ${res.url}`
      );
      updated++;
      didWrite = true;
    } else {
      const res = await devtoRequest<{ url: string }>(apiKey, '/articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log(
        `  [+] Published to dev.to (${payload.article.published ? 'live' : 'draft'}): "${post.title}" -> ${res.url}`
      );
      created++;
      didWrite = true;
    }
  }

  console.log(
    `\ndev.to sync complete — Created: ${created}, Updated: ${updated}, Unchanged: ${unchanged}`
  );
}

main().catch((err) => {
  console.error('Error syncing posts to dev.to:', err);
  process.exit(1);
});
