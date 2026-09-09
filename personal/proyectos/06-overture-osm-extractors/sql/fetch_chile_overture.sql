LOAD spatial;
LOAD httpfs;
SET s3_region='us-west-2';

-- Rubros comerciales relevantes para vender sistemas web + automatizacion.
-- Se excluye a proposito: escuelas, iglesias, hospitales publicos, gobierno,
-- ONGs, landmarks -- no son clientes de este negocio.
COPY (
  SELECT
    id,
    names.primary AS nombre,
    categories.primary AS rubro_overture,
    phones[1] AS telefono_raw,
    addresses[1].freeform AS direccion,
    addresses[1].locality AS ciudad,
    addresses[1].region AS region,
    confidence
  FROM read_parquet('s3://overturemaps-us-west-2/release/2026-08-19.0/theme=places/type=place/*', filename=true, hive_partitioning=1)
  -- El bbox acelera la lectura del parquet, pero NO respeta fronteras: se pasa
  -- a Peru, Bolivia y Argentina. El filtro real de pais es addresses[1].country.
  WHERE bbox.xmin BETWEEN -76 AND -66 AND bbox.ymin BETWEEN -56 AND -17.4
    AND addresses[1].country = 'CL'
    AND (operating_status IS NULL OR operating_status = 'open')
    AND confidence >= 0.7
    AND len(phones) > 0
    AND (len(websites) = 0 OR websites IS NULL)
    AND names.primary IS NOT NULL
    AND categories.primary IN (
      'restaurant','fast_food_restaurant','sushi_restaurant','peruvian_restaurant',
      'seafood_restaurant','chinese_restaurant','pizza_restaurant','italian_restaurant',
      'mexican_restaurant','cafe','bakery','ice_cream_shop','bar','pub',
      'beauty_salon','hair_salon','barber','nail_salon','spas','spa','gym',
      'dentist','veterinarian','pet_store',
      'clothing_store','shoe_store','jewelry_store','florist','flowers_and_gifts_shop',
      'furniture_store','hardware_store',
      'automotive_repair','car_dealer',
      'grocery_store','convenience_store',
      'professional_services','nursery_and_gardening','hostel'
    )
) TO 'chile_overture_leads.csv' (HEADER, DELIMITER ',');

SELECT count(*) AS total_exportado FROM read_csv('chile_overture_leads.csv');
