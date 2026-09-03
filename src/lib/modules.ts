import type { Author, Category } from '@/types'

/** Module keys must match ContentModules in the API — they are stored in category_modules.Module. */
export const CONTENT_MODULES = [
  { key: 'book', label: 'Books' },
  { key: 'bayan', label: 'Bayan' },
  { key: 'malfuzat', label: 'Malfuzat' },
  { key: 'masail', label: 'Masail' },
  { key: 'dua', label: 'Dua' },
  { key: 'article', label: 'Articles' },
] as const

export type ModuleKey = (typeof CONTENT_MODULES)[number]['key']

export const moduleLabel = (key: string) =>
  CONTENT_MODULES.find(m => m.key === key)?.label ?? key

/**
 * The categories a module actually uses, in that module's own order.
 *
 * Membership used to be implied by "has content", so every picker listed all ~88 categories
 * regardless of module. `category_modules` makes it explicit, and carries the per-module
 * position recovered from the legacy system.
 *
 * Falls back to the full list when no category reports membership: during a deploy the API may
 * still be the older build that does not send `modules`, and empty pickers would be worse than
 * unfiltered ones.
 */
export function categoriesForModule(categories: Category[], module: string): Category[] {
  if (!categories.some(c => c.modules?.length)) return categories.flatMap(c => [c, ...c.children])

  const positionIn = (c: Category) =>
    c.modules?.find(m => m.module === module)?.position ?? Number.MAX_SAFE_INTEGER

  return categories
    .filter(c => c.modules?.some(m => m.module === module))
    .sort((a, b) => positionIn(a) - positionIn(b))
    .flatMap(c => [c, ...c.children])
}

/**
 * The modules that attribute content to an author. Deliberately not `CONTENT_MODULES`: dua has
 * no author, so the author module list is five, not six. Keys match AuthorModules in the API.
 */
export const AUTHOR_MODULES = CONTENT_MODULES.filter(m => m.key !== 'dua')

/**
 * The authors a module actually uses, in that module's own order.
 *
 * The old system had five separate author tables, each with its own position; unifying them
 * collapsed those into one column holding the books ordering. `author_modules` restores the
 * per-module position recovered from the legacy tables.
 *
 * Falls back to the full list when no author reports membership: during a deploy the API may
 * still be the older build that does not send `modules`, and empty pickers would be worse than
 * unfiltered ones.
 */
export function authorsForModule(authors: Author[], module: string): Author[] {
  if (!authors.some(a => a.modules?.length)) return authors

  const positionIn = (a: Author) =>
    a.modules?.find(m => m.module === module)?.position ?? Number.MAX_SAFE_INTEGER

  return authors
    .filter(a => a.modules?.some(m => m.module === module))
    .sort((a, b) => positionIn(a) - positionIn(b))
}
