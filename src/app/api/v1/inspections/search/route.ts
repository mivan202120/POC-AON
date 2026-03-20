import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inspections } from "@/lib/db/schema";
import { verifyApiKey } from "@/lib/auth";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// GET /api/v1/inspections/search — Search by plate, VIN, dates, status
export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid API Key" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const plate = searchParams.get("plate");
  const vin = searchParams.get("vin");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  // Build conditions
  const conditions = [];

  if (plate) {
    conditions.push(
      sql`LOWER(${inspections.vehiclePlate}) = LOWER(${plate})`
    );
  }

  if (vin) {
    conditions.push(
      sql`LOWER(${inspections.vehicleVin}) = LOWER(${vin})`
    );
  }

  if (from) {
    conditions.push(gte(inspections.createdAt, new Date(from)));
  }

  if (to) {
    conditions.push(lte(inspections.createdAt, new Date(to)));
  }

  if (status) {
    const validStatuses = ["PENDING", "PROCESSING", "APPROVED", "REJECTED"];
    if (validStatuses.includes(status.toUpperCase())) {
      conditions.push(
        eq(inspections.status, status.toUpperCase() as "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED")
      );
    }
  }

  const results = await db
    .select({
      id: inspections.id,
      vehicleMake: inspections.vehicleMake,
      vehicleModel: inspections.vehicleModel,
      vehicleColor: inspections.vehicleColor,
      vehiclePlate: inspections.vehiclePlate,
      vehicleVin: inspections.vehicleVin,
      status: inspections.status,
      confidenceScore: inspections.confidenceScore,
      createdAt: inspections.createdAt,
      completedAt: inspections.completedAt,
    })
    .from(inspections)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${inspections.createdAt} DESC`)
    .limit(limit);

  return NextResponse.json({
    total: results.length,
    inspections: results.map((r) => ({
      inspection_id: r.id,
      vehicle: {
        make: r.vehicleMake,
        model: r.vehicleModel,
        color: r.vehicleColor,
        plate: r.vehiclePlate,
        vin: r.vehicleVin,
      },
      status: r.status,
      confidence_score: r.confidenceScore,
      created_at: r.createdAt,
      completed_at: r.completedAt,
    })),
  });
}
