import { NextRequest, NextResponse } from "next/server";
import { hasValidAgentToken, hasValidSession } from "@/server/auth";

export async function requireSession(request: NextRequest): Promise<NextResponse | null> {
  return (await hasValidSession(request)) ? null : NextResponse.json({ error: "Authentication required.", code: "UNAUTHORIZED" }, { status: 401 });
}

export async function requireAgentToken(request: NextRequest): Promise<NextResponse | null> {
  return (await hasValidAgentToken(request))
    ? null
    : NextResponse.json({ status: 401, success: false, error: "Authentication required.", code: "UNAUTHORIZED" }, { status: 401 });
}

export function errorResponse(error: unknown): NextResponse {
  console.error("Diary API error", error);
  return NextResponse.json({ error: "The request could not be completed." }, { status: 500 });
}

export function agentErrorResponse(error: unknown): NextResponse {
  console.error("Agent diary API error", error);
  return NextResponse.json({ status: 500, success: false, error: "The request could not be completed." }, { status: 500 });
}
