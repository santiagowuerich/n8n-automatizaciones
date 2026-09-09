-- Extraccion de mails de negocios en Argentina desde Overture Maps.
-- Gemela de fetch_argentina_overture.sql, que saca telefonos.
--
-- Fuente: dataset abierto de Overture (Meta / Microsoft / PinMeTo), licencia
-- CDLA Permissive 2.0. Sin API key, sin creditos, sin limite de requests.
INSTALL spatial;
INSTALL httpfs;
LOAD spatial;
LOAD httpfs;
SET s3_region='us-west-2';

CREATE OR REPLACE TEMP TABLE crudo AS
SELECT
  id,
  names.primary                        AS nombre,
  categories.primary                   AS rubro_overture,
  lower(trim(emails[1]))               AS mail,
  CASE WHEN len(websites) > 0 THEN websites[1] ELSE '' END AS sitio_web,
  CASE WHEN len(phones)   > 0 THEN phones[1]   ELSE '' END AS telefono_raw,
  addresses[1].freeform                AS direccion,
  addresses[1].locality                AS ciudad,
  addresses[1].region                  AS region,
  confidence
FROM read_parquet('s3://overturemaps-us-west-2/release/2026-08-19.0/theme=places/type=place/*', filename=true, hive_partitioning=1)
-- El bbox acelera la lectura del parquet, pero NO respeta fronteras: se pasa a
-- Chile, Bolivia, Paraguay, Brasil y Uruguay. El filtro real de pais es
-- addresses[1].country.
WHERE bbox.xmin BETWEEN -73.6 AND -53.6 AND bbox.ymin BETWEEN -55.1 AND -21.8
  AND addresses[1].country = 'AR'
  AND (operating_status IS NULL OR operating_status = 'open')
  AND confidence >= 0.7
  AND len(emails) > 0
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
  );

-- Un mail que aparece en muchas fichas distintas es el corporativo de una
-- cadena (shellcustomercare@shell.com sale 167 veces), no un negocio chico al
-- que se le pueda vender una web. Se corta en 3.
CREATE OR REPLACE TEMP TABLE repetidos AS
SELECT mail FROM crudo GROUP BY mail HAVING count(*) > 3;

COPY (
  SELECT DISTINCT ON (mail)
    id, nombre, rubro_overture, mail, sitio_web, telefono_raw,
    direccion, ciudad, region, confidence,
    CASE WHEN sitio_web = '' THEN 'no' ELSE 'si' END AS tiene_web
  FROM crudo
  WHERE mail NOT IN (SELECT mail FROM repetidos)
    AND mail LIKE '%@%.%'
  ORDER BY mail, confidence DESC
) TO 'argentina_overture_mails.csv' (HEADER, DELIMITER ',');

SELECT
  count(*)                                  AS total_exportado,
  count(*) FILTER (WHERE tiene_web = 'no')  AS sin_sitio_web,
  count(*) FILTER (WHERE telefono_raw != '') AS tambien_con_telefono
FROM read_csv('argentina_overture_mails.csv');
