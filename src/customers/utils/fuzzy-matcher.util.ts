/**
 * Fuzzy Name Matching and Normalization Utility for Client deduplication and grouping
 */
export class FuzzyMatcher {
  private static LEGAL_STOP_WORDS = [
    'private limited',
    'pvt ltd',
    'pvt. ltd.',
    'p. ltd.',
    'p. ltd',
    'p ltd',
    'limited',
    'ltd.',
    'ltd',
    'co-operative',
    'cooperative',
    'coop',
    'joint venture',
    'j.v.',
    'jv',
    'trading',
    'suppliers',
    'supplier',
    'enterprises',
    'enterprise',
    'international',
    'consulting',
    'company',
    'corp',
    'corporation',
    'inc',
    'nepal',
    'pvt',
  ];

  /**
   * Normalize client name by removing legal forms, punctuation, and extra whitespace
   */
  static normalize(str: string): string {
    if (!str) return '';
    let normalized = str.toLowerCase().trim();

    // Replace slashes and hyphens with spaces
    normalized = normalized.replace(/[-/\\&(),.]/g, ' ');

    // Remove stop words
    for (const stopWord of this.LEGAL_STOP_WORDS) {
      const regex = new RegExp(`\\b${stopWord.replace('.', '\\.')}\\b`, 'gi');
      normalized = normalized.replace(regex, ' ');
    }

    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    return normalized;
  }

  /**
   * Levenshtein Distance between two strings
   */
  static levenshteinDistance(s1: string, s2: string): number {
    const a = s1 || '';
    const b = s2 || '';
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Token Set Jaccard Similarity (word-level overlap)
   */
  static tokenJaccardSimilarity(s1: string, s2: string): number {
    const tokens1 = new Set((s1 || '').split(' ').filter(Boolean));
    const tokens2 = new Set((s2 || '').split(' ').filter(Boolean));

    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    let intersectionCount = 0;
    tokens1.forEach((token) => {
      if (tokens2.has(token)) {
        intersectionCount++;
      }
    });

    const unionCount = new Set([...tokens1, ...tokens2]).size;
    return unionCount === 0 ? 0 : intersectionCount / unionCount;
  }

  /**
   * Calculate comprehensive similarity score between two client names (0 to 100)
   */
  static calculateSimilarity(raw1: string, raw2: string): {
    score: number;
    matchType: 'exact' | 'high' | 'moderate' | 'low';
    normalized1: string;
    normalized2: string;
  } {
    if (!raw1 || !raw2) {
      return { score: 0, matchType: 'low', normalized1: '', normalized2: '' };
    }

    const norm1 = this.normalize(raw1);
    const norm2 = this.normalize(raw2);

    if (norm1 === norm2 && norm1.length > 0) {
      return { score: 100, matchType: 'exact', normalized1: norm1, normalized2: norm2 };
    }

    // Levenshtein character similarity
    const maxLen = Math.max(norm1.length, norm2.length);
    const levDist = this.levenshteinDistance(norm1, norm2);
    const levScore = maxLen > 0 ? Math.max(0, (1 - levDist / maxLen) * 100) : 0;

    // Token Jaccard similarity
    const jaccardScore = this.tokenJaccardSimilarity(norm1, norm2) * 100;

    // Substring / Brand prefix check
    let substringBoost = 0;
    if (norm1.length >= 4 && norm2.length >= 4) {
      if (norm1.includes(norm2) || norm2.includes(norm1)) {
        substringBoost = 75;
      }
    }

    // Weighted composite score
    const compositeScore = Math.round(
      Math.max(
        levScore * 0.6 + jaccardScore * 0.4,
        jaccardScore,
        levScore,
        substringBoost
      )
    );

    let matchType: 'exact' | 'high' | 'moderate' | 'low' = 'low';
    if (compositeScore >= 85) matchType = 'high';
    else if (compositeScore >= 60) matchType = 'moderate';

    return {
      score: compositeScore,
      matchType,
      normalized1: norm1,
      normalized2: norm2,
    };
  }

  /**
   * Generate smart short name suggestions from a client's full name
   */
  static generateShortNameSuggestions(fullName: string): string[] {
    if (!fullName || !fullName.trim()) return [];

    const suggestions: string[] = [];
    const trimmed = fullName.trim();

    // 1. Acronym from non-stop words
    const words = trimmed.replace(/[-/\\&(),.]/g, ' ').split(/\s+/).filter(Boolean);
    const acronymWords = words.filter(
      (w) => !this.LEGAL_STOP_WORDS.some((sw) => sw.toLowerCase() === w.toLowerCase())
    );

    if (acronymWords.length > 1) {
      const acronym = acronymWords.map((w) => w[0].toUpperCase()).join('');
      if (acronym.length >= 2 && acronym.length <= 10) {
        suggestions.push(acronym);
      }
    }

    // 2. Full Acronym (including Pvt Ltd if present, e.g. ACPL)
    if (words.length > 1) {
      const fullAcronym = words.map((w) => w[0].toUpperCase()).join('');
      if (fullAcronym.length >= 2 && fullAcronym.length <= 8 && !suggestions.includes(fullAcronym)) {
        suggestions.push(fullAcronym);
      }
    }

    // 3. Clean Uppercase Brand Token (e.g. "HANUMAN", "SUBHA", "KUMARI")
    const norm = this.normalize(fullName);
    const normTokens = norm.split(' ').filter(Boolean);
    if (normTokens.length > 0) {
      const brandToken = normTokens[0].toUpperCase().slice(0, 12);
      if (brandToken.length >= 2 && !suggestions.includes(brandToken)) {
        suggestions.push(brandToken);
      }

      // If 2 words like "HANUMAN-DS"
      if (normTokens.length >= 2) {
        const brandCombo = `${brandToken}-${normTokens[1].toUpperCase()}`.slice(0, 16);
        if (!suggestions.includes(brandCombo)) {
          suggestions.push(brandCombo);
        }
      }
    }

    return suggestions.slice(0, 4);
  }
}
