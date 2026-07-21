/**
 * Fallback content shown before Sanity is seeded.
 * Historically grounded; not fabricated first-person quotes from named laureates.
 * Programme copy merged from docs/programme-intro-draft.md (research-checked).
 */

import type {GallerySummary, PersonSummary, ProgrammeContent, StorySummary} from './types'

export const fallbackHome = {
  settings: {
    siteTitle: 'Biological Control Folklore',
    tagline: 'Find each other. Share a story. Keep the compound’s memory warm.',
    domain: 'biologicalcontrol.org',
    intro:
      'A gathering place for everyone who lived the IITA Biological Control Programme — staff, spouses, kids who grew up on station, national-programme friends — and a folklore archive of the messy, funny, affectionate stories that never made the annual report.',
  },
  counts: {stories: 6, people: 55, galleries: 2},
  featured: [
    {
      _id: 'f1',
      title: 'Two thousand wasps a second',
      slug: 'two-thousand-wasps-a-second',
      excerpt:
        'The release method sounded absurd until you watched the parcels leave the aircraft door over the cassava belt.',
      year: 1986,
      location: 'Over the African cassava belt',
      narrator: {name: 'Field notes', slug: 'archive'},
    },
    {
      _id: 'f2',
      title: 'Looking for a ghost in Paraguay',
      slug: 'looking-for-a-ghost-in-paraguay',
      excerpt:
        'Cassava came from the Amazon. So did its pest. The enemy of that enemy had to be found where both were at home.',
      year: 1981,
      location: 'Paraguay & Brazil',
      narrator: {name: 'Archive', slug: 'archive'},
    },
  ] satisfies StorySummary[],
  latest: [
    {
      _id: 'f1',
      title: 'Two thousand wasps a second',
      slug: 'two-thousand-wasps-a-second',
      excerpt:
        'The release method sounded absurd until you watched the parcels leave the aircraft door over the cassava belt.',
      year: 1986,
      location: 'Over the African cassava belt',
      narrator: {name: 'Field notes', slug: 'archive'},
    },
    {
      _id: 'f2',
      title: 'Looking for a ghost in Paraguay',
      slug: 'looking-for-a-ghost-in-paraguay',
      excerpt:
        'Cassava came from the Amazon. So did its pest. The enemy of that enemy had to be found where both were at home.',
      year: 1981,
      location: 'Paraguay & Brazil',
      narrator: {name: 'Archive', slug: 'archive'},
    },
    {
      _id: 'f3',
      title: 'The factory that smelled like honeydew',
      slug: 'the-factory-that-smelled-like-honeydew',
      excerpt:
        'Mass rearing was not glamorous. It was heat, schedule, and an insectary that never really slept.',
      year: 1984,
      location: 'Ibadan',
      narrator: {name: 'Lab memory', slug: 'archive'},
    },
    {
      _id: 'f4',
      title: 'A map drawn in releases',
      slug: 'a-map-drawn-in-releases',
      excerpt:
        'From Senegal to Mozambique, the programme was a logistics problem disguised as entomology.',
      year: 1988,
      location: 'West & Central Africa',
      narrator: {name: 'Archive', slug: 'archive'},
    },
  ] satisfies StorySummary[],
  people: [
    // Core / featured — IITA BCP & PHMD (annual-report staff lists)
    {
      _id: 'p1',
      name: 'Hans R. Herren',
      slug: 'hans-r-herren',
      role: 'Programme / PHMD director',
      yearsActive: '1979–1994',
      location: 'Ibadan · Cotonou',
    },
    {
      _id: 'p2',
      name: 'Peter Neuenschwander',
      slug: 'peter-neuenschwander',
      role: 'Entomologist; BCP leader; PHMD director',
      yearsActive: '1980s–1990s',
      location: 'Cotonou',
    },
    {
      _id: 'p3',
      name: 'J. S. Yaninek',
      slug: 'j-s-yaninek',
      role: 'Acarologist (cassava green mite)',
      yearsActive: '1989–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p4',
      name: 'W. N. O. Hammond',
      slug: 'w-n-o-hammond',
      role: 'Entomologist; regional coordinator / TT&TU',
      yearsActive: '1989–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p5',
      name: 'F. Schulthess',
      slug: 'f-schulthess',
      role: 'Ecologist',
      yearsActive: '1989–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p6',
      name: 'C. J. Lomer',
      slug: 'c-j-lomer',
      role: 'Insect pathologist; BCP programme leader',
      yearsActive: '1991–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p7',
      name: 'Georg Goergen',
      slug: 'georg-goergen',
      role: 'Entomologist',
      yearsActive: '1995–',
      location: 'Cotonou',
    },
    {
      _id: 'p8',
      name: 'R. H. Markham',
      slug: 'r-h-markham',
      role: 'Entomologist',
      yearsActive: '1992–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p9',
      name: 'M. Tamò',
      slug: 'm-tamo',
      role: 'Insect ecologist; Habitat Management leader',
      yearsActive: '1989–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p10',
      name: 'D. T. Akibo-Betts',
      slug: 'd-t-akibo-betts',
      role: 'Entomologist; East/Southern Africa coordinator',
      yearsActive: '1989–1990',
      location: 'BCP',
    },
    {
      _id: 'p11',
      name: 'T. G. Shanower',
      slug: 't-g-shanower',
      role: 'Entomologist',
      yearsActive: '1989–1991',
      location: 'BCP',
    },
    {
      _id: 'p12',
      name: 'A. Wodageneh',
      slug: 'a-wodageneh',
      role: 'Training officer (FAO)',
      yearsActive: '1989–1992',
      location: 'Cotonou',
    },
    {
      _id: 'p13',
      name: 'T. M. Haug',
      slug: 't-m-haug',
      role: 'Mass rearing specialist',
      yearsActive: '1989–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p14',
      name: 'B. Megevand',
      slug: 'b-megevand',
      role: 'Mite rearing specialist',
      yearsActive: '1989–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p15',
      name: 'J. B. Akinwumi',
      slug: 'j-b-akinwumi',
      role: 'Engineer',
      yearsActive: '1989–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p16',
      name: 'C. Boavida',
      slug: 'c-boavida',
      role: 'Ecologist',
      yearsActive: '1989–1992',
      location: 'Cotonou',
    },
    {
      _id: 'p17',
      name: 'C. Gold',
      slug: 'c-gold',
      role: 'Entomologist',
      yearsActive: '1991–1995',
      location: 'Cotonou · Namulonge',
    },
    {
      _id: 'p18',
      name: 'C. Borgemeister',
      slug: 'c-borgemeister',
      role: 'Entomologist',
      yearsActive: '1992–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p19',
      name: 'B. D. James',
      slug: 'b-d-james',
      role: 'Entomologist; IITA/CIAT cassava project',
      yearsActive: '1992–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p20',
      name: 'W. Meikle',
      slug: 'w-meikle',
      role: 'Entomologist',
      yearsActive: '1995',
      location: 'Cotonou',
    },
    {
      _id: 'p21',
      name: 'N. Jenkins',
      slug: 'n-jenkins',
      role: 'Microbiologist (IIBC)',
      yearsActive: '1995',
      location: 'Cotonou',
    },
    {
      _id: 'p22',
      name: 'P. Le Gall',
      slug: 'p-le-gall',
      role: 'Entomologist (ORSTOM)',
      yearsActive: '1995',
      location: 'Cotonou',
    },
    {
      _id: 'p23',
      name: 'B. Kristensen',
      slug: 'b-kristensen',
      role: 'Acarologist (DANIDA)',
      yearsActive: '1991–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p24',
      name: 'A. Paraiso',
      slug: 'a-paraiso',
      role: 'Insect pathologist',
      yearsActive: '1991–1995',
      location: 'Cotonou · Niamey',
    },
    {
      _id: 'p25',
      name: 'P. Bieler',
      slug: 'p-bieler',
      role: 'Agronomist / plant protectionist',
      yearsActive: '1992–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p26',
      name: 'J. Langewald',
      slug: 'j-langewald',
      role: 'Entomologist',
      yearsActive: '1995',
      location: 'Cotonou',
    },
    {
      _id: 'p27',
      name: 'W. Msikita',
      slug: 'w-msikita',
      role: 'Plant pathologist',
      yearsActive: '1995',
      location: 'Cotonou',
    },
    {
      _id: 'p28',
      name: 'W. Modder',
      slug: 'w-modder',
      role: 'Entomologist (visiting)',
      yearsActive: '1992–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p29',
      name: 'J. Stonehouse',
      slug: 'j-stonehouse',
      role: 'Insect pathologist (visiting)',
      yearsActive: '1995',
      location: 'Cotonou',
    },
    {
      _id: 'p30',
      name: 'H. Bottenberg',
      slug: 'h-bottenberg',
      role: 'Entomologist',
      yearsActive: '1991–1992',
      location: 'Cotonou',
    },
    {
      _id: 'p31',
      name: 'H. M. Dreyer',
      slug: 'h-m-dreyer',
      role: 'Entomologist / ecologist',
      yearsActive: '1991–1992',
      location: 'Cotonou',
    },
    {
      _id: 'p32',
      name: 'M. E. Zweigert',
      slug: 'm-e-zweigert',
      role: 'TT&TU head (GTZ)',
      yearsActive: '1991–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p33',
      name: 'J. N. Quaye',
      slug: 'j-n-quaye',
      role: 'Chief administrator, Benin station',
      yearsActive: '1992–1995',
      location: 'Cotonou',
    },
    {
      _id: 'p34',
      name: 'K. F. Cardwell',
      slug: 'k-f-cardwell',
      role: 'Plant pathologist',
      yearsActive: '1991–1995',
      location: 'Cotonou · Ibadan',
    },
    {
      _id: 'p35',
      name: 'K. Wydra',
      slug: 'k-wydra',
      role: 'Plant pathologist',
      yearsActive: '1995',
      location: 'Cotonou',
    },
    {
      _id: 'p36',
      name: 'O. Bonato',
      slug: 'o-bonato',
      role: 'Modeler (ORSTOM)',
      yearsActive: '1995',
      location: 'Cotonou',
    },
    {
      _id: 'p37',
      name: 'N. A. Bosque-Pérez',
      slug: 'n-a-bosque-perez',
      role: 'Entomologist; HPR programme leader',
      yearsActive: '1991–1995',
      location: 'Ibadan',
    },
    {
      _id: 'p38',
      name: 'D. Berner',
      slug: 'd-berner',
      role: 'Parasitic weeds biologist',
      yearsActive: '1991–1995',
      location: 'Ibadan',
    },
    {
      _id: 'p39',
      name: 'L. E. N. Jackai',
      slug: 'l-e-n-jackai',
      role: 'Entomologist',
      yearsActive: '1991–1995',
      location: 'Ibadan',
    },
    {
      _id: 'p40',
      name: 'D. A. Fiorini',
      slug: 'd-a-fiorini',
      role: 'Plant pathologist; Seed Health',
      yearsActive: '1991–1995',
      location: 'Ibadan',
    },
    // Exploration, NARS & modelling (programme literature)
    {
      _id: 'p41',
      name: 'K. M. Lema',
      slug: 'k-m-lema',
      role: 'Early Nigeria releases',
      yearsActive: '1981–1985',
      location: 'Nigeria',
    },
    {
      _id: 'p42',
      name: 'B. Löhr',
      slug: 'b-lohr',
      role: 'South American exploration',
      yearsActive: '1983–1986',
      location: 'Paraguay · Bolivia · Brazil',
    },
    {
      _id: 'p43',
      name: 'A. M. Varela',
      slug: 'a-m-varela',
      role: 'South American exploration',
      yearsActive: '1980s',
      location: 'Neotropics',
    },
    {
      _id: 'p44',
      name: 'M. Yaseen',
      slug: 'm-yaseen',
      role: 'CIBC explorer',
      yearsActive: '1970s–1980s',
      location: 'Neotropics',
    },
    {
      _id: 'p45',
      name: 'A. H. Bokonon-Ganta',
      slug: 'a-h-bokonon-ganta',
      role: 'Parasitoid biology',
      yearsActive: '1980s',
      location: 'Benin',
    },
    {
      _id: 'p46',
      name: 'J. A. Odebiyi',
      slug: 'j-a-odebiyi',
      role: 'Parasitoid biology',
      yearsActive: '1980s',
      location: 'Nigeria',
    },
    {
      _id: 'p47',
      name: 'R. D. Hennessey',
      slug: 'r-d-hennessey',
      role: 'Field biology of cassava mealybug',
      yearsActive: '1980s',
      location: 'Zaire',
    },
    {
      _id: 'p48',
      name: 'A. R. Cudjoe',
      slug: 'a-r-cudjoe',
      role: 'National collaborator',
      yearsActive: '1980s–1990s',
      location: 'Ghana',
    },
    {
      _id: 'p49',
      name: 'S. Korang-Amoakoh',
      slug: 's-korang-amoakoh',
      role: 'National collaborator',
      yearsActive: '1980s–1990s',
      location: 'Ghana',
    },
    {
      _id: 'p50',
      name: 'A. Kiyindou',
      slug: 'a-kiyindou',
      role: 'National collaborator',
      yearsActive: '1980s–1990s',
      location: 'Congo',
    },
    {
      _id: 'p51',
      name: 'A. P. Gutierrez',
      slug: 'a-p-gutierrez',
      role: 'Systems modelling',
      yearsActive: '1980s',
      location: 'UC Berkeley',
    },
    {
      _id: 'p52',
      name: 'J. van Alphen',
      slug: 'j-van-alphen',
      role: 'Host-finding behaviour',
      yearsActive: '1980s–1990s',
      location: 'Univ. of Leiden',
    },
    {
      _id: 'p53',
      name: 'F. I. Nweke',
      slug: 'f-i-nweke',
      role: 'COSCA agricultural economist',
      yearsActive: '1989–1995',
      location: 'Ibadan',
    },
    {
      _id: 'p54',
      name: 'J. Zeddies',
      slug: 'j-zeddies',
      role: 'Economic impact analysis',
      yearsActive: '1990s–2001',
      location: 'Hohenheim',
    },
    {
      _id: 'p55',
      name: 'O. Ajuonu',
      slug: 'o-ajuonu',
      role: 'PHMD collaborator / co-author',
      yearsActive: '1990s',
      location: 'Benin',
    },
  ] satisfies PersonSummary[],
  galleries: [
    {
      _id: 'g1',
      title: 'Ibadan insectary',
      slug: 'ibadan-insectary',
      description: 'Rearing rooms, cassava plants, and the daily choreography of a biological factory.',
      year: 1984,
      location: 'Ibadan',
      photoCount: 0,
    },
    {
      _id: 'g2',
      title: 'Releases over the belt',
      slug: 'releases-over-the-belt',
      description: 'Aircraft, parcels, and the long green geometry of cassava fields from above.',
      year: 1986,
      location: 'Cassava belt',
      photoCount: 0,
    },
  ] satisfies GallerySummary[],
}

