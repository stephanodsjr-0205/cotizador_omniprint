-- Script para configurar las políticas RLS (Row Level Security) para la tabla usuario
-- Esto permite que los usuarios puedan autenticarse
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar RLS en la tabla usuario (si no está habilitado)
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura pública (SELECT) de usuarios
-- Esto permite que la aplicación pueda verificar credenciales
CREATE POLICY "Permitir lectura pública de usuarios para autenticación"
ON usuario
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
WHERE tablename = 'usuario';
