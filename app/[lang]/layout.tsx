import "../globals.css";
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

/**
 * SEO / metadata
 * полностью мультиязычно
 * тексты берём ТОЛЬКО из словарей
 */
export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> }
): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? (raw as Locale) : "en";
  const t = await getDictionary(lang);

  return {
    title: t.seo.home.title,
    description: t.seo.home.description,

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

  return (
    <html lang={lang} className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
