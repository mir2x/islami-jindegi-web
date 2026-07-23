export interface AyahBox {
  ayah_number: number
  box_id: number
  max_x: number
  max_y: number
  min_x: number
  min_y: number
  page_number: number
  sura_number: number
}

export interface MushafEdition {
  id: string
  title: string
  width: number
  height: number
  ext: string
  totalPages: number
  pagesBaseUrl: string
  ayahBoxesUrl: string
}

export type MediaType = 'image' | 'audio' | 'document'

export interface MediaItem {
  id: string
  fileName: string
  url: string
  type: MediaType
  mimeType: string
  size: number
  width: number | null
  height: number | null
  createdAt: string
  updatedAt: string
}

export interface Author {
  id: string
  name: string
  info: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export interface Admin {
  id: string
  email: string
  displayName: string | null
  createdAt: string
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
  chapterCount: number
}

export interface SubChapter {
  id: string
  title: string
  body: string | null
  position: number
  parentSubChapterId: string | null
}

export interface Chapter {
  id: string
  title: string
  body: string | null
  position: number
  subChapters: SubChapter[]
}

export interface BookDetail extends Book {
  chapters: Chapter[]
}

export interface ChapterListItem {
  id: string
  title: string
  position: number
  bookId: string
  bookTitle: string
  subChapterCount: number
}

export interface SubChapterListItem {
  id: string
  title: string
  position: number
  chapterId: string
  chapterTitle: string
  bookId: string
  bookTitle: string
  parentSubChapterId: string | null
}

export interface ChapterDetail {
  id: string
  title: string
  body: string | null
  position: number
  bookId: string
  bookTitle: string
  subChapters: SubChapter[]
}

export interface SubChapterDetail {
  id: string
  title: string
  body: string | null
  position: number
  chapterId: string
  chapterTitle: string
  bookId: string
  bookTitle: string
  parentSubChapterId: string | null
}

export interface PagedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface MalfuzatListItem {
  id: string
  title: string
  excerpt: string | null
  language: string
  hasAudio: boolean
  audioUrl: string | null
  published: boolean
  publishedAt: string | null
  position: number | null
  createdAt: string
  updatedAt: string
  author: Author
  categories: Category[]
}

export interface MalfuzatDetail extends MalfuzatListItem {
  body: string | null
  documentUrl: string | null
}

export interface MalfuzatAuthorOption {
  id: string
  name: string
  count: number
}

export interface MalfuzatCategoryOption {
  id: string
  title: string
  count: number
}

export interface MasailListItem {
  id: string
  title: string
  language: string
  hasAudio: boolean
  audioUrl: string | null
  published: boolean
  publishedAt: string | null
  position: number
  createdAt: string
  updatedAt: string
  author: Author | null
  categories: Category[]
}

export interface MasailDetail extends MasailListItem {
  question: string
  answer: string | null
  documentUrl: string | null
}

export interface MasailAuthorOption {
  id: string
  name: string
  count: number
}

export interface MasailCategoryOption {
  id: string
  title: string
  count: number
}

export interface DuaListItem {
  id: string
  title: string
  excerpt: string | null
  language: string
  audioUrl: string | null
  published: boolean
  position: number
  createdAt: string
  updatedAt: string
  categories: Category[]
}

export interface DuaDetail extends DuaListItem {
  body: string
  documentUrl: string | null
}

export interface DuaCategoryOption {
  id: string
  title: string
  count: number
}

export interface BayanListItem {
  id: string
  title: string
  excerpt: string | null
  language: string
  location: string | null
  audioUrl: string | null
  published: boolean
  publishedAt: string
  position: number
  createdAt: string
  updatedAt: string
  author: Author
  categories: Category[]
}

export type BayanDetail = BayanListItem

export interface BayanAuthorOption {
  id: string
  name: string
  count: number
}

export interface BayanCategoryOption {
  id: string
  title: string
  count: number
}

export interface BookAuthorOption {
  id: string
  name: string
  count: number
}

export interface BookCategoryOption {
  id: string
  title: string
  count: number
}

export interface ArticleListItem {
  id: string
  title: string
  excerpt: string | null
  language: string
  published: boolean
  publishedAt: string | null
  position: number | null
  createdAt: string
  updatedAt: string
  author: Author | null
  categories: Category[]
}

export interface ArticleDetail extends ArticleListItem {
  body: string
  documentUrl: string | null
}

export interface ArticleAuthorOption {
  id: string
  name: string
  count: number
}

export interface ArticleCategoryOption {
  id: string
  title: string
  count: number
}

export interface NewsListItem {
  id: string
  title: string
  excerpt: string | null
  language: string
  published: boolean
  publishedAt: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export interface NewsDetail extends NewsListItem {
  body: string
}

export interface PageListItem {
  id: string
  title: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface PageDetail extends PageListItem {
  body: string
  imageUrl: string | null
}


export interface MadrasahInfoItem {
  id: string | null
  label: string
  info: string
  position: number
}

export interface MadrasahPhotoItem {
  id: string | null
  title: string
  imageUrl: string
  position: number
}

export interface MadrasahListItem {
  id: string
  title: string
  excerpt: string | null
  position: number
  infoCount: number
  photoCount: number
  createdAt: string
  updatedAt: string
}

export interface MadrasahDetail {
  id: string
  title: string
  excerpt: string | null
  introduction: string
  position: number
  infos: MadrasahInfoItem[]
  photos: MadrasahPhotoItem[]
  createdAt: string
  updatedAt: string
}

export interface NamazTimeListItem {
  id: string
  title: string
  titleBn: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export interface NamazTimeDetail {
  id: string
  title: string
  titleBn: string | null
  masail: string
  fazail: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export interface QuranSurah {
  number: number
  nameArabic: string
  nameBengali: string
  nameEnglish: string
  transliteration: string
  totalAyahs: number
  revelationType: 'Meccan' | 'Medinan'
  paraNumber: number
}

export interface QuranWord {
  id: number
  arabic: string
  bengali: string
}

export interface QuranTranslation {
  translator: string
  text: string
}

export interface QuranTafsir {
  id: string
  name: string
  text: string
}

export interface QuranAyah {
  number: number
  arabic: string
  translations: QuranTranslation[]
  words: QuranWord[]
  tafsirs: QuranTafsir[]
}

// The surah-detail endpoint (`/api/quran/surahs/{n}/ayahs`) returns `surahNumber`, not `number`
// like the surah-list endpoint — Omit + explicit field keeps this type honest about that.
export interface QuranSurahDetail extends Omit<QuranSurah, 'number'> {
  surahNumber: number
  ayahs: QuranAyah[]
}

export interface QuranAyahDetail {
  surahNumber: number
  ayahNumber: number
  arabic: string
  translations: QuranTranslation[]
  words: QuranWord[]
  tafsirs: QuranTafsir[]
}

export interface QuranReciter {
  id: string
  name: string
}

export interface QuranSearchHit {
  surahNumber: number
  surahName: string
  ayahNumber: number
  arabic: string
  translations: QuranTranslation[]
}

export interface SuraAudioUrls {
  urls: string[]
  totalAyahs: number
  totalDownloadSizeBytes: number
  totalDownloadSizeMB: number
}

export interface HijriMonthSighting {
  id: string
  countryCode: string
  hijriYear: number
  hijriMonth: number
  monthNameEn: string
  monthNameAr: string
  monthNameBn: string
  gregorianStartDate: string // YYYY-MM-DD
  createdAt: string
  updatedAt: string
}
