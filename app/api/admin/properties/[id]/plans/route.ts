import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function deleteFileIfInUploads(plansUrl: string | null) {
  if (!plansUrl) return;
  const url = String(plansUrl).trim();
  if (!url.startsWith("/uploads/")) return;

  // url: /uploads/plans/xxx.pdf
  const filePath = path.join(process.cwd(), "public", url);
  try {
    await fs.unlink(filePath);
  } catch {
    // если файла нет — просто игнорируем
  }
}

async function getCurrentPlansUrl(propertyId: number) {
  const res = await db.execute(sql`
    SELECT plans_url
    FROM properties
    WHERE id = ${propertyId}
    LIMIT 1
  `);
  const row = (res as any).rows?.[0];
  return (row?.plans_url ?? null) as string | null;
}

/**
 * POST:
 * - обычная загрузка pdf (field: file)
 * - или "_method=delete" для удаления через HTML form
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const propertyId = Number(id);

  if (!Number.isFinite(propertyId)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const form = await req.formData();

  // ✅ поддержка delete через hidden _method
  const override = String(form.get("_method") || "").toLowerCase();
  if (override === "delete") {
    return handleDelete(req, propertyId);
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file (field name must be 'file')" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF allowed" }, { status: 400 });
  }

  // ✅ читаем файл
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // ✅ гарантируем, что папка существует
  const plansDir = path.join(process.cwd(), "public", "uploads", "plans");
  await ensureDir(plansDir);

  // ✅ удаляем предыдущий pdf (если был)
  const oldUrl = await getCurrentPlansUrl(propertyId);

  const filename = `property-${propertyId}-${Date.now()}-${safeName(file.name || "plans.pdf")}`;
  const diskPath = path.join(plansDir, filename);
  const publicUrl = `/uploads/plans/${filename}`;

  await fs.writeFile(diskPath, buffer);

  await db.execute(sql`
    UPDATE properties
    SET plans_url = ${publicUrl}, updated_at = NOW()
    WHERE id = ${propertyId}
  `);

  // ✅ чистим старый файл после успешной записи нового
  await deleteFileIfInUploads(oldUrl);

  return NextResponse.redirect(new URL(`/admin/properties/${propertyId}`, req.url), 303);
}

/**
 * DELETE:
 * - удаляет plans_url из БД
 * - удаляет физический файл из public/uploads/...
 */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const propertyId = Number(id);

  if (!Number.isFinite(propertyId)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  return handleDelete(req, propertyId);
}

async function handleDelete(req: Request, propertyId: number) {
  const oldUrl = await getCurrentPlansUrl(propertyId);

  // убираем ссылку из БД
  await db.execute(sql`
    UPDATE properties
    SET plans_url = NULL, updated_at = NOW()
    WHERE id = ${propertyId}
  `);

  // удаляем файл
  await deleteFileIfInUploads(oldUrl);

  return NextResponse.redirect(new URL(`/admin/properties/${propertyId}`, req.url), 303);
}
