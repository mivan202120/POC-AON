import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inspections } from "@/lib/db/schema";
import { createSessionToken, verifyApiKey } from "@/lib/auth";
import { z } from "zod";

// POST /api/v1/inspections — Create a new inspection session
const createInspectionSchema = z.object({
  vehicle_make: z.string().min(1),
  vehicle_model: z.string().min(1),
  vehicle_color: z.string().min(1),
  vehicle_plate: z.string().optional(),
  vehicle_vin: z.string().max(17).optional(),
  vehicle_year: z.number().int().optional(),
  url_ttl_hours: z.number().int().min(1).max(720).optional().default(72),
});

export async function POST(request: NextRequest) {
  // Verify API Key
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid API Key" },
      { status: 401 }
    );
  }

  // Parse and validate body
  let body;
  try {
    body = createInspectionSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body", details: error },
      { status: 400 }
    );
  }

  // Calculate URL expiration
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + body.url_ttl_hours);

  // Create session token
  const sessionToken = await createSessionToken(
    {
      inspectionId: "", // Will be updated after insert
      vehicleMake: body.vehicle_make,
      vehicleModel: body.vehicle_model,
      vehicleColor: body.vehicle_color,
      vehiclePlate: body.vehicle_plate,
    },
    body.url_ttl_hours
  );

  // Insert inspection into DB
  const [inspection] = await db
    .insert(inspections)
    .values({
      sessionToken,
      vehicleMake: body.vehicle_make,
      vehicleModel: body.vehicle_model,
      vehicleColor: body.vehicle_color,
      vehiclePlate: body.vehicle_plate || null,
      vehicleVin: body.vehicle_vin || null,
      vehicleYear: body.vehicle_year || null,
      status: "PENDING",
      urlExpiresAt: expiresAt,
    })
    .returning();

  // Regenerate token with actual inspection ID
  const finalToken = await createSessionToken(
    {
      inspectionId: inspection.id,
      vehicleMake: body.vehicle_make,
      vehicleModel: body.vehicle_model,
      vehicleColor: body.vehicle_color,
      vehiclePlate: body.vehicle_plate,
    },
    body.url_ttl_hours
  );

  // Update the session token in DB
  const { eq } = await import("drizzle-orm");
  await db
    .update(inspections)
    .set({ sessionToken: finalToken })
    .where(eq(inspections.id, inspection.id));

  // Build capture URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const captureUrl = `${appUrl}/capture/${inspection.id}?token=${finalToken}`;

  return NextResponse.json(
    {
      inspection_id: inspection.id,
      capture_url: captureUrl,
      session_token: finalToken,
      expires_at: expiresAt.toISOString(),
    },
    { status: 201 }
  );
}
