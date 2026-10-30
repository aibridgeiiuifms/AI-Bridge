/**
 * Normalizes unicode strings to standard characters supported by WinAnsi / standard PDF fonts.
 * Converts smart quotes, special dashes, and decomposed unicode to prevent pdf-lib encoding errors.
 */
export function normalizePdfText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKD')
    // Remove diacritical marks/accents
    .replace(/[\u0300-\u036f]/g, '')
    // Replace smart quotes and special characters
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    // Replace any remaining non-standard characters with safe equivalent
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

/**
 * Ensures recipient name is cleaned and formatted in executive Title Case.
 * Automatically fixes ALL CAPS (e.g. SEHAR WAHEED) and all lowercase (e.g. ali hassan),
 * while preserving single-letter initials like "M." or "Dr.".
 */
export function formatCertificateName(name: string): string {
  if (!name) return 'Participant';
  const clean = normalizePdfText(name);

  const isAllUpper = clean === clean.toUpperCase() && clean !== clean.toLowerCase();
  const isAllLower = clean === clean.toLowerCase() && clean !== clean.toUpperCase();

  if (isAllUpper || isAllLower) {
    return clean
      .split(/\s+/)
      .map((part) => {
        if (/^[A-Z]\.?$/i.test(part)) return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join(' ');
  }
  return clean;
}
