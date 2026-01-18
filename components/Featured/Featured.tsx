"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PropertyCard from "../PropertyCard/PropertyCard";
import styles from "./Featured.module.css";

type FeaturedDict = {
  title: string;
  subtitle: string;
  cta: string;
  card: any;
};

export type FeaturedItem = {
  id?: number | string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: number;
  image: string;
  slug?: string;
};

const fallbackFeatured: FeaturedItem[] = [
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

type Props = {
  lang: "en" | "es";
  t: FeaturedDict;
  items?: FeaturedItem[];

  itemsPerView?: number;
  intervalMs?: number;
  randomStart?: boolean;
  fadeMs?: number;
};

export default function Featured({
  lang,
  t,
  items,
  itemsPerView = 3,
  intervalMs = 6000,
  randomStart = true,
  fadeMs = 1000,
}: Props) {
  const pool: FeaturedItem[] = useMemo(() => {
    return Array.isArray(items) && items.length > 0 ? items : fallbackFeatured;
  }, [items]);

  const pageCount = Math.max(1, Math.ceil(pool.length / itemsPerView));

  const [page, setPage] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (page >= pageCount) setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount]);

  useEffect(() => {
    if (!randomStart) return;
    if (pageCount <= 1) return;

    setPage((current) => {
      if (current !== 0) return current;
      return Math.floor(Math.random() * pageCount);
    });
  }, [randomStart, pageCount]);

  const goNext = () => {
    if (pageCount <= 1) return;

    setIsFading(true);

    if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);

    fadeTimeoutRef.current = window.setTimeout(() => {
      setPage((p) => (p + 1) % pageCount);
      setIsFading(false);
    }, fadeMs);
  };

  useEffect(() => {
    if (pageCount <= 1) return;

    if (intervalRef.current) window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      goNext();
    }, intervalMs);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount, intervalMs, fadeMs]);

  const visible = useMemo(() => {
    const start = page * itemsPerView;
    const slice = pool.slice(start, start + itemsPerView);

    if (slice.length < itemsPerView && pool.length > slice.length) {
      return slice.concat(pool.slice(0, itemsPerView - slice.length));
    }

    return slice;
  }, [pool, page, itemsPerView]);

  return (
    <section id="properties" className={`section ${styles.section}`}>
      <div className="container">
        <div className="section__head">
          <h2 className="sectionTitle">
            <span className="sectionTitleText">{t.title}</span>
          </h2>
          <p className="section__kicker">{t.subtitle}</p>
        </div>

        <div
          className={`${styles.fadeWrap} ${isFading ? styles.fadeOut : styles.fadeIn}`}
          style={{ ["--fade-ms" as any]: `${fadeMs}ms` }}
        >
          <div className={styles.grid}>
            {visible.map((p) => (
              <PropertyCard
                key={String(p.id ?? p.title)}
                property={{
                  ...p,
                  // ✅ теперь "View Details" ведёт на детальную страницу объекта
                  href: p.slug ? `/${lang}/properties/${p.slug}` : `/${lang}#contact`,
                }}
                t={t.card}
              />
            ))}
          </div>
        </div>

        <div className="section__actions">
          <Link className={`btn btnPrimary ${styles.allBtn}`} href={`/${lang}/properties`}>
            {t.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
