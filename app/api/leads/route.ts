import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";

function isEmail(x: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
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
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<LeadPayload>;

    const name = String(body?.name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const message = body?.message ? String(body.message).trim() : null;

    const lang = String(body?.lang ?? "").trim();
    const pageUrl = String(body?.page_url ?? "").trim();

    const propertyId =
      body?.property_id === null || body?.property_id === undefined
        ? null
        : Number(body.property_id);

    const propertySlug = body?.property_slug ? String(body.property_slug).trim() : null;

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

    await db.insert(leads).values({
      name,
      phone,
      email,
      message,
      lang,
      pageUrl,
      propertyId,
      propertySlug,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
