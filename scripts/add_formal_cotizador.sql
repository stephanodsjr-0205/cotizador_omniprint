-- Script para agregar columnas FORMAL, PRECIO_DIRECTO y DESCRIPCION a la tabla cotizador
-- Ejecutar en el SQL Editor de Supabase

-- Cotización formal: si es true, el PDF muestra descripción + precio_directo en lugar del desglose
ALTER TABLE cotizador
ADD COLUMN IF NOT EXISTS formal BOOLEAN DEFAULT false;

-- Precio directo (para cotización formal): number(10,2)
ALTER TABLE cotizador
ADD COLUMN IF NOT EXISTS precio_directo NUMERIC(10,2) NULL;

-- Descripción (texto largo, para cotización formal)
ALTER TABLE cotizador
ADD COLUMN IF NOT EXISTS descripcion TEXT NULL;

-- Verificación
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'cotizador'
  AND column_name IN ('formal', 'precio_directo', 'descripcion')
ORDER BY column_name;
