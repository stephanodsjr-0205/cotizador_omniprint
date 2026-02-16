-- Script para crear el usuario DJARA con clave omniprint0217
-- Ejecutar este script en el SQL Editor de Supabase

-- Insertar usuario DJARA
INSERT INTO usuario (id_usuario, usuario, clave)
VALUES (
  gen_random_uuid(),  -- Genera un UUID automático
  'DJARA',
  'omniprint0217'
)
ON CONFLICT (usuario) DO UPDATE
SET clave = EXCLUDED.clave;

-- Verificar que el usuario se creó correctamente
SELECT id_usuario, usuario, clave
FROM usuario
WHERE usuario = 'DJARA';
