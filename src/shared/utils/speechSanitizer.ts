/**
 * Utility to sanitize vocabulary key/value text for Text-to-Speech (TTS).
 *
 * Requirements:
 * 1. Remove all content within parentheses `(...)` (including nested or attached like `direct(v)`),
 *    straight double quotes `"..."`, and curly double quotes `“...”`.
 * 2. Handle delimiters (`/`, `=`, `+`, `-`, `,`, `;`, `...`, `~`, `|`) converting them into
 *    natural pauses between clean phrases (joined with `, `).
 * 3. Never allow TTS to read symbols aloud ("slash", "plus", "equals", "dot", etc.).
 * 4. Normalize spaces and trim. If clean text has no alphanumeric characters, return `""`.
 */

// Delimiters that separate distinct words, phrases or synonyms
const DELIMITER_REGEX = /[/=+;,|~\\–—]|\s+-\s*|\s*-\s+|\.{2,}|\n+/g;

// Forbidden special characters inside phrases that should not be vocalized
const FORBIDDEN_CHARS_REGEX = /[_*#@$%^&?!:<>\[\]{}~\\`]/g;

// Punctuation at the edges of a phrase to strip
const EDGE_PUNCTUATION_REGEX = /^[.,\-:;!?/\+=_~'"“”‘’`\s]+|[.,\-:;!?/\+=_~'"“”‘’`\s]+$/g;

/**
 * Clean a single phrase segment: remove forbidden chars, edge punctuation, collapse spaces.
 */
function cleanPhraseSegment(raw: string): string {
  let s = raw.replace(FORBIDDEN_CHARS_REGEX, ' ');
  s = s.replace(EDGE_PUNCTUATION_REGEX, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Returns an array of clean phrase segments ready for TTS.
 */
export function getSpeechPhrases(rawText: string | null | undefined): string[] {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  let text = rawText;

  // Step 1: Remove all content inside parentheses `(...)` (including nested or attached)
  const parenRegex = /\([^()]*\)/g;
  while (parenRegex.test(text)) {
    text = text.replace(parenRegex, ' ');
  }

  // Also remove bracketed content `[...]` or `{...}`
  const bracketRegex = /\[[^\[\]]*\]|\{[^{}]*\}/g;
  while (bracketRegex.test(text)) {
    text = text.replace(bracketRegex, ' ');
  }

  // Remove content in double quotes `"..."` and curly double/single quotes `“...”`, `‘...’`
  text = text.replace(/"[^"]*"/g, ' ');
  text = text.replace(/“[^”]*”/g, ' ');
  text = text.replace(/‘[^’]*’/g, ' ');
  text = text.replace(/["“”‘’]/g, ' ');

  // Step 2: Split by phrase delimiters
  const rawSegments = text.split(DELIMITER_REGEX);

  // Step 3: Clean each phrase segment and keep only those with letters or numbers
  const validPhrases: string[] = [];
  for (const seg of rawSegments) {
    const cleaned = cleanPhraseSegment(seg);
    if (cleaned.length > 0 && /[a-zA-Z0-9]/.test(cleaned)) {
      validPhrases.push(cleaned);
    }
  }

  return validPhrases;
}

/**
 * Sanitizes input text into a comma-separated string that creates natural pauses in TTS.
 * Returns empty string `""` if input contains no speakable content.
 */
export function sanitizeTextForSpeech(rawText: string | null | undefined): string {
  const phrases = getSpeechPhrases(rawText);
  if (phrases.length === 0) {
    return '';
  }
  return phrases.join(', ');
}

