"use client";

import { scrollToHash } from "@/utils/smoothScroll";
import styles from "./PropertyCard.module.css";

type Property = {
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: number;
  image: string;
};

type CardT = {
  beds: string;
  baths: string;
  details: string;
};

export default function PropertyCard({
  property,
  t,
}: {
  property: Property;
  t: CardT;
}) {
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

        {/* ✅ ВОТ ОН — spacer */}
        <div className={styles.spacer} />

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
      </div>
    </article>
  );
}
