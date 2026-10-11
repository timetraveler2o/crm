import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to persist filter state in sessionStorage.
 * Saves filter state whenever it changes, restores on mount.
 * This allows pages to retain their filter state when navigating back from detail pages.
 */

const STORAGE_PREFIX = 'crm_filters_';

export function savePageFilters(pageKey: string, filterState: Record<string, any>) {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${pageKey}`, JSON.stringify(filterState));
  } catch (e) {
    // Silently ignore storage errors
  }
}

export function loadPageFilters<T extends Record<string, any>>(pageKey: string): T | null {
  try {
    const saved = sessionStorage.getItem(`${STORAGE_PREFIX}${pageKey}`);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (e) {
    // Silently ignore parse errors
  }
  return null;
}

export function clearPageFilters(pageKey: string) {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${pageKey}`);
  } catch (e) {
    // Silently ignore
  }
}

/**
 * Hook that auto-saves filter state to sessionStorage on every change.
 * Call this in your component, passing the current filter state.
 * It will save after a short debounce to avoid excessive writes.
 */
export function useFilterPersistence(pageKey: string, filterState: Record<string, any>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip saving on the very first render (we're likely restoring)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Debounce saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      savePageFilters(pageKey, filterState);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pageKey, JSON.stringify(filterState)]);

  // Save immediately on unmount (when navigating away)
  const currentState = useRef(filterState);
  currentState.current = filterState;

  useEffect(() => {
    return () => {
      savePageFilters(pageKey, currentState.current);
    };
  }, [pageKey]);
}

/**
 * Utility to create a safe goBack function.
 * Uses navigate(-1) if there's history, otherwise navigates to fallback.
 */
export function createGoBack(navigate: (to: any) => void, fallbackPath: string) {
  return () => {
    // Check if there's a meaningful history entry to go back to
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };
}
