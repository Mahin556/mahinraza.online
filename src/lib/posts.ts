import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import { SITE_CONFIG } from './site';

export interface PostAuthor {
  username: string;
  name: string;
  bio: string;
  githubUrl: string;
  avatarUrl: string;
}

export interface BlogPost {
  /** URL slug, e.g. "2026-09-29-customer-outage-report-to-sli-alert" */
  slug: string;
  title: string;
  description: string;
  date: Date;
  dateISO: string;
  formattedDate: string;
  tags: string[];
  category: string;
  categorySlug: string;
  author: PostAuthor;
  body: string;
  readingTimeMinutes: number;
  readingTimeText: string;
  ogImage: string;
  sourcePath: string;
  githubEditUrl: string;
  isDirectoryPost: boolean;
  /** Whether this post is opted in for cross-posting to DEV Community (dev.to) */
  devto: boolean;
  /** When true, syncs to DEV Community as an unpublished draft instead of live */
  devtoDraft: boolean;
  /** Optional DEV Community series name */
  devtoSeries?: string;
  /** Whether this post is opted in for cross-posting to Hashnode */
  hashnode: boolean;
  /** When true, syncs to Hashnode as an unpublished draft instead of live */
  hashnodeDraft: boolean;
}

export interface TaxonomyItem {
  name: string;
  slug: string;
  count: number;
  description?: string;
}

interface AuthorsMap {
  [username: string]: {
    authorName: string;
    authorBio: string;
    githubUrl?: string;
  };
}

const ROOT_DIR = process.cwd();
const POSTS_DIR = path.join(ROOT_DIR, 'posts');
const AUTHORS_PATH = path.join(ROOT_DIR, 'Authors.json');

const CATEGORY_DEFINITIONS: Array<{
  name: string;
  description: string;
  keywords: string[];
}> = [
  {
    name: 'Kubernetes & Containers',
    description: 'Cluster operations, EKS, CSI storage drivers, autoscaling, and container workloads.',
    keywords: [
      'kubernetes',
      'eks',
      'k8s',
      'docker',
      'container',
      'csi driver',
      'autoscaling',
      'helm',
      'pod',
      'microk8s',
    ],
  },
  {
    name: 'Cloud & Storage',
    description: 'AWS architecture, Elastic File System (EFS), IAM, cloud networking, storage throughput, and migrations.',
    keywords: [
      'aws',
      'efs',
      'cloud',
      's3',
      'ec2',
      'lambda',
      'iam',
      'nfs',
      'storage',
      'datasync',
      'migration',
      'encryption',
      'fips',
      'cloudwatch',
      'sqs',
      'replication',
      'lifecycle management',
    ],
  },
  {
    name: 'Observability & Tracing',
    description: 'OpenTelemetry, Prometheus, PromQL, distributed tracing, metrics cardinality, and telemetry pipelines.',
    keywords: [
      'opentelemetry',
      'distributed tracing',
      'tracing',
      'prometheus',
      'promql',
      'monitoring',
      'observability',
      'exemplars',
      'cardinality',
      'sampling',
      'red metrics',
      'logging',
      'exporter',
      'remote write',
      'span links',
      'context propagation',
      'instrumentation',
      'dashboard',
      'cost optimization',
      'counter',
      'pushgateway',
      'heartbeat',
    ],
  },
  {
    name: 'SRE & Incident Response',
    description: 'SLIs/SLOs, alerting strategy, on-call readiness, incident command, chaos drills, and reliability engineering.',
    keywords: [
      'incident response',
      'incident management',
      'sre',
      'site reliability engineering',
      'sli',
      'slo',
      'alerting',
      'alertmanager',
      'chaos engineering',
      'on-call',
      'reliability',
      'high availability',
      'disaster recovery',
      'troubleshooting',
      'customer support',
    ],
  },
  {
    name: 'Security & Networking',
    description: 'Authentication, OAuth, zero-trust boundaries, TLS, DNS debugging, and infrastructure security.',
    keywords: [
      'security',
      'oauth',
      'authentication',
      'authorization',
      'pkce',
      'dns',
      'networking',
      'tls',
      'owasp',
    ],
  },
  {
    name: 'Platform & Systems Engineering',
    description: 'Linux internals, performance engineering, queues, async architectures, and backend reliability.',
    keywords: [
      'linux',
      'performance',
      'python',
      'async',
      'api',
      'batch job',
      'queue',
      'message queue',
      'http',
    ],
  },
];

export function slugifyTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';
}

function loadAuthorsMap(): AuthorsMap {
  if (!fs.existsSync(AUTHORS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(AUTHORS_PATH, 'utf-8')) as AuthorsMap;
  } catch {
    return {};
  }
}

