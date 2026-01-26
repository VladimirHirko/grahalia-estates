import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { getDictionary, isLocale, type Locale } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function CookiesPage({
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
            <h1 className="h2">{lang === "es" ? "Cookies" : "Cookies"}</h1>

            <p className="p" style={{ marginTop: 12 }}>
              {lang === "es"
                ? "Esta página es una plantilla temporal. Aquí publicaremos nuestra política de cookies, incluyendo qué cookies usamos, para qué sirven y cómo puedes gestionar tus preferencias."
                : "This is a temporary placeholder page. Here we’ll publish our cookie policy, including what cookies we use, what they’re for, and how you can manage your preferences."}
            </p>

            <div style={{ marginTop: 18 }}>
              <h2 className="h2" style={{ fontSize: 18 }}>
                {lang === "es" ? "Resumen" : "Summary"}
              </h2>

              <p className="p" style={{ marginTop: 10 }}>
                {lang === "es"
                  ? "• Cookies necesarias: para que el sitio funcione correctamente.\n• Analítica: para entender el uso del sitio (opcional).\n• Marketing: para campañas y medición (opcional)."
                  : "• Necessary cookies: required for the website to work.\n• Analytics: helps us understand site usage (optional).\n• Marketing: helps measure campaigns (optional)."}
              </p>
            </div>

            <div style={{ marginTop: 22 }}>
              <a className="btn btnPrimary" href={`/${uiLang}#contact`}>
                {lang === "es" ? "Contacto" : "Contact"}
              </a>
            </div>
          </div>
        </section>
      </main>

      
    </>
  );
}
