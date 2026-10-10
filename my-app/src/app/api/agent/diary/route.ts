import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/database/mongoose";
import { Diary } from "@/models/diary";
import { agentErrorResponse, requireAgentToken } from "@/server/api";

export const runtime = "nodejs";
const MAX_LIMIT = 5;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const denied = await requireAgentToken(request);
  if (denied) return denied;

  try {
    const limitValue = request.nextUrl.searchParams.get("limit") ?? "5";
    const offsetValue = request.nextUrl.searchParams.get("offset") ?? "0";
    const limit = Number(limitValue);
    const offset = Number(offsetValue);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT || !Number.isInteger(offset) || offset < 0) {
      return NextResponse.json({ status: 400, success: false, error: `limit must be 1-${MAX_LIMIT} and offset must be a non-negative integer.` }, { status: 400 });
    }

    await connectDatabase();
    const entries = await Diary.find({}).sort({ date: -1 }).skip(offset).limit(limit).lean();
    return NextResponse.json({ status: 200, success: true, countDocument: entries.length, entries }, { status: 200 });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
