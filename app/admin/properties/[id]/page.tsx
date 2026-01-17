// app/admin/properties/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import UploadForms from "./UploadForms";

export const dynamic = "force-dynamic";

function toInt(s: string) {
  const v = s.trim();
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function toDecimal(s: string) {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function normalizePublicPath(p: unknown) {
  const s = String(p ?? "").trim();
  if (!s) return null;
  return s.startsWith("/") ? s : `/${s}`;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPropertyEditPage({ params }: PageProps) {
  const resolved = await params;
  const id = Number(resolved.id);

  if (!Number.isFinite(id)) redirect("/admin/properties");

  const propRes = await db.execute(sql`SELECT * FROM properties WHERE id = ${id} LIMIT 1`);
  const prop = (propRes as any).rows?.[0];
  if (!prop) redirect("/admin/properties");

  const imagesRes = await db.execute(sql`
    SELECT id, url, alt, sort_order, is_cover
    FROM property_images
    WHERE property_id = ${id}
    ORDER BY sort_order ASC, id ASC
  `);
  const images = ((imagesRes as any).rows ?? []) as Array<any>;

  const plansHref = normalizePublicPath(prop.plans_url);

  async function updateBase(formData: FormData) {
    "use server";

    const slugRaw = String(formData.get("slug") || "").trim();
    const slug = slugRaw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 255); // даём запас, но лучше держать <= limit колонки

    if (!slug) redirect(`/admin/properties/${id}`);

    const isPublished = formData.get("isPublished") === "on";
    const price = toDecimal(String(formData.get("price") || ""));
    const currency =
      String(formData.get("currency") || "EUR")
        .trim()
        .toUpperCase()
        .slice(0, 3) || "EUR";
    const location = String(formData.get("location") || "").trim() || null;

    const bedrooms = toInt(String(formData.get("bedrooms") || ""));
    const bathrooms = toInt(String(formData.get("bathrooms") || ""));

    const plotArea = toDecimal(String(formData.get("plotAreaM2") || ""));
    const builtArea = toDecimal(String(formData.get("builtAreaM2") || ""));
    const terraceArea = toDecimal(String(formData.get("terraceAreaM2") || ""));

    await db.execute(sql`
      UPDATE properties
      SET
        slug = ${slug},
        is_published = ${isPublished},
        price = ${price},
        currency = ${currency},
        location = ${location},
        bedrooms = ${bedrooms},
        bathrooms = ${bathrooms},
        plot_area_m2 = ${plotArea},
        built_area_m2 = ${builtArea},
        terrace_area_m2 = ${terraceArea},
        updated_at = NOW()
      WHERE id = ${id}
    `);

    redirect(`/admin/properties/${id}`);
  }

  return (
    <main style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Edit property #{id}</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/properties" style={btnGhost}>
            ← Back
          </Link>
          <a href={`/properties/${prop.slug ?? ""}`} style={btnGhost} target="_blank" rel="noreferrer">
            Public page
          </a>
        </div>
      </div>

      {/* Base fields */}
      <section style={card}>
        <form action={updateBase}>
          <div style={grid2}>
            <Field label="Slug">
              <input name="slug" defaultValue={prop.slug ?? ""} style={input} />
            </Field>
            <Field label="Currency">
              <input name="currency" defaultValue={prop.currency ?? "EUR"} style={input} />
            </Field>
          </div>

          <div style={grid3}>
            <Field label="Price">
              <input name="price" defaultValue={prop.price ?? ""} style={input} />
            </Field>
            <Field label="Bedrooms">
              <input name="bedrooms" defaultValue={prop.bedrooms ?? ""} style={input} />
            </Field>
            <Field label="Bathrooms">
              <input name="bathrooms" defaultValue={prop.bathrooms ?? ""} style={input} />
            </Field>
          </div>

          <Field label="Location">
            <input name="location" defaultValue={prop.location ?? ""} style={input} />
          </Field>

          <div style={grid3}>
            <Field label="Plot area (m²)">
              <input name="plotAreaM2" defaultValue={prop.plot_area_m2 ?? ""} style={input} />
            </Field>
            <Field label="Built area (m²)">
              <input name="builtAreaM2" defaultValue={prop.built_area_m2 ?? ""} style={input} />
            </Field>
            <Field label="Terrace area (m²)">
              <input name="terraceAreaM2" defaultValue={prop.terrace_area_m2 ?? ""} style={input} />
            </Field>
          </div>

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <input id="isPublished" name="isPublished" type="checkbox" defaultChecked={!!prop.is_published} />
            <label htmlFor="isPublished">Published</label>
          </div>

          <div style={{ marginTop: 14 }}>
            <button type="submit" style={btnPrimaryFill}>
              Save changes
            </button>
          </div>
        </form>
      </section>

      {/* Plans PDF */}
      <section style={card}>
        <h2 style={h2}>Plans (PDF)</h2>

        {plansHref ? (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>
              Current:{" "}
              <a href={plansHref} target="_blank" rel="noreferrer">
                {plansHref}
              </a>
            </span>

            {/* delete pdf (через POST + _method) */}
            <form action={`/api/admin/properties/${id}/plans`} method="post">
              <input type="hidden" name="_method" value="delete" />
              <button type="submit" style={btnDanger}>
                Delete PDF
              </button>
            </form>
          </div>
        ) : (
          <p style={{ marginTop: 8, opacity: 0.7 }}>No plans uploaded yet.</p>
        )}

        <div style={{ marginTop: 12 }}>
          <UploadForms propertyId={id} />
        </div>
      </section>

      {/* Images preview */}
      <section style={card}>
        <h2 style={h2}>Images</h2>

        {images.length === 0 ? (
          <p style={{ marginTop: 12, opacity: 0.7 }}>No images yet.</p>
        ) : (
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {images.map((img, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === images.length - 1;

              return (
                <div key={img.id} style={{ border: "1px solid #E2E2DE", borderRadius: 14, overflow: "hidden" }}>
                  <img src={img.url} alt={img.alt ?? ""} style={{ width: "100%", height: 150, objectFit: "cover" }} />

                  <div style={{ padding: 10, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <span style={{ opacity: 0.75 }}>#{img.sort_order}</span>
                      {img.is_cover ? <strong>Cover</strong> : <span style={{ opacity: 0.5 }}>—</span>}
                    </div>

                    <div style={{ marginTop: 6, opacity: 0.7, wordBreak: "break-all" }}>{img.url}</div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {/* Set cover */}
                      <form action={`/api/admin/properties/${id}/images`} method="post">
                        <input type="hidden" name="_method" value="setCover" />
                        <input type="hidden" name="imageId" value={String(img.id)} />
                        <button type="submit" style={btnMini} disabled={!!img.is_cover}>
                          {img.is_cover ? "Cover" : "Set cover"}
                        </button>
                      </form>

                      {/* Move up */}
                      <form action={`/api/admin/properties/${id}/images`} method="post">
                        <input type="hidden" name="_method" value="move" />
                        <input type="hidden" name="dir" value="up" />
                        <input type="hidden" name="imageId" value={String(img.id)} />
                        <button type="submit" style={btnMini} disabled={isFirst}>
                          ↑ Up
                        </button>
                      </form>

                      {/* Move down */}
                      <form action={`/api/admin/properties/${id}/images`} method="post">
                        <input type="hidden" name="_method" value="move" />
                        <input type="hidden" name="dir" value="down" />
                        <input type="hidden" name="imageId" value={String(img.id)} />
                        <button type="submit" style={btnMini} disabled={isLast}>
                          ↓ Down
                        </button>
                      </form>

                      {/* Delete */}
                      <form action={`/api/admin/properties/${id}/images`} method="post">
                        <input type="hidden" name="_method" value="delete" />
                        <input type="hidden" name="imageId" value={String(img.id)} />
                        <button type="submit" style={btnMiniDanger}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const card: React.CSSProperties = {
  marginTop: 18,
  border: "1px solid #E2E2DE",
  borderRadius: 16,
  padding: 16,
  background: "#fff",
};

const h2: React.CSSProperties = { fontSize: 18, margin: 0 };
const input: React.CSSProperties = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #E2E2DE" };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };
const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 };

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #E2E2DE",
  textDecoration: "none",
  color: "inherit",
};

const btnPrimaryFill: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #0E5E56",
  background: "#0E5E56",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #d95555",
  background: "#d95555",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const btnMini: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #E2E2DE",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};

const btnMiniDanger: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #d95555",
  background: "#fff5f5",
  cursor: "pointer",
  fontWeight: 600,
  color: "#a11d1d",
};
