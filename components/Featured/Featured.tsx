"use client";

import { scrollToHash } from "@/utils/smoothScroll";
import PropertyCard from "../PropertyCard/PropertyCard";
import styles from "./Featured.module.css";

type FeaturedDict = {
  title: string;
  subtitle: string;
  cta: string;
};

const featured = [
  {
    title: "Modern Villa in Marbella",
    location: "Marbella · Costa del Sol",
    price: "€1,250,000",
    beds: 4,
    baths: 3,
    area: 250,
    image: "/properties/p1.jpg",
  },
  {
    title: "Seaside Apartment in Estepona",
    location: "Estepona · Costa del Sol",
    price: "€850,000",
    beds: 2,
    baths: 2,
    area: 120,
    image: "/properties/p2.jpg",
  },
  {
    title: "Luxury Villa in Benahavís",
    location: "Benahavís · Costa del Sol",
    price: "Price on Request",
    beds: 5,
    baths: 5,
    area: 450,
    image: "/properties/p3.jpg",
  },
];

export default function Featured({ t }: { t: FeaturedDict }) {
  const OFFSET = 90;

  return (
    <section id="properties" className={`section ${styles.section}`}>
      <div className="container">
        {/* Центрированный заголовок как в макете */}
        <div className="section__head">
          <h2 className="sectionTitle">
            <span className="sectionTitleText">{t.title}</span>
          </h2>
          <p className="section__kicker">{t.subtitle}</p>
        </div>

        <div className={styles.grid}>
          {featured.map((p) => (
            <PropertyCard key={p.title} property={p} t={t.card} />
          ))}
        </div>

        {/* CTA */}
        <div className="section__actions">
          <a
            className={`btn btnPrimary ${styles.allBtn}`}
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollToHash("#contact", { offset: OFFSET });
            }}
          >
            {t.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