function resolveAuthor(rawAuthor: string | undefined, authorsMap: AuthorsMap): PostAuthor {
  if (!rawAuthor || !rawAuthor.trim()) {
    return { ...SITE_CONFIG.author };
  }

  // Match Markdown link format: [username](https://github.com/username)
  const mdMatch = rawAuthor.match(/\[([^\]]+)\]\(([^)]+)\)/);
  const handleOrName = (mdMatch ? mdMatch[1] : rawAuthor).replace(/^@/, '').trim();
  const explicitUrl = mdMatch ? mdMatch[2].trim() : undefined;

  const entry =
    authorsMap[handleOrName] ||
    Object.entries(authorsMap).find(
      ([k, v]) =>
        k.toLowerCase() === handleOrName.toLowerCase() ||
        v.authorName.toLowerCase() === handleOrName.toLowerCase()
    )?.[1];

  if (entry) {
    const username =
      Object.keys(authorsMap).find(
        (k) => k.toLowerCase() === handleOrName.toLowerCase()
      ) || SITE_CONFIG.author.username;
    return {
      username,
      name: entry.authorName,
      bio: entry.authorBio,
      githubUrl: entry.githubUrl || explicitUrl || `https://github.com/${username}`,
      avatarUrl: `https://avatars.githubusercontent.com/${username}?s=160`,
    };
  }

  // If handle matches Mahin Raza / Mahin556 variations, normalize to primary author
  if (
    handleOrName.toLowerCase() === 'mahin556' ||
    handleOrName.toLowerCase() === 'mahin raza'
  ) {
    return { ...SITE_CONFIG.author };
  }

  const isGitHubHandle = /^[a-zA-Z0-9-]+$/.test(handleOrName);
  return {
    username: isGitHubHandle ? handleOrName : SITE_CONFIG.author.username,
    name: handleOrName,
    bio: SITE_CONFIG.author.bio,
    githubUrl:
      explicitUrl ||
      (isGitHubHandle
        ? `https://github.com/${handleOrName}`
        : SITE_CONFIG.author.githubUrl),
    avatarUrl: isGitHubHandle
      ? `https://avatars.githubusercontent.com/${handleOrName}?s=160`
      : SITE_CONFIG.author.avatarUrl,
  };
}

