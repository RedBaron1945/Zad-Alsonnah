/**
 * Name Validation and Normalization utility for Student Profiles in Zad Al-Sunnah.
 * Enforces correct, complete Arabic name guidelines.
 */

export interface NameValidationResult {
  isValid: boolean;
  normalizedName: string;
  error?: string;
}

/**
 * Validates and normalizes an Arabic student name.
 * 
 * Rules:
 * 1. Must be written in Arabic characters.
 * 2. Cannot contain English/Latin letters.
 * 3. Cannot contain numbers (0-9 or Arabic-Indic numerals).
 * 4. Cannot contain inappropriate symbols or punctuation.
 * 5. Must be complete (at least 2 words, ideally 3 words), avoiding single-letter abbreviations.
 * 6. Strips leading, trailing, and duplicate spaces.
 */
export function validateAndNormalizeArabicName(input: string): NameValidationResult {
  if (!input) {
    return {
      isValid: false,
      normalizedName: '',
      error: 'يرجى كتابة اسمك الكريم باللغة العربية.',
    };
  }

  // 1. Remove leading/trailing spaces and collapse multiple spaces
  const normalized = input.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return {
      isValid: false,
      normalizedName: '',
      error: 'يرجى كتابة اسمك الكريم باللغة العربية.',
    };
  }

  // 2. Disallow Latin / English characters
  if (/[a-zA-Z]/.test(normalized)) {
    return {
      isValid: false,
      normalizedName: normalized,
      error: 'يرجى كتابة الاسم بالأحرف العربية فقط، دون استخدام أحرف إنجليزية.',
    };
  }

  // 3. Disallow digits / numbers (Western Arabic 0-9, Eastern Arabic-Indic ٠-٩, Persian ۰-۹)
  if (/[0-9\u0660-\u0669\u06F0-\u06F9]/.test(normalized)) {
    return {
      isValid: false,
      normalizedName: normalized,
      error: 'الاسم لا يمكن أن يحتوي على أرقام.',
    };
  }

  // 4. Disallow inappropriate symbols
  // Allowed: Arabic letters (\u0621-\u064A), Arabic diacritics/tashkeel (\u064B-\u0652), spaces
  const arabicAndSpaceOnlyRegex = /^[\u0621-\u064A\u064B-\u0652\s]+$/;
  if (!arabicAndSpaceOnlyRegex.test(normalized)) {
    return {
      isValid: false,
      normalizedName: normalized,
      error: 'الاسم يحتوي على رموز أو علامات غير مسموحة، يرجى استخدام الأحرف العربية فقط.',
    };
  }

  // 5. Must contain Arabic letters
  if (!/[\u0621-\u064A]/.test(normalized)) {
    return {
      isValid: false,
      normalizedName: normalized,
      error: 'يرجى كتابة اسم صحيح يحتوي على أحرف عربية.',
    };
  }

  // 6. Check words structure and completeness
  const words = normalized.split(' ').filter(Boolean);

  if (words.length < 2) {
    return {
      isValid: false,
      normalizedName: normalized,
      error: 'يرجى كتابة اسمك كاملاً (الاسم الثنائي أو الثلاثي على الأقل) وتجنب الأسماء المفردة أو الناقصة.',
    };
  }

  // Check that words are not single-letter abbreviations (e.g. "م أحمد" or "أ. محمد")
  for (const word of words) {
    // Strip diacritics to measure actual letter count
    const bareWord = word.replace(/[\u064B-\u0652]/g, '');
    if (bareWord.length < 2) {
      return {
        isValid: false,
        normalizedName: normalized,
        error: 'يرجى كتابة أجزاء الاسم كاملة وتجنب الاختصارات بالأحرف المفردة.',
      };
    }
  }

  return {
    isValid: true,
    normalizedName: normalized,
  };
}

/**
 * Quick helper to check if a given string is already an approved, valid Arabic full name.
 */
export function isArabicFullNameValid(name: string | undefined | null): boolean {
  if (!name) return false;
  return validateAndNormalizeArabicName(name).isValid;
}
