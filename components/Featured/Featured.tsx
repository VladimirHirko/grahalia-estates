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

  // ✅ для бейджей
  dealType?: "sale" | "rent" | null;
  isNewBuild?: boolean;
  status?: "available" | "reserved" | "sold" | null;
};

type Props = {
  lang: "en" | "es";
  t: FeaturedDict;
  items?: FeaturedItem[];
  itemsPerView?: number;
  intervalMs?: number;
  randomStart?: boolean;
  fadeMs?: number;
};

const fallbackFeatured: FeaturedItem[] = [
  {
    id: "fallback-1",
    title: "Modern Villa in Marbella",
    location: "Marbella · Costa del Sol",
    price: "€1,250,000",
    beds: 4,
    baths: 3,
    area: 250,
    image: "/properties/p1.jpg",
    slug: "modern-villa-marbella",
    dealType: "sale",
    isNewBuild: false,
  },
  {
    id: "fallback-2",
    title: "Seaside Apartment in Estepona",
    location: "Estepona · Costa del Sol",
    price: "€850,000",
    beds: 2,
    baths: 2,
    area: 120,
    image: "/properties/p2.jpg",
    slug: "seaside-apartment-estepona",
    dealType: "sale",
    isNewBuild: false,
  },
  {
    id: "fallback-3",
    title: "Luxury Villa in Benahavís",
    location: "Benahavís · Costa del Sol",
    price: "Price on Request",
    beds: 5,
    baths: 5,
    area: 450,
    image: "/properties/p3.jpg",
    slug: "luxury-villa-benahavis",
    dealType: "sale",
    isNewBuild: true,
  },
];

export default function Featured({
  lang,
  t,
  items,
  itemsPerView = 3,
  intervalMs = 6000,
  randomStart = true,
  fadeMs = 1000,
}: Props) {
  const safeItemsPerView = Math.max(1, Math.floor(itemsPerView));

  const pool = useMemo<FeaturedItem[]>(() => {
    return Array.isArray(items) && items.length > 0 ? items : fallbackFeatured;
  }, [items]);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(pool.length / safeItemsPerView));
  }, [pool.length, safeItemsPerView]);

  const [page, setPage] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
      intervalRef.current = null;
      fadeTimeoutRef.current = null;
    };
  }, []);

  useEffect(() => {
    setPage((p) => (p >= pageCount ? 0 : p));
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
    intervalRef.current = window.setInterval(goNext, intervalMs);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount, intervalMs, fadeMs]);

  const visible = useMemo(() => {
    const start = page * safeItemsPerView;
    const slice = pool.slice(start, start + safeItemsPerView);

    if (slice.length < safeItemsPerView && pool.length > slice.length) {
      return slice.concat(pool.slice(0, safeItemsPerView - slice.length));
    }

    return slice;
  }, [pool, page, safeItemsPerView]);

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
            {visible.map((p) => {
              const href = p.slug ? `/${lang}/properties/${p.slug}` : `/${lang}#contact`;

              return (
                <PropertyCard
                  key={String(p.id ?? `${p.title}-${href}`)}
                  property={{
                    title: p.title,
                    location: p.location,
                    price: p.price,
                    beds: p.beds,
                    baths: p.baths,
                    area: p.area,
                    image: p.image,
                    href,

                    dealType: p.dealType ?? null,
                    isNewBuild: Boolean(p.isNewBuild),

                    // ✅ статус
                    status: (p as any).status ?? null,
                  }}
                  t={t.card}
                />

              );
            })}
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
