import { Schema, model, models } from "mongoose";

const diarySchema = new Schema({
  date: { type: String, required: true, unique: true, immutable: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  encryptedContent: { type: String, required: true, maxlength: 2_000_000 },
  iv: { type: String, required: true, maxlength: 64 },
  kdfSalt: { type: String, required: true, maxlength: 64 },
}, { timestamps: true, versionKey: "version" });

export const Diary = models.Diary || model("Diary", diarySchema);
