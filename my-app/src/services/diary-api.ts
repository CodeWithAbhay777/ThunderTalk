import type { DiaryEntry, DiaryIndexItem, EncryptedDiaryPayload } from "@/types/diary";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers }, credentials: "same-origin" });
  const text = await response.text();
  let body: unknown;
  if (text) {
    try { body = JSON.parse(text); }
    catch { throw new Error("The server returned an invalid response."); }
  }
  if (!response.ok) {
    const message = typeof body === "object" && body && "error" in body && typeof body.error === "string" ? body.error : "Network request failed.";
    throw new Error(message);
  }
  // DELETE responds with 204 No Content. Other future empty successful
  // responses are handled safely too.
  return body as T;
}

export const diaryApi = {
  list: () => request<DiaryIndexItem[]>("/api/diary"),
  get: (date: string) => request<DiaryEntry>(`/api/diary/${date}`),
  create: (entry: EncryptedDiaryPayload) => request<DiaryEntry>("/api/diary", { method: "POST", body: JSON.stringify(entry) }),
  update: (date: string, entry: Omit<EncryptedDiaryPayload, "date">) => request<DiaryEntry>(`/api/diary/${date}`, { method: "PUT", body: JSON.stringify(entry) }),
  remove: (date: string) => request<void>(`/api/diary/${date}`, { method: "DELETE" }),
};
