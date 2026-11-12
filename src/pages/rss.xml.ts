import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { loadAllPosts } from '../lib/posts';
import { SITE_CONFIG } from '../lib/site';

export async function GET(context: APIContext) {
  const posts = loadAllPosts();

  return rss({
    title: `${SITE_CONFIG.brandName} — ${SITE_CONFIG.shortRole} Blog`,
    description: SITE_CONFIG.description,
    site: context.site ?? SITE_CONFIG.siteUrl,
    items: posts.map((post) => ({
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
