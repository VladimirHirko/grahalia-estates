import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { leads, leadRateLimits } from "@/db/schema";
import { sendLeadNotification } from "@/app/lib/email/sendLeadNotification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isEmail(x: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

// простая нормализация телефона (не валидация, а чистка мусора)
function normalizePhone(x: string) {
  return x.replace(/[^\d+()\-\s]/g, "").trim();
}

type LeadPayload = {
  name: string;
  phone: string;
  email: string;
  message?: string | null;
  lang: "en" | "es";
  page_url: string;
  property_id?: number | null;
  property_slug?: string | null;
  source?: string | null;

  // ✅ Honeypot
  website?: string | null;
};

function getClientIp(req: Request) {
  // В проде за прокси обычно есть x-forwarded-for
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();

  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();

  // локально часто будет IPv6 loopback, но он обычно не приходит заголовками
  // оставим "unknown" как fallback — это ок для dev
  return "unknown";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<LeadPayload>;

    // ✅ Honeypot: если бот заполнил скрытое поле — молча “успех”
    const website = String(body?.website ?? "").trim();
    if (website) {
      return NextResponse.json({ success: true });
    }

    const name = String(body?.name ?? "").trim();
    const phone = normalizePhone(String(body?.phone ?? ""));
    const email = String(body?.email ?? "").trim();
    const message = body?.message ? String(body.message).trim() : null;

    const lang = String(body?.lang ?? "").trim();
    const pageUrl = String(body?.page_url ?? "").trim();

    const propertyId =
      body?.property_id === null || body?.property_id === undefined
        ? null
        : Number(body.property_id);

    const propertySlug = body?.property_slug ? String(body.property_slug).trim() : null;
    const source = body?.source ? String(body.source).trim().slice(0, 80) : null;

    // ✅ базовая валидация required
    if (!name || !phone || !email || !lang || !pageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (lang !== "en" && lang !== "es") {
      return NextResponse.json({ error: "Invalid lang" }, { status: 400 });
    }
    if (propertyId !== null && Number.isNaN(propertyId)) {
      return NextResponse.json({ error: "Invalid property_id" }, { status: 400 });
    }

    // ✅ антиспам-лимиты по длине
    if (name.length > 120) return NextResponse.json({ error: "Name too long" }, { status: 400 });
    if (phone.length > 60) return NextResponse.json({ error: "Phone too long" }, { status: 400 });
    if (email.length > 160) return NextResponse.json({ error: "Email too long" }, { status: 400 });
    if (pageUrl.length > 2000) return NextResponse.json({ error: "Page URL too long" }, { status: 400 });
    if (propertySlug && propertySlug.length > 255) return NextResponse.json({ error: "Property slug too long" }, { status: 400 });
    if (message && message.length > 2000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

    // ✅ простая эвристика: если сообщение есть, но почти без букв — часто мусор
    if (message) {
      const letters = message.replace(/[^a-zA-Zа-яА-Я]+/g, "");
      if (letters.length > 0 && letters.length < 5) {
        return NextResponse.json({ error: "Invalid message" }, { status: 400 });
      }
    }

    // ✅ Rate limit по IP
    const ip = getClientIp(req);

    // лимит: не больше 5 запросов за 10 минут с одного IP
    const WINDOW_MIN = 10;
    const MAX_REQ = 5;

    // ✅ FIX: нельзя параметризовать INTERVAL '...'
    const countRes = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt
      FROM lead_rate_limits
      WHERE ip = ${ip}
        AND created_at > NOW() - (${WINDOW_MIN} * INTERVAL '1 minute')
    `);

    const cnt = Number((countRes as any).rows?.[0]?.cnt ?? 0);

    if (cnt >= MAX_REQ) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    // логируем попытку (даже если дальше что-то упадет — уже отсекаем флуд)
    await db.insert(leadRateLimits).values({ ip });

    // ✅ вставка + возврат id
    const inserted = await db
      .insert(leads)
      .values({
        name,
        phone,
        email,
        message,
        lang,
        pageUrl,
        propertyId,
        propertySlug,
        source,
        // status по умолчанию 'new' из миграции
      })
      .returning({ id: leads.id, createdAt: leads.createdAt });

    const row = inserted?.[0];

    // ✅ письмо админу (не ломает, если env не настроен)
    await sendLeadNotification({
      id: row?.id,
      createdAt: row?.createdAt ? String(row.createdAt) : null,
      name,
      phone,
      email,
      message,
      lang,
      pageUrl,
      propertyId,
      propertySlug,
      source,
    });

    return NextResponse.json({ success: true, id: row?.id ?? null });
  } catch (e) {
    console.error("POST /api/leads error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
