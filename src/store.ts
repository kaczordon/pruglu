// Distribution lists are the first data users can change, so they need storage.
//
// With Upstash Redis credentials (added by Vercel's Upstash integration) the lists
// are one JSON document in Redis — the only option that works on deployed Vercel,
// where each function instance has its own disk and memory.
//
// Without Redis they're a JSON file in the OS temp folder. Process memory isn't
// enough even locally: `vercel dev` doesn't keep one long-lived process, so a list
// created by one request was gone by the next.
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CREW, SEED_LISTS, type Contact, type Group } from './data.ts'

export type StoredList = { id: string; name: string; memberIds: number[] }

// One Redis database serves every environment, so each gets its own key: lists
// edited while developing locally never touch what production users see.
const ENV = process.env.VERCEL_ENV ?? 'development'
const KEY = `pruglu:${ENV}:lists`

const seed = (): StoredList[] =>
  SEED_LISTS.map((list) => ({ id: list.id, name: list.name, memberIds: list.members.map((m) => m.id) }))

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

// Upstash's REST API: POST a command as a JSON array, get back { result }
const redis = async (command: string[]) => {
  const res = await fetch(redisUrl!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisToken}` },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error(`Redis ${command[0]} failed with ${res.status}`)
  return ((await res.json()) as { result: unknown }).result
}

const FILE = join(tmpdir(), 'pruglu-lists.json')

export const storage = redisUrl && redisToken ? 'redis' : 'file'

if (storage === 'redis') console.info(`pruglu: distribution lists stored in Upstash Redis (key ${KEY})`)
else if (ENV === 'production' || ENV === 'preview')
  console.warn('pruglu: no Redis configured; distribution list changes will not persist on this deployment')
else console.info(`pruglu: distribution lists stored in ${FILE} (connect Upstash Redis to share them)`)

export const loadLists = async (): Promise<StoredList[]> => {
  if (storage === 'redis') {
    const raw = await redis(['GET', KEY])
    return typeof raw === 'string' ? (JSON.parse(raw) as StoredList[]) : seed()
  }
  try {
    return JSON.parse(await readFile(FILE, 'utf8')) as StoredList[]
  } catch {
    return seed() // first run: nothing saved yet
  }
}

// Read-modify-write of the whole document. Two edits landing at the same moment
// could overwrite each other; acceptable while one production office edits lists.
export const saveLists = async (lists: StoredList[]) => {
  if (storage === 'redis') await redis(['SET', KEY, JSON.stringify(lists)])
  else await writeFile(FILE, JSON.stringify(lists))
}

const byId = new Map(CREW.map((c) => [c.id, c]))

export const toGroup = (list: StoredList): Group => ({
  id: list.id,
  name: list.name,
  members: list.memberIds.map((id) => byId.get(id)).filter((c): c is Contact => !!c),
})

// Lists as Groups, alphabetical — what every page renders
export const getGroups = async () =>
  (await loadLists()).map(toGroup).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
