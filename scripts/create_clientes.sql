-- Script para crear la tabla CLIENTES y actualizar COTIZADOR
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear tabla CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  area TEXT,
  empresa TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS en clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política: permitir inserción y lectura pública (ajustar según tu seguridad)
CREATE POLICY "Permitir inserción pública de clientes"
ON clientes FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Permitir lectura pública de clientes"
ON clientes FOR SELECT TO public USING (true);

CREATE POLICY "Permitir actualización pública de clientes"
ON clientes FOR UPDATE TO public USING (true);

-- 3. Agregar columnas a cotizador: fk_id_cliente y numero_cotizacion
ALTER TABLE cotizador
ADD COLUMN IF NOT EXISTS fk_id_cliente UUID REFERENCES clientes(id_cliente),
ADD COLUMN IF NOT EXISTS numero_cotizacion TEXT;

-- Comentarios opcionales
COMMENT ON TABLE clientes IS 'Clientes para cotizaciones';
COMMENT ON COLUMN cotizador.fk_id_cliente IS 'Cliente asociado a la cotización';
COMMENT ON COLUMN cotizador.numero_cotizacion IS 'Número secuencial de cotización (ej: 0001, 0002)';