export const fallbackStories: StorySummary[] = fallbackHome.latest.concat([
  {
    _id: 'f5',
    title: 'Training the trainers',
    slug: 'training-the-trainers',
    excerpt:
      'The science only mattered if national programmes could carry it after the international team moved on.',
    year: 1991,
    location: 'Regional workshops',
    narrator: {name: 'Archive', slug: 'archive'},
  },
  {
    _id: 'f6',
    title: 'When the mealybug went quiet',
    slug: 'when-the-mealybug-went-quiet',
    excerpt:
      'Success looked like nothing happening — fields that no longer whitened, markets that stayed open.',
    year: 1990,
    location: 'Cassava belt',
    narrator: {name: 'Field notes', slug: 'archive'},
  },
])

/**
 * Programme primer from docs/programme-intro-draft.md (research-checked).
 * Estimates attributed; no invented quotes. Bug jokes live on the page UI.
 */
export const fallbackProgramme: ProgrammeContent = {
  title: 'Cassava, a mealybug, and a wasp',
  lede:
    'In the late 1970s, a tiny South American mealybug threatened Africa’s drought-hardy staple — cassava — from Senegal toward Mozambique. At IITA in Ibadan, a classical biological-control programme answered with biology rather than a spray campaign the size of a continent. The insect at the centre was a gnat-sized parasitoid wasp. The human cast was everyone on and around the stations: insectary staff, national entomologists, pilots, drivers, quarantine officers, spouses and kids on compound, and the farmers who noticed when the white stuff stopped winning.',
  body: null,
  timeline: [
    {
      year: '1500s',
      title: 'Cassava without its neighbours',
      detail:
        'Cassava reaches Africa from South America without the insects that keep its pests quiet in the Amazon. A sturdy staple — and an open invitation if the wrong hitchhiker arrives.',
    },
    {
      year: 'c. 1973',
      title: 'An uninvited guest',
      detail:
        'Cassava mealybug (Phenacoccus manihoti) is reported devastating fields in Congo / Zaire — almost certainly on plant cuttings. Soft-bodied, sap-sucking, and able to reproduce without males. Fields bleach with honeydew and sooty mould; “candlestick” damage follows.',
    },
    {
      year: '1979',
      title: 'Programme begins at IITA',
      detail:
        'Hans R. Herren joins IITA in Ibadan. The Africa-wide Biological Control Programme starts as exploration, quarantine, mass rearing, and release — at first with essentially one staff member.',
    },
    {
      year: '1981',
      title: 'The right enemy of the enemy',
      detail:
        'CIAT finds the pest at low density in Paraguay. Among natural enemies screened via London quarantine is the parasitoid then called Epidinocarsis lopezi (today Anagyrus lopezi). First releases at Ibadan begin in November.',
    },
    {
      year: '1982–86',
      title: 'Factories that buzz — and fly',
      detail:
        'Establishment confirmed after rainy-season survival. Insectaries rear wasps on a living chain of cassava → mealybug → wasp. Ground releases and aerial drops (AIRS) seed populations across the belt, always on request with national partners.',
    },
    {
      year: '1990–95',
      title: 'Wide establishment & recognition',
      detail:
        'By the early 1990s the wasp is established widely (24 countries in period tallies; ~26 by ~2001). IITA and CIAT share the 1990 King Baudouin Award. In 1995 Herren receives the World Food Prize. Later: Right Livelihood Award (2013).',
    },
  ],
}