function inferCategory(explicitCategory: string | undefined, tags: string[]): string {
  if (explicitCategory && explicitCategory.trim()) {
    return explicitCategory.trim();
  }

  const lowerTags = tags.map((t) => t.toLowerCase().trim());

  // Score each category by matching tags (earlier tags carry slightly higher weight)
  let bestCategory = 'Platform & Systems Engineering';
  let bestScore = 0;

  for (const def of CATEGORY_DEFINITIONS) {
    let score = 0;
    lowerTags.forEach((tag, idx) => {
      const weight = idx === 0 ? 3 : idx === 1 ? 2 : 1.5;
      if (def.keywords.includes(tag)) {
        score += weight;
      }
    });
    if (score > bestScore) {
      bestScore = score;
      bestCategory = def.name;
    }
  }

  return bestCategory;
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function parseDateFromSlugOrFrontmatter(
  rawDate: unknown,
  slugName: string,
  fallbackFilePath: string
): Date {
  if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
    return rawDate;
  }
  if (typeof rawDate === 'string' && rawDate.trim()) {
    const parsed = new Date(rawDate.trim());
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const dateMatch = slugName.match(/^(\d{4}-\d{2}-\d{2})(?:-|$)/);
  if (dateMatch) {
    const parsed = new Date(`${dateMatch[1]}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const stat = fs.statSync(fallbackFilePath);
  return stat.mtime;
}

function extractFirstParagraph(markdownBody: string): string {
  const lines = markdownBody.split(/\r?\n/);
  let inCodeFence = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence || !trimmed) continue;
    if (
      trimmed.startsWith('#') ||
      trimmed.startsWith('!') ||
      trimmed.startsWith('>') ||
      trimmed.startsWith('|') ||
      trimmed.startsWith('- ') ||
      trimmed.startsWith('* ')
    ) {
      continue;
    }
    const plain = trimmed
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, '')
      .trim();
    if (plain.length >= 20) {
      return plain.length > 180 ? `${plain.slice(0, 177).trimEnd()}...` : plain;
    }
  }

  return SITE_CONFIG.description;
}

function parsePostFile(
  filePath: string,
  slug: string,
  isDirectoryPost: boolean,
  authorsMap: AuthorsMap
): BlogPost | null {
  const rawFile = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(rawFile);
  const fm = parsed.data || {};

  if (fm.draft === true) {
    return null;
  }

  let title = typeof fm.title === 'string' ? fm.title.trim() : '';
  let description = typeof fm.description === 'string' ? fm.description.trim() : '';
  let rawAuthor = typeof fm.author === 'string' ? fm.author.trim() : '';
  let rawCategory = typeof fm.category === 'string' ? fm.category.trim() : '';
  let rawDevto: unknown = fm.devto ?? fm.devio ?? fm.publish_to_devto;
  let rawDevtoDraft: unknown =
    fm.devto_draft ?? (fm.devto_published === false ? true : undefined);
  let devtoSeries =
    typeof fm.devto_series === 'string' && fm.devto_series.trim()
      ? fm.devto_series.trim()
      : typeof fm.series === 'string' && fm.series.trim()
        ? fm.series.trim()
        : undefined;
  let rawHashnode: unknown = fm.hashnode ?? fm.publish_to_hashnode;
  let rawHashnodeDraft: unknown =
    fm.hashnode_draft ?? (fm.hashnode_published === false ? true : undefined);
  let tags: string[] = Array.isArray(fm.tags)
    ? fm.tags.map((t) => String(t).trim()).filter(Boolean)
    : typeof fm.tags === 'string'
      ? fm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  // Parse inline legacy OneUptime metadata lines at top of Markdown content if present
  const lines = parsed.content.split(/\r?\n/);
  const bodyLines: string[] = [];
  let inHeaderZone = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inHeaderZone) {
      if (trimmed === '') {
        continue;
      }
      if (!title && trimmed.startsWith('# ')) {
        title = trimmed.slice(2).trim();
        continue;
      }
      if (/^Author:\s*/i.test(trimmed)) {
        if (!rawAuthor) rawAuthor = trimmed.replace(/^Author:\s*/i, '').trim();
        continue;
      }
      if (/^Tags:\s*/i.test(trimmed)) {
        if (tags.length === 0) {
          tags = trimmed
            .replace(/^Tags:\s*/i, '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        }
        continue;
      }
      if (/^Category:\s*/i.test(trimmed)) {
        if (!rawCategory) rawCategory = trimmed.replace(/^Category:\s*/i, '').trim();
        continue;
      }
      if (/^Description:\s*/i.test(trimmed)) {
        if (!description) {
          description = trimmed.replace(/^Description:\s*/i, '').trim();
        }
        continue;
      }
      if (/^(DevTo|DevIo|PublishToDevTo):\s*/i.test(trimmed)) {
        if (rawDevto === undefined) {
          rawDevto = trimmed.replace(/^(DevTo|DevIo|PublishToDevTo):\s*/i, '').trim();
        }
        continue;
      }
      if (/^(Hashnode|PublishToHashnode):\s*/i.test(trimmed)) {
        if (rawHashnode === undefined) {
          rawHashnode = trimmed.replace(/^(Hashnode|PublishToHashnode):\s*/i, '').trim();
        }
        continue;
      }
      // Reached actual article body
      inHeaderZone = false;
    }

    bodyLines.push(line);
  }

  const body = bodyLines.join('\n').trim();

  if (!title) {
    title = slug
      .replace(/^\d{4}-\d{2}-\d{2}-/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (!description) {
    description = extractFirstParagraph(body);
  }

  if (tags.length === 0) {
    tags = ['DevOps'];
  }

  // Deduplicate tags case-insensitively while preserving display casing
  const seenLower = new Set<string>();
  const uniqueTags: string[] = [];
  for (const t of tags) {
    const lower = t.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      uniqueTags.push(t);
    }
  }

  const category = inferCategory(rawCategory, uniqueTags);
  const categorySlug = slugifyTerm(category);
  const date = parseDateFromSlugOrFrontmatter(fm.date ?? fm.pubDate, slug, filePath);
  const author = resolveAuthor(rawAuthor, authorsMap);

  const wordCount = body
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.round((wordCount || 200) / 200));

  // Determine OG social image
  let ogImage: string = SITE_CONFIG.defaultOgImage;
  if (typeof fm.image === 'string' && fm.image.trim()) {
    const customImg = fm.image.trim();
    ogImage =
      customImg.startsWith('http') || customImg.startsWith('/')
        ? customImg
        : isDirectoryPost
          ? `/post-assets/${slug}/${customImg.replace(/^\.\//, '')}`
          : SITE_CONFIG.defaultOgImage;
  } else if (isDirectoryPost) {
    const socialImgOnDisk = path.join(path.dirname(filePath), 'social-media.png');
    if (fs.existsSync(socialImgOnDisk)) {
      ogImage = `/post-assets/${slug}/social-media.png`;
    }
  }

  const relSourcePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');

  const normalizedDevtoStr =
    typeof rawDevto === 'string' ? rawDevto.trim().toLowerCase() : '';
  const devto =
    rawDevto === true ||
    normalizedDevtoStr === 'true' ||
    normalizedDevtoStr === 'yes' ||
    normalizedDevtoStr === '1' ||
    normalizedDevtoStr === 'draft';
  const devtoDraft =
    rawDevtoDraft === true ||
    (typeof rawDevtoDraft === 'string' &&
      rawDevtoDraft.trim().toLowerCase() === 'true') ||
    normalizedDevtoStr === 'draft';

  const normalizedHashnodeStr =
    typeof rawHashnode === 'string' ? rawHashnode.trim().toLowerCase() : '';
  const hashnode =
    rawHashnode === true ||
    normalizedHashnodeStr === 'true' ||
    normalizedHashnodeStr === 'yes' ||
    normalizedHashnodeStr === '1' ||
    normalizedHashnodeStr === 'draft';
  const hashnodeDraft =
    rawHashnodeDraft === true ||
    (typeof rawHashnodeDraft === 'string' &&
      rawHashnodeDraft.trim().toLowerCase() === 'true') ||
    normalizedHashnodeStr === 'draft';

  return {
    slug,
    title,
    description,
    date,
    dateISO: date.toISOString(),
    formattedDate: formatDateDisplay(date),
    tags: uniqueTags,
    category,
    categorySlug,
    author,
    body,
    readingTimeMinutes,
    readingTimeText: `${readingTimeMinutes} min read`,
    ogImage,
    sourcePath: relSourcePath,
    githubEditUrl: `${SITE_CONFIG.repoUrl}/blob/main/${relSourcePath}`,
    isDirectoryPost,
    devto,
    devtoDraft,
    ...(devtoSeries ? { devtoSeries } : {}),
    hashnode,
    hashnodeDraft,
  };
}

let cachedPosts: BlogPost[] | null = null;

export function loadAllPosts(): BlogPost[] {
  if (cachedPosts) return cachedPosts;
  if (!fs.existsSync(POSTS_DIR)) return [];

  const authorsMap = loadAuthorsMap();
  const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
  const posts: BlogPost[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

    if (entry.isDirectory()) {
      const dirPath = path.join(POSTS_DIR, entry.name);
      const readmePath = path.join(dirPath, 'README.md');
      const indexPath = path.join(dirPath, 'index.md');
      const mdPath = fs.existsSync(readmePath)
        ? readmePath
        : fs.existsSync(indexPath)
          ? indexPath
          : null;

      if (!mdPath) continue;
      const post = parsePostFile(mdPath, entry.name, true, authorsMap);
      if (post) posts.push(post);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      const slug = entry.name.replace(/\.md$/i, '');
      const filePath = path.join(POSTS_DIR, entry.name);
      const post = parsePostFile(filePath, slug, false, authorsMap);
      if (post) posts.push(post);
    }
  }

  // Sort newest first, tie-break alphabetically by slug descending
  posts.sort((a, b) => {
    const diff = b.date.getTime() - a.date.getTime();
    if (diff !== 0) return diff;
    return b.slug.localeCompare(a.slug);
  });

  cachedPosts = posts;
  return posts;
}

export function getAllCategories(): TaxonomyItem[] {
  const posts = loadAllPosts();
  const map = new Map<string, TaxonomyItem>();

  for (const def of CATEGORY_DEFINITIONS) {
    const slug = slugifyTerm(def.name);
    map.set(slug, {
      name: def.name,
      slug,
      count: 0,
      description: def.description,
    });
  }

  for (const post of posts) {
    const existing = map.get(post.categorySlug);
    if (existing) {
      existing.count++;
    } else {
      map.set(post.categorySlug, {
        name: post.category,
        slug: post.categorySlug,
        count: 1,
        description: `Articles and blogs in ${post.category}.`,
      });
    }
  }

  return Array.from(map.values())
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getAllTags(): TaxonomyItem[] {
  const posts = loadAllPosts();
  const map = new Map<string, TaxonomyItem>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = slugifyTerm(tag);
      const existing = map.get(slug);
      if (existing) {
        existing.count++;
      } else {
        map.set(slug, {
          name: tag,
          slug,
          count: 1,
        });
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

export function getRelatedPosts(current: BlogPost, limit = 4): BlogPost[] {
  const all = loadAllPosts();
  const currentTags = new Set(current.tags.map((t) => t.toLowerCase()));

  return all
    .filter((p) => p.slug !== current.slug)
    .map((candidate) => {
      let score = 0;
      for (const t of candidate.tags) {
        if (currentTags.has(t.toLowerCase())) score += 3;
      }
      if (candidate.categorySlug === current.categorySlug) {
        score += 1.5;
      }
      return { candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.candidate.date.getTime() - a.candidate.date.getTime()
    )
    .slice(0, limit)
    .map((item) => item.candidate);
}
