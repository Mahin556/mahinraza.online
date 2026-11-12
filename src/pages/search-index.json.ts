import type { APIRoute } from 'astro';
import { loadAllPosts } from '../lib/posts';

export const GET: APIRoute = () => {
  const posts = loadAllPosts();

  const payload = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    categorySlug: post.categorySlug,
    tags: post.tags,
    formattedDate: post.formattedDate,
    readingTimeText: post.readingTimeText,
  }));

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
