import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { getDictionary, isLocale, type Locale } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? (raw as Locale) : "en";
  const t = await getDictionary(lang);

  const uiLang: "en" | "es" = lang === "es" ? "es" : "en";

  return (
    <>
      <Header lang={uiLang} t={t.header} />

      <main>
        <section className="section">
          <div className="container">
            <h1 className="h2">
              {lang === "es" ? "Términos y condiciones" : "Terms & Conditions"}
            </h1>

            <p className="p" style={{ marginTop: 12 }}>
              {lang === "es"
                ? "Esta página es una plantilla temporal. Aquí publicaremos los términos de uso del sitio, avisos legales y limitaciones de responsabilidad."
                : "This is a temporary placeholder page. Here we’ll publish the website terms of use, legal notices, and limitations of liability."}
            </p>

            <div style={{ marginTop: 18 }}>
              <h2 className="h2" style={{ fontSize: 18 }}>
                {lang === "es" ? "Nota" : "Note"}
              </h2>

              <p className="p" style={{ marginTop: 10 }}>
                {lang === "es"
                  ? "La información del sitio puede cambiar. Para confirmar disponibilidad y precios, contáctanos."
                  : "Information on this website may change. To confirm availability and pricing, please contact us."}
              </p>
            </div>

            <div style={{ marginTop: 22 }}>
              <a className="btn btnPrimary" href={`/${uiLang}#contact`}>
                {lang === "es" ? "Contactar" : "Contact"}
              </a>
            </div>
          </div>
        </section>
      </main>

      
    </>
  );
}
