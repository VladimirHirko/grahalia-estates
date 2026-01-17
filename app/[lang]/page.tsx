import Header from "@/components/Header/Header";
import Hero from "@/components/Hero/Hero";
import Featured from "@/components/Featured/Featured";
import Services from "@/components/Services/Services";
import About from "@/components/About/About";
import Contact from "@/components/Contact/Contact";

import { getDictionary, isLocale, type Locale } from "@/i18n/dictionaries";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? (raw as Locale) : "en";
  const t = await getDictionary(lang);

  return (
    <>
      <Header lang={lang} t={t.header} />
      <main>
        <Hero t={t.hero} />
        <Featured t={t.featured} />
        <Services t={t.services} />
        <About t={t.about} />
        <Contact t={t.contact} />
      </main>
    </>
  );
}
