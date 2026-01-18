// app/lib/publicProperties.ts
import { sql } from "drizzle-orm";
import { db } from "@/db";

/* -----------------------------
   Shared helpers
------------------------------ */

function titleFromSlug(slug: string) {
  // "modern-villa-marbella" -> "Modern Villa Marbella"
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

/* -----------------------------
   Featured (home page) - keep as is
------------------------------ */

export type FeaturedProperty = {
  id: number;
  slug: string;
  title: string;
  location: string | null;
  price: number | null;
  currency: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  built_area_m2: number | null;
  cover_url: string | null;
};

export async function getFeaturedProperties(limit = 6): Promise<FeaturedProperty[]> {
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

/* -----------------------------
   Catalog + filters + amenities
------------------------------ */

export type CatalogFeature = {
  key: string;
  label: string;
};

export type CatalogItem = {
  id: number;
  slug: string;

  title: string;
  location: string;
  priceText: string;

  beds: number;
  baths: number;
  area: number;

  image: string;
  features: CatalogFeature[];
};

export type CatalogFilters = {
  type?: string | null;
  featureKeys?: string[] | null; // объект должен иметь ВСЕ выбранные keys
};

// ✅ Поставь true, когда реально добавишь эти вещи в БД
const HAS_PROPERTY_TYPE = false;
const HAS_PROPERTY_TRANSLATIONS = false;

function normalizeFeatureKeys(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => String(x || "").trim().toLowerCase())
    .filter(Boolean);
}

export async function getCatalogItems(opts: {
  lang: "en" | "es";
  page: number;
  pageSize: number;
  filters?: CatalogFilters;
}): Promise<{ items: CatalogItem[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const { lang, pageSize } = opts;

  const page = Number.isFinite(opts.page) && opts.page > 0 ? Math.floor(opts.page) : 1;

  const type = (opts.filters?.type || "").trim() || null;
  const featureKeys = normalizeFeatureKeys(opts.filters?.featureKeys);
  const needFeatures = featureKeys.length > 0;

  // WHERE
  const whereParts: any[] = [sql`p.is_published = true`];
  if (HAS_PROPERTY_TYPE && type) whereParts.push(sql`p.property_type = ${type}`);
  const whereSql = sql.join(whereParts, sql` AND `);

  // TOTAL
  let total = 0;

  if (!needFeatures) {
    const totalRes = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM properties p
      WHERE ${whereSql}
    `);
    total = Number((totalRes as any).rows?.[0]?.total ?? 0);
  } else {
    const keysList = sql.join(featureKeys.map((k) => sql`${k}`), sql`, `);

    const totalRes = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM (
        SELECT p.id
        FROM properties p
        JOIN property_features pf ON pf.property_id = p.id
        JOIN features f ON f.id = pf.feature_id
        WHERE ${whereSql}
          AND f.key IN (${keysList})
        GROUP BY p.id
        HAVING COUNT(DISTINCT f.key) = ${featureKeys.length}
      ) x
    `);
    total = Number((totalRes as any).rows?.[0]?.total ?? 0);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  // IDS
  let ids: number[] = [];

  if (!needFeatures) {
    const idsRes = await db.execute(sql`
      SELECT p.id
      FROM properties p
      WHERE ${whereSql}
      ORDER BY p.created_at DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    ids = ((idsRes as any).rows ?? [])
      .map((r: any) => Number(r.id))
      .filter((n: any) => Number.isFinite(n));
  } else {
    const keysList = sql.join(featureKeys.map((k) => sql`${k}`), sql`, `);

    const idsRes = await db.execute(sql`
      SELECT p.id
      FROM properties p
      JOIN property_features pf ON pf.property_id = p.id
      JOIN features f ON f.id = pf.feature_id
      WHERE ${whereSql}
        AND f.key IN (${keysList})
      GROUP BY p.id
      HAVING COUNT(DISTINCT f.key) = ${featureKeys.length}
      ORDER BY MAX(p.created_at) DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    ids = ((idsRes as any).rows ?? [])
      .map((r: any) => Number(r.id))
      .filter((n: any) => Number.isFinite(n));
  }

  if (ids.length === 0) {
    return { items: [], total, page: safePage, pageSize, totalPages };
  }

  const idSqlList = sql.join(ids.map((id) => sql`${id}`), sql`, `);

  // PROPS (без translations — безопасно)
  // Если позже добавишь property_translations — переключишь флаг и JOIN включится
  let propsRows: any[] = [];
  if (!HAS_PROPERTY_TRANSLATIONS) {
    const res = await db.execute(sql`
      SELECT
        p.id,
        p.slug,
        p.location,
        p.price,
        p.currency,
        p.bedrooms,
        p.bathrooms,
        p.built_area_m2
      FROM properties p
      WHERE p.id IN (${idSqlList})
    `);
    propsRows = ((res as any).rows ?? []) as any[];
  } else {
    const res = await db.execute(sql`
      SELECT
        p.id,
        p.slug,
        p.location,
        p.price,
        p.currency,
        p.bedrooms,
        p.bathrooms,
        p.built_area_m2,
        COALESCE(pt.title, NULL) AS title
      FROM properties p
      LEFT JOIN property_translations pt
        ON pt.property_id = p.id AND pt.lang = ${lang}
      WHERE p.id IN (${idSqlList})
    `);
    propsRows = ((res as any).rows ?? []) as any[];
  }

  // COVER
  const imagesRes = await db.execute(sql`
    SELECT DISTINCT ON (pi.property_id)
      pi.property_id,
      pi.url
    FROM property_images pi
    WHERE pi.property_id IN (${idSqlList})
    ORDER BY pi.property_id, pi.is_cover DESC, pi.sort_order ASC, pi.id ASC
  `);

  const coverMap = new Map<number, string>();
  for (const row of ((imagesRes as any).rows ?? []) as any[]) {
    coverMap.set(Number(row.property_id), String(row.url));
  }

  // FEATURES
  const featsRes = await db.execute(sql`
    SELECT
      pf.property_id,
      f.key,
      COALESCE(ft.label, f.key) AS label
    FROM property_features pf
    JOIN features f ON f.id = pf.feature_id
    LEFT JOIN feature_translations ft
      ON ft.feature_id = f.id AND ft.lang = ${lang}
    WHERE pf.property_id IN (${idSqlList})
    ORDER BY pf.property_id, f.key ASC
  `);

  const featMap = new Map<number, CatalogFeature[]>();
  for (const row of ((featsRes as any).rows ?? []) as any[]) {
    const pid = Number(row.property_id);
    const arr = featMap.get(pid) ?? [];
    arr.push({ key: String(row.key), label: String(row.label) });
    featMap.set(pid, arr);
  }

  // Keep same order as ids
  const rowById = new Map<number, any>();
  for (const r of propsRows) rowById.set(Number(r.id), r);

  const items: CatalogItem[] = ids.map((id) => {
    const p = rowById.get(id);

    const slug = String(p?.slug ?? "");
    const title =
      HAS_PROPERTY_TRANSLATIONS && p?.title ? String(p.title) : titleFromSlug(slug || `property-${id}`);

    const priceValue = p?.price !== null && p?.price !== undefined ? Number(p.price) : null;
    const currency = p?.currency ? String(p.currency) : null;

    return {
      id,
      slug,
      title,
      location: p?.location ? String(p.location) : "",
      priceText: formatPrice({ lang, value: priceValue, currency }),
      beds: p?.bedrooms !== null && p?.bedrooms !== undefined ? Number(p.bedrooms) : 0,
      baths: p?.bathrooms !== null && p?.bathrooms !== undefined ? Number(p.bathrooms) : 0,
      area: p?.built_area_m2 !== null && p?.built_area_m2 !== undefined ? Number(p.built_area_m2) : 0,
      image: coverMap.get(id) ?? "/properties/p1.jpg",
      features: featMap.get(id) ?? [],
    };
  });

  return { items, total, page: safePage, pageSize, totalPages };
}

export async function getAllFeaturesForFilters(lang: "en" | "es") {
  const res = await db.execute(sql`
    SELECT f.key, COALESCE(ft.label, f.key) AS label
    FROM features f
    LEFT JOIN feature_translations ft
      ON ft.feature_id = f.id AND ft.lang = ${lang}
    ORDER BY f.key ASC
  `);

  return ((res as any).rows ?? []).map((r: any) => ({
    key: String(r.key),
    label: String(r.label),
  }));
}

export type PropertyDetail = {
  id: number;
  slug: string;
  title: string;

  location: string;
  description: string;

  priceText: string;

  beds: number;
  baths: number;
  builtArea: number;

  plansUrl: string | null;

  images: Array<{ url: string; isCover: boolean; sortOrder: number }>;
  features: Array<{ key: string; label: string }>;
};

export async function getPropertyBySlug(opts: { lang: "en" | "es"; slug: string }) {
  const { lang, slug } = opts;

  // 1) property
  const propRes = await db.execute(sql`
    SELECT
      p.id,
      p.slug,
      p.location,
      p.description_en,
      p.description_es,
      p.price,
      p.currency,
      p.bedrooms,
      p.bathrooms,
      p.built_area_m2,
      p.plans_url
    FROM properties p
    WHERE p.is_published = true AND p.slug = ${slug}
    LIMIT 1
  `);

  const p = (propRes as any).rows?.[0];
  if (!p) return null;

  const id = Number(p.id);

  const description =
    lang === "es"
      ? (p.description_es ? String(p.description_es) : "")
      : (p.description_en ? String(p.description_en) : "");


  // title пока строим из slug (без translations, чтобы ничего не падало)
  const title = titleFromSlug(String(p.slug || slug));

  const priceValue = p.price !== null && p.price !== undefined ? Number(p.price) : null;
  const currency = p.currency ? String(p.currency) : null;

  // 2) images
  const imagesRes = await db.execute(sql`
    SELECT
      url,
      is_cover,
      sort_order
    FROM property_images
    WHERE property_id = ${id}
    ORDER BY is_cover DESC, sort_order ASC, id ASC
  `);

  const images = ((imagesRes as any).rows ?? []).map((r: any) => ({
    url: String(r.url),
    isCover: Boolean(r.is_cover),
    sortOrder: r.sort_order !== null && r.sort_order !== undefined ? Number(r.sort_order) : 0,
  }));

  // 3) features
  const featsRes = await db.execute(sql`
    SELECT
      f.key,
      COALESCE(ft.label, f.key) AS label
    FROM property_features pf
    JOIN features f ON f.id = pf.feature_id
    LEFT JOIN feature_translations ft
      ON ft.feature_id = f.id AND ft.lang = ${lang}
    WHERE pf.property_id = ${id}
    ORDER BY f.key ASC
  `);

  const features = ((featsRes as any).rows ?? []).map((r: any) => ({
    key: String(r.key),
    label: String(r.label),
  }));

  const plansUrlRaw = p.plans_url ? String(p.plans_url).trim() : "";
  const plansUrl = plansUrlRaw
    ? (plansUrlRaw.startsWith("/") ? plansUrlRaw : `/${plansUrlRaw}`)
    : null;

  return {
    id,
    slug: String(p.slug),
    title,
    location: p.location ? String(p.location) : "",
    description,
    priceText: formatPrice({ lang, value: priceValue, currency }),

    beds: p.bedrooms !== null && p.bedrooms !== undefined ? Number(p.bedrooms) : 0,
    baths: p.bathrooms !== null && p.bathrooms !== undefined ? Number(p.bathrooms) : 0,
    builtArea:
      p.built_area_m2 !== null && p.built_area_m2 !== undefined
        ? Number(p.built_area_m2)
        : 0,

    plansUrl, // ✅ ВОТ ЗДЕСЬ — вместо прямого p.plans_url

    images,
    features,
  } satisfies PropertyDetail;
}
