"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type DiaryContextValue = { key: CryptoKey | null; unlock: (key: CryptoKey) => void; lock: () => void };
const DiaryContext = createContext<DiaryContextValue | null>(null);

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<CryptoKey | null>(null);
  return <DiaryContext.Provider value={{ key, unlock: setKey, lock: () => setKey(null) }}>{children}</DiaryContext.Provider>;
}

export function useDiaryKey(): DiaryContextValue {
  const context = useContext(DiaryContext);
  if (!context) throw new Error("DiaryProvider is missing.");
  return context;
}
