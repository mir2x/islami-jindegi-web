import { Header } from '@/components/public/header'

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="shrink-0 border-b border-border/60 z-50 bg-background/95">
        <Header />
      </div>
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {children}
      </div>
    </div>
  )
}
