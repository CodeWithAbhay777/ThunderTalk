export type EncryptedDiaryPayload = {
  date: string;
  encryptedContent: string;
  iv: string;
};

export type DiaryEntry = EncryptedDiaryPayload & {
  createdAt: string;
  updatedAt: string;
};

export type DiaryIndexItem = Pick<DiaryEntry, "date" | "createdAt" | "updatedAt">;

export type ApiError = { error: string; code?: string };
