import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Simple hash (POC only — use bcrypt in production)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `poc_hash_${Math.abs(hash).toString(36)}`;
}

// ── GET: List all users ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const users = await db
      .select({
        id: platformUsers.id,
        username: platformUsers.username,
        displayName: platformUsers.displayName,
        role: platformUsers.role,
        isActive: platformUsers.isActive,
        createdAt: platformUsers.createdAt,
        updatedAt: platformUsers.updatedAt,
      })
      .from(platformUsers)
      .orderBy(platformUsers.createdAt);

    // If no users exist, seed the defaults
    if (users.length === 0) {
      await db.insert(platformUsers).values([
        {
          username: "admin",
          passwordHash: simpleHash("1234"),
          displayName: "Administrador",
          role: "admin",
          isActive: true,
        },
        {
          username: "ivan",
          passwordHash: simpleHash("1234"),
          displayName: "Ivan Hernández",
          role: "user",
          isActive: true,
        },
      ]);

      const seeded = await db
        .select({
          id: platformUsers.id,
          username: platformUsers.username,
          displayName: platformUsers.displayName,
          role: platformUsers.role,
          isActive: platformUsers.isActive,
          createdAt: platformUsers.createdAt,
          updatedAt: platformUsers.updatedAt,
        })
        .from(platformUsers)
        .orderBy(platformUsers.createdAt);

      return NextResponse.json({ users: seeded });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Users GET error:", error);
    return NextResponse.json({ error: "Error loading users" }, { status: 500 });
  }
}

// ── POST: Create new user ───────────────────────────────────────────────────

const createUserSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(4).max(100),
  displayName: z.string().min(2).max(100),
  role: z.enum(["admin", "user"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = createUserSchema.parse(await request.json());

    // Check duplicate username
    const existing = await db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.username, body.username));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "El nombre de usuario ya existe" },
        { status: 409 }
      );
    }

    const [user] = await db
      .insert(platformUsers)
      .values({
        username: body.username,
        passwordHash: simpleHash(body.password),
        displayName: body.displayName,
        role: body.role,
      })
      .returning({
        id: platformUsers.id,
        username: platformUsers.username,
        displayName: platformUsers.displayName,
        role: platformUsers.role,
        isActive: platformUsers.isActive,
        createdAt: platformUsers.createdAt,
      });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    console.error("Users POST error:", error);
    return NextResponse.json({ error: "Error creating user" }, { status: 500 });
  }
}

// ── PUT: Update user ────────────────────────────────────────────────────────

const updateUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(2).max(50).optional(),
  password: z.string().min(4).max(100).optional(),
  displayName: z.string().min(2).max(100).optional(),
  role: z.enum(["admin", "user"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = updateUserSchema.parse(await request.json());

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.username) updates.username = body.username;
    if (body.password) updates.passwordHash = simpleHash(body.password);
    if (body.displayName) updates.displayName = body.displayName;
    if (body.role) updates.role = body.role;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const [updated] = await db
      .update(platformUsers)
      .set(updates)
      .where(eq(platformUsers.id, body.id))
      .returning({
        id: platformUsers.id,
        username: platformUsers.username,
        displayName: platformUsers.displayName,
        role: platformUsers.role,
        isActive: platformUsers.isActive,
        updatedAt: platformUsers.updatedAt,
      });

    if (!updated) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    console.error("Users PUT error:", error);
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}

// ── DELETE: Deactivate user ─────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    const [deleted] = await db
      .delete(platformUsers)
      .where(eq(platformUsers.id, id))
      .returning({ id: platformUsers.id });

    if (!deleted) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Users DELETE error:", error);
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
  }
}
