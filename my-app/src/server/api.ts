import { NextRequest, NextResponse } from "next/server";
import { hasValidSession } from "@/server/auth";

export async function requireSession(request: NextRequest): Promise<NextResponse | null> {
  return (await hasValidSession(request)) ? null : NextResponse.json({ error: "Authentication required.", code: "UNAUTHORIZED" }, { status: 401 });
}

export function errorResponse(error: unknown): NextResponse {
  console.error("Diary API error", error);
  return NextResponse.json({ error: "The request could not be completed." }, { status: 500 });
}
