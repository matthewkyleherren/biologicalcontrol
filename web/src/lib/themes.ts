/**
 * Theme helpers retained only so a one-time cleanup can clear leftover joke-theme
 * keys from browsers that still have `bc-theme` in localStorage.
 */

export const THEME_STORAGE_KEY = 'bc-theme'

/** Clears obsolete theme preference before paint. Safe no-op when storage is blocked. */
export const THEME_CLEANUP_SCRIPT = `(function(){try{localStorage.removeItem('${THEME_STORAGE_KEY}');}catch(e){}})();document.documentElement.removeAttribute('data-theme');`
