import type {Metadata} from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {PortableText} from 'next-sanity'
import {client} from '@/sanity/client'
import {PROGRAMME_QUERY} from '@/sanity/queries'
import {fallbackProgramme, programmeSections} from '@/lib/fallback-content'
import type {ProgrammeContent} from '@/lib/types'
import {PageHeader} from '@/components/ui'

export const metadata: Metadata = {
  title: 'The Programme',
  description:
    'A calm introduction to the IITA Biological Control Programme — cassava mealybug, Anagyrus lopezi, and the people who carried the work across West Africa.',
}

export const revalidate = 60

/** Open CGSpace / FAO primary sources from docs/annual-reports-finds.md (early-90s window). */
const programmeReports = [
  {
    year: '1989/90',
    title: 'IITA Annual Report 1989/1990',
    note: 'King Baudouin Award · Biological Control chapter · mango mealybug feature',
    href: 'https://cgspace.cgiar.org/server/api/core/bitstreams/e81bee7a-2d23-4cac-8cf2-9d89f32bd8f7/content',
    source: 'CGSpace PDF',
  },
  {
    year: '1991',
    title: 'IITA Annual Report 1991',
    note: 'First Plant Health Management block · Cotonou biocontrol centre recalled',
    href: 'https://cgspace.cgiar.org/server/api/core/bitstreams/92e339d2-db48-40b8-970e-c810b1c68192/content',
    source: 'CGSpace PDF',
  },
  {
    year: '1992',
    title: 'IITA Annual Report 1992',
    note: 'Mealybug simulation model · first full year after PHMD creation',
    href: 'https://cgspace.cgiar.org/server/api/core/bitstreams/c77dcd25-1391-42c8-b4ab-a2d2953396da/content',
    source: 'CGSpace PDF',
  },
  {
    year: '1995',
    title: 'IITA Annual Report 1995',
    note: 'World Food Prize to Hans Herren · PHMD Cotonou staff roster',
    href: 'https://cgspace.cgiar.org/server/api/core/bitstreams/c7faf1d6-a5d3-4f67-96a8-eb51e01b212d/content',
    source: 'CGSpace PDF',
  },
  {
    year: '1995',
    title: 'Fourth External Programme & Management Review of IITA',
    note: 'BCP → PHMD institutional narrative · Cotonou programmes (FAO / CGIAR TAC)',
    href: 'https://cgspace.cgiar.org/server/api/core/bitstreams/f80954c7-416b-4b16-a176-095577f08e81/content',
    source: 'CGSpace PDF',
  },
] as const

