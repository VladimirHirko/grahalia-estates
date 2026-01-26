import "../globals.css";
import AppShell from "@/components/AppShell/AppShell";

import { Inter, Playfair_Display } from "next/font/google";
import { locales, isLocale, type Locale, getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? (raw as Locale) : "en";
  const t = await getDictionary(lang);

  // ✅ базовый URL (в проде возьмём из env, локально fallback)
  const base =
    process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
      : new URL("http://localhost:3000");

  return {
    metadataBase: base,

    title: t.seo.home.title,
    description: t.seo.home.description,

    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },

    manifest: `${base.origin}/site.webmanifest`,

    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: "/en",
        es: "/es",
      },
    },

    openGraph: {
      title: t.seo.home.ogTitle ?? t.seo.home.title,
      description: t.seo.home.ogDescription ?? t.seo.home.description,
      locale: lang === "es" ? "es_ES" : "en_US",
      type: "website",
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps) {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? (raw as Locale) : "en";
  const t = await getDictionary(lang);

  const uiLang: "en" | "es" = lang === "es" ? "es" : "en";

  // ✅ футер на верхнем уровне словаря
  const footerT = (t as any)?.footer;

  // ✅ cookies строго отсюда: cookies.consent
  const cookieT = (t as any)?.cookies?.consent;

  return (
    <html lang={lang} className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <AppShell
          lang={uiLang}
          footerT={(t as any)?.footer}
          cookieT={(t as any)?.cookies?.consent}   // ✅ ВОТ ЭТО КЛЮЧЕВО
        >
          {children}
        </AppShell>

      </body>
    </html>
  );
}
