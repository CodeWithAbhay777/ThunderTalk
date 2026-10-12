import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/database/mongoose";
import { Diary } from "@/models/diary";
import { agentErrorResponse, requireAgentToken } from "@/server/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const denied = await requireAgentToken(request);
  if (denied) return denied;

  const yearValue = request.nextUrl.searchParams.get("year");
  const monthValue = request.nextUrl.searchParams.get("month");
  const year = Number(yearValue);
  const month = Number(monthValue);

  if (
    !yearValue ||
    !monthValue ||
    !/^\d{4}$/.test(yearValue) ||
    !/^(?:[1-9]|1[0-2])$/.test(monthValue) ||
    !Number.isInteger(year) ||
    !Number.isInteger(month)
  ) {
    return NextResponse.json(
      { status: 400, success: false, error: "year must be YYYY and month must be between 1 and 12." },
      { status: 400 },
    );
  }

  const monthPrefix = `${yearValue}-${monthValue.padStart(2, "0")}-`;

  try {
    await connectDatabase();
    const entries = await Diary.find(
      { date: { $gte: `${monthPrefix}01`, $lt: `${monthPrefix}32` } },
      { _id: 0, date: 1 },
    ).sort({ date: 1 }).lean();
    const entryDates = entries.map((entry) => entry.date);

    return NextResponse.json(
      { status: 200, success: true, countDocument: entryDates.length, entryDates },
      { status: 200 },
    );
  } catch (error) {
    return agentErrorResponse(error);
  }
}
