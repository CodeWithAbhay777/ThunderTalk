import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/database/mongoose";
import { Diary } from "@/models/diary";
import { agentErrorResponse, requireAgentToken } from "@/server/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const denied = await requireAgentToken(request);
  if (denied) return denied;

  const lastSyncedAtValue = request.nextUrl.searchParams.get("lastSyncedAt");
  const lastSyncedAt = lastSyncedAtValue === null ? null : new Date(lastSyncedAtValue);
  if (lastSyncedAtValue !== null && Number.isNaN(Date.parse(lastSyncedAtValue))) {
    return NextResponse.json({ status: 400, success: false, error: "lastSyncedAt must be a valid date." }, { status: 400 });
  }

  try {
    await connectDatabase();
    const syncStartedAt = new Date();
    const filter = lastSyncedAt ? { updatedAt: { $gt: lastSyncedAt } } : {};
    const entries = await Diary.find(filter).sort({ updatedAt: 1, date: 1 }).lean();

    return NextResponse.json({
      status: 200,
      success: true,
      countDocument: entries.length,
      entries,
      lastSyncedAt: syncStartedAt.toISOString(),
    }, { status: 200 });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
