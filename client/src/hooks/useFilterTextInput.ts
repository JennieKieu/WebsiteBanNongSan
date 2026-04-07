import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Ô lọc gắn URL: gõ tiếng Việt không bị vỡ IME (chỉ đẩy URL sau khi gõ xong hoặc debounce).
 */
export function useFilterTextInput(
  urlValue: string,
  paramKey: string,
  updateFilter: (key: string, value: string) => void,
  debounceMs = 420
) {
  const [draft, setDraft] = useState(urlValue);
  const composingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(urlValue);
  }, [urlValue]);

  const flushToUrl = useCallback(
    (v: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      updateFilter(paramKey, v);
    },
    [paramKey, updateFilter]
  );

  const scheduleFlush = useCallback(
    (v: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        updateFilter(paramKey, v);
      }, debounceMs);
    },
    [paramKey, updateFilter, debounceMs]
  );

  return {
    value: draft,
    onCompositionStart: () => {
      composingRef.current = true;
    },
    onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => {
      composingRef.current = false;
      const v = e.currentTarget.value;
      setDraft(v);
      flushToUrl(v);
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setDraft(v);
      if (composingRef.current) return;
      scheduleFlush(v);
    },
  };
}
