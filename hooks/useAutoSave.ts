import { useEffect, useRef, useState } from 'react';
import { AUTO_SAVE_DEBOUNCE_MS } from '@studymate/shared';

/**
 * Auto-save status
 */
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * useAutoSave Hook
 *
 * Automatically saves content after a debounce period when it changes.
 *
 * @param content - The content to save
 * @param onSave - Async function to call when saving
 * @param debounceMs - Debounce delay in milliseconds (default: 2000ms)
 * @returns Status of the auto-save operation
 *
 * @example
 * ```tsx
 * const status = useAutoSave(editorContent, async (content) => {
 *   await fetch('/api/save', { method: 'POST', body: JSON.stringify({ content }) });
 * });
 * ```
 */
export function useAutoSave(
  content: string,
  onSave: (content: string) => Promise<void>,
  debounceMs: number = AUTO_SAVE_DEBOUNCE_MS
): AutoSaveStatus {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>(content);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Skip if content hasn't changed
    if (content === lastSavedContentRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set status to idle while waiting for debounce
    setStatus('idle');

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;

      setStatus('saving');

      try {
        await onSave(content);

        if (!isMountedRef.current) return;

        lastSavedContentRef.current = content;
        setStatus('saved');

        // Reset to idle after showing "saved" for 2 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus('idle');
          }
        }, 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);

        if (!isMountedRef.current) return;

        setStatus('error');

        // Reset to idle after showing error for 3 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus('idle');
          }
        }, 3000);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, onSave, debounceMs]);

  return status;
}
