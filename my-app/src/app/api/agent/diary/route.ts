import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/database/mongoose";
import { Diary } from "@/models/diary";
import { agentErrorResponse, requireAgentToken } from "@/server/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const denied = await requireAgentToken(request);
  if (denied) return denied;

  try {
    await connectDatabase();
    const entries = await Diary.find({}).sort({ date: -1 }).lean();
    return NextResponse.json({ status: 200, success: true, entries }, { status: 200 });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
