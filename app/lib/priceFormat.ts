export function priceOnRequest(lang: "en" | "es") {
  return lang === "es" ? "Precio bajo consulta" : "Price on Request";
}

export function formatMoney(opts: {
  lang: "en" | "es";
  value: number | null;
  currency: string | null;
}) {
  const { lang, value, currency } = opts;

  if (value === null || value === undefined) return priceOnRequest(lang);

  const cur = (currency || "EUR").toUpperCase();

  try {
    return new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    const n = new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB", {
      maximumFractionDigits: 0,
    }).format(value);
    return cur === "EUR" ? `€${n}` : `${n} ${cur}`;
  }
}

export function formatRentMoney(opts: {
  lang: "en" | "es";
  value: number | null;
  currency: string | null;
  period: string | null; // month|week|day|null
}) {
  const { lang, value, currency, period } = opts;

  if (value === null || value === undefined) return priceOnRequest(lang);

  const base = formatMoney({ lang, value, currency });

  const suffix =
    period === "month"
      ? lang === "es" ? " / mes" : " / month"
      : period === "week"
        ? lang === "es" ? " / semana" : " / week"
        : period === "day"
          ? lang === "es" ? " / día" : " / day"
          : "";

  return `${base}${suffix}`;
}

export function formatDisplayPrice(opts: {
  lang: "en" | "es";
  dealType: string | null; // sale|rent|null
  salePrice: number | null;
  rentPrice: number | null;
  currency: string | null;
  rentPeriod: string | null;
}) {
  const { lang, dealType, salePrice, rentPrice, currency, rentPeriod } = opts;

  if (dealType === "rent") {
    return formatRentMoney({ lang, value: rentPrice, currency, period: rentPeriod });
  }
  return formatMoney({ lang, value: salePrice, currency });
}
