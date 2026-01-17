"use client";

import styles from "./Services.module.css";

type ServicesDict = {
  title: string;
  subtitle: string;
  items: {
    title: string;
    text: string;
    icon: string;
  }[];
};

export default function Services({ t }: { t: ServicesDict }) {
  return (
    <section id="services" className={`section ${styles.section}`}>
      <div className="container">
        {/* Центрированный заголовок + линии, как в макете */}
        <div className="section__head">
          <h2 className="sectionTitle">
            <span className="sectionTitleText">{t.title}</span>
          </h2>
          <p className="section__kicker">{t.subtitle}</p>
        </div>

        <div className={styles.grid}>
          {t.items.map((s) => (
            <div key={s.title} className={styles.card}>
              <div className={styles.icon}>{s.icon}</div>

              <div className={styles.content}>
                <div className={styles.title}>{s.title}</div>
                <div className={styles.text}>{s.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
