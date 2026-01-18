"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./properties.module.css";

type FeatureOption = { key: string; label: string };

function parseFeaturesParam(value: string) {
  return new Set(
    (value || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
  );
}

export default function Filters({
  lang,
  features,
}: {
  lang: "en" | "es";
  features: FeatureOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // ✅ по умолчанию свернуто
  const [open, setOpen] = useState(false);

  const selectedType = (sp.get("type") || "").trim();

  const selectedFeatures = useMemo(() => {
    return parseFeaturesParam(sp.get("features") || "");
  }, [sp]);

  const hasActiveFilters =
    Boolean(selectedType) || selectedFeatures.size > 0;

  function push(next: URLSearchParams) {
    next.set("page", "1");

    // чистим пустые значения
    for (const [k, v] of next.entries()) {
      if (!String(v).trim()) next.delete(k);
    }

    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function setType(value: string) {
    const v = (value || "").trim().toLowerCase();
    const next = new URLSearchParams(sp.toString());

    if (!v) next.delete("type");
    else next.set("type", v);

    push(next);
  }

  function toggleFeature(key: string) {
    const k = String(key || "").trim().toLowerCase();
    if (!k) return;

    const next = new URLSearchParams(sp.toString());
    const cur = parseFeaturesParam(next.get("features") || "");

    if (cur.has(k)) cur.delete(k);
    else cur.add(k);

    const arr = Array.from(cur).sort();
    if (arr.length === 0) next.delete("features");
    else next.set("features", arr.join(","));

    push(next);
  }

  function clearAll() {
    const next = new URLSearchParams(sp.toString());
    next.delete("type");
    next.delete("features");
    next.set("page", "1");

    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className={styles.filters}>
      <div className={styles.filtersTop}>
        <button
          type="button"
          className={styles.filtersToggle}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className={styles.filtersTitle}>
            {lang === "es" ? "Filtros" : "Filters"}
          </span>

          {/* маленький индикатор, что фильтры активны */}
          {hasActiveFilters && (
            <span className={styles.filtersBadge}>
              {lang === "es" ? "Activos" : "Active"}
            </span>
          )}

          <span className={styles.filtersChevron} aria-hidden>
            {open ? "▲" : "▼"}
          </span>
        </button>

        <button
          className={`btn btnGhost ${styles.clearBtn}`}
          type="button"
          onClick={clearAll}
          disabled={!hasActiveFilters}
          title={hasActiveFilters ? "" : (lang === "es" ? "Nada que limpiar" : "Nothing to clear")}
        >
          {lang === "es" ? "Limpiar" : "Clear"}
        </button>
      </div>

      {open && (
        <div className={styles.filtersGrid}>
          <label className={styles.field}>
            <span className={styles.label}>
              {lang === "es" ? "Tipo" : "Type"}
            </span>

            {/* тип пока UI; когда добавишь property_type в БД — включим в запрос */}
            <select
              className={styles.select}
              value={selectedType}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">{lang === "es" ? "Todos" : "All"}</option>
              <option value="apartment">
                {lang === "es" ? "Apartamento" : "Apartment"}
              </option>
              <option value="villa">Villa</option>
              <option value="townhouse">
                {lang === "es" ? "Adosado" : "Townhouse"}
              </option>
              <option value="land">{lang === "es" ? "Terreno" : "Land"}</option>
            </select>
          </label>

          <div className={styles.field}>
            <span className={styles.label}>
              {lang === "es" ? "Comodidades" : "Amenities"}
            </span>

            <div className={styles.features}>
              {features.map((f) => {
                const key = String(f.key || "").trim().toLowerCase();
                const checked = selectedFeatures.has(key);

                return (
                  <label key={f.key} className={styles.featureItem}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFeature(key)}
                    />
                    <span>{f.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
