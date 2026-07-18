import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/database/mongoose";
import { Diary } from "@/models/diary";
import { errorResponse, requireSession } from "@/server/api";

const entrySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), encryptedContent: z.string().min(1).max(2_000_000), iv: z.string().min(16).max(64) });

export async function GET(request: NextRequest): Promise<NextResponse> {
  const denied = await requireSession(request); if (denied) return denied;
  try {
    await connectDatabase();
    const entries = await Diary.find({}, { date: 1, createdAt: 1, updatedAt: 1 }).sort({ date: -1 }).lean();
    return NextResponse.json(entries.map((entry) => ({ date: entry.date, createdAt: entry.createdAt, updatedAt: entry.updatedAt })));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const denied = await requireSession(request); if (denied) return denied;
  try {
    const parsed = entrySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid encrypted entry." }, { status: 400 });
    await connectDatabase();
    const entry = await Diary.create(parsed.data);
    return NextResponse.json({ date: entry.date, encryptedContent: entry.encryptedContent, iv: entry.iv, createdAt: entry.createdAt, updatedAt: entry.updatedAt }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) return NextResponse.json({ error: "An entry already exists for this date.", code: "DUPLICATE_DATE" }, { status: 409 });
    return errorResponse(error);
  }
}
