import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";

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

function badgeStyle(status: string) {
  const isNew = String(status || "").toLowerCase() !== "processed";
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #E2E2DE",
    background: isNew ? "rgba(14, 94, 86, 0.08)" : "rgba(0,0,0,0.04)",
    color: isNew ? "#0E5E56" : "rgba(28,28,28,0.75)",
    fontSize: 12,
    fontWeight: 600 as const,
    whiteSpace: "nowrap" as const,
  };
}

function fmtDate(v: unknown) {
  const s = String(v ?? "");
  if (!s) return "—";
  return s.replace("T", " ").replace("Z", "");
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const status = String(Array.isArray(sp.status) ? sp.status[0] : sp.status ?? "")
    .trim()
    .toLowerCase();

  const qRaw = String(Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();
  const q = qRaw.slice(0, 80);

  // ✅ Server Action: пометить обработанным
  async function markProcessed(formData: FormData) {
    "use server";

    const idRaw = String(formData.get("id") ?? "").trim();
    const id = Number(idRaw);

    const backStatus = String(formData.get("status") ?? "").trim();
    const backQ = String(formData.get("q") ?? "").trim();

    if (!Number.isFinite(id)) {
      redirect("/admin/leads");
    }

    await db.execute(sql`
      UPDATE leads
      SET status = 'processed',
          processed_at = NOW()
      WHERE id = ${id}
        AND status <> 'processed'
    `);

    const params = new URLSearchParams();
    if (backStatus) params.set("status", backStatus);
    if (backQ) params.set("q", backQ);

    const qs = params.toString();
    redirect(qs ? `/admin/leads?${qs}` : "/admin/leads");
  }

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
      name,
      phone,
      email,
      lang,
      page_url,
      property_id,
      property_slug,
      status,
      source,
      processed_at
    FROM leads
    WHERE ${whereSql}
    ORDER BY created_at DESC, id DESC
    LIMIT 200
  `);

  const leads = ((res as any).rows ?? []) as LeadRow[];

  const buildLink = (nextStatus: "" | "new" | "processed") => {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/leads?${qs}` : "/admin/leads";
  };

  const clearLink = status ? `/admin/leads?status=${status}` : "/admin/leads";

  // ✅ Export CSV link с учетом фильтров
  const exportHref = (() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/api/admin/leads/export?${qs}` : "/api/admin/leads/export";
  })();

  const btnPrimary = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #0E5E56",
    background: "#0E5E56",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  };

  const btnGhost = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #E2E2DE",
    textDecoration: "none",
    color: "inherit",
    background: "#fff",
    whiteSpace: "nowrap" as const,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  };

  return (
    <main style={{ maxWidth: 1100, margin: "60px auto", padding: 16 }}>
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 520px" }}>
          <h1 style={{ fontSize: 34, margin: 0 }}>Leads</h1>
          <p style={{ marginTop: 8, opacity: 0.75 }}>
            Incoming contact requests (latest 200). Search by email, phone, name, property slug or page URL.
          </p>

          {/* ✅ Search + Export CSV в ОДНОЙ линии */}
          <form
            action="/admin/leads"
            method="GET"
            style={{
              display: "flex",
              gap: 10,
              marginTop: 12,
              flexWrap: "nowrap",
              alignItems: "center",
            }}
          >
            {status ? <input type="hidden" name="status" value={status} /> : null}

            <input
              name="q"
              defaultValue={q}
              placeholder="Search: email, phone, name…"
              style={{
                flex: "1 1 auto",
                minWidth: 240,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #E2E2DE",
                outline: "none",
              }}
            />

            <button type="submit" style={btnPrimary}>
              Search
            </button>

            <a href={exportHref} style={btnPrimary}>
              Export CSV
            </a>

            {q ? (
              <Link href={clearLink} style={btnGhost}>
                Clear
              </Link>
            ) : null}
          </form>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <Link
              href={buildLink("")}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #E2E2DE",
                textDecoration: "none",
                color: "inherit",
                background: !status ? "rgba(0,0,0,0.03)" : "transparent",
              }}
            >
              All
            </Link>

            <Link
              href={buildLink("new")}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #E2E2DE",
                textDecoration: "none",
                color: "inherit",
                background: status === "new" ? "rgba(0,0,0,0.03)" : "transparent",
              }}
            >
              New
            </Link>

            <Link
              href={buildLink("processed")}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #E2E2DE",
                textDecoration: "none",
                color: "inherit",
                background: status === "processed" ? "rgba(0,0,0,0.03)" : "transparent",
              }}
            >
              Processed
            </Link>
          </div>
        </div>

        {/* ✅ Справа: только Admin */}
        <Link
          href="/admin"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #E2E2DE",
            textDecoration: "none",
            color: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          ← Admin
        </Link>
      </header>

      <div
        style={{
          marginTop: 18,
          border: "1px solid #E2E2DE",
          borderRadius: 16,
          background: "#fff",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid #E2E2DE",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {leads.length} item(s)
            {q ? <span style={{ marginLeft: 10, opacity: 0.7, fontWeight: 500 }}>for “{q}”</span> : null}
          </div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>Tip: process leads прямо из списка</div>
        </div>

        {leads.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.8 }}>No leads found.</div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1120 }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 12, letterSpacing: 0.3, opacity: 0.7 }}>
                  <th style={{ padding: "12px 14px" }}>ID</th>
                  <th style={{ padding: "12px 14px" }}>Status</th>
                  <th style={{ padding: "12px 14px" }}>Name</th>
                  <th style={{ padding: "12px 14px" }}>Email</th>
                  <th style={{ padding: "12px 14px" }}>Phone</th>
                  <th style={{ padding: "12px 14px" }}>Property</th>
                  <th style={{ padding: "12px 14px" }}>Source</th>
                  <th style={{ padding: "12px 14px" }}>Page</th>
                  <th style={{ padding: "12px 14px" }}>Created</th>
                  <th style={{ padding: "12px 14px" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {leads.map((l) => {
                  const prop = l.property_slug ? `${l.property_slug}` : "—";
                  const statusText = String(l.status || "new");
                  const isProcessed = statusText.toLowerCase() === "processed";

                  return (
                    <tr key={String(l.id)} style={{ borderTop: "1px solid #F1F1EE" }}>
                      <td style={{ padding: "12px 14px", fontVariantNumeric: "tabular-nums" }}>{l.id}</td>

                      <td style={{ padding: "12px 14px" }}>
                        <span style={badgeStyle(statusText)}>{isProcessed ? "Processed" : "New"}</span>
                      </td>

                      <td style={{ padding: "12px 14px" }}>{l.name || "—"}</td>

                      <td style={{ padding: "12px 14px" }}>
                        <a href={`mailto:${l.email}`} style={{ color: "inherit" }}>
                          {l.email}
                        </a>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <a href={`tel:${l.phone}`} style={{ color: "inherit" }}>
                          {l.phone}
                        </a>
                      </td>

                      <td style={{ padding: "12px 14px", opacity: 0.85 }}>{prop}</td>
                      <td style={{ padding: "12px 14px", opacity: 0.85 }}>{l.source || "—"}</td>

                      <td style={{ padding: "12px 14px", opacity: 0.85, maxWidth: 280 }}>
                        <span
                          title={l.page_url || ""}
                          style={{
                            display: "inline-block",
                            maxWidth: 280,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            verticalAlign: "bottom",
                          }}
                        >
                          {l.page_url || "—"}
                        </span>
                      </td>

                      <td style={{ padding: "12px 14px", opacity: 0.85 }}>{fmtDate(l.created_at)}</td>

                      <td style={{ padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                        <Link
                          href={`/admin/leads/${l.id}`}
                          style={{ textDecoration: "none", fontWeight: 600, color: "#0E5E56" }}
                        >
                          View →
                        </Link>

                        {!isProcessed ? (
                          <form action={markProcessed}>
                            <input type="hidden" name="id" value={String(l.id)} />
                            <input type="hidden" name="status" value={status} />
                            <input type="hidden" name="q" value={q} />

                            <button
                              type="submit"
                              style={{
                                padding: "6px 10px",
                                borderRadius: 10,
                                border: "1px solid #E2E2DE",
                                background: "rgba(0,0,0,0.03)",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              Mark processed
                            </button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
