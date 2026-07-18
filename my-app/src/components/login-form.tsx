"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null); const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const password = passwordRef.current?.value ?? ""; setLoading(true); setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.status === 401) throw new Error("Incorrect password.");
      if (!response.ok) throw new Error("Sign-in is temporarily unavailable. Check the server configuration and try again.");
      passwordRef.current?.form?.reset();
      router.replace("/dashboard");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to unlock diary."); passwordRef.current?.focus(); }
    finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="card stack" noValidate>
    <div><p className="eyebrow">Private space</p><h1>Welcome back</h1><p className="muted">Your entries are decrypted only in this browser.</p></div>
    <label htmlFor="password">Master password</label>
    <input ref={passwordRef} id="password" type="password" autoComplete="current-password" required autoFocus minLength={1} disabled={loading} />
    {error && <p role="alert" className="error">{error}</p>}
    <button className="button" disabled={loading}>{loading ? "Unlocking…" : "Unlock diary"}</button>
  </form>;
}
