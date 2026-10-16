/**
 * Calculates Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = [];

  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }

  return d[m][n];
}

/**
 * Calculates email similarity percentage between 0 and 1.
 * Evaluates both the full email address and the institutional roll/degree local prefix.
 */
export function calculateEmailSimilarity(email1: string, email2: string): number {
  const s1 = (email1 || '').replace(/\s+/g, '').toLowerCase().replace(/\.$/, '');
  const s2 = (email2 || '').replace(/\s+/g, '').toLowerCase().replace(/\.$/, '');

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  // 1. Overall full-string Levenshtein similarity
  const maxLen = Math.max(s1.length, s2.length);
  const dist = levenshteinDistance(s1, s2);
  const overallSimilarity = 1 - dist / maxLen;

  // 2. Local-part / Student Registration Prefix Match
  // e.g. 007452bspksf24 from 007452bspksf24.iiu.edu.pk or 007452bspksf24@student.iiu.edu.pk
  const local1 = s1.split('@')[0].split('.iiu')[0].replace(/[^a-z0-9]/g, '');
  const local2 = s2.split('@')[0].split('.iiu')[0].replace(/[^a-z0-9]/g, '');

  if (local1 && local2 && local1.length >= 6 && local2.length >= 6) {
    if (local1 === local2) {
      // Exactly matching student ID & degree code despite mistyped domain/separator
      return Math.max(overallSimilarity, 0.95);
    }

    const localMax = Math.max(local1.length, local2.length);
    const localDist = levenshteinDistance(local1, local2);
    const localSim = 1 - localDist / localMax;

    if (localSim >= 0.85) {
      return Math.max(overallSimilarity, localSim);
    }
  }

  return overallSimilarity;
}
