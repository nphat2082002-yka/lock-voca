const assert = require('assert');

// Delimiters that separate distinct words, phrases or synonyms
const DELIMITER_REGEX = /[/=+;,|~\\–—]|\s+-\s*|\s*-\s+|\.{2,}|\n+/g;

// Forbidden special characters inside phrases that should not be vocalized
const FORBIDDEN_CHARS_REGEX = /[_*#@$%^&?!:<>\[\]{}~\\`]/g;

// Punctuation at the edges of a phrase to strip
const EDGE_PUNCTUATION_REGEX = /^[.,\-:;!?/\+=_~'"“”‘’`\s]+|[.,\-:;!?/\+=_~'"“”‘’`\s]+$/g;

function cleanPhraseSegment(raw) {
  let s = raw.replace(FORBIDDEN_CHARS_REGEX, ' ');
  s = s.replace(EDGE_PUNCTUATION_REGEX, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function getSpeechPhrases(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  let text = rawText;

  // Step 1: Remove all content inside parentheses `(...)` (including nested)
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
  const validPhrases = [];
  for (const seg of rawSegments) {
    const cleaned = cleanPhraseSegment(seg);
    if (cleaned.length > 0 && /[a-zA-Z0-9]/.test(cleaned)) {
      validPhrases.push(cleaned);
    }
  }

  return validPhrases;
}

function sanitizeTextForSpeech(rawText) {
  const phrases = getSpeechPhrases(rawText);
  if (phrases.length === 0) {
    return '';
  }
  return phrases.join(', ');
}

// === TEST SUITE ===
console.log('Testing sanitizeTextForSpeech against all requirements...\n');

const testCases = [
  {
    input: 'be located',
    expected: 'be located',
    desc: 'Simple phrase without punctuation',
  },
  {
    input: 'in person/ offile/ directly/ on site',
    expected: 'in person, offile, directly, on site',
    desc: 'Synonyms separated by slash',
  },
  {
    input: 'address (n)',
    expected: 'address',
    desc: 'Part of speech in parentheses at end',
  },
  {
    input: 'address (v) = direct(v) + to',
    expected: 'address, direct, to',
    desc: 'Attached parentheses and equation separators (=, +)',
  },
  {
    input: 'fare/ rate',
    expected: 'fare, rate',
    desc: 'Two words separated by slash',
  },
  {
    input: '(v) look for/ navigate/ seek/ find/ locate/ figure out',
    expected: 'look for, navigate, seek, find, locate, figure out',
    desc: 'Leading parentheses with multiple slash-separated phrases',
  },
  {
    input: 'next to/ near/ by/ near by/ close to/ adjacent to',
    expected: 'next to, near, by, near by, close to, adjacent to',
    desc: 'Multiple prepositional synonyms separated by slash',
  },
  {
    input: '/ + - = , ....',
    expected: '',
    desc: 'Only special characters and ellipsis',
  },
  {
    input: 'word with "quote notes"',
    expected: 'word with',
    desc: 'Double quotes and internal notes removed',
  },
  {
    input: 'word with “curly quotes”',
    expected: 'word with',
    desc: 'Curly quotes and internal notes removed',
  },
  {
    input: '(see (nested) note) clean word',
    expected: 'clean word',
    desc: 'Nested parentheses',
  },
  {
    input: 'on-site / well-known',
    expected: 'on-site, well-known',
    desc: 'Internal hyphens preserved inside compound words',
  },
  {
    input: '   extra   spaces   and   commas, , ,  ',
    expected: 'extra spaces and commas',
    desc: 'Normalized spacing and stripped trailing commas',
  },
  {
    input: null,
    expected: '',
    desc: 'Null input returns empty string',
  },
  {
    input: '',
    expected: '',
    desc: 'Empty string returns empty string',
  },
];

let passed = 0;
for (const tc of testCases) {
  const actual = sanitizeTextForSpeech(tc.input);
  try {
    assert.strictEqual(actual, tc.expected);
    console.log(`[PASS] ${tc.desc}`);
    console.log(`       Input:    "${tc.input}"`);
    console.log(`       Output:   "${actual}"\n`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${tc.desc}`);
    console.error(`       Input:    "${tc.input}"`);
    console.error(`       Expected: "${tc.expected}"`);
    console.error(`       Actual:   "${actual}"\n`);
  }
}

console.log(`=== Result: ${passed}/${testCases.length} tests passed ===`);
if (passed === testCases.length) {
  console.log('ALL TESTS PASSED 100%! 🎉');
} else {
  process.exit(1);
}
