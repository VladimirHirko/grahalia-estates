// app/lib/publicProperties.ts
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type FeaturedProperty = {
  id: number;
  slug: string;
  title: string;        // пока используем slug -> Title-case, позже добавим реальные поля
  location: string | null;
  price: number | null;
  currency: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  built_area_m2: number | null;
  cover_url: string | null;
};

function titleFromSlug(slug: string) {
  // "modern-villa-marbella" -> "Modern Villa Marbella"
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function getFeaturedProperties(limit = 6): Promise<FeaturedProperty[]> {
  // 1) берём опубликованные properties
  const propsRes = await db.execute(sql`
    SELECT
      id,
      slug,
      location,
      price,
      currency,
      bedrooms,
      bathrooms,
      built_area_m2
    FROM properties
    WHERE is_published = true
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

  const props = ((propsRes as any).rows ?? []) as Array<any>;
  if (props.length === 0) return [];

  const ids = props.map((p) => Number(p.id));

  // 2) берём cover-картинки пачкой (cover first, then smallest sort_order)
  const imagesRes = await db.execute(sql`
    SELECT DISTINCT ON (property_id)
      property_id,
      url
    FROM property_images
    WHERE property_id = ANY(${ids}::int[])
    ORDER BY property_id, is_cover DESC, sort_order ASC, id ASC
  `);

  const images = ((imagesRes as any).rows ?? []) as Array<any>;
  const coverMap = new Map<number, string>();
  for (const row of images) {
    coverMap.set(Number(row.property_id), String(row.url));
  }

  return props.map((p) => {
    const slug = String(p.slug ?? "");
    return {
      id: Number(p.id),
      slug,
      title: titleFromSlug(slug || `property-${p.id}`),
      location: p.location ? String(p.location) : null,
      price: p.price !== null && p.price !== undefined ? Number(p.price) : null,
      currency: p.currency ? String(p.currency) : null,
      bedrooms: p.bedrooms !== null && p.bedrooms !== undefined ? Number(p.bedrooms) : null,
      bathrooms: p.bathrooms !== null && p.bathrooms !== undefined ? Number(p.bathrooms) : null,
      built_area_m2:
        p.built_area_m2 !== null && p.built_area_m2 !== undefined ? Number(p.built_area_m2) : null,
      cover_url: coverMap.get(Number(p.id)) ?? null,
    };
  });
}
