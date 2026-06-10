import { type NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = ['static.islamijindegi.com', 'fly.storage.tigris.dev']

function isAllowed(urlStr: string): boolean {
  try {
    const { hostname } = new URL(urlStr)
    return ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url || !isAllowed(url)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const upstream = await fetch(url, { cache: 'force-cache' })
  if (!upstream.ok) {
    return new NextResponse('Not found', { status: upstream.status })
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
