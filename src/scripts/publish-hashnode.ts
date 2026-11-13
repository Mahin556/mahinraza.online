#!/usr/bin/env npx tsx

/**
 * Hashnode Cross-Posting Script (GraphQL API: https://gql.hashnode.com)
 *
 * Publishes or updates ONLY blog posts that explicitly opt in via `hashnode: true`
 * (or `hashnode: draft` to save as an unpublished draft on Hashnode).
 *
 * Usage:
 *   npm run publish:hashnode                                    # Sync all posts with hashnode: true
 *   npm run publish:hashnode -- --dry-run                       # Preview opted-in posts without API calls
 *   npm run publish:hashnode -- posts/2026-11-13-my-post.md     # Sync a specific opted-in post
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadAllPosts, slugifyTerm, type BlogPost } from '../lib/posts';
import { SITE_CONFIG } from '../lib/site';
import { prepareSyndicatedMarkdown } from '../lib/syndication';

const HASHNODE_GQL_ENDPOINT = 'https://gql.hashnode.com';

interface GraphQLErrorItem {
  message: string;
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorItem[];
}

interface HashnodePostNode {
  id: string;
  title: string;
  slug: string;
  url: string;
  canonicalUrl?: string | null;
  content?: {
    markdown?: string | null;
  } | null;
}

interface HashnodeDraftNode {
  id: string;
  title: string;
  canonicalUrl?: string | null;
  content?: {
    markdown?: string | null;
  } | null;
}

interface HashnodeTagInput {
  name: string;
  slug: string;
}

function loadDotEnvIfNeeded(): void {
  if (process.env.HASHNODE_TOKEN && process.env.HASHNODE_PUBLICATION_ID) return;
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

function normalizeNewlines(s: string | null | undefined): string {
  return (s || '').replace(/\r\n/g, '\n').trim();
}

export function sanitizeHashnodeTags(rawTags: string[]): HashnodeTagInput[] {
  const result: HashnodeTagInput[] = [];
  const seen = new Set<string>();

  for (const raw of rawTags) {
    const name = raw.trim();
    if (!name) continue;
    const slug = slugifyTerm(name).slice(0, 35);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    result.push({ name: name.slice(0, 35), slug });
    if (result.length === 5) break;
  }

  return result.length > 0 ? result : [{ name: 'DevOps', slug: 'devops' }];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hashnodeGraphQL<T>(
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
  attempt = 1
): Promise<T> {
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

  const res = await fetch(HASHNODE_GQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: cleanToken,
      'Content-Type': 'application/json',
      'x-hashnode-client': 'mahin-raza-blog-publisher/1.0',
      'User-Agent': 'mahin-raza-blog-publisher/1.0',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (res.status === 429 && attempt <= 3) {
    const retryAfterSec = Number(res.headers.get('retry-after')) || 30;
    console.warn(`Rate-limited by Hashnode (429). Retrying in ${retryAfterSec}s...`);
    await sleep(retryAfterSec * 1000);
    return hashnodeGraphQL<T>(token, query, variables, attempt + 1);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Hashnode HTTP ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors && json.errors.length > 0) {
    const hasForbidden = json.errors.some(
      (e) =>
        e.extensions?.code === 'FORBIDDEN' ||
        /forbidden|pro plan/i.test(e.message)
    );
    const combined = json.errors.map((e) => e.message).join('; ');
    if (hasForbidden) {
      throw new Error(
        `Hashnode returned FORBIDDEN (${combined}). Note: Hashnode requires an active Hashnode Pro plan for GraphQL API access, or verify HASHNODE_TOKEN & HASHNODE_PUBLICATION_ID permissions. Your opted-in Hashnode posts are also available via ${SITE_CONFIG.siteUrl}/rss-hashnode.xml.`
      );
    }
    throw new Error(`Hashnode GraphQL error: ${combined}`);
  }

  if (!json.data) {
    throw new Error('Hashnode GraphQL response returned no data.');
  }

  return json.data;
}

async function resolvePublicationId(token: string): Promise<{
  id: string;
  title?: string;
  url?: string;
}> {
  const explicitId = process.env.HASHNODE_PUBLICATION_ID?.trim();
  if (explicitId) {
    return { id: explicitId };
  }

  const explicitHost = process.env.HASHNODE_HOST?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (explicitHost) {
    const data = await hashnodeGraphQL<{
      publication: { id: string; title: string; url: string } | null;
    }>(
      token,
      `query GetPubByHost($host: String!) {
        publication(host: $host) {
          id
          title
          url
        }
      }`,
      { host: explicitHost }
    );
    if (data.publication?.id) {
      return data.publication;
    }
  }

  const meData = await hashnodeGraphQL<{
    me: {
      publications: {
        edges: Array<{
          node: { id: string; title: string; url: string };
        }>;
      };
    };
  }>(
    token,
    `query GetMyPublications {
      me {
        publications(first: 10) {
          edges {
            node {
              id
              title
              url
            }
          }
        }
      }
    }`
  );

  const firstPub = meData.me?.publications?.edges?.[0]?.node;
  if (!firstPub?.id) {
    throw new Error(
      'Could not auto-discover a Hashnode publication for this account. Create a blog on Hashnode first or set HASHNODE_PUBLICATION_ID explicitly.'
    );
  }

  return firstPub;
}

async function fetchExistingHashnodeContent(
  token: string,
  publicationId: string
): Promise<{
  posts: HashnodePostNode[];
  drafts: HashnodeDraftNode[];
}> {
  const posts: HashnodePostNode[] = [];
  let after: string | null = null;

  for (let page = 0; page < 10; page++) {
    const data: {
      publication: {
        posts: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          edges: Array<{ node: HashnodePostNode }>;
        };
      } | null;
    } = await hashnodeGraphQL(
      token,
      `query GetPublicationPosts($id: ObjectId!, $after: String) {
        publication(id: $id) {
          posts(first: 50, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                title
                slug
                url
                canonicalUrl
                content {
                  markdown
                }
              }
            }
          }
        }
      }`,
      { id: publicationId, after }
    );

    const conn = data.publication?.posts;
    if (!conn) break;
    for (const edge of conn.edges) {
      posts.push(edge.node);
    }
    if (!conn.pageInfo.hasNextPage || !conn.pageInfo.endCursor) break;
    after = conn.pageInfo.endCursor;
  }

  let drafts: HashnodeDraftNode[] = [];
  try {
    const draftData = await hashnodeGraphQL<{
      publication: {
        drafts: {
          edges: Array<{ node: HashnodeDraftNode }>;
        };
      } | null;
    }>(
      token,
      `query GetPublicationDrafts($id: ObjectId!) {
        publication(id: $id) {
          drafts(first: 50) {
            edges {
              node {
                id
                title
                canonicalUrl
                content {
                  markdown
                }
              }
            }
          }
        }
      }`,
      { id: publicationId }
    );
    drafts = (draftData.publication?.drafts?.edges || []).map((e) => e.node);
  } catch {
    // Draft query is non-fatal if restricted
    drafts = [];
  }

  return { posts, drafts };
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

    candidatePosts = matched.filter((p) => p.hashnode || force);
    if (candidatePosts.length === 0) {
      console.log(
        `Skipped "${matched[0].title}" because \`hashnode: true\` is not set in its frontmatter (pass --force to override).`
      );
      return;
    }
  } else {
    candidatePosts = allPosts.filter((p) => p.hashnode);
  }

  const skippedCount = allPosts.length - candidatePosts.length;
  console.log(
    `Hashnode sync — Opted-in (hashnode: true): ${candidatePosts.length} | Skipped (hashnode: false): ${skippedCount}`
  );

  if (candidatePosts.length === 0) {
    console.log(
      'Nothing to publish to Hashnode. Add `hashnode: true` to a post frontmatter (or `Hashnode: true` inline) to cross-post it.'
    );
    return;
  }

  const siteBase = SITE_CONFIG.siteUrl.replace(/\/+$/, '');
  const orderedPosts = [...candidatePosts].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  if (dryRun) {
    console.log('\n[DRY RUN] Would sync the following posts to Hashnode:\n');
    for (const post of orderedPosts) {
      const canonicalUrl = `${siteBase}/posts/${post.slug}/`;
      const coverImageURL = post.ogImage.startsWith('http')
        ? post.ogImage
        : `${siteBase}${post.ogImage}`;
      const tags = sanitizeHashnodeTags(post.tags);
      console.log(`  • ${post.title}`);
      console.log(`    Slug:          ${post.slug}`);
      console.log(`    Status:        ${post.hashnodeDraft ? 'DRAFT' : 'PUBLISHED (LIVE)'}`);
      console.log(`    Tags:          ${tags.map((t) => t.slug).join(', ')}`);
      console.log(`    Canonical URL: ${canonicalUrl}`);
      console.log(`    Cover Image:   ${coverImageURL}\n`);
    }
    return;
  }

  const token = process.env.HASHNODE_TOKEN?.trim();
  if (!token) {
    console.error(
      'ERROR: HASHNODE_TOKEN environment variable is not set.\n' +
        'Generate a Personal Access Token at https://hashnode.com/settings/developer and set HASHNODE_TOKEN in .env or GitHub Actions Secrets.'
    );
    process.exit(1);
  }

  const pub = await resolvePublicationId(token);
  console.log(
    `Target Hashnode Publication: ${pub.title ? `${pub.title} (${pub.url || pub.id})` : pub.id}`
  );

  const { posts: existingPosts, drafts: existingDrafts } =
    await fetchExistingHashnodeContent(token, pub.id);

  const postByCanonical = new Map<string, HashnodePostNode>();
  const postBySlug = new Map<string, HashnodePostNode>();
  const postByTitle = new Map<string, HashnodePostNode>();

  for (const p of existingPosts) {
    const normCan = normalizeUrlForCompare(p.canonicalUrl);
    if (normCan) postByCanonical.set(normCan, p);
    if (p.slug) postBySlug.set(p.slug.toLowerCase(), p);
    postByTitle.set(p.title.trim().toLowerCase(), p);
  }

  const draftByCanonical = new Map<string, HashnodeDraftNode>();
  const draftByTitle = new Map<string, HashnodeDraftNode>();
  for (const d of existingDrafts) {
    const normCan = normalizeUrlForCompare(d.canonicalUrl);
    if (normCan) draftByCanonical.set(normCan, d);
    draftByTitle.set(d.title.trim().toLowerCase(), d);
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let didWrite = false;

  for (const post of orderedPosts) {
    const canonicalUrl = `${siteBase}/posts/${post.slug}/`;
    const coverImageURL = post.ogImage.startsWith('http')
      ? post.ogImage
      : `${siteBase}${post.ogImage}`;
    const tags = sanitizeHashnodeTags(post.tags);
    const contentMarkdown = prepareSyndicatedMarkdown(post, canonicalUrl);
    const cleanSlug = post.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '') || post.slug;

    if (post.hashnodeDraft) {
      const matchedDraft =
        draftByCanonical.get(normalizeUrlForCompare(canonicalUrl)) ||
        draftByTitle.get(post.title.trim().toLowerCase());

      if (
        matchedDraft &&
        !force &&
        matchedDraft.title.trim() === post.title.trim() &&
        matchedDraft.content?.markdown &&
        normalizeNewlines(matchedDraft.content.markdown) ===
          normalizeNewlines(contentMarkdown)
      ) {
        console.log(`  [=] Draft unchanged on Hashnode: "${post.title}"`);
        unchanged++;
        continue;
      }

      if (didWrite) await sleep(2000);

      if (matchedDraft) {
        await hashnodeGraphQL(
          token,
          `mutation UpdateDraft($input: UpdateDraftInput!) {
            updateDraft(input: $input) {
              draft {
                id
                title
              }
            }
          }`,
          {
            input: {
              id: matchedDraft.id,
              title: post.title,
              contentMarkdown,
              tags,
              originalArticleURL: canonicalUrl,
              coverImageOptions: { coverImageURL },
            },
          }
        );
        console.log(`  [~] Updated draft on Hashnode: "${post.title}"`);
        updated++;
        didWrite = true;
      } else {
        await hashnodeGraphQL(
          token,
          `mutation CreateDraft($input: CreateDraftInput!) {
            createDraft(input: $input) {
              draft {
                id
                title
              }
            }
          }`,
          {
            input: {
              publicationId: pub.id,
              title: post.title,
              contentMarkdown,
              tags,
              originalArticleURL: canonicalUrl,
              coverImageOptions: { coverImageURL },
            },
          }
        );
        console.log(`  [+] Created draft on Hashnode: "${post.title}"`);
        created++;
        didWrite = true;
      }
      continue;
    }

    // Live publish / update path
    const matchedPost =
      postByCanonical.get(normalizeUrlForCompare(canonicalUrl)) ||
      postBySlug.get(cleanSlug.toLowerCase()) ||
      postByTitle.get(post.title.trim().toLowerCase());

    if (
      matchedPost &&
      !force &&
      matchedPost.title.trim() === post.title.trim() &&
      matchedPost.content?.markdown &&
      normalizeNewlines(matchedPost.content.markdown) ===
        normalizeNewlines(contentMarkdown)
    ) {
      console.log(
        `  [=] Unchanged on Hashnode: "${post.title}" (${matchedPost.url})`
      );
      unchanged++;
      continue;
    }

    if (didWrite) await sleep(2000);

    if (matchedPost) {
      const res = await hashnodeGraphQL<{
        updatePost: { post: { id: string; url: string } };
      }>(
        token,
        `mutation UpdatePost($input: UpdatePostInput!) {
          updatePost(input: $input) {
            post {
              id
              url
            }
          }
        }`,
        {
          input: {
            id: matchedPost.id,
            title: post.title,
            contentMarkdown,
            tags,
            originalArticleURL: canonicalUrl,
            coverImageOptions: { coverImageURL },
          },
        }
      );
      console.log(
        `  [~] Updated on Hashnode: "${post.title}" -> ${res.updatePost.post.url}`
      );
      updated++;
      didWrite = true;
    } else {
      const res = await hashnodeGraphQL<{
        publishPost: { post: { id: string; url: string } };
      }>(
        token,
        `mutation PublishPost($input: PublishPostInput!) {
          publishPost(input: $input) {
            post {
              id
              url
            }
          }
        }`,
        {
          input: {
            publicationId: pub.id,
            title: post.title,
            slug: cleanSlug,
            contentMarkdown,
            tags,
            originalArticleURL: canonicalUrl,
            coverImageOptions: { coverImageURL },
            metaTags: {
              title: post.title,
              description: post.description.slice(0, 155),
              image: coverImageURL,
            },
          },
        }
      );
      console.log(
        `  [+] Published to Hashnode: "${post.title}" -> ${res.publishPost.post.url}`
      );
      created++;
      didWrite = true;
    }
  }

  console.log(
    `\nHashnode sync complete — Created: ${created}, Updated: ${updated}, Unchanged: ${unchanged}`
  );
}

main().catch((err) => {
  console.error('Error syncing posts to Hashnode:', err);
  process.exit(1);
});
