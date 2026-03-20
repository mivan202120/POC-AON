import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────────────

export const inspectionStatusEnum = pgEnum("inspection_status", [
  "PENDING",
  "PROCESSING",
  "APPROVED",
  "REJECTED",
]);

export const angleTypeEnum = pgEnum("angle_type", [
  "FRONTAL",
  "REAR",
  "LEFT",
  "RIGHT",
  "DASHBOARD",
  "VIN",
]);

// ── Table: inspections ─────────────────────────────────────────────────────────

export const inspections = pgTable("inspections", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("session_token", { length: 512 }).notNull(),
  vehicleMake: varchar("vehicle_make", { length: 100 }).notNull(),
  vehicleModel: varchar("vehicle_model", { length: 100 }).notNull(),
  vehicleColor: varchar("vehicle_color", { length: 50 }).notNull(),
  vehiclePlate: varchar("vehicle_plate", { length: 20 }),
  vehicleVin: varchar("vehicle_vin", { length: 17 }),
  vehicleYear: integer("vehicle_year"),
  status: inspectionStatusEnum("status").notNull().default("PENDING"),
  resultJson: jsonb("result_json"),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  rejectionReasons: text("rejection_reasons").array(),
  geolocationLat: decimal("geolocation_lat", { precision: 10, scale: 8 }),
  geolocationLng: decimal("geolocation_lng", { precision: 11, scale: 8 }),
  gpsAccuracy: decimal("gps_accuracy", { precision: 6, scale: 2 }),
  userAgent: text("user_agent"),
  urlExpiresAt: timestamp("url_expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  geminiLatencyMs: integer("gemini_latency_ms"),
});

// ── Table: inspection_photos ───────────────────────────────────────────────────

export const inspectionPhotos = pgTable("inspection_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  inspectionId: uuid("inspection_id")
    .notNull()
    .references(() => inspections.id, { onDelete: "cascade" }),
  photoIndex: integer("photo_index").notNull(),
  angleType: angleTypeEnum("angle_type").notNull(),
  blobUrl: text("blob_url").notNull(),
  blobKey: varchar("blob_key", { length: 255 }).notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  widthPx: integer("width_px").notNull(),
  heightPx: integer("height_px").notNull(),
  timestampCapture: timestamp("timestamp_capture", { withTimezone: true }).notNull(),
  geolocationLat: decimal("geolocation_lat", { precision: 10, scale: 8 }),
  geolocationLng: decimal("geolocation_lng", { precision: 11, scale: 8 }),
  aiAngleCorrect: boolean("ai_angle_correct"),
  aiVehiclePresent: boolean("ai_vehicle_present"),
  aiObservations: text("ai_observations"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Types ──────────────────────────────────────────────────────────────────────

export type Inspection = typeof inspections.$inferSelect;
export type NewInspection = typeof inspections.$inferInsert;
export type InspectionPhoto = typeof inspectionPhotos.$inferSelect;
export type NewInspectionPhoto = typeof inspectionPhotos.$inferInsert;
