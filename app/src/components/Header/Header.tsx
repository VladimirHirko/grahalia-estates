"use client";

import styles from "./header.module.css";
import { NAV } from "@/lib/nav";
import { useActiveSection } from "@/lib/useActiveSection";

export function Header() {
  const activeId = useActiveSection(NAV.map((n) => n.id));

  return (
    <header className={styles.header}>
      <div className={`${styles.inner} container`}>
        <div className={styles.brand}>
          {/* потом заменим на реальный логотип из /public */}
          <span className={styles.logoMark}>G</span>
          <span className={styles.brandText}>Grahalia Estates</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`${styles.link} ${activeId === item.id ? styles.active : ""}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a href="#contact" className={styles.cta}>
          Контакт
        </a>
      </div>
    </header>
  );
}