/** Long-form sections for /programme when Sanity body is empty. From programme-intro-draft.md. */
export const programmeSections = [
  {
    heading: 'The crop, the pest, the problem',
    paragraphs: [
      'Cassava (Manihot esculenta) came to Africa from South America in the 1500s. It became a staple for hundreds of millions: carbohydrates in the roots, protein and vitamins in the leaves, and a crop that stays in the ground when the rains fail. What did not come with it, for centuries, was the neighbourhood of insects that keep cassava pests quiet in the Amazon.',
      'In the early 1970s — first reports around 1973 — an unknown mealybug began devastating fields in Congo (Brazzaville) and Zaire (now DR Congo). It was formally described in 1977 as Phenacoccus manihoti. Because cassava travels as stem cuttings, the pest almost certainly hitchhiked on plant material. Soft-bodied, sap-sucking, and able to reproduce without males (parthenogenesis — an all-female army), it exploded where nothing was waiting to eat it.',
      'Farmers and officials first talked about a “candlestick” affliction: leaves gone, bare stalks standing like candles. Damage was insect work, not a pathogen. Documented tuber-yield losses reached about 80% in the worst places; peak infestations could put more than a thousand mealybugs on a single shoot tip. Chemical spraying was tried. Across smallholder mixed-cropping it was expensive, impractical, and temporary. Someone needed a plan that could travel as far as the pest had — and keep working after the project vehicles left.',
    ],
  },
  {
    heading: 'Classical biological control, in plain language',
    paragraphs: [
      'The idea is older than the programme and younger than the crop: find the pest’s natural enemies where pest and crop evolved together; screen them carefully; introduce them so the invader meets the neighbour it left behind. Cassava is Amazonian. So is P. manihoti. In its homeland the mealybug is usually rare — kept that way by parasitoids and predators. In Africa that neighbourhood was missing. Search South America.',
      'Early hunts hit a false start: a look-alike mealybug in the Caribbean and northern South America turned out to be a different species (later P. herreni), and its parasitoids would not attack the African pest. Frustrating, but useful — biology does not care about our deadlines.',
      'The breakthrough came in 1981. Scientists of CIAT found P. manihoti at low density in Paraguay. Among natural enemies collected via CIBC and later exploration teams was a tiny wasp then called Epidinocarsis lopezi (later Apoanagyrus lopezi; today often Anagyrus lopezi). A female lays a single egg inside a mealybug; the larva eats the host from within and leaves a “mummy.” Host-specific. Precision labour the size of a comma.',
      'Hans R. Herren arrived at IITA in 1979 — Swiss entomologist, early thirties, initially the sole staff of what became the Africa-wide Biological Control Programme. He led and built the campaign — not as a lone collector with a butterfly net, but with a wide team. CIAT located the pest in Paraguay; explorers including CIBC’s M. Yaseen and later GTZ/IITA teams (among them B. Löhr and A. M. Varela) gathered enemies; quarantine ran through Silwood Park in England. Shipments were screened so wasps would not harm bees or silkworms, and so hyperparasitoids (parasites of the parasite — the office politics of the insect world) did not sneak in.',
    ],
  },
  {
    heading: 'Ibadan, insectaries, and airplanes',
    paragraphs: [
      'First releases of E. lopezi at IITA/Ibadan began in November 1981 (start of the dry season). By late 1982, after a second release near Abeokuta and a rainy season survived, permanent establishment was confirmed. Within a few years the wasp had raced across southwestern Nigeria — one of the fastest dispersals ever recorded for such a tiny wasp.',
      'Mass rearing was a living Russian doll: grow cassava in pots, grow mealybugs on the plants, grow wasps on the mealybugs. Quality mattered more than raw headcount; for inoculative releases, sometimes fewer than a hundred wasps established a new population. Still, the insectaries became industrial — dozens of rearing units, mechanized cages, schedules that never quite slept, and a smell veterans remember as honeydew and damp green.',
      'Releases went out only on request from national programmes, always with local collaborators. Ground crews carried parcels to chosen fields. Then came the flying chapter: IITA’s Automatic Insect Release System (AIRS), built with Austrian and Swiss partners, installed in a twin turbo-prop, to drop wasps over hard-to-reach stretches of the cassava belt. Herren later described wasps “packaged in a way that they could be shot out of an airplane travelling at 300 kilometres per hour or more across Africa, from Senegal on one side to Mozambique on the other” (swissinfo interview, 2011).',
      'The World Food Prize Foundation has described aerial release as “almost 2,000 wasps per second” — a vivid picture of the method. According to Right Livelihood, some 1.6 million wasps were released between 1982 and 1993 across 24 countries. By around 2001 the wasp was established in about 26 African countries. Madagascar notably stayed free of the pest through the mid-1990s.',
    ],
  },
  {
    heading: 'What quiet control looked like',
    paragraphs: [
      'When classical biological control works, daily life can look oddly ordinary again. Fields stop whitening. Yields recover. Markets stay open. The wasp does not send a press release.',
      'Peer-reviewed work documents sharp drops in damage after establishment, control in roughly 95% of fields by the end of the 1980s, and exclusion experiments showing the wasp — not weather alone — was the key factor. Equilibrium has held for decades. Economic analysis (Zeddies and colleagues, 2001) found benefit–cost ratios on the order of 200 (world cassava price) up to several hundred at intra-African prices — for a programme that, spread over the belt and decades, cost on the order of cents per hectare per year.',
      'The most-repeated human figure — “saved upward of 20 million lives” — comes from World Food Prize / biography accounts as an estimate of famine averted. Cassava fed on the order of 200 million people; protecting it mattered whether or not anyone can put a single number on every meal saved. This site is not here to restate that number as a victory lap — it is here for the people who lived the work.',
      'In 1990, IITA and CIAT jointly received the CGIAR King Baudouin Award. In 1995, Herren received the World Food Prize (presented 16 October 1995 in Washington). He later received the Right Livelihood Award (2013). Last African releases wound down around 1994. When the mealybug later hit Thailand, IITA’s Georg Goergen hand-carried a starter colony of about 500 wasps from Benin to Bangkok. Biology has a long passport stamp.',
    ],
  },
  {
    heading: 'Why this site exists',
    paragraphs: [
      'People who lived the programme are growing older. The papers are on shelves and in DOIs. The texture is still in kitchens, photo albums, compound jokes, and the odd story that only makes sense if you have ever counted wasps before breakfast — or waited for a parent who was still in the insectary.',
      'biologicalcontrol.org is modelled on a folklore archive: find someone you remember, share a story from the compound, caption a photograph. We will keep the primer accurate. We need you for the rest — the night the generator failed, the collaborator who drove all night, the field that finally looked green again, the name misspelled on a shipping label, the kids racing between houses after dark.',
      'If you were in quarantine, in an insectary, on a release flight, in a national programme office, on a farm that stopped looking like a candlestick factory, or living on station beside someone who was: write it down. Families welcome. Two paragraphs count. A name on a photograph counts. Folklore survives on specifics.',
    ],
  },
]

export function fallbackStory(slug: string) {
  const meta = fallbackStories.find((s) => s.slug === slug)
  if (!meta) return null
  return {
    ...meta,
    body: [
      {
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            text: `${meta.excerpt} This stub is waiting for a first-person telling. If you were there — staff, spouse, kid on station, national-programme friend — this is the place to write it down.`,
          },
        ],
      },
      {
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            text: 'biologicalcontrol.org is modelled on folklore.org: short, specific, human stories from the community that shared the compound. Replace this placeholder with your memory.',
          },
        ],
      },
    ],
    people: [],
    themes: [],
    mainImage: null,
    publishedAt: null,
  }
}
