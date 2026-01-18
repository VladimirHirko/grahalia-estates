-- Seed features (amenities) for Grahalia Estates
-- Safe to re-run: uses ON CONFLICT DO NOTHING

-- 1) features
INSERT INTO features (key)
VALUES
  ('parking'),
  ('garage'),
  ('pool'),
  ('gym'),
  ('lift'),
  ('terrace'),
  ('garden'),
  ('sea_view'),
  ('storage'),
  ('aircon'),
  ('heating'),
  ('gated')
ON CONFLICT (key) DO NOTHING;

-- 2) translations (EN)
INSERT INTO feature_translations (feature_id, lang, label)
SELECT
  f.id,
  'en',
  CASE f.key
    WHEN 'parking' THEN 'Parking'
    WHEN 'garage' THEN 'Garage'
    WHEN 'pool' THEN 'Pool'
    WHEN 'gym' THEN 'Gym'
    WHEN 'lift' THEN 'Lift'
    WHEN 'terrace' THEN 'Terrace'
    WHEN 'garden' THEN 'Garden'
    WHEN 'sea_view' THEN 'Sea view'
    WHEN 'storage' THEN 'Storage room'
    WHEN 'aircon' THEN 'Air conditioning'
    WHEN 'heating' THEN 'Heating'
    WHEN 'gated' THEN 'Gated community'
    ELSE f.key
  END AS label
FROM features f
WHERE f.key IN (
  'parking','garage','pool','gym','lift','terrace','garden','sea_view','storage','aircon','heating','gated'
)
ON CONFLICT DO NOTHING;

-- 3) translations (ES)
INSERT INTO feature_translations (feature_id, lang, label)
SELECT
  f.id,
  'es',
  CASE f.key
    WHEN 'parking' THEN 'Aparcamiento'
    WHEN 'garage' THEN 'Garaje'
    WHEN 'pool' THEN 'Piscina'
    WHEN 'gym' THEN 'Gimnasio'
    WHEN 'lift' THEN 'Ascensor'
    WHEN 'terrace' THEN 'Terraza'
    WHEN 'garden' THEN 'Jardín'
    WHEN 'sea_view' THEN 'Vistas al mar'
    WHEN 'storage' THEN 'Trastero'
    WHEN 'aircon' THEN 'Aire acondicionado'
    WHEN 'heating' THEN 'Calefacción'
    WHEN 'gated' THEN 'Urbanización cerrada'
    ELSE f.key
  END AS label
FROM features f
WHERE f.key IN (
  'parking','garage','pool','gym','lift','terrace','garden','sea_view','storage','aircon','heating','gated'
)
ON CONFLICT DO NOTHING;
