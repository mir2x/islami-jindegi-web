export interface Author {
  id: string
  name: string
  info: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  title: string
  position: number
  parentId: string | null
  children: Category[]
  createdAt: string
  updatedAt: string
}

export interface BookDetail {
  id: string
  title: string
  excerpt: string | null
  publisher: string | null
  price: string | null
  language: string
  coverUrl: string | null
  documentUrl: string | null
  position: number
  publishedAt: string | null
  published: boolean
  createdAt: string
  updatedAt: string
  authors: Author[]
  categories: Category[]
  chapters: Chapter[]
}

export interface Book {
  id: string
  title: string
  excerpt: string | null
  publisher: string | null
  price: string | null
  language: string
  coverUrl: string | null
  documentUrl: string | null
  position: number
  publishedAt: string | null
  published: boolean
  createdAt: string
  updatedAt: string
  authors: Author[]
  categories: Category[]
}

export interface Chapter {
  id: string
  title: string
  body: string | null
  position: number
  subChapters: SubChapter[]
}

export interface SubChapter {
  id: string
  title: string
  body: string
  position: number
}

export interface PagedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
