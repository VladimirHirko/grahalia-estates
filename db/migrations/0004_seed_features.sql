-- Seed features (amenities) for Grahalia Estates
-- Safe to re-run: uses ON CONFLICT DO NOTHING

BEGIN;

-- 1) features (keys)
INSERT INTO features(key)
VALUES
  ('air_conditioning'),
  ('pool'),
  ('garden'),
  ('terrace'),
  ('parking'),
  ('garage'),
  ('sea_view'),
  ('mountain_view'),
  ('lift'),
  ('storage_room'),
  ('gym'),
  ('security'),
  ('gated_community'),
  ('furnished'),
  ('pets_allowed'),
  ('heating'),
  ('fireplace'),
  ('barbecue'),
  ('sauna'),
  ('jacuzzi'),
  ('near_beach'),
  ('near_golf'),
  ('near_schools'),
  ('smart_home')
ON CONFLICT (key) DO NOTHING;

-- 2) translations (EN)
INSERT INTO feature_translations(feature_id, lang, label)
SELECT f.id, 'en',
  CASE f.key
    WHEN 'air_conditioning' THEN 'Air conditioning'
    WHEN 'pool' THEN 'Pool'
    WHEN 'garden' THEN 'Garden'
    WHEN 'terrace' THEN 'Terrace'
    WHEN 'parking' THEN 'Parking'
    WHEN 'garage' THEN 'Garage'
    WHEN 'sea_view' THEN 'Sea view'
    WHEN 'mountain_view' THEN 'Mountain view'
    WHEN 'lift' THEN 'Lift'
    WHEN 'storage_room' THEN 'Storage room'
    WHEN 'gym' THEN 'Gym'
    WHEN 'security' THEN 'Security'
    WHEN 'gated_community' THEN 'Gated community'
    WHEN 'furnished' THEN 'Furnished'
    WHEN 'pets_allowed' THEN 'Pets allowed'
    WHEN 'heating' THEN 'Heating'
    WHEN 'fireplace' THEN 'Fireplace'
    WHEN 'barbecue' THEN 'Barbecue'
    WHEN 'sauna' THEN 'Sauna'
    WHEN 'jacuzzi' THEN 'Jacuzzi'
    WHEN 'near_beach' THEN 'Near beach'
    WHEN 'near_golf' THEN 'Near golf'
    WHEN 'near_schools' THEN 'Near schools'
    WHEN 'smart_home' THEN 'Smart home'
    ELSE f.key
  END
FROM features f
ON CONFLICT (feature_id, lang) DO NOTHING;

-- 3) translations (ES)
INSERT INTO feature_translations(feature_id, lang, label)
SELECT f.id, 'es',
  CASE f.key
    WHEN 'air_conditioning' THEN 'Aire acondicionado'
    WHEN 'pool' THEN 'Piscina'
    WHEN 'garden' THEN 'Jardín'
    WHEN 'terrace' THEN 'Terraza'
    WHEN 'parking' THEN 'Aparcamiento'
    WHEN 'garage' THEN 'Garaje'
    WHEN 'sea_view' THEN 'Vistas al mar'
    WHEN 'mountain_view' THEN 'Vistas a la montaña'
    WHEN 'lift' THEN 'Ascensor'
    WHEN 'storage_room' THEN 'Trastero'
    WHEN 'gym' THEN 'Gimnasio'
    WHEN 'security' THEN 'Seguridad'
    WHEN 'gated_community' THEN 'Urbanización cerrada'
    WHEN 'furnished' THEN 'Amueblado'
    WHEN 'pets_allowed' THEN 'Se admiten mascotas'
    WHEN 'heating' THEN 'Calefacción'
    WHEN 'fireplace' THEN 'Chimenea'
    WHEN 'barbecue' THEN 'Barbacoa'
    WHEN 'sauna' THEN 'Sauna'
    WHEN 'jacuzzi' THEN 'Jacuzzi'
    WHEN 'near_beach' THEN 'Cerca de la playa'
    WHEN 'near_golf' THEN 'Cerca de campos de golf'
    WHEN 'near_schools' THEN 'Cerca de colegios'
    WHEN 'smart_home' THEN 'Casa inteligente'
    ELSE f.key
  END
FROM features f
ON CONFLICT (feature_id, lang) DO NOTHING;

COMMIT;
