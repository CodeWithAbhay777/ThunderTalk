import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createAgentToken } from "@/server/auth";
import { requiredEnvironment } from "@/server/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const password = typeof body === "object" && body && "password" in body ? body.password : undefined;
    if (typeof password !== "string" || password.length === 0 || password.length > 1024) {
      return NextResponse.json({ status: 401, success: false, error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, requiredEnvironment("AUTH_PASSWORD_BCRYPT_HASH"));
    if (!valid) return NextResponse.json({ status: 401, success: false, error: "Invalid credentials." }, { status: 401 });

    return NextResponse.json({ status: 200, success: true, token: await createAgentToken() }, { status: 200 });
  } catch (error) {
    console.error("Agent login failure", error);
    return NextResponse.json({ status: 500, success: false, error: "Unable to authenticate." }, { status: 500 });
  }
}
