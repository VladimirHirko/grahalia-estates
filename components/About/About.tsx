"use client";

import { scrollToHash } from "@/utils/smoothScroll";
import styles from "./About.module.css";

type AboutDict = {
  title: string;
  subtitle: string;
  body: string;
  cta: string;
};

export default function About({ t }: { t: AboutDict }) {
  const OFFSET = 90;

  return (
    <section id="about" className={`section ${styles.section}`}>
      <div className="container">
        {/* Заголовок секции как в макете: по центру + линии */}
        <div className="section__head">
          <h2 className="sectionTitle">
            <span className="sectionTitleText">{t.title}</span>
          </h2>
        </div>

        <div className={styles.grid}>
          <div className={styles.text}>
            <p className={`p ${styles.subtitle}`}>{t.subtitle}</p>

            <p className={`p ${styles.body}`}>{t.body}</p>

            <a
              className={`btn btnPrimary ${styles.btn}`}
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToHash("#contact", { offset: OFFSET });
              }}
            >
              {t.cta}
            </a>
          </div>

          <div className={styles.media}>
            <img
              className={styles.image}
              src="/about.jpg"
              alt={t.title}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
