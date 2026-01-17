"use client";

import styles from "./Hero.module.css";
import { scrollToHash } from "@/utils/smoothScroll";

type HeroDict = {
  titleA: string;
  titleB: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export default function Hero({ t }: { t: HeroDict }) {
  const OFFSET = 90;

  return (
    <section id="home" className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <h1 className="h1">
            {t.titleA} <span className={styles.ital}>{t.titleB}</span>
          </h1>

          <p className={`p ${styles.sub}`}>{t.subtitle}</p>

          <div className={styles.actions}>
            <a
              className="btn btnPrimary"
              href="#properties"
              onClick={(e) => {
                e.preventDefault();
                scrollToHash("#properties", { offset: OFFSET });
              }}
            >
              {t.ctaPrimary}
            </a>

            <a
              className="btn btnGhost"
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToHash("#contact", { offset: OFFSET });
              }}
            >
              {t.ctaSecondary}
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.fade} aria-hidden="true" />
    </section>
  );
}
