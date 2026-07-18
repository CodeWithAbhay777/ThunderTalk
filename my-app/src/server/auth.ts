import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { requiredEnvironment } from "@/server/env";

const COOKIE_NAME = "diary_session";
const issuer = "private-diary";
const audience = "private-diary-user";

function jwtSecret(): Uint8Array { return new TextEncoder().encode(requiredEnvironment("JWT_SECRET")); }

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "owner" }).setProtectedHeader({ alg: "HS256" }).setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime("8h").sign(jwtSecret());
}

export async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try { await jwtVerify(token, jwtSecret(), { issuer, audience }); return true; } catch { return false; }
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 8 });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}
