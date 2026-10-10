import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/database/mongoose";
import { Diary } from "@/models/diary";
import { agentErrorResponse, requireAgentToken } from "@/server/api";

export const runtime = "nodejs";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const denied = await requireAgentToken(request);
  if (denied) return denied;

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  if (!from || !to || !datePattern.test(from) || !datePattern.test(to) || from > to) {
    return NextResponse.json({ status: 400, success: false, error: "Valid from and to dates are required." }, { status: 400 });
  }

  try {
    await connectDatabase();
    const entries = await Diary.find({ date: { $gte: from, $lte: to } }).sort({ date: -1 }).lean();
    return NextResponse.json({ status: 200, success: true, from, to, countDocument: entries.length, entries }, { status: 200 });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
