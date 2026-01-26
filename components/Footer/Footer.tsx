"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Footer.module.css";
import { scrollToHash } from "@/utils/smoothScroll";

type FooterDict = {
  tagline: string;
  locationLine: string;

  navTitle: string;
  nav: {
    home: string;
    properties: string;
    services: string;
    about: string;
    contact: string;
  };

  socialTitle: string;
  socials: {
    instagram: string;
    facebook: string;
    linkedin: string;
  };

  legal: {
    privacy: string;
    cookies: string;
    terms: string;
    manageCookies: string;
  };

  rights: string;
};

export default function Footer({
  lang,
  t,
  onManageCookies,
}: {
  lang: "en" | "es";
  t?: FooterDict;
  onManageCookies?: () => void;
}) {
  if (!t) return null;

  const year = new Date().getFullYear();

  const router = useRouter();
  const pathname = usePathname();

  const HEADER_OFFSET = 90;
  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`;

  const goToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();

    // На главной — скроллим мягко сразу
    if (isHome) {
      scrollToHash(`#${id}`, { offset: HEADER_OFFSET });
      return;
    }

    // На других страницах — переходим на главную с hash.
    // Header уже умеет после перехода сделать плавный скролл.
    router.push(`/${lang}#${id}`);
  };

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.col}>
            <div className={styles.brandBlock}>
              <Image
                src="/logo_cuadrado.png"
                alt="Grahalia Estates"
                width={140}
                height={140}
                className={styles.brandLogo}
              />
              <div className={styles.location}>{t.locationLine}</div>
            </div>
          </div>

          {/* Nav */}
          <div className={styles.col}>
            <div className={styles.title}>{t.navTitle}</div>
            <nav className={styles.links}>
              <a href={`/${lang}#home`} onClick={goToSection("home")}>
                {t.nav.home}
              </a>

              <Link href={`/${lang}/properties`}>{t.nav.properties}</Link>

              <a href={`/${lang}#services`} onClick={goToSection("services")}>
                {t.nav.services}
              </a>

              <a href={`/${lang}#about`} onClick={goToSection("about")}>
                {t.nav.about}
              </a>

              <a href={`/${lang}#contact`} onClick={goToSection("contact")}>
                {t.nav.contact}
              </a>
            </nav>
          </div>

          {/* Socials (placeholders) */}
          <div className={styles.col}>
            <div className={styles.title}>{t.socialTitle}</div>
            <div className={styles.socials}>
              <a
                className={styles.socialDisabled}
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-disabled="true"
              >
                {t.socials.instagram}
              </a>
              <a
                className={styles.socialDisabled}
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-disabled="true"
              >
                {t.socials.facebook}
              </a>
              <a
                className={styles.socialDisabled}
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-disabled="true"
              >
                {t.socials.linkedin}
              </a>
            </div>

            <div className={styles.hint}>*</div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.copy}>
            © {year} Grahalia Estates · {t.rights}
          </div>

          <div className={styles.legal}>
            <Link href={`/${lang}/privacy`}>{t.legal.privacy}</Link>
            <Link href={`/${lang}/cookies`}>{t.legal.cookies}</Link>
            <Link href={`/${lang}/terms`}>{t.legal.terms}</Link>

            <button
              type="button"
              className={styles.manageBtn}
              onClick={() => onManageCookies?.()}
            >
              {t.legal.manageCookies}
            </button>

          </div>
        </div>
      </div>
    </footer>
  );
}
