/**
 * Cohesive slate & teal technical accent tokens for cards and topic chips.
 * Strictly light-mode tokens only — no dark-mode classes or variants.
 */

export interface TagAccent {
  pill: string;
  dot: string;
}

export interface CardAccent {
  cardHover: string;
  topBar: string;
  titleHover: string;
  cta: string;
}

const TAG_ACCENTS: TagAccent[] = [
  {
    pill: 'border-slate-200/90 bg-slate-100/80 text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800',
    dot: 'bg-teal-500',
  },
  {
    pill: 'border-teal-200/80 bg-teal-50/60 text-teal-800 hover:bg-teal-100/80 hover:border-teal-300',
    dot: 'bg-teal-600',
  },
  {
    pill: 'border-cyan-200/80 bg-cyan-50/60 text-cyan-800 hover:bg-cyan-100/80 hover:border-cyan-300',
    dot: 'bg-cyan-600',
  },
  {
    pill: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900',
    dot: 'bg-slate-500',
  },
];

const CARD_ACCENTS: CardAccent[] = [
  {
    cardHover: 'hover:border-teal-300/90 hover:shadow-md',
    topBar: 'group-hover:bg-teal-600',
    titleHover: 'group-hover:text-teal-700',
    cta: 'text-teal-700 group-hover:text-teal-600',
  },
  {
    cardHover: 'hover:border-cyan-300/90 hover:shadow-md',
    topBar: 'group-hover:bg-cyan-600',
    titleHover: 'group-hover:text-cyan-700',
    cta: 'text-cyan-700 group-hover:text-cyan-600',
  },
  {
    cardHover: 'hover:border-slate-400/70 hover:shadow-md',
    topBar: 'group-hover:bg-slate-800',
    titleHover: 'group-hover:text-teal-700',
    cta: 'text-slate-700 group-hover:text-teal-700',
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
