import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

type PropertyRow = {
  id: number;
  slug: string;
  is_published: boolean;
  price: string | null;
  currency: string;
  location: string | null;
  created_at: string;
};

export default async function AdminPropertiesPage() {
  const result = await db.execute(sql`
    SELECT id, slug, is_published, price, currency, location, created_at
    FROM properties
    ORDER BY id DESC
    LIMIT 200
  `);

  const rows = (result as any).rows as PropertyRow[];

  return (
    <main style={{ maxWidth: 1100, margin: "60px auto", padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 34, margin: 0 }}>Properties</h1>
          <p style={{ marginTop: 8, opacity: 0.75 }}>
            {rows.length} item(s)
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin" style={btnGhost}>← Admin</Link>
          <Link href="/admin/properties/new" style={btnPrimary}>+ Create</Link>
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
                  {["ID", "Slug", "Status", "Price", "Location", "Created", "Actions"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td style={td}>{p.id}</td>
                    <td style={td}><code>{p.slug}</code></td>
                    <td style={td}>{p.is_published ? "Published" : "Draft"}</td>
                    <td style={td}>
                      {p.price ? `${p.price} ${p.currency}` : <span style={{ opacity: 0.5 }}>—</span>}
                    </td>
                    <td style={td}>{p.location ?? <span style={{ opacity: 0.5 }}>—</span>}</td>
                    <td style={td}>{new Date(p.created_at).toLocaleString()}</td>
                    <td style={td}>
                      <Link href={`/admin/properties/${p.id}`} style={{ textDecoration: "none", fontWeight: 600 }}>
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
