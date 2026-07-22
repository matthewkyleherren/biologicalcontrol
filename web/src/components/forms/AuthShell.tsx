/**
 * The plain, centred card that both auth pages sit inside.
 *
 * The site header above already carries the wordmark, so this shell adds
 * nothing but room: a centred column, the Clerk card, and one short line of
 * reassurance underneath it. No eyebrow, no display headline, no paragraph —
 * Clerk's own card already supplies the heading.
 */
export function AuthShell({
  children,
  reassurance,
}: {
  children: React.ReactNode
  reassurance: string
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12 md:py-16">
      <div className="w-full max-w-[26rem]">
        <div className="[&_.cl-rootBox]:mx-auto [&_.cl-rootBox]:w-full">{children}</div>
        <p className="mt-6 text-center text-base leading-relaxed text-ink-soft">{reassurance}</p>
      </div>
    </main>
  )
}
