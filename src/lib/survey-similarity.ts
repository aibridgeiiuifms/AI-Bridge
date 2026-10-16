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
 * Extracts student registration number and department details if available.
 */
function extractStudentDetails(email: string): { reg: string; dept?: string } | null {
  const clean = (email || '').replace(/\s+/g, '').toLowerCase().replace(/\.$/, '');
  const user = clean.split('@')[0].split('.iiu')[0];

  // Modern Format: 025580bsirf26 or 011283/bsirs25
  const m1 = user.match(/(\d{4,7})[/\-_]?([a-z]+?)([fs]\d{2})?/);
  if (m1) return { reg: m1[1], dept: m1[2].toUpperCase() };

  // Senior Format: zain.bsba126
  const m2 = user.match(/^[a-z]+[._-]([a-z]+?)(\d+)$/);
  if (m2) return { reg: m2[2], dept: m2[1].toUpperCase() };

  return null;
}

/**
 * Calculates email similarity percentage between 0 and 1.
 * 
 * CRITICAL GUARDS:
 * 1. For Institutional Student Emails: If registration numbers do NOT match, they are TWO DIFFERENT STUDENTS.
 *    Similarity is 0! (Prevents classmates in the same department/semester from matching because they share @student.iiu.edu.pk).
 * 2. If registration numbers match exactly and domain had a typo (e.g. @sgudent or missing @), returns 98% match.
 * 3. For Personal Emails: The username prefix before '@' must independently be at least 80% similar.
 */
export function calculateEmailSimilarity(email1: string, email2: string): number {
  const s1 = (email1 || '').replace(/\s+/g, '').toLowerCase().replace(/\.$/, '');
  const s2 = (email2 || '').replace(/\s+/g, '').toLowerCase().replace(/\.$/, '');

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  const det1 = extractStudentDetails(s1);
  const det2 = extractStudentDetails(s2);

  // GUARD 1: If both emails have student registration numbers, they MUST match.
  // If they differ (e.g. 005044 vs 009999), they are completely different human beings.
  if (det1?.reg && det2?.reg && det1.reg !== det2.reg) {
    return 0;
  }

  // GUARD 2: If both registration numbers match, this is definitely the same student!
  if (det1?.reg && det2?.reg && det1.reg === det2.reg) {
    const user1 = s1.split('@')[0].split('.iiu')[0].replace(/[^a-z0-9]/g, '');
    const user2 = s2.split('@')[0].split('.iiu')[0].replace(/[^a-z0-9]/g, '');
    if (user1 === user2) {
      return 0.98; // 98% match (domain/separator typo)
    }
  }

  // GUARD 3: If one is institutional with a reg number and the other is a personal email (or different),
  // they cannot be matched as a simple typo.
  if ((det1?.reg && !det2?.reg) || (det2?.reg && !det1?.reg)) {
    return 0;
  }

  // GUARD 4: For personal/general emails, check username prefix similarity independently.
  const u1 = s1.split('@')[0];
  const u2 = s2.split('@')[0];
  const uMax = Math.max(u1.length, u2.length);
  const uDist = levenshteinDistance(u1, u2);
  const userSimilarity = 1 - uDist / uMax;

  // If the usernames before '@' are different (e.g. tayyab vs ahmed), do not match even if both are @gmail.com!
  if (userSimilarity < 0.80) {
    return 0;
  }

  // Full string Levenshtein distance
  const maxLen = Math.max(s1.length, s2.length);
  const dist = levenshteinDistance(s1, s2);
  return 1 - dist / maxLen;
}
