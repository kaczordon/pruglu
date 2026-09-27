// Demo data shared by the Compose and Sent pages. Everything is deterministic so
// pages look the same on every request (and on every serverless instance).

export type Person = { name: string; email: string }
export type Group = { id: string; name: string; members: Person[] }

const FIRST = ['Ava', 'Ben', 'Chloe', 'Dev', 'Elena', 'Finn', 'Grace', 'Hugo', 'Iris', 'Jonah', 'Kai', 'Lena', 'Milo', 'Nora', 'Owen', 'Priya', 'Quinn', 'Rosa', 'Sam', 'Tara']
const LAST = ['Adams', 'Brooks', 'Chen', 'Diaz', 'Evans', 'Fischer', 'Garcia', 'Hughes', 'Ito', 'Jensen', 'Khan', 'Lopez', 'Murphy', 'Novak', 'Okafor', 'Park', 'Reyes', 'Singh', 'Torres', 'Walsh']

const DEPARTMENT_NAMES = ['Production', 'Camera', 'Grip', 'Electric', 'Art', 'Sound', 'Wardrobe', 'Locations']
const ROLES: string[][] = [
  ['Producer', 'Line Producer', 'Production Coordinator', 'Production Assistant'],
  ['Director of Photography', '1st AC', '2nd AC', 'Camera Operator'],
  ['Key Grip', 'Best Boy Grip', 'Dolly Grip'],
  ['Gaffer', 'Best Boy Electric', 'Electrician'],
  ['Production Designer', 'Art Director', 'Set Decorator'],
  ['Sound Mixer', 'Boom Operator'],
  ['Costume Designer', 'Wardrobe Supervisor'],
  ['Location Manager', 'Location Scout'],
]

export type Contact = Person & { id: number; role: string; department: string }

// Unique names for up to 400 people: same first name ⇒ different last name
export const CREW: Contact[] = Array.from({ length: 120 }, (_, i) => {
  const first = FIRST[i % FIRST.length]
  const last = LAST[(i * 7 + Math.floor(i / FIRST.length)) % LAST.length]
  const d = i % DEPARTMENT_NAMES.length
  const roles = ROLES[d]
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${first}.${last}@example.com`.toLowerCase(),
    department: DEPARTMENT_NAMES[d],
    role: roles[Math.floor(i / DEPARTMENT_NAMES.length) % roles.length],
  }
})

export const findContact = (id: number) => CREW.find((c) => c.id === id)

// Stepping by 3 through the crew never repeats for up to 40 picks
const pick = (start: number, count: number) =>
  Array.from({ length: count }, (_, k) => CREW[(start + k * 3) % CREW.length])

export const LISTS: Group[] = (
  [
    ['Call Sheets', 27],
    ['Crew List - General', 15],
    ['Deal Memos - Confidential', 4],
    ['Deal Memos - General', 8],
    ['Oneline/DOODs', 17],
    ['Prep Schedule', 16],
    ['Scripts', 25],
  ] as const
).map(([name, count], i) => ({ id: `list-${i}`, name, members: pick(i * 5, count) }))

export const DEPARTMENTS: Group[] = DEPARTMENT_NAMES.map((name, d) => ({
  id: `dept-${d}`,
  name,
  members: CREW.filter((c) => c.department === name).slice(0, 12),
}))

// ---- Sent messages -------------------------------------------------------------

export const DELIVERY_STATUSES = ['sent', 'received', 'opened', 'bounced', 'deferred', 'dropped'] as const
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]
export const FAILED: ReadonlySet<DeliveryStatus> = new Set(['bounced', 'deferred', 'dropped'])

export type SentMessage = { id: number; title: string; sentAt: Date; kind: 'call-sheet' | 'prelim' | 'wrap' }
export type Delivery = { person: Person; status: DeliveryStatus }

// Small seeded PRNG (mulberry32) so each message always gets the same recipients
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const LAST_SHOOT_DAY = Date.UTC(2026, 8, 25)
const DAY_MS = 86_400_000

// Three messages per shooting day, newest first: call sheet, prelim report, wrap report
export const SENT: SentMessage[] = Array.from({ length: 120 }, (_, i) => {
  const dayIndex = Math.floor(i / 3)
  const day = 40 - dayIndex
  const kind = (['wrap', 'prelim', 'call-sheet'] as const)[i % 3]
  const title = {
    'call-sheet': `PRU - Call Sheet, Day ${day}`,
    prelim: `PRU - Prelim Production Report - Day ${day}`,
    wrap: `PRU - Wrap Report - Day ${day}`,
  }[kind]
  // Later in the day for later message types
  const hour = { 'call-sheet': 18, prelim: 20, wrap: 22 }[kind]
  return { id: 120 - i, title, kind, sentAt: new Date(LAST_SHOOT_DAY - dayIndex * DAY_MS + hour * 3_600_000) }
})

export const findSent = (id: number) => SENT.find((m) => m.id === id)

export const deliveriesFor = (message: SentMessage): Delivery[] => {
  const random = seeded(message.id)
  const size = message.kind === 'call-sheet' ? 90 + Math.floor(random() * 30) : 30 + Math.floor(random() * 40)
  // Fisher–Yates shuffle, then take the first `size`
  const people = [...CREW]
  for (let i = people.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[people[i], people[j]] = [people[j], people[i]]
  }
  people.length = size
  return people
    .map((person) => {
      const r = random()
      const status: DeliveryStatus =
        r < 0.8 ? 'opened' : r < 0.88 ? 'received' : r < 0.95 ? 'sent' : r < 0.975 ? 'bounced' : r < 0.99 ? 'deferred' : 'dropped'
      return { person, status }
    })
    .sort((a, b) => a.person.name.localeCompare(b.person.name))
}

export const MESSAGE_BODIES: Record<SentMessage['kind'], string> = {
  'call-sheet': "Hi {{recipient_name}}, please find tomorrow's call sheet attached. Crew call is 7:00 AM at basecamp.",
  prelim: 'Hi {{recipient_name}}, the preliminary production report for today is attached.',
  wrap: "Hi {{recipient_name}}, that's a wrap for today. The wrap report is attached. Thanks, everyone!",
}

// ---- Contacts ------------------------------------------------------------------

// Names of the distribution lists a contact is on, e.g. ["Call Sheets", "Scripts"]
export const listsFor = (contact: Person) =>
  LISTS.filter((list) => list.members.some((m) => m.email === contact.email)).map((list) => list.name)

export const SECURITY_GROUPS = ['ADMIN', 'EXEC', 'DTR', 'CREW'] as const
export type SecurityGroup = (typeof SECURITY_GROUPS)[number]
