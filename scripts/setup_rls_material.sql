-- Script para configurar las políticas RLS (Row Level Security) para la tabla material
-- Esto permite que los usuarios anónimos puedan leer los materiales
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar RLS en la tabla material (si no está habilitado)
ALTER TABLE material ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura pública (SELECT) de materiales
-- Esto permite que cualquier usuario (incluso anónimo) pueda leer los materiales
CREATE POLICY "Permitir lectura pública de materiales"
ON material
FOR SELECT
TO public
USING (true);

-- Si quieres permitir también inserción desde el cliente (opcional):
-- CREATE POLICY "Permitir inserción de materiales"
-- ON material
-- FOR INSERT
-- TO public
-- WITH CHECK (true);

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
WHERE tablename = 'material';
