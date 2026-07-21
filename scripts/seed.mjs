/**
 * Seed starter documents into Sanity.
 * Usage (from studio/):
 *   SANITY_AUTH_TOKEN=... npx sanity exec ../scripts/seed.ts --with-user-token
 *
 * Or from repo root with a write token in env.
 */

import {createClient} from '@sanity/client'

const client = createClient({
  projectId: 'z5q3j9hv',
  dataset: 'production',
  apiVersion: '2026-05-15',
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
})

function block(text: string) {
  return {
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', text}],
  }
}

async function main() {
  if (!client.config().token) {
    throw new Error('Set SANITY_API_WRITE_TOKEN or SANITY_AUTH_TOKEN')
  }

  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteTitle: 'Biological Control Folklore',
    tagline: 'Find your colleagues. Leave a story. Keep the programme’s memory warm.',
    domain: 'biologicalcontrol.org',
    intro:
      'A gathering place for veterans of the IITA Biological Control Programme — and a folklore archive of the wasps, airplanes, insectaries, and late nights that kept cassava alive across West Africa.',
  })

  await client.createOrReplace({
    _id: 'programme',
    _type: 'programme',
    title: 'How a wasp saved cassava',
    lede:
      'In the late 1970s, an accidental pest threatened Africa’s staple root crop. At IITA in Ibadan, a programme answered with biology — not a spray truck the size of a continent — and helped keep markets open and famines at bay.',
    timeline: [
      {
        _key: 't0',
        year: 'c. 1973',
        title: 'An uninvited guest',
        detail:
          'The cassava mealybug arrives in Africa. Fields bleach white with honeydew and sooty mould.',
      },
      {
        _key: 't1',
        year: '1979',
        title: 'Programme begins at IITA',
        detail:
          'Hans R. Herren joins IITA in Ibadan and begins assembling Africa’s largest biological control effort against the cassava mealybug.',
      },
      {
        _key: 't2',
        year: '1981',
        title: 'Natural enemy identified',
        detail:
          'A parasitoid wasp — Anagyrus (Epidinocarsis) lopezi — is found in South America, where cassava and the mealybug evolved together.',
      },
      {
        _key: 't3',
        year: '1982–86',
        title: 'Mass rearing and release',
        detail:
          'Insectaries produce wasps at industrial scale. Releases by ground and air spread populations across affected regions.',
      },
      {
        _key: 't4',
        year: '1995',
        title: 'World Food Prize',
        detail:
          'Herren receives the World Food Prize for leading the campaign. Later honours include the Right Livelihood Award (2013).',
      },
    ],
  })

  // Roster from docs/staff-roster.md (IITA AR staff lists + research brief). No invented bios.
  const people = [
    {slug: 'hans-r-herren', name: 'Hans R. Herren', role: 'Programme / PHMD director', yearsActive: '1979–1994', location: 'Ibadan · Cotonou', featured: true},
    {slug: 'peter-neuenschwander', name: 'Peter Neuenschwander', role: 'Entomologist; BCP leader; PHMD director', yearsActive: '1980s–1990s', location: 'Cotonou', featured: true},
    {slug: 'j-s-yaninek', name: 'J. S. Yaninek', role: 'Acarologist (cassava green mite)', yearsActive: '1989–1995', location: 'Cotonou', featured: true},
    {slug: 'w-n-o-hammond', name: 'W. N. O. Hammond', role: 'Entomologist; regional coordinator / TT&TU', yearsActive: '1989–1995', location: 'Cotonou', featured: true},
    {slug: 'f-schulthess', name: 'F. Schulthess', role: 'Ecologist', yearsActive: '1989–1995', location: 'Cotonou', featured: true},
    {slug: 'c-j-lomer', name: 'C. J. Lomer', role: 'Insect pathologist; BCP programme leader', yearsActive: '1991–1995', location: 'Cotonou', featured: true},
    {slug: 'georg-goergen', name: 'Georg Goergen', role: 'Entomologist', yearsActive: '1995–', location: 'Cotonou', featured: true},
    {slug: 'r-h-markham', name: 'R. H. Markham', role: 'Entomologist', yearsActive: '1992–1995', location: 'Cotonou', featured: true},
    {slug: 'm-tamo', name: 'M. Tamò', role: 'Insect ecologist; Habitat Management leader', yearsActive: '1989–1995', location: 'Cotonou', featured: false},
    {slug: 'd-t-akibo-betts', name: 'D. T. Akibo-Betts', role: 'Entomologist; East/Southern Africa coordinator', yearsActive: '1989–1990', location: 'BCP', featured: false},
    {slug: 't-g-shanower', name: 'T. G. Shanower', role: 'Entomologist', yearsActive: '1989–1991', location: 'BCP', featured: false},
    {slug: 'a-wodageneh', name: 'A. Wodageneh', role: 'Training officer (FAO)', yearsActive: '1989–1992', location: 'Cotonou', featured: false},
    {slug: 't-m-haug', name: 'T. M. Haug', role: 'Mass rearing specialist', yearsActive: '1989–1995', location: 'Cotonou', featured: false},
    {slug: 'b-megevand', name: 'B. Megevand', role: 'Mite rearing specialist', yearsActive: '1989–1995', location: 'Cotonou', featured: false},
    {slug: 'j-b-akinwumi', name: 'J. B. Akinwumi', role: 'Engineer', yearsActive: '1989–1995', location: 'Cotonou', featured: false},
    {slug: 'c-boavida', name: 'C. Boavida', role: 'Ecologist', yearsActive: '1989–1992', location: 'Cotonou', featured: false},
    {slug: 'c-gold', name: 'C. Gold', role: 'Entomologist', yearsActive: '1991–1995', location: 'Cotonou · Namulonge', featured: false},
    {slug: 'c-borgemeister', name: 'C. Borgemeister', role: 'Entomologist', yearsActive: '1992–1995', location: 'Cotonou', featured: false},
    {slug: 'b-d-james', name: 'B. D. James', role: 'Entomologist; IITA/CIAT cassava project', yearsActive: '1992–1995', location: 'Cotonou', featured: false},
    {slug: 'w-meikle', name: 'W. Meikle', role: 'Entomologist', yearsActive: '1995', location: 'Cotonou', featured: false},
    {slug: 'n-jenkins', name: 'N. Jenkins', role: 'Microbiologist (IIBC)', yearsActive: '1995', location: 'Cotonou', featured: false},
    {slug: 'p-le-gall', name: 'P. Le Gall', role: 'Entomologist (ORSTOM)', yearsActive: '1995', location: 'Cotonou', featured: false},
    {slug: 'b-kristensen', name: 'B. Kristensen', role: 'Acarologist (DANIDA)', yearsActive: '1991–1995', location: 'Cotonou', featured: false},
    {slug: 'a-paraiso', name: 'A. Paraiso', role: 'Insect pathologist', yearsActive: '1991–1995', location: 'Cotonou · Niamey', featured: false},
    {slug: 'p-bieler', name: 'P. Bieler', role: 'Agronomist / plant protectionist', yearsActive: '1992–1995', location: 'Cotonou', featured: false},
    {slug: 'j-langewald', name: 'J. Langewald', role: 'Entomologist', yearsActive: '1995', location: 'Cotonou', featured: false},
    {slug: 'w-msikita', name: 'W. Msikita', role: 'Plant pathologist', yearsActive: '1995', location: 'Cotonou', featured: false},
    {slug: 'w-modder', name: 'W. Modder', role: 'Entomologist (visiting)', yearsActive: '1992–1995', location: 'Cotonou', featured: false},
    {slug: 'j-stonehouse', name: 'J. Stonehouse', role: 'Insect pathologist (visiting)', yearsActive: '1995', location: 'Cotonou', featured: false},
    {slug: 'h-bottenberg', name: 'H. Bottenberg', role: 'Entomologist', yearsActive: '1991–1992', location: 'Cotonou', featured: false},
    {slug: 'h-m-dreyer', name: 'H. M. Dreyer', role: 'Entomologist / ecologist', yearsActive: '1991–1992', location: 'Cotonou', featured: false},
    {slug: 'm-e-zweigert', name: 'M. E. Zweigert', role: 'TT&TU head (GTZ)', yearsActive: '1991–1995', location: 'Cotonou', featured: false},
    {slug: 'j-n-quaye', name: 'J. N. Quaye', role: 'Chief administrator, Benin station', yearsActive: '1992–1995', location: 'Cotonou', featured: false},
    {slug: 'k-f-cardwell', name: 'K. F. Cardwell', role: 'Plant pathologist', yearsActive: '1991–1995', location: 'Cotonou · Ibadan', featured: false},
    {slug: 'k-wydra', name: 'K. Wydra', role: 'Plant pathologist', yearsActive: '1995', location: 'Cotonou', featured: false},
    {slug: 'o-bonato', name: 'O. Bonato', role: 'Modeler (ORSTOM)', yearsActive: '1995', location: 'Cotonou', featured: false},
    {slug: 'n-a-bosque-perez', name: 'N. A. Bosque-Pérez', role: 'Entomologist; HPR programme leader', yearsActive: '1991–1995', location: 'Ibadan', featured: false},
    {slug: 'd-berner', name: 'D. Berner', role: 'Parasitic weeds biologist', yearsActive: '1991–1995', location: 'Ibadan', featured: false},
    {slug: 'l-e-n-jackai', name: 'L. E. N. Jackai', role: 'Entomologist', yearsActive: '1991–1995', location: 'Ibadan', featured: false},
    {slug: 'd-a-fiorini', name: 'D. A. Fiorini', role: 'Plant pathologist; Seed Health', yearsActive: '1991–1995', location: 'Ibadan', featured: false},
    {slug: 'k-m-lema', name: 'K. M. Lema', role: 'Early Nigeria releases', yearsActive: '1981–1985', location: 'Nigeria', featured: false},
    {slug: 'b-lohr', name: 'B. Löhr', role: 'South American exploration', yearsActive: '1983–1986', location: 'Paraguay · Bolivia · Brazil', featured: false},
    {slug: 'a-m-varela', name: 'A. M. Varela', role: 'South American exploration', yearsActive: '1980s', location: 'Neotropics', featured: false},
    {slug: 'm-yaseen', name: 'M. Yaseen', role: 'CIBC explorer', yearsActive: '1970s–1980s', location: 'Neotropics', featured: false},
    {slug: 'a-h-bokonon-ganta', name: 'A. H. Bokonon-Ganta', role: 'Parasitoid biology', yearsActive: '1980s', location: 'Benin', featured: false},
    {slug: 'j-a-odebiyi', name: 'J. A. Odebiyi', role: 'Parasitoid biology', yearsActive: '1980s', location: 'Nigeria', featured: false},
    {slug: 'r-d-hennessey', name: 'R. D. Hennessey', role: 'Field biology of cassava mealybug', yearsActive: '1980s', location: 'Zaire', featured: false},
    {slug: 'a-r-cudjoe', name: 'A. R. Cudjoe', role: 'National collaborator', yearsActive: '1980s–1990s', location: 'Ghana', featured: false},
    {slug: 's-korang-amoakoh', name: 'S. Korang-Amoakoh', role: 'National collaborator', yearsActive: '1980s–1990s', location: 'Ghana', featured: false},
    {slug: 'a-kiyindou', name: 'A. Kiyindou', role: 'National collaborator', yearsActive: '1980s–1990s', location: 'Congo', featured: false},
    {slug: 'a-p-gutierrez', name: 'A. P. Gutierrez', role: 'Systems modelling', yearsActive: '1980s', location: 'UC Berkeley', featured: false},
    {slug: 'j-van-alphen', name: 'J. van Alphen', role: 'Host-finding behaviour', yearsActive: '1980s–1990s', location: 'Univ. of Leiden', featured: false},
    {slug: 'f-i-nweke', name: 'F. I. Nweke', role: 'COSCA agricultural economist', yearsActive: '1989–1995', location: 'Ibadan', featured: false},
    {slug: 'j-zeddies', name: 'J. Zeddies', role: 'Economic impact analysis', yearsActive: '1990s–2001', location: 'Hohenheim', featured: false},
    {slug: 'o-ajuonu', name: 'O. Ajuonu', role: 'PHMD collaborator / co-author', yearsActive: '1990s', location: 'Benin', featured: false},
  ].map((p) => ({...p, _id: `person-${p.slug}`}))

  for (const p of people) {
    await client.createOrReplace({
      _type: 'person',
      _id: p._id,
      name: p.name,
      slug: {_type: 'slug', current: p.slug},
      role: p.role,
      yearsActive: p.yearsActive,
      location: p.location,
      featured: p.featured,
    })
  }

  const stories = [
    {
      _id: 'story-two-thousand-wasps',
      title: 'Two thousand wasps a second',
      slug: 'two-thousand-wasps-a-second',
      year: 1986,
      era: 'release',
      location: 'Over the African cassava belt',
      featured: true,
      excerpt:
        'The release method sounded absurd until you watched the parcels leave the aircraft door over the cassava belt.',
      body: [
        block(
          'The numbers were the kind that make donors blink and engineers grin. Nearly two thousand wasps a second, packaged so they could survive leaving an aircraft travelling hundreds of kilometres an hour, then find mealybugs in the green geometry of cassava fields below.'
        ),
        block(
          'Aerial release was not a stunt. The cassava belt was too wide, the pest too fast, for ground crews alone. What looks like theatre in retrospect was logistics: rearing schedules, parcel design, flight paths, and national teams waiting on the other side of the map.'
        ),
        block(
          'This stub is waiting for a first-person telling from someone who packed the parcels, flew the line, or watched them open. If that was you, replace these paragraphs with what you remember.'
        ),
      ],
      narrator: {_type: 'reference', _ref: 'person-t-m-haug'},
      people: [
        {_type: 'reference', _key: 'a', _ref: 'person-hans-r-herren'},
        {_type: 'reference', _key: 'b', _ref: 'person-t-m-haug'},
        {_type: 'reference', _key: 'c', _ref: 'person-b-megevand'},
      ],
    },
    {
      _id: 'story-ghost-in-paraguay',
      title: 'Looking for a ghost in Paraguay',
      slug: 'looking-for-a-ghost-in-paraguay',
      year: 1981,
      era: 'finding',
      location: 'Paraguay & Brazil',
      featured: true,
      excerpt:
        'Cassava came from the Amazon. So did its pest. The enemy of that enemy had to be found where both were at home.',
      body: [
        block(
          'Classical biological control begins with a detective story. An invasive pest without natural enemies explodes. You go home — the pest’s home — and look for the organisms that kept it in check for millennia.'
        ),
        block(
          'For the cassava mealybug, that search led to South America and to a parasitoid wasp later known widely as Epidinocarsis / Anagyrus lopezi. Finding it was only the first act. Specificity testing, rearing, and politics still had to be survived.'
        ),
      ],
      narrator: {_type: 'reference', _ref: 'person-hans-r-herren'},
      people: [{_type: 'reference', _key: 'a', _ref: 'person-hans-r-herren'}],
    },
    {
      _id: 'story-honeydew-factory',
      title: 'The factory that smelled like honeydew',
      slug: 'the-factory-that-smelled-like-honeydew',
      year: 1984,
      era: 'release',
      location: 'Ibadan',
      featured: false,
      excerpt:
        'Mass rearing was not glamorous. It was heat, schedule, and an insectary that never really slept.',
      body: [
        block(
          'Before wasps could leave aircraft doors, they had to leave cages. The Ibadan insectary was a biological factory: cassava plants, mealybug colonies, parasitoid cages, and people who knew the difference between a good cohort and a doomed one by smell and sight.'
        ),
        block(
          'Anyone who worked those rooms has a story about generators, contamination scares, and the quiet pride of a shipment that left on time. This archive wants those stories — named, dated, and slightly unfair to whoever stole the last coffee.'
        ),
      ],
      narrator: {_type: 'reference', _ref: 'person-t-m-haug'},
      people: [
        {_type: 'reference', _key: 'a', _ref: 'person-t-m-haug'},
        {_type: 'reference', _key: 'b', _ref: 'person-b-megevand'},
        {_type: 'reference', _key: 'c', _ref: 'person-peter-neuenschwander'},
      ],
    },
  ]

  for (const s of stories) {
    await client.createOrReplace({
      _type: 'story',
      _id: s._id,
      title: s.title,
      slug: {_type: 'slug', current: s.slug},
      year: s.year,
      era: s.era,
      location: s.location,
      featured: s.featured,
      excerpt: s.excerpt,
      body: s.body,
      narrator: s.narrator,
      people: s.people,
      publishedAt: new Date().toISOString(),
    })
  }

  await client.createOrReplace({
    _id: 'gallery-ibadan-insectary',
    _type: 'gallery',
    title: 'Ibadan insectary',
    slug: {_type: 'slug', current: 'ibadan-insectary'},
    year: 1984,
    location: 'Ibadan',
    description:
      'Rearing rooms, cassava plants, and the daily choreography of a biological factory. Photos welcome.',
    people: [
      {_type: 'reference', _key: 'a', _ref: 'person-t-m-haug'},
      {_type: 'reference', _key: 'b', _ref: 'person-b-megevand'},
    ],
    photos: [],
    featured: true,
  })

  console.log('Seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
