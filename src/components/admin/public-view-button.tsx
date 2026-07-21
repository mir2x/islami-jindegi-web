import { ExternalLink } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  href: string
}

/** Opens the live public-site page for the item being edited, in a new tab. */
export function PublicViewButton({ href }: Props) {
  return (
    <Button
      variant="outline"
      size="sm"
      render={<Link href={href} target="_blank" rel="noopener noreferrer" />}
      className="gap-1.5"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      Public View
    </Button>
  )
}
