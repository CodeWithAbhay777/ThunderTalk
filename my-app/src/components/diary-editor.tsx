"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { encryptDiaryContent } from "@/crypto/diary-crypto";
import { diaryApi } from "@/services/diary-api";
import type { DiaryEntry, EncryptedDiaryPayload } from "@/types/diary";

type Props = { date: string; initialContent: string; exists: boolean; cryptoKey: CryptoKey; kdfSalt: string | null; onSaved: (entry: DiaryEntry) => void; onDirtyChange: (dirty: boolean) => void };
export function DiaryEditor({ date, initialContent, exists, cryptoKey, kdfSalt, onSaved, onDirtyChange }: Props) {
  const [content, setContent] = useState(initialContent); const [savedContent, setSavedContent] = useState(initialContent); const [status, setStatus] = useState("Saved"); const [error, setError] = useState<string | null>(null); const saving = useRef(false);
  const dirty = content !== savedContent;
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  const stats = useMemo(() => { const words = content.trim() ? content.trim().split(/\s+/u).length : 0; return { chars: [...content].length, words, minutes: Math.max(1, Math.ceil(words / 200)) }; }, [content]);
  const save = useCallback(async () => {
    if (!dirty || saving.current) return; saving.current = true; setStatus("Encrypting…"); setError(null);
    try {
      if (!kdfSalt) throw new Error("Missing key derivation salt for this entry.");
      const encrypted = await encryptDiaryContent(cryptoKey, content);
      const payload: Omit<EncryptedDiaryPayload, "date"> = { ...encrypted, kdfSalt };
      const savedEntry = exists ? await diaryApi.update(date, payload) : await diaryApi.create({ date, ...payload });
      setSavedContent(content);
      setStatus("Saved");
      onSaved(savedEntry);
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save entry."); setStatus("Not saved"); }
    finally { saving.current = false; }
  }, [content, cryptoKey, date, dirty, exists, kdfSalt, onSaved]);
  useEffect(() => {
    if (!dirty) return;
    const timer = window.setInterval(() => { void save(); }, 15_000);
    return () => window.clearInterval(timer);
  }, [dirty, save]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
  useEffect(() => { const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void save(); } }; window.addEventListener("keydown", shortcut); return () => window.removeEventListener("keydown", shortcut); });
  return <section className="editor-card"><div className="editor-head"><div><p className="eyebrow">{date}</p><p className="muted" aria-live="polite">{status}</p></div><button onClick={() => void save()} disabled={!dirty} className="button small">Save</button></div>
    <textarea aria-label={`Diary entry for ${date}`} autoFocus value={content} onChange={(event) => setContent(event.target.value)} placeholder="Begin writing…" spellCheck />
    <div className="editor-foot"><span>{stats.chars.toLocaleString()} characters · {stats.words.toLocaleString()} words · {stats.minutes} min read</span>{error && <span role="alert" className="error">{error}</span>}</div>
  </section>;
}
