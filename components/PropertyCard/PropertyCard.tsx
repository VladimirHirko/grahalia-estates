"use client";

import Link from "next/link";
import { scrollToHash } from "@/utils/smoothScroll";
import styles from "./PropertyCard.module.css";

type Feature = {
  key: string;   // parking, pool...
  label: string; // translated label
};

type Property = {
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: number;
  image: string;

  // ✅ Новое (не обязательное)
  href?: string;              // если есть — кнопка ведёт по ссылке, а не скроллит
  features?: Feature[];       // amenities для бейджей
  showFeatures?: boolean;     // можно отключить (например на главной)
};

type CardT = {
  beds: string;
  baths: string;
  details: string;
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

export default function PropertyCard({
  property,
  t,
}: {
  property: Property;
  t: CardT;
}) {
  const feats = Array.isArray(property.features) ? property.features : [];
  const showFeatures = property.showFeatures !== false; // по умолчанию показываем

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <img
          className={styles.image}
          src={property.image}
          alt={property.title}
          loading="lazy"
        />
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{property.title}</h3>
        <div className={styles.meta}>{property.location}</div>

        <div className={styles.price}>{property.price}</div>

        <div className={styles.specs}>
          <span className={styles.specItem}>
            🛏 {property.beds} {t.beds}
          </span>
          <span className={styles.dot}>•</span>
          <span className={styles.specItem}>
            🛁 {property.baths} {t.baths}
          </span>
          <span className={styles.dot}>•</span>
          <span className={styles.specItem}>📐 {property.area} m²</span>
        </div>

        {/* ✅ Amenities / Features (бейджи) */}
        {showFeatures && feats.length > 0 && (
          <div className={styles.badges} aria-label="Amenities">
            {feats.slice(0, 5).map((f) => (
              <span key={f.key} className={styles.badge} title={f.label}>
                <span className={styles.badgeIcon}>{ICON[f.key] ?? "•"}</span>
                <span className={styles.badgeText}>{f.label}</span>
              </span>
            ))}
            {feats.length > 5 && (
              <span className={styles.more}>+{feats.length - 5}</span>
            )}
          </div>
        )}

        {/* ✅ spacer */}
        <div className={styles.spacer} />

        {/* ✅ ВАЖНО: если href есть — обычная навигация, иначе якорь */}
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
