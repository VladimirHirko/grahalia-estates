// app/[lang]/properties/[slug]/page.tsx
import Header from "@/components/Header/Header";
import PropertyGallery from "@/components/PropertyGallery/PropertyGallery";
import LeadContactForm from "@/components/LeadContactForm/LeadContactForm";
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

            {/* ✅ Lead form (anchored) */}
            <div id="contact" className={styles.block}>
              <LeadContactForm
                lang={uiLang}
                propertyId={property.id}
                propertySlug={property.slug}
                title={lang === "es" ? "Solicitar detalles" : "Request details"}
                subtitle={
                  lang === "es"
                    ? "Déjanos tus datos y te contactaremos por esta propiedad."
                    : "Leave your details and we’ll contact you about this property."
                }
                labels={
                  lang === "es"
                    ? {
                        name: "Nombre",
                        phone: "Teléfono",
                        email: "Email",
                        message: "Mensaje",
                        send: "Enviar",
                        sending: "Enviando...",
                        sent: "Enviado ✅",
                        namePlaceholder: "Tu nombre",
                        phonePlaceholder: "+34 ...",
                        emailPlaceholder: "tu@email.com",
                        messagePlaceholder: "Cuéntanos qué buscas…",
                        errRequired: "Rellena nombre, teléfono y email.",
                        errEmail: "Email no válido.",
                        errFailed: "Error al enviar. Inténtalo de nuevo.",
                      }
                    : {
                        name: "Your Name",
                        phone: "Phone",
                        email: "Email",
                        message: "Message",
                        send: "Send Message",
                        sending: "Sending...",
                        sent: "Sent ✅",
                        namePlaceholder: "Name",
                        phonePlaceholder: "+34 ...",
                        emailPlaceholder: "you@email.com",
                        messagePlaceholder: "Tell us what you are looking for…",
                        errRequired: "Please fill name, phone and email.",
                        errEmail: "Invalid email.",
                        errFailed: "Failed to send. Try again.",
                      }
                }
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
