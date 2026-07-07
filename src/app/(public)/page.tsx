import { ClassicHome } from '@/components/public/home/classic-home'
import {
  getBooks, getBayans, getMalfuzats,
  getArticles, getRecentNews,
} from '@/lib/public-api'

export const metadata = { title: 'ইসলামী যিন্দেগী' }

const HOME_PAGE_SIZE = 8

export default async function HomePage() {
  const [books, bayans, malfuzat, articles, news] = await Promise.all([
    getBooks({ pageSize: HOME_PAGE_SIZE }),
    getBayans({ pageSize: HOME_PAGE_SIZE }),
    getMalfuzats({ pageSize: HOME_PAGE_SIZE }),
    getArticles({ pageSize: HOME_PAGE_SIZE }),
    getRecentNews(8),
  ])

  return (
    <ClassicHome
      books={books?.data ?? []}
      booksTotal={books?.total ?? 0}
      bayans={bayans?.data ?? []}
      bayansTotal={bayans?.total ?? 0}
      malfuzat={malfuzat?.data ?? []}
      malfuzatTotal={malfuzat?.total ?? 0}
      articles={articles?.data ?? []}
      articlesTotal={articles?.total ?? 0}
      news={news}
    />
  )
}
