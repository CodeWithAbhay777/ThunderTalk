import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/database/mongoose";
import { Diary } from "@/models/diary";
import { agentErrorResponse, requireAgentToken } from "@/server/api";

export const runtime = "nodejs";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
type Context = { params: Promise<{ date: string }> };

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
  const denied = await requireAgentToken(request);
  if (denied) return denied;

  const { date } = await context.params;
  if (!datePattern.test(date)) {
    return NextResponse.json({ status: 400, success: false, error: "Invalid date." }, { status: 400 });
  }

  try {
    await connectDatabase();
    const entry = await Diary.findOne({ date }).lean();
    if (!entry) {
      return NextResponse.json({ status: 404, success: false, error: "Diary entry not found." }, { status: 404 });
    }
    return NextResponse.json({ status: 200, success: true, countDocument: 1, entry }, { status: 200 });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
