export type CookieConsent = {
  necessary: true;      // всегда true
  analytics: boolean;
  marketing: boolean;
  updatedAt: number;
};

const STORAGE_KEY = "grahalia_cookie_consent";
const COOKIE_NAME = "grahalia_cookie_consent";

export function getDefaultConsent(): CookieConsent {
  return { necessary: true, analytics: false, marketing: false, updatedAt: Date.now() };
}

export function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // простая валидация
    if (typeof parsed !== "object" || parsed === null) return null;
    if (typeof parsed.analytics !== "boolean") return null;
    if (typeof parsed.marketing !== "boolean") return null;

    return {
      necessary: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeConsent(consent: CookieConsent) {
  if (typeof window === "undefined") return;

  const safe: CookieConsent = {
    necessary: true,
    analytics: !!consent.analytics,
    marketing: !!consent.marketing,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));

  // cookie на год
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(safe))}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function hasMadeChoice(): boolean {
  return !!readConsent();
}
