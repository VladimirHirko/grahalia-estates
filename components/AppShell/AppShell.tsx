"use client";

import { useCallback, useState } from "react";
import Footer from "@/components/Footer/Footer";
import CookieConsentUI from "@/components/CookieConsent/CookieConsent";

export default function AppShell({
  lang,
  footerT,
  cookieT,
  children,
}: {
  lang: "en" | "es";
  footerT?: any;
  cookieT?: any;
  children: React.ReactNode;
}) {
  // ✅ важно: undefined по умолчанию, чтобы модалка НЕ открывалась сразу
  const [openKey, setOpenKey] = useState<number | undefined>(undefined);

  const onManageCookies = useCallback(() => {
    // ✅ новый ключ на каждый клик
    setOpenKey(Date.now());
  }, []);

  return (
    <>
      {children}

      {/* ✅ футер можно скрыть, если нет словаря (например, в админке) */}
      <Footer lang={lang} t={footerT} onManageCookies={onManageCookies} />

      {/* ✅ баннер/модалка тоже тихо не покажутся, если cookieT нет */}
      <CookieConsentUI t={cookieT} openKey={openKey} />
    </>
  );
}
