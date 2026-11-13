import type { BlogPost } from './posts';
import { SITE_CONFIG } from './site';

/**
 * Rewrites relative image/link URLs outside code blocks to absolute blog.mahinraza.online URLs
 * and appends a canonical origin note for syndicated platforms (DEV, Hashnode, etc.).
 */
export function prepareSyndicatedMarkdown(
  post: BlogPost,
  canonicalUrl: string
): string {
  const siteBase = SITE_CONFIG.siteUrl.replace(/\/+$/, '');
  const lines = post.body.split(/\r?\n/);
  let inFence = false;

  const rewrittenLines = lines.map((line) => {
    const trimmed = line.trim();
    if (/^(`{3,}|~{3,})/.test(trimmed)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;

    // 1. Rewrite Markdown images: ![alt](target)
    let updated = line.replace(
      /!\[([^\]]*)\]\(([^)\s]+)([^)]*)\)/g,
      (full, alt: string, target: string, rest: string) => {
        if (
          target.startsWith('http://') ||
          target.startsWith('https://') ||
          target.startsWith('data:')
        ) {
          return full;
        }
        if (target.startsWith('/')) {
          return `![${alt}](${siteBase}${target}${rest})`;
        }
        if (post.isDirectoryPost) {
          const cleanRel = target.replace(/^\.\//, '');
          return `![${alt}](${siteBase}/post-assets/${post.slug}/${cleanRel}${rest})`;
        }
        return full;
      }
    );

    // 2. Rewrite root-relative Markdown links: [label](/path)
    updated = updated.replace(
      /(?<!!)\[([^\]]+)\]\((\/[^)\s]+)([^)]*)\)/g,
      (_full, label: string, target: string, rest: string) => {
        return `[${label}](${siteBase}${target}${rest})`;
      }
    );

    return updated;
  });

  const body = rewrittenLines.join('\n').trim();
  if (body.includes(SITE_CONFIG.siteUrl)) {
    return body;
  }

  return `${body}\n\n---\n\n*Originally published at [blog.mahinraza.online](${canonicalUrl}).*`;
}
