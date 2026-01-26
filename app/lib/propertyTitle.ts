export function stripPublicIdFromSlug(slug: string) {
  // убираем хвост типа "-ge-000012" (регистронезависимо)
  return (slug || "").replace(/-ge-\d{6}$/i, "");
}

export function titleFromSlugClean(slug: string) {
  const clean = stripPublicIdFromSlug(slug);

  if (!clean) return "Property";

  return clean
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
