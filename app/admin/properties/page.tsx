// app/admin/properties/page.tsx
import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

type DealType = "sale" | "rent";

type PropertyRow = {
  id: number;
  slug: string;
  is_published: boolean;
  deal_type: DealType;
  price: string | null;
  currency: string | null;
  location: string | null;
  created_at: string;
};

function normalizeDeal(v: unknown): DealType | "all" {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "sale" || s === "rent") return s;
  return "all";
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  // ✅ Next иногда отдаёт searchParams как Promise — учитываем оба варианта
  searchParams?: { deal?: string } | Promise<{ deal?: string }>;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const deal = normalizeDeal(sp?.deal);

  let result: any;

  // ✅ Самый надёжный способ: отдельные запросы для all / sale / rent
  if (deal === "sale" || deal === "rent") {
    result = await db.execute(sql`
      SELECT
        id,
        slug,
        is_published,
        deal_type,
        price,
        currency,
        location,
        created_at
      FROM properties
      WHERE deal_type = ${deal}
      ORDER BY id DESC
      LIMIT 200
    `);
  } else {
    result = await db.execute(sql`
      SELECT
        id,
        slug,
        is_published,
        deal_type,
        price,
        currency,
        location,
        created_at
      FROM properties
      ORDER BY id DESC
      LIMIT 200
    `);
  }

  const rows = ((result as any).rows ?? []) as PropertyRow[];

  const filterLink = (v: "all" | DealType) =>
    v === "all" ? "/admin/properties" : `/admin/properties?deal=${v}`;

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
        <div>
          <h1 style={{ fontSize: 34, margin: 0 }}>Properties</h1>
          <p style={{ marginTop: 8, opacity: 0.75 }}>
            {rows.length} item(s)
            {deal !== "all" ? (
              <>
                {" "}
                • filter: <b>{deal}</b>
              </>
            ) : null}
          </p>

          {/* ✅ Фильтр All / Sale / Rent */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            <Link
              href={filterLink("all")}
              style={deal === "all" ? btnPillActive : btnPill}
            >
              All
            </Link>
            <Link
              href={filterLink("sale")}
              style={deal === "sale" ? btnPillActive : btnPill}
            >
              Sale
            </Link>
            <Link
              href={filterLink("rent")}
              style={deal === "rent" ? btnPillActive : btnPill}
            >
              Rent
            </Link>

            {deal !== "all" ? (
              <Link href={filterLink("all")} style={btnClearSmall}>
                Clear
              </Link>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin" style={btnGhost}>
            ← Admin
          </Link>
          <Link href="/admin/properties/new" style={btnPrimary}>
            + Create
          </Link>
        </div>
      </header>

      <section style={card}>
        {rows.length === 0 ? (
          <div style={{ padding: 18 }}>
            <p style={{ margin: 0 }}>No properties yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "ID",
                    "Slug",
                    "Deal",
                    "Status",
                    "Price",
                    "Location",
                    "Created",
                    "Actions",
                  ].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td style={td}>{p.id}</td>

                    <td style={td}>
                      <code>{p.slug}</code>
                    </td>

                    {/* ✅ Deal */}
                    <td style={td}>
                      <span style={pill}>
                        {p.deal_type === "sale" ? "Sale" : "Rent"}
                      </span>
                    </td>

                    <td style={td}>
                      {p.is_published ? "Published" : "Draft"}
                    </td>

                    <td style={td}>
                      {p.price ? (
                        `${p.price} ${p.currency ?? ""}`.trim()
                      ) : (
                        <span style={{ opacity: 0.5 }}>—</span>
                      )}
                    </td>

                    <td style={td}>
                      {p.location ?? <span style={{ opacity: 0.5 }}>—</span>}
                    </td>

                    <td style={td}>
                      {new Date(p.created_at).toLocaleString()}
                    </td>

                    <td style={td}>
                      <Link
                        href={`/admin/properties/${p.id}`}
                        style={{ textDecoration: "none", fontWeight: 600 }}
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const card: React.CSSProperties = {
  marginTop: 18,
  border: "1px solid #E2E2DE",
  borderRadius: 16,
  overflow: "hidden",
  background: "#fff",
};

const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  letterSpacing: 0.3,
  textTransform: "uppercase",
  padding: "12px 14px",
  borderBottom: "1px solid #E2E2DE",
  background: "#F6F5F2",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid #F0F0ED",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const pill: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #E2E2DE",
  background: "#fff",
  fontSize: 12,
  fontWeight: 600,
};

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #E2E2DE",
  textDecoration: "none",
  color: "inherit",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #0E5E56",
  textDecoration: "none",
  color: "#0E5E56",
  fontWeight: 600,
};

const btnPill: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #E2E2DE",
  textDecoration: "none",
  color: "inherit",
  background: "#fff",
  fontWeight: 600,
  fontSize: 13,
};

const btnPillActive: React.CSSProperties = {
  ...btnPill,
  border: "1px solid #0E5E56",
  color: "#0E5E56",
};

const btnClearSmall: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #E2E2DE",
  textDecoration: "none",
  color: "inherit",
  background: "#F6F5F2",
  fontWeight: 600,
  fontSize: 13,
};
