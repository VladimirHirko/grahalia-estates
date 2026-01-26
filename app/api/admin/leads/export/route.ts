import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadRow = {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  lang: string;
  page_url: string;
  property_id: number | null;
  property_slug: string | null;
  status: string;
  source: string | null;
  processed_at: string | null;
};

function escapeCsvCell(v: unknown) {
  const s = String(v ?? "");
  // CSV: если есть спецсимволы — оборачиваем в кавычки и удваиваем кавычки
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    // даже если пусто — вернём CSV с заголовками (согласовано, удобно)
    return "\ufeff" + ["id,created_at,processed_at,status,source,name,email,phone,lang,page_url,property_id,property_slug,message"].join("\n");
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((r) => headers.map((h) => escapeCsvCell(r[h])).join(",")),
  ];

  // BOM для Excel (чтобы кириллица/акценты не ломались)
  return "\ufeff" + lines.join("\n");
}

async function tryEmailAdminCsv(opts: { filename: string; csv: string; rowsCount: number; status: string; q: string }) {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim();
  if (!adminEmail) {
    console.warn("[export] ADMIN_EMAIL is not set -> skip email");
    return;
  }

  // Чтобы вообще не ломать экспорт, отправка почты должна быть полностью optional
  // и зависеть от наличия SMTP переменных.
  const host = (process.env.SMTP_HOST || "").trim();
  const portRaw = (process.env.SMTP_PORT || "").trim();
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();

  // FROM: либо явный SMTP_FROM, либо SMTP_USER
  const from = (process.env.SMTP_FROM || user || "").trim();

  if (!host || !portRaw || !user || !pass || !from) {
    console.warn("[export] SMTP env is not fully set -> skip email");
    return;
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port)) {
    console.warn("[export] SMTP_PORT invalid -> skip email");
    return;
  }

  try {
    // динамический импорт, чтобы сборка не падала если nodemailer не установлен
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 обычно secure; 587/25 обычно STARTTLS
      auth: { user, pass },
    });

    const subject = `Leads export (${opts.rowsCount})`;
    const text =
      `CSV export attached.\n\n` +
      `Filters:\n` +
      `status: ${opts.status || "all"}\n` +
      `q: ${opts.q || "—"}\n` +
      `rows: ${opts.rowsCount}\n`;

    await transporter.sendMail({
      from,
      to: adminEmail,
      subject,
      text,
      attachments: [
        {
          filename: opts.filename,
          content: Buffer.from(opts.csv, "utf8"),
          contentType: "text/csv; charset=utf-8",
        },
      ],
    });

    console.log("[export] Email sent to admin:", adminEmail);
  } catch (e) {
    console.error("[export] Email failed (ignored):", e);
  }
}

export async function GET(req: Request) {
  // ✅ защита: экспорт только из админки
  const cookie = req.headers.get("cookie") || "";
  const isAdmin = /(?:^|;\s*)admin=1(?:;|$)/.test(cookie);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);

  const status = String(url.searchParams.get("status") || "").trim().toLowerCase();
  const qRaw = String(url.searchParams.get("q") || "").trim();
  const q = qRaw.slice(0, 80);

  let whereSql = sql`TRUE`;

  if (status === "new") whereSql = sql`${whereSql} AND status <> 'processed'`;
  if (status === "processed") whereSql = sql`${whereSql} AND status = 'processed'`;

  if (q) {
    const like = `%${q}%`;
    whereSql = sql`${whereSql} AND (
      name ILIKE ${like}
      OR email ILIKE ${like}
      OR phone ILIKE ${like}
      OR COALESCE(property_slug, '') ILIKE ${like}
      OR COALESCE(page_url, '') ILIKE ${like}
    )`;
  }

  const res = await db.execute(sql`
    SELECT
      id,
      created_at,
      processed_at,
      status,
      source,
      name,
      email,
      phone,
      lang,
      page_url,
      property_id,
      property_slug,
      message
    FROM leads
    WHERE ${whereSql}
    ORDER BY created_at DESC, id DESC
    LIMIT 5000
  `);

  const leads = ((res as any).rows ?? []) as (LeadRow & { message?: string | null })[];

  const rows = leads.map((l) => ({
    id: l.id,
    created_at: l.created_at,
    processed_at: l.processed_at ?? "",
    status: l.status ?? "",
    source: l.source ?? "",
    name: l.name ?? "",
    email: l.email ?? "",
    phone: l.phone ?? "",
    lang: l.lang ?? "",
    page_url: l.page_url ?? "",
    property_id: l.property_id ?? "",
    property_slug: l.property_slug ?? "",
    message: (l as any).message ?? "",
  }));

  const csv = toCsv(rows);

  const today = new Date().toISOString().slice(0, 10);
  const filename = `leads-${today}.csv`;

  // ✅ Авто-отправка админу: не ломаем экспорт даже если упадёт
  // (письмо отправляем "в фоне" в смысле: не влияя на Response)
  // Но внутри serverless обычно всё равно успеет.
  void tryEmailAdminCsv({
    filename,
    csv,
    rowsCount: rows.length,
    status,
    q,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
