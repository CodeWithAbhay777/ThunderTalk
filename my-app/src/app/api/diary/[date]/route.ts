import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/database/mongoose";
import { Diary } from "@/models/diary";
import { errorResponse, requireSession } from "@/server/api";

const encryptedUpdate = z.object({ encryptedContent: z.string().min(1).max(2_000_000), iv: z.string().min(16).max(64), kdfSalt: z.string().min(16).max(64) });
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

type Context = { params: Promise<{ date: string }> };
async function validDate(context: Context): Promise<string | null> { const date = (await context.params).date; return dateSchema.safeParse(date).success ? date : null; }

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
  const denied = await requireSession(request); if (denied) return denied;
  const date = await validDate(context); if (!date) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  try { await connectDatabase(); const entry = await Diary.findOne({ date }).lean(); if (!entry) return NextResponse.json({ error: "Diary entry not found." }, { status: 404 }); return NextResponse.json({ date: entry.date, encryptedContent: entry.encryptedContent, iv: entry.iv, kdfSalt: entry.kdfSalt, createdAt: entry.createdAt, updatedAt: entry.updatedAt }); } catch (error) { return errorResponse(error); }
}

export async function PUT(request: NextRequest, context: Context): Promise<NextResponse> {
  const denied = await requireSession(request); if (denied) return denied;
  const date = await validDate(context); if (!date) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  const parsed = encryptedUpdate.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid encrypted entry." }, { status: 400 });
  try { await connectDatabase(); const entry = await Diary.findOneAndUpdate({ date }, parsed.data, { new: true, runValidators: true }).lean(); if (!entry) return NextResponse.json({ error: "Diary entry not found." }, { status: 404 }); return NextResponse.json({ date: entry.date, encryptedContent: entry.encryptedContent, iv: entry.iv, kdfSalt: entry.kdfSalt, createdAt: entry.createdAt, updatedAt: entry.updatedAt }); } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest, context: Context): Promise<NextResponse> {
  const denied = await requireSession(request); if (denied) return denied;
  const date = await validDate(context); if (!date) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  try { await connectDatabase(); const entry = await Diary.findOneAndDelete({ date }); if (!entry) return NextResponse.json({ error: "Diary entry not found." }, { status: 404 }); return new NextResponse(null, { status: 204 }); } catch (error) { return errorResponse(error); }
}
