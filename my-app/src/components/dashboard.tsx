"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createDiarySalt, decryptDiaryContent, deriveDiaryKey } from "@/crypto/diary-crypto";
import { Brand } from "@/components/brand";
import { DiaryEditor } from "@/components/diary-editor";
import { EntryUnlockDialog } from "@/components/entry-unlock-dialog";
import { diaryApi } from "@/services/diary-api";
import type { DiaryEntry, DiaryIndexItem } from "@/types/diary";

const localDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).format(new Date());
const AUTO_LOCK_MS = 5 * 60 * 1000;

export function Dashboard() {
  const [entries, setEntries] = useState<DiaryIndexItem[]>([]);
  const [date, setDate] = useState(localDate);
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [entrySalt, setEntrySalt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  const refreshIndex = useCallback(async () => {
    try { setEntries(await diaryApi.list()); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not load entries."); }
  }, []);
  const clearEntryKey = useCallback(() => { setKey(null); setContent(null); setEntrySalt(null); }, []);
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), []);
  const logout = useCallback(async () => { clearEntryKey(); await fetch("/api/logout", { method: "POST", credentials: "same-origin", cache: "no-store" }); router.replace("/login"); }, [clearEntryKey, router]);

  // This is an external network synchronization; its callback owns the state update.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refreshIndex(); }, [refreshIndex]);
  useEffect(() => {
    let active = true;
    void diaryApi.get(date).then((result) => { if (active) setEntry(result); }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof Error && error.message.includes("not found")) setEntry(null);
      else setNotice(error instanceof Error ? error.message : "Could not load encrypted entry.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date]);
  useEffect(() => {
    let timer: number;
    const lockOnInactivity = () => { void logout(); };
    const resetTimer = () => { window.clearTimeout(timer); timer = window.setTimeout(lockOnInactivity, AUTO_LOCK_MS); };
    const activityEvents: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => { window.clearTimeout(timer); activityEvents.forEach((event) => window.removeEventListener(event, resetTimer)); };
  }, [logout]);

  function selectDate(nextDate: string) {
    if (nextDate === date) { if (!key) setDialogOpen(true); return; }
    if (dirty && !window.confirm("You have unsaved changes. Lock this entry and continue?")) return;
    setDirty(false); setEntry(null); clearEntryKey(); setNotice(null); setLoading(true); setDialogOpen(true); setDate(nextDate);
  }

  async function unlockEntry(password: string) {
    if (!password) throw new Error("A password is required to unlock this entry.");
    if (!entry) {
      const newSalt = createDiarySalt();
      const scopedKey = await deriveDiaryKey(password, newSalt);
      setEntrySalt(newSalt);
      setKey(scopedKey);
      setContent("");
      setDialogOpen(false);
      return;
    }

    if (entry.kdfSalt) {
      const scopedKey = await deriveDiaryKey(password, entry.kdfSalt);
      setEntrySalt(entry.kdfSalt);
      setKey(scopedKey);
      setContent(await decryptDiaryContent(scopedKey, entry.encryptedContent, entry.iv));
      setDialogOpen(false);
      return;
    }

    setEntrySalt(null);
    const scopedKey = await deriveDiaryKey(password, entry.kdfSalt);
    setContent(await decryptDiaryContent(scopedKey, entry.encryptedContent, entry.iv));
    setKey(scopedKey);
    setDialogOpen(false);
  }

  const encryptedPreview = entry && !key && <section className="encrypted-preview" aria-live="polite"><p className="eyebrow">Ciphertext only</p><p className="muted">This entry has not been decrypted in this session.</p><code>{entry.encryptedContent}</code><dl><div><dt>IV</dt><dd>{entry.iv}</dd></div><div><dt>Last updated</dt><dd>{new Date(entry.updatedAt).toLocaleString()}</dd></div></dl><button className="button" onClick={() => setDialogOpen(true)}>Unlock entry</button></section>;

  return <main className="app-shell"><header><div><Brand href="/dashboard" /><span className="muted">Encrypted per entry</span></div><button className="ghost" onClick={() => void logout()}>Lock diary</button></header>
    <div className="workspace"><aside className="sidebar"><div className="sidebar-row"><h2>Entries</h2><button className="icon-button" aria-label="New entry" onClick={() => selectDate(localDate())}>+</button></div><label className="sr-only" htmlFor="date-search">Find date</label><input id="date-search" type="date" value={date} onChange={(event) => selectDate(event.target.value)} />
      <nav aria-label="Previous diary entries">{entries.map((item) => <button key={item.date} className={item.date === date ? "entry-link active" : "entry-link"} onClick={() => selectDate(item.date)}><span>{item.date}</span><small>Updated {new Date(item.updatedAt).toLocaleDateString()}</small></button>)}</nav></aside>
      <section className="content"><div className="content-title"><div><p className="eyebrow">Daily entry</p><h1>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h1></div><button className="danger" onClick={async () => { if (entry && confirm("Permanently delete this encrypted entry?")) { await diaryApi.remove(date); clearEntryKey(); setEntry(null); await refreshIndex(); } }} disabled={!entry}>Delete</button></div>
        {notice && <p className="error" role="alert">{notice}</p>}{loading ? <p className="muted">Loading encrypted entry…</p> : encryptedPreview}{!loading && !entry && !key && <section className="encrypted-preview"><p className="eyebrow">No ciphertext yet</p><p className="muted">Unlock this date to create its encrypted entry.</p><button className="button" onClick={() => setDialogOpen(true)}>Unlock new entry</button></section>}{key && content !== null && <DiaryEditor key={date} date={date} initialContent={content} exists={Boolean(entry)} cryptoKey={key} kdfSalt={entrySalt} onSaved={() => void refreshIndex()} onDirtyChange={onDirtyChange} />}
      </section></div>{dialogOpen && !loading && <EntryUnlockDialog date={date} onUnlock={unlockEntry} onCancel={() => setDialogOpen(false)} />}</main>;
}
