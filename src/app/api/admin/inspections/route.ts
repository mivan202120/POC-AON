import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inspections, inspectionPhotos } from "@/lib/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";

// GET /api/admin/inspections — Fetch all inspections with photos and stats
export async function GET() {
  try {
    // Fetch all inspections ordered by creation date
    const allInspections = await db
      .select()
      .from(inspections)
      .orderBy(desc(inspections.createdAt));

    // Fetch all photos
    const allPhotos = await db
      .select()
      .from(inspectionPhotos)
      .orderBy(inspectionPhotos.photoIndex);

    // Group photos by inspection
    const photosByInspection = allPhotos.reduce(
      (acc, photo) => {
        if (!acc[photo.inspectionId]) acc[photo.inspectionId] = [];
        acc[photo.inspectionId].push(photo);
        return acc;
      },
      {} as Record<string, typeof allPhotos>
    );

    // Compute stats
    const stats = {
      total: allInspections.length,
      approved: allInspections.filter((i) => i.status === "APPROVED").length,
      rejected: allInspections.filter((i) => i.status === "REJECTED").length,
      pending: allInspections.filter((i) => i.status === "PENDING").length,
      processing: allInspections.filter((i) => i.status === "PROCESSING").length,
      totalPhotos: allPhotos.length,
      avgLatencyMs:
        allInspections.filter((i) => i.geminiLatencyMs).length > 0
          ? Math.round(
              allInspections
                .filter((i) => i.geminiLatencyMs)
                .reduce((sum, i) => sum + (i.geminiLatencyMs || 0), 0) /
                allInspections.filter((i) => i.geminiLatencyMs).length
            )
          : null,
    };

    // Build response with photos attached
    const data = allInspections.map((inspection) => ({
      ...inspection,
      photos: photosByInspection[inspection.id] || [],
    }));

    return NextResponse.json({ stats, inspections: data });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Error fetching inspections" },
      { status: 500 }
    );
  }
}
