import { NamazTimesClient } from '@/components/public/namaz-times/namaz-times-client'
import { getNamazTimes } from '@/lib/public-api'

export const metadata = { title: 'নামাযের সময়' }

export default async function NamazTimesPage() {
  const namazTimes = await getNamazTimes()

  return (
    <div className="overflow-y-auto px-4 py-6" style={{ height: 'calc(100vh - 68px)' }}>
      <div className="max-w-2xl mx-auto">
        <NamazTimesClient namazTimes={namazTimes} />
      </div>
    </div>
  )
}
