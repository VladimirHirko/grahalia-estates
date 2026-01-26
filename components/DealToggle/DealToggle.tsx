"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Deal = "all" | "sale" | "rent";

function withParam(params: URLSearchParams, key: string, value?: string) {
  const p = new URLSearchParams(params.toString());
  if (!value || value === "all") p.delete(key);
  else p.set(key, value);
  p.delete("page"); // при смене типа сделки сбрасываем пагинацию
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export default function DealToggle() {
  const pathname = usePathname();
  const sp = useSearchParams();

  const deal = (sp.get("deal") as Deal) || "all";

  const items: Array<{ key: Deal; label: string }> = [
    { key: "all", label: "All" },
    { key: "sale", label: "For Sale" },
    { key: "rent", label: "For Rent" },
  ];

  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      {items.map((it) => {
        const active = deal === it.key;
        return (
          <Link
            key={it.key}
            href={`${pathname}${withParam(new URLSearchParams(sp.toString()), "deal", it.key)}`}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #E2E2DE",
              textDecoration: "none",
              color: "inherit",
              fontWeight: 600,
              background: active ? "#0E5E56" : "#fff",
              color: active ? "#fff" : "inherit",
            }}
          >
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
