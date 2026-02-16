-- Script para configurar las políticas RLS (Row Level Security) para la tabla cotizador
-- Esto permite que los usuarios anónimos puedan insertar cotizaciones
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar RLS en la tabla cotizador (si no está habilitado)
ALTER TABLE cotizador ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir inserción pública (INSERT) de cotizaciones
CREATE POLICY "Permitir inserción pública de cotizaciones"
ON cotizador
FOR INSERT
TO public
WITH CHECK (true);

-- Crear política para permitir lectura pública (SELECT) de cotizaciones
-- Esto es necesario para que se puedan listar las cotizaciones
CREATE POLICY "Permitir lectura pública de cotizaciones"
ON cotizador
FOR SELECT
TO public
USING (true);

-- Verificar las políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'cotizador';
