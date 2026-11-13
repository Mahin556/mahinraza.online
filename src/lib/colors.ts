/**
 * Cohesive slate & teal technical accent tokens for light and dark modes.
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
    pill: 'border-slate-200/90 bg-slate-100/80 text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-teal-950/70 dark:hover:border-teal-500/60 dark:hover:text-teal-300',
    dot: 'bg-teal-500',
  },
  {
    pill: 'border-teal-200/80 bg-teal-50/60 text-teal-800 hover:bg-teal-100/80 hover:border-teal-300 dark:border-teal-800/70 dark:bg-teal-950/50 dark:text-teal-300 dark:hover:bg-teal-900/60 dark:hover:border-teal-500/60',
    dot: 'bg-teal-600 dark:bg-teal-400',
  },
  {
    pill: 'border-cyan-200/80 bg-cyan-50/60 text-cyan-800 hover:bg-cyan-100/80 hover:border-cyan-300 dark:border-cyan-800/70 dark:bg-cyan-950/50 dark:text-cyan-300 dark:hover:bg-cyan-900/60 dark:hover:border-cyan-500/60',
    dot: 'bg-cyan-600 dark:bg-cyan-400',
  },
  {
    pill: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:text-white',
    dot: 'bg-slate-500 dark:bg-slate-400',
  },
];

const CARD_ACCENTS: CardAccent[] = [
  {
    cardHover:
      'hover:border-teal-300/90 hover:shadow-md dark:hover:border-teal-500/50 dark:hover:shadow-[0_8px_30px_rgba(20,184,166,0.08)]',
    topBar: 'group-hover:bg-teal-600 dark:group-hover:bg-teal-400',
    titleHover: 'group-hover:text-teal-700 dark:group-hover:text-teal-400',
    cta: 'text-teal-700 group-hover:text-teal-600 dark:text-teal-400 dark:group-hover:text-teal-300',
  },
  {
    cardHover:
      'hover:border-cyan-300/90 hover:shadow-md dark:hover:border-cyan-500/50 dark:hover:shadow-[0_8px_30px_rgba(6,182,212,0.08)]',
    topBar: 'group-hover:bg-cyan-600 dark:group-hover:bg-cyan-400',
    titleHover: 'group-hover:text-cyan-700 dark:group-hover:text-cyan-400',
    cta: 'text-cyan-700 group-hover:text-cyan-600 dark:text-cyan-400 dark:group-hover:text-cyan-300',
  },
  {
    cardHover:
      'hover:border-slate-400/70 hover:shadow-md dark:hover:border-teal-500/40 dark:hover:shadow-[0_8px_30px_rgba(15,23,42,0.4)]',
    topBar: 'group-hover:bg-slate-800 dark:group-hover:bg-teal-400',
    titleHover: 'group-hover:text-teal-700 dark:group-hover:text-teal-400',
    cta: 'text-slate-700 group-hover:text-teal-700 dark:text-slate-300 dark:group-hover:text-teal-400',
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
