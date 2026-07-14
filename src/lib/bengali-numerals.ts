const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

/** Converts any ASCII digits within a number/string to Bengali numerals, for display text.
 *  Do NOT use this on values fed into `<input type="number">`, URLs, or query params —
 *  only on rendered Bangla-context text. */
export function bn(n: number | string): string {
  return String(n).replace(/[0-9]/g, d => BENGALI_DIGITS[Number(d)])
}
