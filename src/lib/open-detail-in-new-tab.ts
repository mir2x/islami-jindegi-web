export function openDetailInNewTab(path: string) {
  const locale = document.documentElement.lang
  const localizedPath = `/${locale}${path}`
  window.open(new URL(localizedPath, window.location.origin).href, '_blank', 'noopener,noreferrer')
}
