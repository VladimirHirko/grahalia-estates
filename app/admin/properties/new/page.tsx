import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import RentFieldsSync from "../RentFieldsSync";
import RentFieldsToggle from "./RentFieldsToggle";

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

function normalizeSlugBase(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 220);
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
  const features = ((featuresRes as any).rows ?? []) as Array<{
    id: number;
    key: string;
    label: string;
  }>;

  async function create(formData: FormData) {
    "use server";

    console.log("FORM DATA:", Object.fromEntries(formData.entries()));
    console.log("dealType:", formData.get("dealType"));
    console.log("rentType:", formData.get("rentType"));
    console.log("rentPrice:", formData.get("rentPrice"));
    console.log("rentPeriod:", formData.get("rentPeriod"));

    const slugRaw = String(formData.get("slug") || "");
    const baseSlug = normalizeSlugBase(slugRaw);

    if (!baseSlug) redirect("/admin/properties/new");

    // nonce чтобы temp значения были уникальными даже при параллельных запросах
    const nonce = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

    // временные значения (проходим NOT NULL + unique)
    const tempSlug = `${baseSlug}-${nonce}`;
    const tempPublicId = `TMP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`; // 12 chars примерно

    const isPublished = formData.get("isPublished") === "on";

    const price = toDecimal(formData.get("price"));
    const currency =
      String(formData.get("currency") || "EUR").trim().toUpperCase().slice(0, 3) || "EUR";

    const location = String(formData.get("location") || "").trim() || null;

    const bedrooms = toInt(formData.get("bedrooms"));
    const bathrooms = toInt(formData.get("bathrooms"));

    const plotAreaM2 = toInt(formData.get("plotAreaM2"));
    const builtAreaM2 = toInt(formData.get("builtAreaM2"));
    const terraceAreaM2 = toInt(formData.get("terraceAreaM2"));

    const descriptionEn = String(formData.get("descriptionEn") || "").trim() || null;
    const descriptionEs = String(formData.get("descriptionEs") || "").trim() || null;

    const plansUrl = String(formData.get("plansUrl") || "").trim() || null;

    // ✅ NEW: deal/property/condition/status + floors
    const dealTypeRaw = String(formData.get("dealType") || "sale").trim().toLowerCase();
    const dealType = dealTypeRaw === "rent" ? "rent" : "sale";

    const propertyTypeRaw = String(formData.get("propertyType") || "").trim().toLowerCase();
    const propertyType = propertyTypeRaw || null;

    const conditionRaw = String(formData.get("condition") || "").trim().toLowerCase();
    const condition = conditionRaw || null;

    const statusRaw = String(formData.get("status") || "available").trim().toLowerCase();
    const status = ["available", "reserved", "sold"].includes(statusRaw) ? statusRaw : "available";

    const floor = toInt(formData.get("floor"));
    const totalFloors = toInt(formData.get("totalFloors"));

    // ✅ RENT fields
    const rentTypeRaw = String(formData.get("rentType") || "").trim().toLowerCase();
    const rentType = ["long_term", "short_term", "holiday"].includes(rentTypeRaw) ? rentTypeRaw : null;

    const rentPeriodRaw = String(formData.get("rentPeriod") || "").trim().toLowerCase();
    const rentPeriod = ["month", "week", "day"].includes(rentPeriodRaw) ? rentPeriodRaw : null;

    const rentPrice = toDecimal(formData.get("rentPrice"));

    const finalRentType = dealType === "rent" ? rentType : null;
    const finalRentPeriod = dealType === "rent" ? rentPeriod : null;
    const finalRentPrice = dealType === "rent" ? rentPrice : null;

    // ✅ серверная валидация: для rent — тип и цена обязательны
    if (dealType === "rent") {
      // rentType обязателен, цена — нет
      if (!finalRentType) {
        redirect("/admin/properties/new");
      }
    }

    // ✅ Amenities (features) из чекбоксов
    const rawFeatureIds = formData.getAll("features");
    const featureIds = rawFeatureIds
      .map((v) => Number(String(v)))
      .filter((n) => Number.isFinite(n)) as number[];

    try {
      // ✅ транзакция: либо всё, либо ничего
      await db.execute(sql`BEGIN`);

      // 1) INSERT (с temp slug/public_id)
      const inserted = await db.execute(sql`
        INSERT INTO properties
          (
            slug,
            public_id,
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
            plans_url,
            deal_type,
            property_type,
            condition,
            status,
            floor,
            total_floors,
            rent_type,
            rent_price,
            rent_period
          )
        VALUES
          (
            ${tempSlug},
            ${tempPublicId},
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
            ${plansUrl},
            ${dealType},
            ${propertyType},
            ${condition},
            ${status},
            ${floor},
            ${totalFloors},
            ${finalRentType},
            ${finalRentPrice},
            ${finalRentPeriod}
          )
        RETURNING id
      `);

      const newId = Number((inserted as any).rows?.[0]?.id);
      if (!Number.isFinite(newId)) {
        await db.execute(sql`ROLLBACK`);
        redirect("/admin/properties/new");
      }

      // 2) финальные значения
      const publicId = `GE-${String(newId).padStart(6, "0")}`;
      const finalSlug = `${baseSlug}-${publicId.toLowerCase()}`;

      await db.execute(sql`
        UPDATE properties
        SET
          public_id = ${publicId},
          slug = ${finalSlug},
          updated_at = NOW()
        WHERE id = ${newId}
      `);

      // 3) amenities
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

      await db.execute(sql`COMMIT`);
    } catch (e) {
      try {
        await db.execute(sql`ROLLBACK`);
      } catch {
        // ignore rollback errors
      }
      console.error("CREATE PROPERTY ERROR:", e);
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

      <RentFieldsToggle />
      <form action={create} style={{ marginTop: 18 }}>
        <RentFieldsSync />

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

          <h2 style={{ fontSize: 18, marginTop: 18, marginBottom: 10 }}>Basics</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Deal type">
              <select name="dealType" id="dealType" defaultValue="sale" style={inputStyle}>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
            </Field>

            <Field label="Status">
              <select name="status" defaultValue="available" style={inputStyle}>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Property type">
              <select name="propertyType" defaultValue="" style={inputStyle}>
                <option value="">—</option>
                <option value="villa">Villa</option>
                <option value="house">House</option>
                <option value="townhouse">Townhouse</option>
                <option value="apartment">Apartment</option>
                <option value="penthouse">Penthouse</option>
                <option value="duplex">Duplex</option>
                <option value="studio">Studio</option>
                <option value="plot">Plot</option>
              </select>
            </Field>

            <Field label="Condition">
              <select name="condition" defaultValue="" style={inputStyle}>
                <option value="">—</option>
                <option value="new_build">New build</option>
                <option value="resale">Resale</option>
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Floor">
              <input name="floor" inputMode="numeric" placeholder="2" style={inputStyle} />
            </Field>

            <Field label="Total floors">
              <input name="totalFloors" inputMode="numeric" placeholder="6" style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Price" hint="например: 350000">
              <input name="price" inputMode="decimal" placeholder="350000" style={inputStyle} />
            </Field>

            <Field label="Currency" hint="EUR / USD ...">
              <input name="currency" defaultValue="EUR" style={inputStyle} />
            </Field>
          </div>

          {/* RENT fields (visible only when Deal type = Rent) */}
          <div
            id="rentFields"
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 14,
              border: "1px dashed #E2E2DE",
              background: "#fafafa",
              display: "none", // ✅ чтобы не мигало
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Rent details</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Field label="Rent type">
                <select name="rentType" data-rent-input defaultValue="" style={inputStyle}>
                  <option value="">—</option>
                  <option value="long_term">Long-term</option>
                  <option value="short_term">Short-term</option>
                  <option value="holiday">Holiday</option>
                </select>
              </Field>

              <Field label="Rent price" hint="например: 2000">
                <input name="rentPrice" data-rent-input inputMode="decimal" placeholder="2000" style={inputStyle} />
              </Field>

              <Field label="Rent period">
                <select name="rentPeriod" data-rent-input defaultValue="month" style={inputStyle}>
                  <option value="">—</option>
                  <option value="month">/ month</option>
                  <option value="week">/ week</option>
                  <option value="day">/ day</option>
                </select>
              </Field>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              These fields are required for Rent objects (type + price).
            </div>
          </div>

          <Field label="Location" hint="например: Marbella, Nueva Andalucía">
            <input name="location" placeholder="Marbella" style={inputStyle} />
          </Field>

          <Field label="Description (EN)" hint="Короткое описание на английском">
            <textarea name="descriptionEn" rows={6} placeholder="Short description in English..." style={textarea} />
          </Field>

          <Field label="Description (ES)" hint="Descripción en español">
            <textarea name="descriptionEs" rows={6} placeholder="Descripción en español..." style={textarea} />
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
