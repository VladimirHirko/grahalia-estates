// app/lib/publicFeatured.ts
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type FeaturedItem = {
  id: number;
  slug: string;
  title: string;
  location: string;
  price: string; // formatted for UI
  beds: number;
  baths: number;
  area: number;
  image: string;
};

function titleFromSlug(slug: string) {
  if (!slug) return "Property";
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatPrice(opts: { lang: "en" | "es"; value: number | null; currency: string | null }) {
  const { lang, value, currency } = opts;

  if (value === null || value === undefined) {
    return lang === "es" ? "Precio bajo consulta" : "Price on Request";
  }

  const cur = (currency || "EUR").toUpperCase();

  try {
    return new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    const n = new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB", {
      maximumFractionDigits: 0,
    }).format(value);
    return cur === "EUR" ? `€${n}` : `${n} ${cur}`;
  }
}

export async function getFeaturedItems(lang: "en" | "es", limit = 6): Promise<FeaturedItem[]> {
  // 1) Published properties
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

  const ids = props.map((p) => Number(p.id)).filter((n) => Number.isFinite(n));

  // 2) One image per property: cover first, else first by sort_order
  // ✅ Вместо ANY(int[]) используем IN (...)
  const idSqlList = sql.join(ids.map((id) => sql`${id}`), sql`, `);

  const imagesRes = await db.execute(sql`
    SELECT DISTINCT ON (property_id)
      property_id,
      url
    FROM property_images
    WHERE property_id IN (${idSqlList})
    ORDER BY property_id, is_cover DESC, sort_order ASC, id ASC
  `);

  const images = ((imagesRes as any).rows ?? []) as Array<any>;
  const coverMap = new Map<number, string>();
  for (const row of images) {
    coverMap.set(Number(row.property_id), String(row.url));
  }

  return props.map((p) => {
    const id = Number(p.id);
    const slug = String(p.slug || "");
    const image = coverMap.get(id) ?? "/properties/p1.jpg";

    return {
      id,
      slug,
      title: titleFromSlug(slug) || `Property #${id}`,
      location: p.location ? String(p.location) : "",
      price: formatPrice({
        lang,
        value: p.price !== null && p.price !== undefined ? Number(p.price) : null,
        currency: p.currency ? String(p.currency) : null,
      }),
      beds: p.bedrooms !== null && p.bedrooms !== undefined ? Number(p.bedrooms) : 0,
      baths: p.bathrooms !== null && p.bathrooms !== undefined ? Number(p.bathrooms) : 0,
      area: p.built_area_m2 !== null && p.built_area_m2 !== undefined ? Number(p.built_area_m2) : 0,
      image,
    };
  });
}