export default async function ProgrammePage() {
  const fetched = (await client.fetch(PROGRAMME_QUERY).catch(() => null)) as ProgrammeContent | null
  const programme: ProgrammeContent = fetched?.title ? fetched : fallbackProgramme
  const timeline = programme.timeline?.length ? programme.timeline : fallbackProgramme.timeline
  const useCmsBody = Array.isArray(programme.body) && programme.body.length > 0

  return (
    <main className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
      <PageHeader title={programme.title} subtitle={programme.lede || undefined} />

      <p className="rounded-sm border border-rule bg-paper-2 px-4 py-3 text-base text-ink-soft">
        New to the science? Start here. If you lived it — staff, spouse, kid on station,
        national-programme friend — skim the timeline, then{' '}
        <Link href="/contribute" className="text-accent underline decoration-rule">
          share a story from the compound
        </Link>{' '}
        or{' '}
        <Link href="/people" className="text-accent underline decoration-rule">
          find someone you remember
        </Link>
        .
      </p>

      <section className="mt-12">
        <p className="rail-title">Cotonou · PHMD</p>
        <h2 className="story-title mt-2 text-2xl md:text-3xl">The spider insectary</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft md:text-xl">
          From 1988 the Africa-wide programme’s hub was IITA’s Plant Health Management Division in{' '}
          <strong className="font-medium text-ink">Cotonou, Benin</strong> — remembered as a central
          office/lab with eight rearing greenhouses sticking out like spider legs. If you have an aerial
          photo or slide of the site, please{' '}
          <Link href="/contribute" className="text-accent underline decoration-rule">
            share it
          </Link>
          .
        </p>
        <p className="mt-4 text-sm text-ink-faint">
          Further reading:{' '}
          <a
            className="underline decoration-rule hover:text-accent"
            href="https://iaes.cgiar.org/sites/default/files/pdf/5.impact_major-pest.pdf"
          >
            BCP moves to Cotonou, 1988
          </a>
          {' · '}
          <a
            className="underline decoration-rule hover:text-accent"
            href="https://doi.org/10.17660/actahortic.1997.443.4"
          >
            screenhouse study at IITA BCP
          </a>
          {' · '}
          <a
            className="underline decoration-rule hover:text-accent"
            href="https://www.iita.org/iita-countries/benin/"
          >
            IITA Benin station
          </a>
        </p>
      </section>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <figure className="archive-photo">
          <Image
            src="/archive/anagyrus-lopezi-goergen.jpg"
            alt="Close-up of Anagyrus lopezi wasp"
            width={800}
            height={660}
            className="max-h-56 w-full object-cover"
          />
          <figcaption>
            <em>A. lopezi</em> — Georg Goergen (IITA).{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Anagyrus_lopezi.jpg">CC BY-SA 2.0</a>
          </figcaption>
        </figure>
        <figure className="archive-photo">
          <Image
            src="/archive/wasp-release-vial-lefroy.jpg"
            alt="Vial of Anagyrus lopezi at a release ceremony"
            width={800}
            height={550}
            className="max-h-56 w-full object-cover"
          />
          <figcaption>
            Release vial — Rod Lefroy (CIAT).{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Wasp_release2.jpg">CC BY-SA 2.0</a>
          </figcaption>
        </figure>
      </div>

      {useCmsBody ? (
        <div className="prose-story mt-10 text-lg md:text-xl">
          <PortableText value={programme.body as Parameters<typeof PortableText>[0]['value']} />
        </div>
      ) : (
        <div className="mt-10 space-y-14">
          {programmeSections.map((section) => (
            <section key={section.heading}>
              <h2 className="story-title text-2xl md:text-3xl">{section.heading}</h2>
              <div className="prose-story-plain mt-5 text-lg leading-relaxed md:text-xl md:leading-relaxed">
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 48)}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {timeline?.length ? (
        <section className="mt-16 border-t border-rule pt-10">
          <p className="rail-title">Timeline</p>
          <h2 className="story-title mt-2 text-2xl md:text-3xl">A rough timeline</h2>
          <ol className="mt-8 space-y-8">
            {timeline.map((item, i) => (
              <li key={`${item.year}-${i}`} className="grid gap-2 md:grid-cols-[7.5rem_1fr] md:gap-6">
                <p className="font-[family-name:var(--font-mono)] text-base text-accent md:text-lg">
                  {item.year}
                </p>
                <div>
                  <h3 className="story-title text-xl md:text-2xl">{item.title}</h3>
                  {item.detail ? (
                    <p className="mt-2 text-lg leading-relaxed text-ink-soft md:text-xl">
                      {item.detail}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-16 border-t border-rule pt-10">
        <p className="rail-title">Archive · open access</p>
        <h2 className="story-title mt-2 text-2xl md:text-3xl">Reports &amp; sources</h2>
        <p className="mt-4 max-w-[36rem] text-lg leading-relaxed text-ink-soft md:text-xl">
          Open-access IITA annual reports from the early 1990s and the 1995 external review — useful
          reading on Biological Control and Plant Health Management.
        </p>
        <ul className="mt-8 space-y-6">
          {programmeReports.map((report) => (
            <li
              key={`${report.year}-${report.title}`}
              className="grid gap-1 border-b border-rule pb-6 last:border-0 last:pb-0 md:grid-cols-[7.5rem_1fr] md:gap-6"
            >
              <p className="font-[family-name:var(--font-mono)] text-base text-accent md:text-lg">
                {report.year}
              </p>
              <div>
                <a
                  href={report.href}
                  className="story-title text-xl text-ink underline decoration-rule underline-offset-[0.18em] transition-colors hover:text-accent hover:decoration-accent md:text-2xl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {report.title}
                </a>
                <p className="mt-2 text-lg leading-relaxed text-ink-soft md:text-xl">{report.note}</p>
                <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-ink-faint">
                  {report.source} ↗
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-base text-ink-faint md:text-lg">
          Also readable as HTML on FAO Open Knowledge:{' '}
          <a
            className="text-ink-soft underline decoration-rule hover:text-accent"
            href="https://openknowledge.fao.org/server/api/core/bitstreams/43729cba-578a-423e-ac39-e67e87c3b33a/content/x5806e0a.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Fourth EPMR · research programmes chapter
          </a>
          .
        </p>
      </section>

      <section className="mt-16 border-t border-rule pt-10">
        <p className="rail-title">A few insect jokes (tasteful)</p>
        <ul className="mt-6 space-y-4 text-lg leading-relaxed text-ink-soft">
          <li>
            The mealybug’s public-relations strategy was honeydew and sooty mould. It did not poll
            well with farmers.
          </li>
          <li>
            <em>Anagyrus lopezi</em> is proof that the best project managers sometimes have six legs
            and no expense account.
          </li>
          <li>
            Mass rearing taught everyone the same lesson: if your factory smells like a greenhouse
            and buzzes after midnight, you are probably doing biology, not catering.
          </li>
          <li>
            Aerial release: the rare cargo that is happier to leave the aircraft than the passengers
            are.
          </li>
        </ul>
      </section>

      <section className="mt-16 rounded-sm border border-rule bg-paper-2 p-6 md:p-8">
        <h2 className="story-title text-2xl">Were you there?</h2>
        <p className="mt-3 max-w-[36rem] text-lg leading-relaxed text-ink-soft">
          This page is the primer. The archive is the community — colleagues, partners, spouses,
          kids who grew up on station. Add a memory, a photograph caption, or a profile. Families
          welcome; two paragraphs keep someone findable.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/contribute" className="btn-primary">
            Share a story
          </Link>
          <Link href="/join" className="btn-secondary">
            Create a profile
          </Link>
        </div>
      </section>
    </main>
  )
}
