'use client'

import {useTheme} from '@/components/ThemeProvider'

/**
 * The 1994 theme's decorative furniture, quarantined.
 *
 * This markup used to live inside SiteHeader and SiteFooter, hidden with
 * `display: none` on every other theme — which meant the default site shipped a
 * marquee, a fake Netscape menu bar and a visitor counter in its DOM at all
 * times, and anyone editing the header had to read past them. Now it renders
 * only when the joke is actually switched on in Settings.
 *
 * Everything here is `aria-hidden`: it is a costume, not content.
 */
export function ThemeChrome({slot}: {slot: 'top' | 'bottom'}) {
  const {theme} = useTheme()
  if (theme !== 'retro94') return null

  if (slot === 'bottom') {
    return (
      <p className="retro94-counter container pb-4" aria-hidden>
        Visitors: 0048217
      </p>
    )
  }

  return (
    <div aria-hidden>
      <div className="retro94-toolbar">
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Go</span>
        <span>Bookmarks</span>
        <span>Options</span>
        <span>Directory</span>
        <span>Window</span>
        <span>Help</span>
        <span className="ml-auto">Best viewed in Netscape 3.0</span>
      </div>
      <div className="retro94-marquee">
        <span className="retro94-marquee-track">
          ★★★ WELCOME TO BIOLOGICALCONTROL.ORG ★★★ You are visitor #0048217 ★★★ Site last updated:
          12 June 1994 ★★★ FREE hit counter ★★★ Under construction forever ★★★ Cassava mealybug
          defeated — click here!!! ★★★
        </span>
      </div>
      <p className="retro94-under-construction container">
        <span className="retro94-uc-gif" />
        Under Construction — please excuse our dust (and Comic Sans)
      </p>
    </div>
  )
}
