import { useState, useCallback, useEffect, useRef } from 'react';
import {
  isSpeechSupported,
  speakVocabulary,
  stopSpeech,
} from '@/shared/services/speechService';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopSpeech();
    };
  }, []);

  const stop = useCallback(() => {
    stopSpeech();
    if (mountedRef.current) {
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (isSpeaking) {
        stop();
        return;
      }

      speakVocabulary(text, {
        onStart: () => {
          if (mountedRef.current) {
            setIsSpeaking(true);
          }
        },
        onEnd: () => {
          if (mountedRef.current) {
            setIsSpeaking(false);
          }
        },
        onError: () => {
          if (mountedRef.current) {
            setIsSpeaking(false);
          }
        },
      });
    },
    [isSpeaking, stop]
  );

  return {
    isSpeaking,
    speak,
    stop,
    isSupported: isSpeechSupported(),
  };
}

