// app/[lang]/properties/[slug]/page.tsx
import Header from "@/components/Header/Header";
import PropertyGallery from "@/components/PropertyGallery/PropertyGallery";
import { getDictionary, isLocale, type Locale } from "@/i18n/dictionaries";
import { getPropertyBySlug } from "@/app/lib/publicProperties";
import styles from "./property.module.css";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang: Locale = isLocale(raw) ? (raw as Locale) : "en";
  const t = await getDictionary(lang);

  const uiLang = lang === "es" ? "es" : "en";
  const property = await getPropertyBySlug({ lang: uiLang, slug });

  if (!property) {
    return (
      <>
        <Header lang={lang} t={t.header} />
        <main>
          <section className="section">
            <div className="container">
              <h1 className={styles.title}>
                {lang === "es" ? "Propiedad no encontrada" : "Property not found"}
              </h1>
              <p className={styles.muted}>
                {lang === "es"
                  ? "Puede que no esté publicada o el enlace sea incorrecto."
                  : "It may be unpublished or the link is incorrect."}
              </p>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header lang={lang} t={t.header} />
      <main>
        <section className="section">
          <div className="container">
            <div className={styles.head}>
              <div>
                <h1 className={styles.title}>{property.title}</h1>
                <div className={styles.location}>{property.location}</div>
              </div>

              <div className={styles.price}>{property.priceText}</div>
            </div>

            {/* ✅ Gallery (with modal) */}
            {property.images?.length ? (
              <PropertyGallery images={property.images} />
            ) : (
              <div className={styles.coverPlaceholder} />
            )}

            {/* Specs */}
            <div className={styles.specs}>
              <div className={styles.specItem}>
                🛏 {property.beds} {t.featured.card.beds}
              </div>
              <div className={styles.specItem}>
                🛁 {property.baths} {t.featured.card.baths}
              </div>
              <div className={styles.specItem}>📐 {property.builtArea} m²</div>
            </div>

            {/* Description */}
            {property.description?.trim() ? (
              <div className={styles.block}>
                <div className={styles.blockTitle}>
                  {lang === "es" ? "Descripción" : "Description"}
                </div>
                <p className={styles.description}>{property.description}</p>
              </div>
            ) : null}

            {/* Amenities */}
            {property.features.length > 0 ? (
              <div className={styles.block}>
                <div className={styles.blockTitle}>
                  {lang === "es" ? "Comodidades" : "Amenities"}
                </div>
                <div className={styles.amenities}>
                  {property.features.map((f) => (
                    <span key={f.key} className={styles.amenity}>
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Plans */}
            {property.plansUrl ? (
              <div className={styles.block}>
                <div className={styles.blockTitle}>
                  {lang === "es" ? "Planos (PDF)" : "Plans (PDF)"}
                </div>
                <a
                  className={`btn btnGhost ${styles.planBtn}`}
                  href={property.plansUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {lang === "es" ? "Abrir PDF" : "Open PDF"}
                </a>
              </div>
            ) : null}

            {/* CTA */}
            <div className={styles.cta}>
              <div className={styles.ctaText}>
                {lang === "es"
                  ? "¿Te interesa esta propiedad? Escríbenos y te ayudamos."
                  : "Interested in this property? Message us and we’ll help."}
              </div>
              <a className="btn btnPrimary" href={`/${lang}#contact`}>
                {lang === "es" ? "Contactar" : "Contact"}
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
