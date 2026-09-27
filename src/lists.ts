// Distribution list operations. Each one validates, then saves the whole set of lists.
// They return either the list to show next or a message for the user.
import { CREW } from './data.ts'
import { loadLists, saveLists, type StoredList } from './store.ts'

// The built-in view of every contact; shown like a list but never stored
export const ALL_CONTACTS = 'all'

// `changed` counts people actually added or removed (not already-there, unknown or repeated ids)
export type Result = { ok: true; list: StoredList; changed?: number } | { ok: false; error: string }

const MAX_NAME = 60
const known = new Set(CREW.map((c) => c.id))

const checkName = (raw: unknown, lists: StoredList[]): { name: string } | { error: string } => {
  const name = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : ''
  if (!name) return { error: 'Enter a name for the list.' }
  if (name.length > MAX_NAME) return { error: `Keep the name under ${MAX_NAME} characters.` }
  if (lists.some((l) => l.name.toLowerCase() === name.toLowerCase())) return { error: `A list called “${name}” already exists.` }
  return { name }
}

const newId = () => `list-${crypto.randomUUID().slice(0, 8)}`

// Keeps only real contacts, without duplicates
const cleanIds = (ids: number[]) => [...new Set(ids.filter((id) => known.has(id)))]

const create = async (rawName: unknown, memberIds: number[]): Promise<Result> => {
  const lists = await loadLists()
  const checked = checkName(rawName, lists)
  if ('error' in checked) return { ok: false, error: checked.error }
  const list = { id: newId(), name: checked.name, memberIds: cleanIds(memberIds) }
  await saveLists([...lists, list])
  return { ok: true, list }
}

export const createList = (name: unknown) => create(name, [])

// "All contacts" is a view, not a stored list, so duplicating it copies everyone
export const duplicateList = async (sourceId: string, name: unknown): Promise<Result> => {
  if (sourceId === ALL_CONTACTS) return create(name, [...known])
  const source = (await loadLists()).find((l) => l.id === sourceId)
  if (!source) return { ok: false, error: 'That list no longer exists.' }
  return create(name, source.memberIds)
}

export const mergeLists = async (
  currentId: string,
  otherId: unknown,
  mode: unknown,
  name: unknown
): Promise<Result> => {
  const lists = await loadLists()
  const current = lists.find((l) => l.id === currentId)
  const other = lists.find((l) => l.id === otherId)
  if (!current) return { ok: false, error: 'That list no longer exists.' }
  if (!other || other.id === current.id) return { ok: false, error: 'Choose another list to merge with.' }
  const union = cleanIds([...current.memberIds, ...other.memberIds])

  if (mode === 'into-current') {
    current.memberIds = union
    await saveLists(lists)
    return { ok: true, list: current }
  }
  if (mode === 'into-new') return create(name, union)
  return { ok: false, error: 'Choose where to merge the lists.' }
}

const updateMembers = async (listId: string, change: (ids: number[]) => number[]): Promise<Result> => {
  const lists = await loadLists()
  const list = lists.find((l) => l.id === listId)
  if (!list) return { ok: false, error: 'That list no longer exists.' }
  const before = list.memberIds.length
  list.memberIds = cleanIds(change(list.memberIds))
  await saveLists(lists)
  return { ok: true, list, changed: Math.abs(list.memberIds.length - before) }
}

export const addMembers = (listId: string, ids: number[]) => updateMembers(listId, (current) => [...current, ...ids])

export const removeMembers = (listId: string, ids: number[]) => {
  const drop = new Set(ids)
  return updateMembers(listId, (current) => current.filter((id) => !drop.has(id)))
}
