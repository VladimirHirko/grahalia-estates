import { NextRequest, NextResponse } from "next/server";

const SUPPORTED = ["en", "es"] as const;
type Lang = (typeof SUPPORTED)[number];

const DEFAULT_LANG: Lang = "en";
const COOKIE_NAME = "lang";

function parseAcceptLanguage(header: string | null): Lang {
  if (!header) return DEFAULT_LANG;

  const first = header.split(",")[0]?.trim().toLowerCase();
  if (!first) return DEFAULT_LANG;

  const base = first.split("-")[0] as Lang;
  return (SUPPORTED as readonly string[]).includes(base) ? (base as Lang) : DEFAULT_LANG;
}

function isPublicFile(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") || // ✅ важно: загруженные файлы всегда без i18n
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|pdf|txt|xml)$/) // ✅ добавил pdf на всякий
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicFile(pathname)) return NextResponse.next();

  // ✅ Админка НЕ участвует в i18n редиректах
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname.startsWith("/admin/login")) return NextResponse.next();

    const adminCookie = req.cookies.get("admin")?.value;
    if (adminCookie !== "1") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // Уже с локалью?
  const hasLocale = SUPPORTED.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) {
    const current = pathname.split("/")[1] as Lang;
    const res = NextResponse.next();

    if ((SUPPORTED as readonly string[]).includes(current)) {
      res.cookies.set(COOKIE_NAME, current, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return res;
  }

  // Любой путь без локали — редиректим на /{lang}/...
  const cookieLang = req.cookies.get(COOKIE_NAME)?.value as Lang | undefined;
  const detected =
    cookieLang && (SUPPORTED as readonly string[]).includes(cookieLang)
      ? cookieLang
      : parseAcceptLanguage(req.headers.get("accept-language"));

  const url = req.nextUrl.clone();
  url.pathname = `/${detected}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api).*)"],
};
