import Header from "@/components/Header/Header";
import PropertyCard from "@/components/PropertyCard/PropertyCard";
import { getDictionary, isLocale, type Locale } from "@/i18n/dictionaries";
import styles from "./properties.module.css";

import Filters from "./Filters";
import {
  getAllFeaturesForFilters,
  getCatalogItems,
} from "@/app/lib/publicProperties";

export const dynamic = "force-dynamic";

function parseFeaturesParam(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

type Deal = "all" | "sale" | "rent";
function parseDealParam(v: string | undefined): Deal {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "sale" || s === "rent") return s;
  return "all";
}

export default async function PropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? (raw as Locale) : "en";
  const t = await getDictionary(lang);

  const uiLang = lang === "es" ? "es" : "en";

  const sp = await searchParams;
  const page = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;

  const type =
    String(Array.isArray(sp.type) ? sp.type[0] : sp.type || "").trim() || null;

  const features = parseFeaturesParam(
    String(Array.isArray(sp.features) ? sp.features[0] : sp.features || "")
  );

  // ✅ deal filter
  const deal = parseDealParam(
    String(Array.isArray(sp.deal) ? sp.deal[0] : sp.deal || "")
  );

  const [featuresForFilters, result] = await Promise.all([
    getAllFeaturesForFilters(uiLang),
    getCatalogItems({
      lang: uiLang,
      page,
      pageSize: 12,
      filters: {
        type,
        featureKeys: features,
        deal, // ✅ пробрасываем deal (sale/rent/all)
      },
    }),
  ]);

  // ✅ Расширяем перевод карточек: добавляем Sale/Rent бейдж
  const cardT = {
    ...t.featured.card,
    forSale: lang === "es" ? "En venta" : "For Sale",
    forRent: lang === "es" ? "En alquiler" : "For Rent",
  };

  return (
    <>
      <Header lang={lang} t={t.header} />
      <main>
        <section className="section">
          <div className="container">
            <div className="section__head">
              <h1 className="sectionTitle">
                <span className="sectionTitleText">
                  {lang === "es" ? "Catálogo" : "Properties Catalog"}
                </span>
              </h1>
              <p className="section__kicker">
                {lang === "es"
                  ? "Todas las propiedades publicadas"
                  : "All published properties"}
              </p>
            </div>

            {/* Deal toggle (All / Sale / Rent) */}
            <div className={styles.dealRow}>
              <div className={styles.dealSeg}>
                <a
                  className={`btn ${
                    deal === "all" ? "btnPrimary" : "btnGhost"
                  } ${styles.dealBtn}`}
                  href={buildSetParamHref(sp, { deal: "all" })}
                >
                  {lang === "es" ? "Todas" : "All"}
                </a>

                <a
                  className={`btn ${
                    deal === "sale" ? "btnPrimary" : "btnGhost"
                  } ${styles.dealBtn}`}
                  href={buildSetParamHref(sp, { deal: "sale" })}
                >
                  {lang === "es" ? "Venta" : "For Sale"}
                </a>

                <a
                  className={`btn ${
                    deal === "rent" ? "btnPrimary" : "btnGhost"
                  } ${styles.dealBtn}`}
                  href={buildSetParamHref(sp, { deal: "rent" })}
                >
                  {lang === "es" ? "Alquiler" : "For Rent"}
                </a>
              </div>
            </div>

            {/* ✅ Фильтры */}
            <Filters lang={uiLang} features={featuresForFilters} />

            {result.items.length === 0 ? (
              <div className={styles.empty}>
                {lang === "es"
                  ? "No hay propiedades con estos filtros."
                  : "No properties match these filters."}
              </div>
            ) : (
              <>
                <div className={styles.grid}>
                  {result.items.map((p) => (
                    <PropertyCard
                      key={String(p.id)}
                      property={{
                        title: p.title,
                        location: p.location,
                        price: p.priceText,
                        beds: p.beds,
                        baths: p.baths,
                        area: p.area,
                        image: p.image,

                        features: p.features,
                        href: `/${lang}/properties/${p.slug}`,

                        // ✅ ВОТ ЧЕГО НЕ ХВАТАЛО:
                        dealType: p.dealType ?? null,
                        isNewBuild: Boolean(p.isNewBuild),
                        status: p.status ?? null,
                      }}
                      t={t.featured.card}
                    />

                  ))}
                </div>

                {/* ✅ Пагинация */}
                <div className={styles.pager}>
                  <div className={styles.pagerInfo}>
                    {lang === "es"
                      ? `Página ${result.page} de ${result.totalPages}`
                      : `Page ${result.page} of ${result.totalPages}`}
                  </div>

                  <div className={styles.pagerBtns}>
                    {result.page > 1 && (
                      <a
                        className={`btn btnGhost ${styles.pagerBtn}`}
                        href={buildPageHref(sp, result.page - 1)}
                      >
                        ← {lang === "es" ? "Anterior" : "Prev"}
                      </a>
                    )}

                    {result.page < result.totalPages && (
                      <a
                        className={`btn btnPrimary ${styles.pagerBtn}`}
                        href={buildPageHref(sp, result.page + 1)}
                      >
                        {lang === "es" ? "Siguiente" : "Next"} →
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function buildPageHref(
  sp: Record<string, string | string[] | undefined>,
  nextPage: number
) {
  const u = new URLSearchParams();

  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    if (k === "page") continue;

    const value = Array.isArray(v) ? v[0] : v;
    if (value !== undefined && String(value).trim() !== "") {
      u.set(k, String(value));
    }
  }

  u.set("page", String(nextPage));
  const qs = u.toString();
  return qs ? `?${qs}` : "?page=1";
}

/**
 * Меняем конкретные query параметры (например deal),
 * и всегда сбрасываем page → 1, чтобы не уехать на несуществующую страницу.
 */
function buildSetParamHref(
  sp: Record<string, string | string[] | undefined>,
  patch: Partial<Record<string, string>>
) {
  const u = new URLSearchParams();

  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    if (k === "page") continue; // сбросим
    const value = Array.isArray(v) ? v[0] : v;
    if (value !== undefined && String(value).trim() !== "") {
      u.set(k, String(value));
    }
  }

  for (const [k, v] of Object.entries(patch)) {
    if (!v || v === "all") u.delete(k);
    else u.set(k, v);
  }

  // после смены фильтра начинаем с 1 страницы
  u.set("page", "1");

  const qs = u.toString();
  return qs ? `?${qs}` : "?page=1";
}
