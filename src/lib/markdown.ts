import { Marked } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
}

const LANG_DISPLAY_NAMES: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  ruby: 'Ruby',
  go: 'Go',
  java: 'Java',
  css: 'CSS',
  html: 'HTML',
  xml: 'XML',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  sql: 'SQL',
  bash: 'Bash',
  shell: 'Shell',
  sh: 'Shell',
  zsh: 'Shell',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile',
  rust: 'Rust',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  php: 'PHP',
  graphql: 'GraphQL',
  http: 'HTTP',
  markdown: 'Markdown',
  md: 'Markdown',
  toml: 'TOML',
  ini: 'INI',
  hcl: 'HCL',
  terraform: 'Terraform',
  promql: 'PromQL',
  nginx: 'NGINX',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  diff: 'Diff',
  text: 'Text',
  plaintext: 'Text',
};

const SHIKI_SUPPORTED_LANGS = [
  'bash',
  'shellscript',
  'yaml',
  'json',
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'dockerfile',
  'sql',
  'html',
  'css',
  'xml',
  'toml',
  'ini',
  'hcl',
  'nginx',
  'powershell',
  'diff',
  'markdown',
  'c',
  'cpp',
  'java',
  'ruby',
  'php',
  'graphql',
] as const;

const SHIKI_LANG_MAP: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  rb: 'ruby',
  docker: 'dockerfile',
  ps: 'powershell',
  ps1: 'powershell',
  terraform: 'hcl',
  tf: 'hcl',
  conf: 'ini',
  promql: 'yaml',
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighterInstance(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [...SHIKI_SUPPORTED_LANGS],
    });
  }
  return highlighterPromise;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function slugifyHeading(text: string, usedIds: Map<string, number>): string {
  const base =
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section';

  const count = usedIds.get(base) ?? 0;
  usedIds.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

export async function renderPostMarkdown(
  markdown: string,
  postSlug: string,
  isDirectoryPost: boolean
): Promise<RenderedMarkdown> {
  const highlighter = await getHighlighterInstance();
  const toc: TocItem[] = [];
  const usedHeadingIds = new Map<string, number>();

  const instance = new Marked({
    gfm: true,
    breaks: false,
  });

  instance.use({
    renderer: {
      heading({ tokens, depth }) {
        const innerHtml = this.parser.parseInline(tokens);
        const plainText = stripHtmlTags(innerHtml);
        const id = slugifyHeading(plainText, usedIdsFrom(usedHeadingIds));

        if (depth === 2 || depth === 3) {
          toc.push({
            id,
            text: plainText,
            level: depth,
          });
        }

        const sizeClasses =
          depth === 1
            ? 'my-6 mt-10 text-3xl font-bold tracking-tight text-gray-900'
            : depth === 2
              ? 'my-5 mt-10 text-2xl sm:text-3xl font-bold tracking-tight text-gray-800'
              : depth === 3
                ? 'my-4 mt-8 text-xl sm:text-2xl font-semibold tracking-tight text-gray-800'
                : 'my-3 mt-6 text-lg font-semibold text-gray-800';

        const anchorSvg = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>`;

        return `<h${depth} id="${id}" class="${sizeClasses}">${innerHtml}<a href="#${id}" class="heading-anchor no-underline" aria-label="Link to ${escapeHtml(plainText)}">${anchorSvg}</a></h${depth}>\n`;
      },

      paragraph({ tokens }) {
        const innerHtml = this.parser.parseInline(tokens);
        return `<p class="mt-5 mb-2 leading-8 text-slate-700 text-[17px]">${innerHtml}</p>\n`;
      },

      link({ href, title, tokens }) {
        const innerHtml = this.parser.parseInline(tokens);
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        const targetAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(href)}"${titleAttr}${targetAttrs} class="font-semibold text-teal-700 underline underline-offset-4 decoration-teal-300 hover:decoration-teal-600 hover:text-teal-800 transition-colors">${innerHtml}</a>`;
      },

      image({ href, title, text }) {
        let resolvedSrc = href || '';
        if (
          isDirectoryPost &&
          resolvedSrc &&
          !resolvedSrc.startsWith('http://') &&
          !resolvedSrc.startsWith('https://') &&
          !resolvedSrc.startsWith('/') &&
          !resolvedSrc.startsWith('data:')
        ) {
          resolvedSrc = `/post-assets/${postSlug}/${resolvedSrc.replace(/^\.\//, '')}`;
        }
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img src="${escapeHtml(resolvedSrc)}" alt="${escapeHtml(text || '')}"${titleAttr} loading="lazy" decoding="async" class="my-8 rounded-xl border border-slate-200 max-w-full h-auto block bg-white" />`;
      },

      codespan({ text }) {
        return `<code class="inline-code">${escapeHtml(text)}</code>`;
      },

      code({ text, lang }) {
        const rawLang = (lang || '').trim().split(/\s+/)[0].toLowerCase();
        const displayLang =
          LANG_DISPLAY_NAMES[rawLang] ||
          (rawLang ? rawLang.charAt(0).toUpperCase() + rawLang.slice(1) : 'Code');

        const mappedLang = SHIKI_LANG_MAP[rawLang] || rawLang;
        const loadedLangs = highlighter.getLoadedLanguages();
        const effectiveLang = loadedLangs.includes(mappedLang) ? mappedLang : 'text';

        let highlightedPre: string;
        if (effectiveLang === 'text') {
          highlightedPre = `<pre class="shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code>${escapeHtml(text)}</code></pre>`;
        } else {
          highlightedPre = highlighter.codeToHtml(text, {
            lang: effectiveLang,
            theme: 'github-dark',
          });
        }

        const copyBtnHtml = `<div class="code-block-header"><span class="code-lang-label">${escapeHtml(displayLang)}</span><button type="button" class="code-copy-btn" aria-label="Copy code" aria-live="polite"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><span>Copy</span></button></div>`;

        return highlightedPre.replace(
          /^<pre([^>]*)>/,
          `<pre$1>${copyBtnHtml}`
        );
      },

      table(token) {
        let headerCells = '';
        for (const cell of token.header) {
          const align = cell.align ? ` style="text-align:${cell.align}"` : '';
          headerCells += `<th${align} class="px-4 py-2.5 border-r last:border-r-0 border-gray-200 font-semibold text-gray-900 bg-gray-50">${this.parser.parseInline(cell.tokens)}</th>`;
        }

        let bodyRows = '';
        for (const row of token.rows) {
          let rowCells = '';
          for (const cell of row) {
            const align = cell.align ? ` style="text-align:${cell.align}"` : '';
            rowCells += `<td${align} class="px-4 py-2.5 border-r last:border-r-0 border-gray-200 text-gray-600">${this.parser.parseInline(cell.tokens)}</td>`;
          }
          bodyRows += `<tr class="border-b border-gray-200 last:border-b-0">${rowCells}</tr>`;
        }

        return `<div class="overflow-x-auto my-8 rounded-xl border border-gray-200"><table class="min-w-full text-sm text-left"><thead class="border-b border-gray-200"><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>\n`;
      },
    },
  });

  const html = await instance.parse(markdown);
  return { html, toc };
}

function usedIdsFrom(map: Map<string, number>): Map<string, number> {
  return map;
}
