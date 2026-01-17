// app/api/admin/properties/[id]/images/route.ts
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

function toDiskPathFromPublicUrl(publicUrl: string) {
  // publicUrl вида "/uploads/properties/xxx.jpg"
  const clean = publicUrl.startsWith("/") ? publicUrl.slice(1) : publicUrl;
  return path.join(process.cwd(), "public", clean);
}

async function ensureBelongsToProperty(imageId: number, propertyId: number) {
  const res = await db.execute(sql`
    SELECT id, property_id, url, is_cover, sort_order
    FROM property_images
    WHERE id = ${imageId}
    LIMIT 1
  `);

  const img = (res as any).rows?.[0];
  if (!img || Number(img.property_id) !== propertyId) return null;
  return img as { id: number; property_id: number; url: string; is_cover: boolean; sort_order: number };
}

async function setCover(imageId: number, propertyId: number) {
  // 1) снять cover со всех
  await db.execute(sql`
    UPDATE property_images
    SET is_cover = false
    WHERE property_id = ${propertyId}
  `);

  // 2) поставить cover выбранному
  await db.execute(sql`
    UPDATE property_images
    SET is_cover = true
    WHERE id = ${imageId}
  `);
}

async function moveImage(imageId: number, propertyId: number, dir: "up" | "down") {
  const current = await ensureBelongsToProperty(imageId, propertyId);
  if (!current) return { ok: false, status: 404 as const, error: "Image not found" };

  const curSort = Number(current.sort_order);

  // Находим "соседа" по sort_order
  const neighborRes =
    dir === "up"
      ? await db.execute(sql`
          SELECT id, sort_order
          FROM property_images
          WHERE property_id = ${propertyId}
            AND (sort_order < ${curSort} OR (sort_order = ${curSort} AND id < ${imageId}))
          ORDER BY sort_order DESC, id DESC
          LIMIT 1
        `)
      : await db.execute(sql`
          SELECT id, sort_order
          FROM property_images
          WHERE property_id = ${propertyId}
            AND (sort_order > ${curSort} OR (sort_order = ${curSort} AND id > ${imageId}))
          ORDER BY sort_order ASC, id ASC
          LIMIT 1
        `);

  const neighbor = (neighborRes as any).rows?.[0];
  if (!neighbor) {
    // уже крайний
    return { ok: true as const };
  }

  const neighborId = Number(neighbor.id);
  const neighborSort = Number(neighbor.sort_order);

  // swap sort_order местами
  await db.execute(sql`
    UPDATE property_images
    SET sort_order = ${neighborSort}
    WHERE id = ${imageId}
  `);

  await db.execute(sql`
    UPDATE property_images
    SET sort_order = ${curSort}
    WHERE id = ${neighborId}
  `);

  return { ok: true as const };
}

// ✅ upload images (multiple) + delete + setCover + move
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const propertyId = Number(id);
  if (!Number.isFinite(propertyId)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const form = await req.formData();

  // ✅ метод-оверрайд (как у тебя уже сделано для delete)
  const methodOverride = String(form.get("_method") || "").toLowerCase();

  // 1) delete image
  if (methodOverride === "delete") {
    const imageId = Number(form.get("imageId"));
    if (!Number.isFinite(imageId)) {
      return NextResponse.json({ error: "Bad imageId" }, { status: 400 });
    }

    const img = await ensureBelongsToProperty(imageId, propertyId);
    if (!img) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // удаляем файл с диска (если вдруг уже удалён — не падаем)
    const diskPath = toDiskPathFromPublicUrl(String(img.url));
    try {
      await fs.unlink(diskPath);
    } catch {
      // ignore
    }

    // удаляем запись из БД
    await db.execute(sql`DELETE FROM property_images WHERE id = ${imageId}`);

    // если удалили cover — назначим новый cover (первую по sort_order)
    if (img.is_cover) {
      const nextRes = await db.execute(sql`
        SELECT id
        FROM property_images
        WHERE property_id = ${propertyId}
        ORDER BY sort_order ASC, id ASC
        LIMIT 1
      `);
      const nextId = (nextRes as any).rows?.[0]?.id;
      if (nextId) {
        await setCover(Number(nextId), propertyId);
      }
    }

    return NextResponse.redirect(new URL(`/admin/properties/${propertyId}`, req.url), 303);
  }

  // 2) set cover
  if (methodOverride === "setcover") {
    const imageId = Number(form.get("imageId"));
    if (!Number.isFinite(imageId)) {
      return NextResponse.json({ error: "Bad imageId" }, { status: 400 });
    }

    const img = await ensureBelongsToProperty(imageId, propertyId);
    if (!img) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    await setCover(imageId, propertyId);
    return NextResponse.redirect(new URL(`/admin/properties/${propertyId}`, req.url), 303);
  }

  // 3) move up/down
  if (methodOverride === "move") {
    const imageId = Number(form.get("imageId"));
    const dirRaw = String(form.get("dir") || "").toLowerCase();
    const dir = dirRaw === "up" ? "up" : dirRaw === "down" ? "down" : null;

    if (!Number.isFinite(imageId) || !dir) {
      return NextResponse.json({ error: "Bad move params" }, { status: 400 });
    }

    const res = await moveImage(imageId, propertyId, dir);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });

    return NextResponse.redirect(new URL(`/admin/properties/${propertyId}`, req.url), 303);
  }

  // 4) обычная загрузка (как у тебя сейчас)
  const files = form.getAll("files").filter((x) => x instanceof File) as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "No files (field name must be 'files')" }, { status: 400 });
  }

  // max sort_order
  const maxRes = await db.execute(sql`
    SELECT COALESCE(MAX(sort_order), 0) AS max
    FROM property_images
    WHERE property_id = ${propertyId}
  `);
  const maxSort = Number((maxRes as any).rows?.[0]?.max ?? 0);

  // already has cover?
  const coverRes = await db.execute(sql`
    SELECT id
    FROM property_images
    WHERE property_id = ${propertyId} AND is_cover = true
    LIMIT 1
  `);
  const hasCover = !!(coverRes as any).rows?.length;

  let i = 0;
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `property-${propertyId}-${Date.now()}-${i}-${safeName(file.name || "image")}`;
    const diskPath = path.join(process.cwd(), "public", "uploads", "properties", filename);
    const publicUrl = `/uploads/properties/${filename}`;

    await fs.mkdir(path.dirname(diskPath), { recursive: true });
    await fs.writeFile(diskPath, buffer);

    const sortOrder = maxSort + i + 1;
    const isCover = !hasCover && i === 0;

    await db.execute(sql`
      INSERT INTO property_images (property_id, url, alt, sort_order, is_cover)
      VALUES (${propertyId}, ${publicUrl}, ${null}, ${sortOrder}, ${isCover})
    `);

    i++;
  }

  return NextResponse.redirect(new URL(`/admin/properties/${propertyId}`, req.url), 303);
}
