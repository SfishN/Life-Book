"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const DRAFT_PREFIX = "life-room-draft:";
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;

export function useTemporaryDraft<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue);
  const valueRef = useRef(initialValue);
  const dirtyRef = useRef(false);
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);
  const storageKey = DRAFT_PREFIX + key;

  useEffect(() => {
    let restored = initialRef.current;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { value: T; updatedAt: number };
        if (Date.now() - parsed.updatedAt <= DRAFT_MAX_AGE_MS) {
          restored = parsed.value;
          dirtyRef.current = true;
        } else {
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Restricted storage keeps the draft in memory for this visit.
      }
    }
    valueRef.current = restored;
    setValue(restored);
    setReady(true);
  }, [storageKey]);

  const writeDraft = useCallback(() => {
    if (!dirtyRef.current) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ value: valueRef.current, updatedAt: Date.now() }),
      );
    } catch {
      // Committed records remain authoritative if draft persistence is unavailable.
    }
  }, [storageKey]);

  useEffect(() => {
    if (!ready || !dirtyRef.current) return;
    const timeout = window.setTimeout(writeDraft, 600);
    return () => window.clearTimeout(timeout);
  }, [ready, value, writeDraft]);

  useEffect(() => {
    if (!ready) return;
    window.addEventListener("pagehide", writeDraft);
    return () => window.removeEventListener("pagehide", writeDraft);
  }, [ready, writeDraft]);

  useEffect(() => () => writeDraft(), [writeDraft]);

  const updateDraft = useCallback<Dispatch<SetStateAction<T>>>((nextValue) => {
    setValue((current) => {
      const resolved = typeof nextValue === "function"
        ? (nextValue as (currentValue: T) => T)(current)
        : nextValue;
      valueRef.current = resolved;
      dirtyRef.current = true;
      return resolved;
    });
  }, []);

  const clearDraft = useCallback((nextValue: T = initialRef.current) => {
    dirtyRef.current = false;
    valueRef.current = nextValue;
    setValue(nextValue);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Storage can be unavailable in a restricted browsing context.
    }
  }, [storageKey]);

  return [value, updateDraft, clearDraft] as const;
}
