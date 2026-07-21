export type ThemeId = 'default' | 'typewriter' | 'retro94'

export const THEME_STORAGE_KEY = 'bc-theme'

export const THEME_OPTIONS: {
  id: ThemeId
  label: string
  description: string
}[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Modern Cursor-beige — clean and readable',
  },
  {
    id: 'typewriter',
    label: 'Typewriter',
    description: 'Monospace on typing paper, ASCII card frames',
  },
  {
    id: 'retro94',
    label: '1994',
    description: 'God-awful early-web parody (still navigable)',
  },
]

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value === 'default' || value === 'typewriter' || value === 'retro94'
}

/** Inline script: apply stored theme before paint to avoid flash. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='typewriter'&&t!=='retro94')t='default';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','default');}})();`
