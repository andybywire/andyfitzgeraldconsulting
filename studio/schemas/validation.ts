import {type ObjectItem} from 'sanity'

/**
 * Shared array-uniqueness validators.
 *
 * The band system resolves in three tiers — document, then page-type override in
 * Settings, then the Settings default — and each tier is an array holding at most one
 * band of each kind. "At most one" is not expressible in Sanity's schema language, so
 * every one of those arrays needs the same custom rule. There were five copies of it
 * before this file existed, which is four more places for the message to drift.
 *
 * Returning `paths` rather than a bare message is what makes the error land on the
 * offending array ITEMS instead of on the array as a whole, so the editor sees which
 * entries collide rather than being told that something, somewhere, does.
 */

type Predicate<T> = (items: T[] | undefined) => true | {paths: {_key: string}[][]; message: string}

/**
 * Flags every item sharing a key with another item, where the key is whatever `pick`
 * returns. Items with no `_key` or no pickable value are skipped rather than grouped:
 * an entry the editor has not filled in yet is incomplete, not duplicated, and
 * `required()` is the rule that should complain about it.
 */
function uniqueBy<T extends ObjectItem>(pick: (item: T) => string | undefined, message: string) {
  const check: Predicate<T> = (items) => {
    if (!items) return true

    const groups = new Map<string, T[]>()
    for (const item of items) {
      const value = pick(item)
      if (!value || !item._key) continue
      groups.set(value, [...(groups.get(value) ?? []), item])
    }

    const paths = [...groups.values()]
      .filter((group) => group.length > 1)
      .flatMap((group) => group.map((item) => [{_key: item._key}]))

    return paths.length ? {paths, message} : true
  }

  return check
}

/**
 * For any array of band objects — the Settings default set, a page-type override set,
 * or a single document's custom set.
 *
 * Grouped by `_type` off the items themselves rather than against a list of the three
 * band names. The list would be a fourth place to remember a new band type, and it
 * would silently stop guarding one the day someone forgot.
 */
export const uniqueBandTypes = uniqueBy<ObjectItem>(
  (item) => item._type,
  'Each kind of band may only appear once here.',
)

/**
 * For `settings.bandOverrides`. Two entries naming the same document type would make
 * resolution depend on array order, which is invisible to the editor and arbitrary.
 */
export const uniqueDocumentTypes = uniqueBy<ObjectItem & {documentType?: string}>(
  (item) => item.documentType,
  'Each document type may only be overridden once. Combine the bands into one entry.',
)
