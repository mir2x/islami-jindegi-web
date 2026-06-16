import { ClassicHome } from '@/components/public/home/classic-home'
import {
  getRecentBooks, getRecentBayans, getRecentMalfuzat,
  getRecentArticles, getRecentNews,
} from '@/lib/public-api'

export const metadata = { title: 'ইসলামী যিন্দেগী' }

export default async function HomePage() {
  const [books, bayans, malfuzat, articles, news] = await Promise.all([
    getRecentBooks(8),
    getRecentBayans(8),
    getRecentMalfuzat(8),
    getRecentArticles(8),
    getRecentNews(8),
  ])

  return (
    <ClassicHome
      books={books}
      bayans={bayans}
      malfuzat={malfuzat}
      articles={articles}
      news={news}
    />
  )
}
