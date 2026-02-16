-- Script para agregar las 3 columnas nuevas a la tabla cotizador
-- Ejecutar este script en el SQL Editor de Supabase

-- Agregar columna costo_energ (valor por defecto 0.90)
ALTER TABLE cotizador
ADD COLUMN IF NOT EXISTS costo_energ NUMERIC DEFAULT 0.90;

-- Agregar columna consumo_wh_impr (valor por defecto 400)
ALTER TABLE cotizador
ADD COLUMN IF NOT EXISTS consumo_wh_impr NUMERIC DEFAULT 400;

-- Agregar columna costo_min_maq (valor por defecto 0.002)
ALTER TABLE cotizador
ADD COLUMN IF NOT EXISTS costo_min_maq NUMERIC DEFAULT 0.002;

-- Verificar que las columnas se agregaron correctamente
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'cotizador'
  AND column_name IN ('costo_energ', 'consumo_wh_impr', 'costo_min_maq')
ORDER BY column_name;
