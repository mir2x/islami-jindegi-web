// The official Google Play triangle is four separately-colored strokes, which
// react-icons only ships as a single flat-fill path — this splits that same
// path geometry into four <path> elements so each can carry its own color.
export function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
      <path fill="#01B7F2" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
      <path fill="#12C980" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" />
      <path fill="#FBBC04" d="M472.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" />
      <path fill="#FA3E4E" d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
    </svg>
  )
}
