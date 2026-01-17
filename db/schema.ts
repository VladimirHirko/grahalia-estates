import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  numeric,
  timestamp,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// 1) Ограничиваем языки: только те, что есть в проекте
export const localeEnumValues = ["en", "es"] as const;
export type Locale = (typeof localeEnumValues)[number];

// --------------------
// PROPERTIES (основа)
// --------------------
export const properties = pgTable(
  "properties",
  {
    id: serial("id").primaryKey(),

    // slug для URL: /[lang]/properties/[slug]
    slug: varchar("slug", { length: 255 }).notNull(),

    // статус публикации
    isPublished: boolean("is_published").notNull().default(false),

    // цена
    price: numeric("price", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),

    // базовые характеристики
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),

    // Площади (в м2). Все nullable — если не заполнено, не показываем на сайте.
    // Общая площадь участка (для домов/вилл)
    plotAreaM2: integer("plot_area_m2"),

    // Площадь застройки (built area)
    builtAreaM2: integer("built_area_m2"),

    // Площадь террас
    terraceAreaM2: integer("terrace_area_m2"),

    // Локация (на старте одной строкой)
    location: varchar("location", { length: 120 }),

    // Планы объекта (PDF или похожее) — храним путь/URL
    plansUrl: text("plans_url"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugUnique: uniqueIndex("properties_slug_unique").on(t.slug),
  })
);

// -------------------------------
// PROPERTY TRANSLATIONS (i18n)
// -------------------------------
export const propertyTranslations = pgTable(
  "property_translations",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),

    lang: varchar("lang", { length: 2 }).notNull(), // "en" | "es"

    title: varchar("title", { length: 200 }).notNull(),
    summary: varchar("summary", { length: 300 }), // короткий текст для карточки
    description: text("description"), // подробное описание

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // одно описание на язык для одного объекта
    uniqPerLang: uniqueIndex("property_translations_property_lang_unique").on(t.propertyId, t.lang),
  })
);

// --------------------
// FEATURES (удобства)
// --------------------
export const features = pgTable(
  "features",
  {
    id: serial("id").primaryKey(),

    // системный ключ (удобно для сортировки/внутреннего использования)
    key: varchar("key", { length: 80 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    keyUnique: uniqueIndex("features_key_unique").on(t.key),
  })
);

export const featureTranslations = pgTable(
  "feature_translations",
  {
    id: serial("id").primaryKey(),
    featureId: integer("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),

    lang: varchar("lang", { length: 2 }).notNull(), // "en" | "es"
    label: varchar("label", { length: 120 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqPerLang: uniqueIndex("feature_translations_feature_lang_unique").on(t.featureId, t.lang),
  })
);

// связь many-to-many: property <-> feature
export const propertyFeatures = pgTable(
  "property_features",
  {
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),

    featureId: integer("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.propertyId, t.featureId] }),
  })
);

// --------------------
// IMAGES (галерея)
// --------------------
export const propertyImages = pgTable(
  "property_images",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),

    // путь или URL (мы будем хранить относительный путь типа /uploads/...)
    url: text("url").notNull(),

    // alt на будущее (можно тоже сделать переводимым, но пока достаточно)
    alt: varchar("alt", { length: 200 }),

    // порядок в галерее
    sortOrder: integer("sort_order").notNull().default(0),

    // обложка для карточки
    isCover: boolean("is_cover").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byProperty: uniqueIndex("property_images_property_sort_unique").on(t.propertyId, t.sortOrder),
  })
);
