import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type LeadRow = {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  message: string | null;

  lang: string;
  page_url: string;

  property_id: number | null;
  property_slug: string | null;

  status: string;
  source: string | null;
  processed_at: string | null;
};

function fmtDate(v: unknown) {
  const s = String(v ?? "");
  if (!s) return "—";
  return s.replace("T", " ").replace("Z", "");
}

function row(label: string, value: React.ReactNode) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, padding: "10px 0", borderTop: "1px solid #F1F1EE" }}>
      <div style={{ opacity: 0.75, fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

export default async function AdminLeadDetailPage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) redirect("/admin/leads");

  const res = await db.execute(sql`
    SELECT
      id,
      created_at,
      name,
      phone,
      email,
      message,
      lang,
      page_url,
      property_id,
      property_slug,
      status,
      source,
      processed_at
    FROM leads
    WHERE id = ${id}
    LIMIT 1
  `);

  const lead = ((res as any).rows?.[0] ?? null) as LeadRow | null;
  if (!lead) redirect("/admin/leads");

  const isProcessed = String(lead.status || "").toLowerCase() === "processed";

  async function markProcessed() {
    "use server";

    await db.execute(sql`
      UPDATE leads
      SET status = 'processed',
          processed_at = NOW()
      WHERE id = ${id}
    `);

    redirect(`/admin/leads/${id}`);
  }

  return (
    <main style={{ maxWidth: 980, margin: "60px auto", padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 34, margin: 0 }}>Lead #{lead.id}</h1>
          <p style={{ marginTop: 8, opacity: 0.75 }}>
            Status:{" "}
            <strong style={{ color: isProcessed ? "rgba(28,28,28,0.75)" : "#0E5E56" }}>
              {isProcessed ? "Processed" : "New"}
            </strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link
            href="/admin/leads"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #E2E2DE",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            ← Back to leads
          </Link>

          {!isProcessed && (
            <form action={markProcessed}>
              <button
                type="submit"
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #0E5E56",
                  background: "#0E5E56",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Mark as processed
              </button>
            </form>
          )}
        </div>
      </header>

      <section
        style={{
          marginTop: 18,
          border: "1px solid #E2E2DE",
          borderRadius: 16,
          background: "#fff",
          padding: 18,
        }}
      >
        {row("Created", <span style={{ opacity: 0.85 }}>{fmtDate(lead.created_at)}</span>)}
        {row("Name", lead.name || "—")}
        {row("Email", <a href={`mailto:${lead.email}`} style={{ color: "#0E5E56", fontWeight: 600 }}>{lead.email}</a>)}
        {row("Phone", <a href={`tel:${lead.phone}`} style={{ color: "#0E5E56", fontWeight: 600 }}>{lead.phone}</a>)}

        {row("Language", <span style={{ opacity: 0.85 }}>{lead.lang}</span>)}
        {row(
          "Page URL",
          <a href={lead.page_url} target="_blank" rel="noreferrer" style={{ color: "#0E5E56", fontWeight: 600 }}>
            {lead.page_url}
          </a>
        )}

        {row("Source", <span style={{ opacity: 0.85 }}>{lead.source || "—"}</span>)}

        {row(
          "Property",
          lead.property_slug ? (
            <span style={{ opacity: 0.9 }}>
              {lead.property_slug}{" "}
              {lead.property_id ? <span style={{ opacity: 0.6 }}>(id: {lead.property_id})</span> : null}
            </span>
          ) : (
            "—"
          )
        )}

        {row(
          "Processed at",
          <span style={{ opacity: 0.85 }}>{lead.processed_at ? fmtDate(lead.processed_at) : "—"}</span>
        )}

        <div style={{ padding: "10px 0", borderTop: "1px solid #F1F1EE", marginTop: 6 }}>
          <div style={{ opacity: 0.75, fontSize: 13, marginBottom: 8 }}>Message</div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {lead.message?.trim() ? lead.message : <span style={{ opacity: 0.6 }}>—</span>}
          </div>
        </div>
      </section>
    </main>
  );
}
