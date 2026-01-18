import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

function toInt(v: FormDataEntryValue | null) {
  if (v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function toDecimal(v: FormDataEntryValue | null) {
  if (v === null) return null;
  const s = String(v).trim().replace(",", ".");
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export default async function AdminPropertyNewPage() {
  // ✅ features для чекбоксов (EN labels, админка без i18n)
  const featuresRes = await db.execute(sql`
    SELECT
      f.id,
      f.key,
      COALESCE(ft.label, f.key) AS label
    FROM features f
    LEFT JOIN feature_translations ft
      ON ft.feature_id = f.id AND ft.lang = 'en'
    ORDER BY COALESCE(ft.label, f.key) ASC
  `);
  const features = ((featuresRes as any).rows ?? []) as Array<{ id: number; key: string; label: string }>;

  async function create(formData: FormData) {
    "use server";

    const slugRaw = String(formData.get("slug") || "").trim();
    const slug = slugRaw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    if (!slug) redirect("/admin/properties/new");

    const isPublished = formData.get("isPublished") === "on";

    const price = toDecimal(formData.get("price"));
    const currency =
      String(formData.get("currency") || "EUR").trim().toUpperCase().slice(0, 3) || "EUR";

    const location = String(formData.get("location") || "").trim() || null;

    const bedrooms = toInt(formData.get("bedrooms"));
    const bathrooms = toInt(formData.get("bathrooms"));

    // площади (оставляем как было)
    const plotAreaM2 = toInt(formData.get("plotAreaM2"));
    const builtAreaM2 = toInt(formData.get("builtAreaM2"));
    const terraceAreaM2 = toInt(formData.get("terraceAreaM2"));

    // описание объекта
    const descriptionEn = String(formData.get("descriptionEn") || "").trim() || null;
    const descriptionEs = String(formData.get("descriptionEs") || "").trim() || null;

    // планы (пока просто ссылка/путь)
    const plansUrl = String(formData.get("plansUrl") || "").trim() || null;

    // ✅ Amenities (features) из чекбоксов
    const rawFeatureIds = formData.getAll("features");
    const featureIds = rawFeatureIds
      .map((v) => Number(String(v)))
      .filter((n) => Number.isFinite(n)) as number[];

    try {
      // 1) создаём property и получаем id
      const inserted = await db.execute(sql`
        INSERT INTO properties
          (
            slug,
            is_published,
            price,
            currency,
            bedrooms,
            bathrooms,
            location,
            description_en,
            description_es,
            plot_area_m2,
            built_area_m2,
            terrace_area_m2,
            plans_url
          )
        VALUES
          (
            ${slug},
            ${isPublished},
            ${price},
            ${currency},
            ${bedrooms},
            ${bathrooms},
            ${location},
            ${descriptionEn},
            ${descriptionEs},
            ${plotAreaM2},
            ${builtAreaM2},
            ${terraceAreaM2},
            ${plansUrl}
          )
        RETURNING id
      `);

      const newId = Number((inserted as any).rows?.[0]?.id);
      if (!Number.isFinite(newId)) redirect("/admin/properties/new");

      // 2) записываем amenities в property_features
      if (featureIds.length > 0) {
        const valuesSql = sql.join(
          featureIds.map((fid) => sql`(${newId}, ${fid})`),
          sql`, `
        );

        await db.execute(sql`
          INSERT INTO property_features (property_id, feature_id)
          VALUES ${valuesSql}
          ON CONFLICT DO NOTHING
        `);
      }
    } catch {
      redirect("/admin/properties/new");
    }

    redirect("/admin/properties");
  }

  return (
    <main style={{ maxWidth: 900, margin: "60px auto", padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 34, margin: 0 }}>Create property</h1>
          <p style={{ marginTop: 8, opacity: 0.75 }}>
            Заполни только то, что известно. Пустые поля не будут показываться на сайте.
          </p>
        </div>

        <Link
          href="/admin/properties"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #E2E2DE",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          ← Back to list
        </Link>
      </header>

      <form action={create} style={{ marginTop: 18 }}>
        <div
          style={{
            border: "1px solid #E2E2DE",
            borderRadius: 16,
            background: "#fff",
            padding: 18,
          }}
        >
          <Field label="Slug (required)" hint="URL id, например: modern-villa-marbella">
            <input name="slug" required placeholder="modern-villa-marbella" style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Price" hint="например: 350000">
              <input name="price" inputMode="decimal" placeholder="350000" style={inputStyle} />
            </Field>

            <Field label="Currency" hint="EUR / USD ...">
              <input name="currency" defaultValue="EUR" style={inputStyle} />
            </Field>
          </div>

          <Field label="Location" hint="например: Marbella, Nueva Andalucía">
            <input name="location" placeholder="Marbella" style={inputStyle} />
          </Field>

          <Field label="Description (EN)" hint="Короткое описание на английском">
            <textarea
              name="descriptionEn"
              rows={6}
              placeholder="Short description in English..."
              style={textarea}
            />
          </Field>

          <Field label="Description (ES)" hint="Descripción en español">
            <textarea
              name="descriptionEs"
              rows={6}
              placeholder="Descripción en español..."
              style={textarea}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Bedrooms">
              <input name="bedrooms" inputMode="numeric" placeholder="3" style={inputStyle} />
            </Field>

            <Field label="Bathrooms">
              <input name="bathrooms" inputMode="numeric" placeholder="2" style={inputStyle} />
            </Field>
          </div>

          <h2 style={{ fontSize: 18, marginTop: 18, marginBottom: 10 }}>Areas (m²)</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Field label="Plot area" hint="участок (для дома/виллы)">
              <input name="plotAreaM2" inputMode="numeric" placeholder="450" style={inputStyle} />
            </Field>

            <Field label="Built area" hint="площадь застройки">
              <input name="builtAreaM2" inputMode="numeric" placeholder="120" style={inputStyle} />
            </Field>

            <Field label="Terrace area" hint="террасы">
              <input name="terraceAreaM2" inputMode="numeric" placeholder="30" style={inputStyle} />
            </Field>
          </div>

          {/* ✅ Amenities */}
          <h2 style={{ fontSize: 18, marginTop: 18, marginBottom: 10 }}>Amenities</h2>

          {features.length === 0 ? (
            <p style={{ marginTop: 6, opacity: 0.7 }}>No features found. (Seed features first.)</p>
          ) : (
            <div style={amenitiesGrid}>
              {features.map((f) => (
                <label key={f.id} style={amenityItem}>
                  <input type="checkbox" name="features" value={String(f.id)} />
                  <span style={{ marginLeft: 8 }}>{f.label}</span>
                </label>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: 18, marginTop: 18, marginBottom: 10 }}>Plans</h2>

          <Field label="Plans URL / Path" hint="пока ссылка, позже сделаем upload PDF">
            <input name="plansUrl" placeholder="/uploads/plans/..." style={inputStyle} />
          </Field>

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <input id="isPublished" name="isPublished" type="checkbox" />
            <label htmlFor="isPublished" style={{ userSelect: "none" }}>
              Published
            </label>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button
              type="submit"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #0E5E56",
                background: "#0E5E56",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save
            </button>

            <Link
              href="/admin/properties"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #E2E2DE",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Cancel
            </Link>
          </div>

          <p style={{ marginTop: 14, opacity: 0.65, fontSize: 13 }}>
            Если slug уже существует — форма откроется заново (позже добавим сообщение об ошибке).
          </p>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <label style={{ fontWeight: 600 }}>{label}</label>
        {hint ? <span style={{ fontSize: 12, opacity: 0.6 }}>{hint}</span> : null}
      </div>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #E2E2DE",
};

const textarea: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #E2E2DE",
  resize: "vertical",
  minHeight: 120,
};

const amenitiesGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 10,
};

const amenityItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #E2E2DE",
  background: "#fafafa",
};
