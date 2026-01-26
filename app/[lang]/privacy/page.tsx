import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { getDictionary, isLocale, type Locale } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function PrivacyPage({
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
              {lang === "es" ? "Política de privacidad" : "Privacy Policy"}
            </h1>

            <p className="p" style={{ marginTop: 12 }}>
              {lang === "es"
                ? "Esta página es una plantilla temporal. Aquí explicaremos qué datos recopilamos (por ejemplo, cuando envías un formulario), con qué finalidad, y cómo puedes solicitar acceso/eliminación."
                : "This is a temporary placeholder page. Here we’ll explain what data we collect (for example, when you submit a form), why we collect it, and how you can request access/deletion."}
            </p>

            <div style={{ marginTop: 18 }}>
              <h2 className="h2" style={{ fontSize: 18 }}>
                {lang === "es" ? "Qué datos" : "What data"}
              </h2>

              <p className="p" style={{ marginTop: 10 }}>
                {lang === "es"
                  ? "Nombre, teléfono, email y mensaje que envías voluntariamente en el formulario de contacto."
                  : "Name, phone, email, and the message you voluntarily submit via the contact form."}
              </p>
            </div>

            <div style={{ marginTop: 18 }}>
              <h2 className="h2" style={{ fontSize: 18 }}>
                {lang === "es" ? "Finalidad" : "Purpose"}
              </h2>

              <p className="p" style={{ marginTop: 10 }}>
                {lang === "es"
                  ? "Responder a tu solicitud y ayudarte con información sobre propiedades y servicios."
                  : "To respond to your request and help you with information about properties and services."}
              </p>
            </div>

            <div style={{ marginTop: 22 }}>
              <a className="btn btnPrimary" href={`/${uiLang}#contact`}>
                {lang === "es" ? "Escribirnos" : "Contact us"}
              </a>
            </div>
          </div>
        </section>
      </main>

      
    </>
  );
}
