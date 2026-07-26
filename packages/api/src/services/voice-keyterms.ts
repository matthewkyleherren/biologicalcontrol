/**
 * Deepgram keyterms for biologicalcontrol.org voice stories.
 * Hard cap: 100 (Deepgram replaces the whole list; extras are ignored/rejected).
 *
 * Priority inside the cap:
 * 1. Acronyms / programme terms / places
 * 2. Latin names from the about / programme primer
 * 3. Staff surnames (+ a few full names elders say)
 */

export const VOICE_KEYTERM_LIMIT = 100

/** Spoken forms for the interviewer LLM (not all are keyterms). */
export const VOICE_ACRONYM_HINTS = [
  'IITA — “eye-eye-tee-ay” or “ee-ta”',
  'CIAT — “see-at” or “C-I-A-T”',
  'CIBC / IIBC — “C-I-B-C”, “I-I-B-C”, Silwood Park quarantine',
  'PHMD — Plant Health Management Division',
  'ABCP — Africa-wide Biological Control Programme',
  'NBCP — National Biological Control Programme',
  'TT&TU — Technology Transfer and Training Unit',
  'CGIAR — “see-gar”',
  'GTZ / BMZ — German cooperation',
  'ORSTOM — French research (now IRD)',
  'COSCA — cassava socio-economics',
  'AIRS — Automatic Insect Release System',
  'ESARC — East and Southern Africa Regional Centre',
  'FAO, UNDP, IFAD, USAID, DANIDA',
  'icipe — “i-si-pay”',
].join('; ')

const PROGRAMME_AND_PLACES = [
  'IITA',
  'CIAT',
  'CIBC',
  'IIBC',
  'PHMD',
  'ABCP',
  'NBCP',
  'CGIAR',
  'GTZ',
  'ORSTOM',
  'FAO',
  'biocontrol',
  'biological control',
  'cassava',
  'mealybug',
  'green mite',
  'Cotonou',
  'Ibadan',
  'Benin',
  'Nigeria',
  'Paraguay',
]

const LATIN_NAMES = [
  'Phenacoccus manihoti',
  'Phenacoccus herreni',
  'Epidinocarsis lopezi',
  'Apoanagyrus lopezi',
  'Anagyrus lopezi',
  'Mononychellus tanajoa',
  'Manihot esculenta',
]

/** Staff — core leadership first, then wider roster surnames. */
const STAFF_NAMES = [
  'Herren',
  'Neuenschwander',
  'Yaninek',
  'Hammond',
  'Schulthess',
  'Lomer',
  'Goergen',
  'Markham',
  'Tamò',
  'Tamo',
  'Akibo-Betts',
  'Shanower',
  'Wodageneh',
  'Haug',
  'Megevand',
  'Akinwumi',
  'Boavida',
  'Gold',
  'Borgemeister',
  'Meikle',
  'Le Gall',
  'Kristensen',
  'Paraiso',
  'Bieler',
  'Langewald',
  'Msikita',
  'Modder',
  'Stonehouse',
  'Bottenberg',
  'Dreyer',
  'Zweigert',
  'Quaye',
  'Cardwell',
  'Wydra',
  'Bonato',
  'Bosque-Pérez',
  'Berner',
  'Jackai',
  'Fiorini',
  'Lema',
  'Löhr',
  'Varela',
  'Yaseen',
  'Bokonon-Ganta',
  'Odebiyi',
  'Hennessey',
  'Cudjoe',
  'Korang-Amoakoh',
  'Kiyindou',
  'Gutierrez',
  'van Alphen',
  'Nweke',
  'Zeddies',
  'Ajuonu',
  'Baumgärtner',
  'Schaab',
  'Speijer',
  'Rossel',
  'Hughes',
  'Gauhl',
  'Pasberg-Gauhl',
  'Versteeg',
  'Lefroy',
  'James',
  'Jenkins',
  'Tanigoshi',
  'Mesfin',
  'Awad',
  'Akem',
  'Dahal',
  'Adiovi',
  'Bakare',
  'Gyampong',
  'Olaleye',
  'Ratte',
  'Schill',
  'Lys',
]

/** Deduped, order-preserving, capped for Deepgram. */
export function voiceKeyterms(limit = VOICE_KEYTERM_LIMIT): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const term of [...PROGRAMME_AND_PLACES, ...LATIN_NAMES, ...STAFF_NAMES]) {
    const key = term.trim()
    if (!key) continue
    const norm = key.toLowerCase()
    if (seen.has(norm)) continue
    seen.add(norm)
    out.push(key)
    if (out.length >= limit) break
  }
  return out
}
