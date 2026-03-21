import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inspections, inspectionPhotos } from "@/lib/db/schema";
import { extractBearerToken, verifySessionToken, verifyApiKey } from "@/lib/auth";
import { validateInspection } from "@/lib/gemini";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";

// ── POST /api/v1/inspections/:id/photos — Upload 6 photos + trigger Gemini ──

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: inspectionId } = await params;

  // Verify session token
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized: Missing session token" },
      { status: 401 }
    );
  }

  const session = await verifySessionToken(token);
  if (!session || session.inspectionId !== inspectionId) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or expired session token" },
      { status: 401 }
    );
  }

  // Check inspection exists and is PENDING
  const [inspection] = await db
    .select()
    .from(inspections)
    .where(eq(inspections.id, inspectionId))
    .limit(1);

  if (!inspection) {
    return NextResponse.json(
      { error: "Inspection not found" },
      { status: 404 }
    );
  }

  if (inspection.status === "APPROVED" || inspection.status === "PROCESSING") {
    return NextResponse.json(
      { error: `Inspection already ${inspection.status.toLowerCase()}` },
      { status: 409 }
    );
  }

  // If REJECTED, delete previous photos so they can be re-uploaded
  if (inspection.status === "REJECTED") {
    await db
      .delete(inspectionPhotos)
      .where(eq(inspectionPhotos.inspectionId, inspectionId));
  }

  // Check URL expiration
  if (new Date() > inspection.urlExpiresAt) {
    return NextResponse.json(
      { error: "Capture URL has expired" },
      { status: 410 }
    );
  }

  // Parse multipart form data
  const formData = await request.formData();
  const metadataRaw = formData.get("metadata");
  let metadata: {
    photos: Array<{
      timestamp: string;
      lat?: number;
      lng?: number;
      width: number;
      height: number;
    }>;
    user_agent?: string;
    geolocation?: { lat: number; lng: number; accuracy: number };
  };

  try {
    metadata = JSON.parse(metadataRaw as string);
  } catch {
    return NextResponse.json(
      { error: "Invalid metadata JSON" },
      { status: 400 }
    );
  }

  // Collect photos (expect 6)
  const angleTypes = ["FRONTAL", "REAR", "LEFT", "RIGHT", "DASHBOARD", "VIN"] as const;
  const photoFiles: File[] = [];

  for (let i = 0; i < 6; i++) {
    const file = formData.get(`photos[${i}]`) as File | null;
    if (!file) {
      return NextResponse.json(
        { error: `Missing photo at index ${i} (${angleTypes[i]})` },
        { status: 400 }
      );
    }
    photoFiles.push(file);
  }

  // Update status to PROCESSING
  await db
    .update(inspections)
    .set({
      status: "PROCESSING",
      userAgent: metadata.user_agent || request.headers.get("user-agent") || null,
      geolocationLat: metadata.geolocation?.lat?.toString() || null,
      geolocationLng: metadata.geolocation?.lng?.toString() || null,
      gpsAccuracy: metadata.geolocation?.accuracy?.toString() || null,
    })
    .where(eq(inspections.id, inspectionId));

  // Upload photos to Vercel Blob and collect buffers for Gemini
  const photoBuffers: { buffer: Buffer; mimeType: string }[] = [];
  const photoRecords: Array<{
    inspectionId: string;
    photoIndex: number;
    angleType: (typeof angleTypes)[number];
    blobUrl: string;
    blobKey: string;
    fileSizeBytes: number;
    widthPx: number;
    heightPx: number;
    timestampCapture: Date;
    geolocationLat: string | null;
    geolocationLng: string | null;
  }> = [];

  for (let i = 0; i < 6; i++) {
    const file = photoFiles[i];
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob
    const blobPath = `inspections/${inspectionId}/${angleTypes[i].toLowerCase()}.jpg`;
    let blobResult;
    try {
      blobResult = await put(blobPath, buffer, {
        access: "public",
        contentType: "image/jpeg",
      });
    } catch {
      // If Vercel Blob is not configured, store as base64 data URL
      const base64 = buffer.toString("base64");
      blobResult = { url: `data:image/jpeg;base64,${base64}`, pathname: blobPath };
    }

    photoBuffers.push({ buffer, mimeType: "image/jpeg" });

    const photoMeta = metadata.photos?.[i];
    photoRecords.push({
      inspectionId,
      photoIndex: i + 1,
      angleType: angleTypes[i],
      blobUrl: blobResult.url,
      blobKey: blobResult.pathname || blobPath,
      fileSizeBytes: buffer.length,
      widthPx: photoMeta?.width || 1200,
      heightPx: photoMeta?.height || 900,
      timestampCapture: photoMeta?.timestamp
        ? new Date(photoMeta.timestamp)
        : new Date(),
      geolocationLat: photoMeta?.lat?.toString() || null,
      geolocationLng: photoMeta?.lng?.toString() || null,
    });
  }

  // Save photo records to DB
  await db.insert(inspectionPhotos).values(photoRecords);

  // Call Gemini for validation
  const vehicleData = {
    make: inspection.vehicleMake,
    model: inspection.vehicleModel,
    color: inspection.vehicleColor,
    plate: inspection.vehiclePlate || undefined,
    vin: inspection.vehicleVin || undefined,
    year: inspection.vehicleYear || undefined,
  };

  const { result, latencyMs } = await validateInspection(vehicleData, photoBuffers);

  // Update inspection with results
  const finalStatus = result.inspection_result === "APPROVED" ? "APPROVED" : "REJECTED";

  await db
    .update(inspections)
    .set({
      status: finalStatus as "APPROVED" | "REJECTED",
      resultJson: result,
      confidenceScore: result.confidence_score.toString(),
      rejectionReasons: result.rejection_reasons.length > 0 ? result.rejection_reasons : null,
      completedAt: new Date(),
      geminiLatencyMs: latencyMs,
    })
    .where(eq(inspections.id, inspectionId));

  // Update individual photo AI results
  for (const photoResult of result.photos_validation) {
    const photoRecord = photoRecords[photoResult.photo_index - 1];
    if (photoRecord) {
      await db
        .update(inspectionPhotos)
        .set({
          aiAngleCorrect: photoResult.angle_correct,
          aiVehiclePresent: photoResult.vehicle_present,
          aiObservations: photoResult.observations,
        })
        .where(
          eq(inspectionPhotos.inspectionId, inspectionId)
        );
    }
  }

  return NextResponse.json({
    inspection_id: inspectionId,
    status: finalStatus,
    confidence_score: result.confidence_score,
    vehicle_detected: result.vehicle_detected,
    declared_data_match: result.declared_data_match,
    rejection_reasons: result.rejection_reasons,
    recommendations: result.recommendations,
    odometer_reading: result.odometer_reading,
    vin_extracted: result.vin_extracted,
    latency_ms: latencyMs,
  });
}

