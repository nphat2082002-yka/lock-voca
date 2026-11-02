import { sanitizeTextForSpeech } from '@/shared/utils/speechSanitizer';

export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoice: SpeechSynthesisVoice | null = null;

/**
 * Check if Web Speech API is supported in current environment.
 */
export const isSpeechSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
};

/**
 * Retrieve the best available English voice.
 */
export const getEnglishVoice = (): SpeechSynthesisVoice | null => {
  if (!isSpeechSupported()) return null;
  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Priority order:
  // 1. Natural / Enhanced en-US voice
  // 2. Standard en-US
  // 3. en-GB
  // 4. Any English voice
  cachedVoice =
    voices.find(
      (v) =>
        v.lang === 'en-US' &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Karen'))
    ) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang === 'en-GB') ||
    voices.find((v) => v.lang.startsWith('en')) ||
    null;

  return cachedVoice;
};

// Listen to voiceschanged event to warm up voice cache
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    getEnglishVoice();
  };
}

/**
 * Immediately cancel any ongoing speech synthesis.
 */
export const stopSpeech = () => {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    console.warn('speechSynthesis.cancel error:', err);
  } finally {
    activeUtterance = null;
  }
};

/**
 * Speak sanitized vocabulary text in English.
 * Returns true if speech was queued successfully, false otherwise.
 */
export const speakVocabulary = (
  rawText: string,
  callbacks?: SpeechCallbacks
): boolean => {
  if (!isSpeechSupported()) {
    callbacks?.onEnd?.();
    return false;
  }

  const cleanText = sanitizeTextForSpeech(rawText);
  if (!cleanText) {
    callbacks?.onEnd?.();
    return false;
  }

  try {
    // iOS Safari requirement: Cancel prior speech before queuing new utterance
    window.speechSynthesis.cancel();

    const utterance = new window.SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.92; // Slightly paced for optimal learning clarity
    utterance.pitch = 1.0;

    const voice = getEnglishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (event) => {
      activeUtterance = null;
      // 'interrupted' and 'canceled' are normal lifecycle events when user navigates or stops
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', event.error);
      }
      callbacks?.onEnd?.();
      callbacks?.onError?.(event);
    };

    // Keep reference in module scope to prevent iOS Safari GC bug
    activeUtterance = utterance;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Failed to execute speakVocabulary:', err);
    activeUtterance = null;
    callbacks?.onEnd?.();
    return false;
  }
};

