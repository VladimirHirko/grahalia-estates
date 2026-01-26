"use client";

import Link from "next/link";
import { scrollToHash } from "@/utils/smoothScroll";
import styles from "./PropertyCard.module.css";

type Feature = {
  key: string;
  label: string;
};

type Property = {
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: number;
  image: string;

  dealType?: "sale" | "rent" | string | null;
  isNewBuild?: boolean;

  // ✅ availability status
  status?: "available" | "reserved" | "sold" | string | null;

  href?: string;
  features?: Feature[];
  showFeatures?: boolean;
};

type CardT = {
  beds: string;
  baths: string;
  details: string;

  forSale: string;
  forRent: string;

  newBuild: string;

  // ✅ translations (optional)
  reserved?: string;
  sold?: string;
};

const ICON: Record<string, string> = {
  parking: "🅿️",
  garage: "🚗",
  pool: "🏊",
  gym: "🏋️",
  lift: "🛗",
  terrace: "🌤️",
  garden: "🌿",
  sea_view: "🌊",
  storage: "📦",
  aircon: "❄️",
  heating: "🔥",
  gated: "🔒",
};

function normalizeDealType(v: unknown): "sale" | "rent" | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "sale" || s === "rent") return s;
  return null;
}

function normalizeStatus(v: unknown): "available" | "reserved" | "sold" | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "available" || s === "reserved" || s === "sold") return s;
  return null;
}

export default function PropertyCard({ property, t }: { property: Property; t: CardT }) {
  const feats = Array.isArray(property.features) ? property.features : [];
  const showFeatures = property.showFeatures !== false;

  const dealType = normalizeDealType(property.dealType);
  const dealLabel = dealType === "sale" ? t.forSale : dealType === "rent" ? t.forRent : null;

  const newBuildLabel = property.isNewBuild ? t.newBuild : null;

  const status = normalizeStatus(property.status);
  const isReserved = status === "reserved";
  const isSold = status === "sold";

  const reservedText =
    t.reserved ??
    (typeof property.status === "string" && property.status.toLowerCase() === "reserved"
      ? "Reserved"
      : "Reserved");

  const soldText = t.sold ?? "Sold";

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        {/* ✅ For Sale / For Rent — справа сверху */}
        {dealLabel ? (
          <span className={styles.dealBadge} aria-label={dealLabel}>
            {dealLabel}
          </span>
        ) : null}

        {/* ✅ New build — слева сверху (ВАЖНО: без dealBadge!) */}
        {newBuildLabel ? (
          <span className={styles.newBuildBadge} aria-label={newBuildLabel}>
            {newBuildLabel}
          </span>
        ) : null}

        {/* ✅ SOLD — диагональный штамп по фото */}
        {isSold ? (
          <div className={styles.soldStamp} aria-label={soldText}>
            <span>{soldText}</span>
          </div>
        ) : null}

        {/* ✅ RESERVED — плашка ВНИЗУ ФОТО (не в body) */}
        {isReserved ? (
          <div className={styles.reservedBar} aria-label={reservedText}>
            {reservedText}
          </div>
        ) : null}

        {/* DEV-подсказка */}
        {process.env.NODE_ENV !== "production" && !dealType ? (
          <span className={styles.dealBadgeDebug} title="dealType is missing">
            no dealType
          </span>
        ) : null}

        <img className={styles.image} src={property.image} alt={property.title} loading="lazy" />
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{property.title}</h3>
        <div className={styles.meta}>{property.location}</div>

        <div className={styles.price}>{property.price}</div>

        <div className={styles.specs}>
          <span className={styles.specItem}>🛏 {property.beds} {t.beds}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.specItem}>🛁 {property.baths} {t.baths}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.specItem}>📐 {property.area} m²</span>
        </div>

        {showFeatures && feats.length > 0 && (
          <div className={styles.badges} aria-label="Amenities">
            {feats.slice(0, 5).map((f) => (
              <span key={f.key} className={styles.badge} title={f.label}>
                <span className={styles.badgeIcon}>{ICON[f.key] ?? "•"}</span>
                <span className={styles.badgeText}>{f.label}</span>
              </span>
            ))}
            {feats.length > 5 && <span className={styles.more}>+{feats.length - 5}</span>}
          </div>
        )}

        <div className={styles.spacer} />

        {property.href ? (
          <Link className={`btn btnPrimary ${styles.btn}`} href={property.href}>
            {t.details}
          </Link>
        ) : (
          <a
            className={`btn btnPrimary ${styles.btn}`}
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollToHash("#contact", { offset: 90 });
            }}
          >
            {t.details}
          </a>
        )}
      </div>
    </article>
  );
}
