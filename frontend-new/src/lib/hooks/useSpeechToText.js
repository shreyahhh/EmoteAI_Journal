import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Thin wrapper around the browser's SpeechRecognition API. Dictated text is
 * streamed back through `onResult` as each phrase is finalized, so the
 * caller decides how to merge it into whatever it's already typed — this
 * hook holds no copy of the transcript itself.
 */
export function useSpeechToText({ onResult } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(
    () => typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
  );
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) onResultRef.current?.(result[0].transcript.trim());
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [isSupported]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { isSupported, isListening, start, stop, toggle };
}
