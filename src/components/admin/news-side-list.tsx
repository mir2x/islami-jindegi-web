'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNewsStore } from '@/store/news-store'
import type { NewsListItem, PagedResult } from '@/types'

interface Props {
  currentId?: string
}

export function NewsSideList({ currentId }: Props) {
  const lastSort = useNewsStore(s => s.lastParams.sort) || 'position_desc'
  const [items, setItems] = useState<NewsListItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  
  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: '1', pageSize: '5000', sort: lastSort })
      const res = await api.get<PagedResult<NewsListItem>>(`/api/news?${q}`)
      setItems(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [lastSort])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    String(item.position).includes(search)
  )

  // Scroll to active item on mount or when ID changes
  const activeItemRef = useRef<HTMLAnchorElement>(null)
  const lastScrolledIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (activeItemRef.current && lastScrolledIdRef.current !== currentId) {
      // Small timeout to ensure DOM is fully painted before scrolling
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      lastScrolledIdRef.current = currentId || null
    }
  }, [currentId, filteredItems.length])

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-80 shrink-0">
      <div className="p-4 border-b border-sidebar-border sticky top-0 bg-sidebar z-10">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search title or position..." 
            className="pl-8 bg-background border-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredItems.map(item => {
          const isActive = currentId === item.id
          return (
            <Link 
              key={item.id} 
              href={`/admin/news/${item.id}/edit`}
              replace
              ref={isActive ? activeItemRef : null}
              className={cn(
                "block px-3 py-2.5 rounded-md text-sm transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <div className="flex items-start gap-2">
                <span className={cn(
                  "text-xs font-mono mt-0.5 shrink-0 opacity-70",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  #{item.position}
                </span>
                <span className="line-clamp-2 leading-tight">
                  {item.title}
                </span>
              </div>
            </Link>
          )
        })}
        
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No news found.
          </div>
        )}
      </div>
    </div>
  )
}
