/**
 * Original light-theme accent palettes preserved from the upstream blog design.
 * Strictly light-mode tokens only — no dark-mode classes or variants.
 */

export interface TagAccent {
  pill: string;
  dot: string;
}

export interface CardAccent {
  cardHover: string;
  gradientOverlay: string;
  titleHover: string;
  cta: string;
}

const TAG_ACCENTS: TagAccent[] = [
  {
    pill: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300',
    dot: 'bg-blue-400',
  },
  {
    pill: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300',
    dot: 'bg-purple-400',
  },
  {
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300',
    dot: 'bg-emerald-400',
  },
  {
    pill: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300',
    dot: 'bg-amber-400',
  },
  {
    pill: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300',
    dot: 'bg-sky-400',
  },
  {
    pill: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300',
    dot: 'bg-rose-400',
  },
];

const CARD_ACCENTS: CardAccent[] = [
  {
    cardHover: 'hover:border-blue-200 hover:ring-blue-100',
    gradientOverlay: 'group-hover:from-blue-50/40 group-hover:to-sky-50/30',
    titleHover: 'group-hover:text-blue-600',
    cta: 'text-blue-600 hover:text-blue-500',
  },
  {
    cardHover: 'hover:border-emerald-200 hover:ring-emerald-100',
    gradientOverlay: 'group-hover:from-emerald-50/40 group-hover:to-teal-50/30',
    titleHover: 'group-hover:text-emerald-600',
    cta: 'text-emerald-600 hover:text-emerald-500',
  },
  {
    cardHover: 'hover:border-purple-200 hover:ring-purple-100',
    gradientOverlay: 'group-hover:from-purple-50/40 group-hover:to-violet-50/30',
    titleHover: 'group-hover:text-purple-600',
    cta: 'text-purple-600 hover:text-purple-500',
  },
  {
    cardHover: 'hover:border-amber-200 hover:ring-amber-100',
    gradientOverlay: 'group-hover:from-amber-50/40 group-hover:to-yellow-50/30',
    titleHover: 'group-hover:text-amber-600',
    cta: 'text-amber-600 hover:text-amber-500',
  },
  {
    cardHover: 'hover:border-rose-200 hover:ring-rose-100',
    gradientOverlay: 'group-hover:from-rose-50/40 group-hover:to-pink-50/30',
    titleHover: 'group-hover:text-rose-600',
    cta: 'text-rose-600 hover:text-rose-500',
  },
  {
    cardHover: 'hover:border-sky-200 hover:ring-sky-100',
    gradientOverlay: 'group-hover:from-sky-50/40 group-hover:to-cyan-50/30',
    titleHover: 'group-hover:text-sky-600',
    cta: 'text-sky-600 hover:text-sky-500',
  },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getTagAccent(tag: string): TagAccent {
  return TAG_ACCENTS[hashString(tag.toLowerCase()) % TAG_ACCENTS.length];
}

export function getCardAccent(index: number): CardAccent {
  return CARD_ACCENTS[Math.abs(index) % CARD_ACCENTS.length];
}
