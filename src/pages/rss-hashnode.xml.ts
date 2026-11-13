import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { loadAllPosts } from '../lib/posts';
import { SITE_CONFIG } from '../lib/site';

/**
 * Dedicated RSS feed containing ONLY articles opted in with `hashnode: true` (and not `draft`).
 */
export async function GET(context: APIContext) {
  const optedInPosts = loadAllPosts().filter((p) => p.hashnode && !p.hashnodeDraft);

  return rss({
    title: `${SITE_CONFIG.brandName} — Hashnode Syndication Feed`,
    description: SITE_CONFIG.description,
    site: context.site ?? SITE_CONFIG.siteUrl,
    items: optedInPosts.map((post) => ({
      title: post.title,
      pubDate: post.date,
      description: post.description,
      link: `/posts/${post.slug}/`,
      categories: [post.category, ...post.tags],
      author: post.author.name,
    })),
    customData: `<language>en-us</language>`,
  });
}
