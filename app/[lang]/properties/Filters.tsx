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

  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return features;
    return features.filter((f) => {
      const key = String(f.key || "").toLowerCase();
      const label = String(f.label || "").toLowerCase();
      return key.includes(q) || label.includes(q);
    });
  }, [features, search]);

  const visibleFeatures = useMemo(() => {
    if (showAll) return filteredFeatures;
    return filteredFeatures.slice(0, 8);
  }, [filteredFeatures, showAll]);

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
    next.delete("deal");      // ✅ NEW
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
          className={`btn btnGhost ${styles.filtersToggleBtn}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className={styles.filtersToggleText}>
            {lang === "es" ? "Filtros" : "Filters"}
          </span>

          {hasActiveFilters && (
            <span className={styles.filtersCount}>
              {selectedFeatures.size + (selectedType ? 1 : 0)}
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
          title={
            hasActiveFilters ? "" : (lang === "es" ? "Nada que limpiar" : "Nothing to clear")
          }
        >
          {lang === "es" ? "Limpiar" : "Clear"}
        </button>
      </div>

      {open && (
        <div className={styles.filtersPanel}>
          <div className={styles.filtersGrid}>
            <label className={styles.field}>
              <span className={styles.label}>{lang === "es" ? "Tipo" : "Type"}</span>
              <select
                className={styles.select}
                value={selectedType}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">{lang === "es" ? "Todos" : "All"}</option>
                <option value="apartment">{lang === "es" ? "Apartamento" : "Apartment"}</option>
                <option value="villa">Villa</option>
                <option value="townhouse">{lang === "es" ? "Adosado" : "Townhouse"}</option>
                <option value="land">{lang === "es" ? "Terreno" : "Land"}</option>
              </select>
            </label>

            <div className={styles.field}>
              <div className={styles.amenitiesHead}>
                <span className={styles.label}>{lang === "es" ? "Comodidades" : "Amenities"}</span>

                {/* мини-поиск по amenities */}
                <input
                  className={styles.search}
                  placeholder={lang === "es" ? "Buscar…" : "Search…"}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className={styles.featuresCompact}>
                {visibleFeatures.map((f) => {
                  const key = String(f.key || "").trim().toLowerCase();
                  const checked = selectedFeatures.has(key);

                  return (
                    <button
                      key={f.key}
                      type="button"
                      className={`btn ${checked ? "btnPrimary" : "btnGhost"} ${styles.pill}`}
                      onClick={() => toggleFeature(key)}
                      aria-pressed={checked}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {filteredFeatures.length > 8 && (
                <button
                  type="button"
                  className={`btn btnGhost ${styles.moreBtn}`}
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll
                    ? (lang === "es" ? "Mostrar menos" : "Show less")
                    : (lang === "es" ? `Mostrar todo (${filteredFeatures.length})` : `Show all (${filteredFeatures.length})`)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
