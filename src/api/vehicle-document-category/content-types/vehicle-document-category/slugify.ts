/**
 * Converts a category name into a URL-safe slug for the required `uid` field.
 * Strips accents, lowercases, and collapses non-alphanumerics into hyphens.
 */
export function slugify(input: string): string {
  return (
    String(input)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> hyphen
      .replace(/^-+|-+$/g, '') || 'categoria'
  );
}
