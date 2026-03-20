import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aon-poc-jwt-secret"
);

// ── JWT Session Tokens ─────────────────────────────────────────────────────────

export interface SessionPayload {
  inspectionId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate?: string;
}

export async function createSessionToken(
  payload: SessionPayload,
  expiresInHours: number = 72
): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInHours}h`)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ── API Key Auth ───────────────────────────────────────────────────────────────

const FALLBACK_API_KEY = "aon-poc-api-key-2026";

export function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");

  // No API key header = internal/frontend call, allow it
  if (!apiKey) return true;

  // If API key is provided, validate it
  return apiKey === (process.env.AON_API_KEY || FALLBACK_API_KEY);
}

// ── Extract Bearer Token ───────────────────────────────────────────────────────

export function extractBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}
