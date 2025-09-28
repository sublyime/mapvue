import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Custom hook for debounced callbacks
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<number | null>(null);
  
  callbackRef.current = callback;

  return useMemo(
    () =>
      ((...args: any[]) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
          callbackRef.current(...args);
        }, delay);
      }) as T,
    [delay]
  );
}

/**
 * Custom hook for throttled callbacks
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const lastCallTime = useRef<number>(0);
  
  callbackRef.current = callback;

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      if (now - lastCallTime.current >= delay) {
        lastCallTime.current = now;
        return callbackRef.current(...args);
      }
    }) as T,
    [delay]
  );
}

/**
 * Custom hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);
  const previousValue = ref.current;
  ref.current = value;
  return previousValue;
}

/**
 * Custom hook for local storage with SSR support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * Custom hook for intersection observer
 */
export function useIntersectionObserver(
  elementRef: { current: Element | null },
  options?: IntersectionObserverInit
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return entry;
}