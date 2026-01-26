// app/lib/publicFeatured.ts
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { formatDisplayPrice } from "@/app/lib/priceFormat";
import { titleFromSlugClean } from "@/app/lib/propertyTitle";

export type DealType = "sale" | "rent" | null;
export type PropertyStatus = "available" | "reserved" | "sold" | null;

export type FeaturedItem = {
  id: number;
  slug: string;
  title: string;
  location: string;
  price: string; // formatted for UI
  dealType: DealType; // ✅ for badge
  beds: number;
  baths: number;
  area: number;
  image: string;

  // ✅ NEW BUILD for badge
  isNewBuild: boolean;

  // ✅ STATUS for reserved/sold UI
  status: PropertyStatus;
};

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function normalizeDealType(v: unknown): DealType {
  const s = (toStringOrNull(v) ?? "").toLowerCase();
  if (s === "sale" || s === "rent") return s;
  return null;
}

function normalizeStatus(v: unknown): PropertyStatus {
  const s = (toStringOrNull(v) ?? "").toLowerCase();
  if (s === "available" || s === "reserved" || s === "sold") return s;
  return null;
}

function isNewBuildFromCondition(v: unknown): boolean {
  const s = (toStringOrNull(v) ?? "").toLowerCase();
  if (!s) return false;
  return s === "new_build" || s === "new build" || s === "newbuild" || s.includes("new");
}

export async function getFeaturedItems(lang: "en" | "es", limit = 6): Promise<FeaturedItem[]> {
  const propsRes = await db.execute(sql`
    SELECT
      id,
      slug,
      location,
      price,
      currency,
      deal_type,
      rent_price,
      rent_period,
      bedrooms,
      bathrooms,
      built_area_m2,
      condition,
      status
    FROM properties
    WHERE is_published = true
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

  const props = ((propsRes as any).rows ?? []) as any[];
  if (props.length === 0) return [];

  const ids = props.map((p) => Number(p.id)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) return [];

  // ✅ IN (...) — не ANY (чтобы не ловить cast record -> int[])
  const idSqlList = sql.join(ids.map((id) => sql`${id}`), sql`, `);

  const imagesRes = await db.execute(sql`
    SELECT DISTINCT ON (property_id)
      property_id,
      url
    FROM property_images
    WHERE property_id IN (${idSqlList})
    ORDER BY property_id, is_cover DESC, sort_order ASC, id ASC
  `);

  const coverMap = new Map<number, string>();
  for (const row of ((imagesRes as any).rows ?? []) as any[]) {
    const pid = Number(row.property_id);
    const url = toStringOrNull(row.url);
    if (Number.isFinite(pid) && url) coverMap.set(pid, url);
  }

  return props.map((p) => {
    const id = Number(p.id);
    const slug = toStringOrNull(p.slug) ?? "";

    const dealType = normalizeDealType(p.deal_type);
    const status = normalizeStatus(p.status);

    const salePrice = toNumberOrNull(p.price);
    const rentPrice = toNumberOrNull(p.rent_price);
    const rentPeriod = toStringOrNull(p.rent_period);
    const currency = toStringOrNull(p.currency);

    const isNewBuild = isNewBuildFromCondition(p.condition);

    return {
      id,
      slug,
      title: titleFromSlugClean(slug) || "Property",
      location: toStringOrNull(p.location) ?? "",
      price: formatDisplayPrice({
        lang,
        dealType,
        salePrice,
        currency,
        rentPrice,
        rentPeriod,
      }),
      dealType,
      beds: toNumberOrNull(p.bedrooms) ?? 0,
      baths: toNumberOrNull(p.bathrooms) ?? 0,
      area: toNumberOrNull(p.built_area_m2) ?? 0,
      image: coverMap.get(id) ?? "/properties/p1.jpg",
      isNewBuild,
      status,
    };
  });
}
