"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Props = { date: string; onUnlock: (password: string) => Promise<void>; onCancel: () => void };

export function EntryUnlockDialog({ date, onUnlock, onCancel }: Props) {
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { passwordRef.current?.focus(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const password = passwordRef.current?.value ?? ""; setBusy(true); setError(null);
    try { await onUnlock(password); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not unlock this entry."); passwordRef.current?.select(); }
    finally { setBusy(false); }
  }
  return <div className="dialog-backdrop" role="presentation"><section className="card unlock-dialog" role="dialog" aria-modal="true" aria-labelledby="unlock-title">
    <p className="eyebrow">Encrypted entry</p><h2 id="unlock-title">Unlock {date}</h2><p className="muted">Enter your master password to derive this date&apos;s in-memory decryption key.</p>
    <form className="stack" onSubmit={submit}><label htmlFor="entry-password">Master password</label><input ref={passwordRef} id="entry-password" type="password" autoComplete="current-password" required disabled={busy} />
      {error && <p role="alert" className="error">{error}</p>}<div className="dialog-actions"><button type="button" className="ghost" onClick={onCancel} disabled={busy}>Cancel</button><button className="button" disabled={busy}>{busy ? "Unlocking…" : "Unlock entry"}</button></div>
    </form>
  </section></div>;
}
