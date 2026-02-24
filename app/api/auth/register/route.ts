import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    if (existing && !existing.passwordHash) {
      // User exists from Google OAuth — attach password for credentials login
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, name: existing.name ?? name ?? null },
      });
      return NextResponse.json({ ok: true });
    }

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API/register] Error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

