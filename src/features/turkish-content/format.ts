/** Title-case Turkish meaning labels without changing stored translations. */
export function formatTurkishMeaning(value: string): string {
  return value.replace(/(^|[\s(/-])(\p{L})/gu, (_, prefix: string, letter: string) =>
    prefix + letter.toLocaleUpperCase("tr-TR"));
}
