import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/server/auth";
import { requiredEnvironment } from "@/server/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const password = typeof body === "object" && body && "password" in body ? body.password : undefined;
    if (typeof password !== "string" || password.length === 0 || password.length > 1024) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, requiredEnvironment("AUTH_PASSWORD_BCRYPT_HASH"));
    if (!valid) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, await createSessionToken());
    return response;
  } catch (error) {
    console.error("Login failure", error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