// ── GET /api/v1/inspections/:id — Query inspection result ──

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: inspectionId } = await params;

  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid API Key" },
      { status: 401 }
    );
  }

  const [inspection] = await db
    .select()
    .from(inspections)
    .where(eq(inspections.id, inspectionId))
    .limit(1);

  if (!inspection) {
    return NextResponse.json(
      { error: "Inspection not found" },
      { status: 404 }
    );
  }

  // Get photos
  const photos = await db
    .select()
    .from(inspectionPhotos)
    .where(eq(inspectionPhotos.inspectionId, inspectionId));

  return NextResponse.json({
    inspection_id: inspection.id,
    status: inspection.status,
    vehicle: {
      make: inspection.vehicleMake,
      model: inspection.vehicleModel,
      color: inspection.vehicleColor,
      plate: inspection.vehiclePlate,
      vin: inspection.vehicleVin,
      year: inspection.vehicleYear,
    },
    result_json: inspection.resultJson,
    confidence_score: inspection.confidenceScore,
    rejection_reasons: inspection.rejectionReasons,
    photos: photos.map((p) => ({
      url_signed: p.blobUrl,
      angle_type: p.angleType,
      timestamp: p.timestampCapture,
      ai_angle_correct: p.aiAngleCorrect,
      ai_vehicle_present: p.aiVehiclePresent,
      ai_observations: p.aiObservations,
    })),
    geolocation: inspection.geolocationLat
      ? {
          lat: inspection.geolocationLat,
          lng: inspection.geolocationLng,
          accuracy: inspection.gpsAccuracy,
        }
      : null,
    created_at: inspection.createdAt,
    completed_at: inspection.completedAt,
    gemini_latency_ms: inspection.geminiLatencyMs,
  });
}
