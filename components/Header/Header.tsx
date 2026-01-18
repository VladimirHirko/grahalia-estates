"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Header.module.css";
import { scrollToHash } from "@/utils/smoothScroll";

type NavItem = { id: string; label: string };

type HeaderProps = {
  lang: "en" | "es";
  t: {
    nav: Record<string, string>;
    menuTitle: string;
    whatsapp: string;
  };
};

export default function Header({ lang, t }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const nav: NavItem[] = useMemo(
    () => [
      { id: "home", label: t.nav.home },
      { id: "properties", label: t.nav.properties },
      { id: "services", label: t.nav.services },
      { id: "about", label: t.nav.about },
      { id: "contact", label: t.nav.contact },
    ],
    [t]
  );

  const HEADER_OFFSET = 90;

  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`;

  // ✅ любые страницы properties: каталог + детальная
  const isProperties = pathname?.startsWith(`/${lang}/properties`);
  const isCatalog = pathname === `/${lang}/properties`;

  const [activeId, setActiveId] = useState<string>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const closeMenu = () => setMenuOpen(false);

  const goTo = (id: string) => {
    setActiveId(id);
    closeMenu();

    // На главной — всегда плавный перелёт по якорю
    if (isHome) {
      scrollToHash(`#${id}`, { offset: HEADER_OFFSET });
      return;
    }

    // ✅ если кликнули "Properties" НЕ на главной — ведём в каталог
    if (id === "properties") {
      router.push(`/${lang}/properties`);
      return;
    }

    // На других страницах — уводим на главную с hash
    router.push(`/${lang}#${id}`);
  };

  // --- helpers for locale switch ---
  function buildLocalePath(nextLang: "en" | "es") {
    // pathname типа: /en или /es (и позже может быть /en/что-то)
    const parts = (pathname || "/").split("/");
    // ["", "en", ...]
    parts[1] = nextLang;
    const base = parts.join("/") || `/${nextLang}`;

    // сохраняем текущий hash секции (для one-page)
    const hash =
      typeof window !== "undefined"
        ? window.location.hash || `#${activeId}`
        : `#${activeId}`;

    return `${base}${hash}`;
  }

  function switchLang(nextLang: "en" | "es") {
    closeMenu();
    router.push(buildLocalePath(nextLang));
  }

  useEffect(() => {
    if (!isHome) return;

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash) return;

    const id = hash.replace("#", "");
    if (!id) return;

    // даём DOM прогрузить секции, потом скроллим мягко
    const tmr = window.setTimeout(() => {
      scrollToHash(`#${id}`, { offset: HEADER_OFFSET });
    }, 50);

    return () => window.clearTimeout(tmr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, lang]);

  useEffect(() => {
    // ✅ на каталоге и на детальной странице подсвечиваем Properties
    if (isProperties) {
      setActiveId("properties");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 1) Active section picker
  useEffect(() => {
    // Если мы на каталоге — секций нет, подсвечиваем Properties вручную
    if (isCatalog) {
      setActiveId("properties");
      return;
    }

    const sections = nav
      .map((n) => document.getElementById(n.id))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    const PIVOT_PAD = 22;
    const MIN_SWITCH_MS = 260;

    let raf = 0;
    let lastId = activeId;
    let lastSwitchAt = 0;

    const pickActive = () => {
      const now = performance.now();
      const pivot = HEADER_OFFSET + PIVOT_PAD;

      let bestId = lastId;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const el of sections) {
        const rect = el.getBoundingClientRect();
        const delta = rect.top - pivot;
        const score = delta < 0 ? Math.abs(delta) * 0.7 : Math.abs(delta) * 1.0;

        if (score < bestScore) {
          bestScore = score;
          bestId = el.id;
        }
      }

      if (bestId !== lastId && now - lastSwitchAt < MIN_SWITCH_MS) return;

      if (bestId !== lastId) {
        lastId = bestId;
        lastSwitchAt = now;
        setActiveId(bestId);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pickActive);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [nav, isCatalog, activeId, HEADER_OFFSET]);


  // 2) Desktop indicator
  const recalcIndicator = () => {
    const navEl = navRef.current;
    const linkEl = linkRefs.current[activeId];
    if (!navEl || !linkEl) return;

    const navBox = navEl.getBoundingClientRect();
    const linkBox = linkEl.getBoundingClientRect();

    const padding = 10;
    const left = linkBox.left - navBox.left + padding;
    const width = Math.max(18, linkBox.width - padding * 2);

    setIndicator({ left, width });
  };

  useLayoutEffect(() => {
    recalcIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    const onResize = () => recalcIndicator();
    window.addEventListener("resize", onResize);
    const tmr = window.setTimeout(recalcIndicator, 150);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(tmr);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // 3) Lock body scroll when mobile menu open + close on ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    if (menuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const onNavClick =
    (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      goTo(id);
    };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.row}`}>
        {/* Logo */}
        <div
          className={styles.logo}
          role="button"
          tabIndex={0}
          onClick={() => goTo("home")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") goTo("home");
          }}
        >
          <span className={styles.logoMark}>GRAHALIA</span>
          <span className={styles.logoSub}>ESTATES</span>
        </div>

        {/* Desktop nav */}
        <nav className={styles.nav} ref={(el) => (navRef.current = el)}>
          <span
            className={styles.indicator}
            style={{
              transform: `translateX(${indicator.left}px)`,
              width: `${indicator.width}px`,
            }}
            aria-hidden="true"
          />

          {nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={onNavClick(item.id)}
              ref={(el) => {
                linkRefs.current[item.id] = el;
              }}
              className={`${styles.link} ${
                activeId === item.id ? styles.active : ""
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right controls */}
        <div className={styles.right}>
          <div className={styles.lang}>
            <button
              className={styles.langBtn}
              type="button"
              aria-current={lang === "en" ? "page" : undefined}
              onClick={() => switchLang("en")}
            >
              EN
            </button>
            <span className={styles.sep}>|</span>
            <button
              className={styles.langBtn}
              type="button"
              aria-current={lang === "es" ? "page" : undefined}
              onClick={() => switchLang("es")}
            >
              ES
            </button>
          </div>

          <a
            className={`${styles.wa} btn btnPrimary`}
            href="https://wa.me/34123456789"
            target="_blank"
            rel="noreferrer"
          >
            {t.whatsapp}
          </a>

          {/* Burger (mobile) */}
          <button
            type="button"
            className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={styles.burgerText}>
              {menuOpen ? "Close" : "Menu"}
            </span>

            <span className={styles.burgerLines} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        id="mobile-menu"
        className={`${styles.mobileOverlay} ${
          menuOpen ? styles.mobileOverlayOpen : ""
        }`}
        aria-hidden={!menuOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMenu();
        }}
      >
        <div className={styles.mobilePanel}>
          <div className={styles.mobileTop}>
            <div className={styles.mobileTitle}>{t.menuTitle}</div>

            <button
              type="button"
              className={styles.mobileClose}
              aria-label="Close menu"
              onClick={closeMenu}
            >
              ✕
            </button>
          </div>

          <div className={styles.mobileLinks}>
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`${styles.mobileLink} ${
                  activeId === item.id ? styles.mobileActive : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(item.id);
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className={styles.mobileBottom}>
            <a
              className={`btn btnPrimary ${styles.mobileWa}`}
              href="https://wa.me/34123456789"
              target="_blank"
              rel="noreferrer"
              onClick={() => closeMenu()}
            >
              {t.whatsapp}
            </a>

            <div className={styles.mobileLang}>
              <button
                className={styles.langBtn}
                type="button"
                onClick={() => switchLang("en")}
              >
                EN
              </button>
              <span className={styles.sep}>|</span>
              <button
                className={styles.langBtn}
                type="button"
                onClick={() => switchLang("es")}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
