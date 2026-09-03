import type { Category } from '@/types'

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
