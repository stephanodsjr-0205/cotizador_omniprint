# Configuración de Variables de Entorno

## Pasos para Configurar Supabase

### 1. Crear archivo `.env.local`

Crea un archivo llamado `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Variables de configuración para cálculos
NEXT_PUBLIC_CONSUMO_WH_IMPR=400
NEXT_PUBLIC_COSTO_ENERG=0.90
NEXT_PUBLIC_COSTO_MIN_MAQ=0.002
```

### 2. Obtener las credenciales de Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Navega a **Settings** → **API**
3. Copia los siguientes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Reiniciar el servidor de desarrollo

Después de crear o modificar el archivo `.env.local`, **debes reiniciar el servidor de desarrollo**:

```bash
# Detén el servidor (Ctrl + C)
# Luego inicia de nuevo:
npm run dev
```

### 4. Verificar la configuración

Si ves el error "Invalid API key", verifica:

- ✅ El archivo `.env.local` existe en la raíz del proyecto
- ✅ Las variables tienen los nombres correctos (con `NEXT_PUBLIC_` al inicio)
- ✅ Los valores NO son los placeholders (`your_supabase_project_url`, etc.)
- ✅ Has reiniciado el servidor después de crear/modificar `.env.local`
- ✅ La `anon_key` es la correcta (no uses la `service_role_key`)

### 5. Estructura de archivos

```
COTIZADOR_OMNI/
├── .env.local          ← Crea este archivo aquí
├── package.json
├── components/
├── lib/
└── ...
```

## Solución de Problemas

### Error: "Invalid API key"
- Verifica que copiaste la **anon/public key** correcta (no la service_role)
- Asegúrate de que no hay espacios extra al inicio o final de los valores
- Reinicia el servidor de desarrollo

### Error: "Variables de entorno no configuradas"
- Verifica que el archivo se llama exactamente `.env.local` (con el punto al inicio)
- Verifica que está en la raíz del proyecto (mismo nivel que `package.json`)
- Reinicia el servidor de desarrollo

### Los materiales no se cargan

Este es el problema más común. Sigue estos pasos:

#### Paso 1: Verificar que la tabla existe
1. Ve a Supabase → **Table Editor**
2. Verifica que existe la tabla `material`
3. Si no existe, créala con las columnas: `id_material` (uuid), `nombre` (text), `costoxkg` (numeric), `costoxgr` (numeric), `created_at` (timestamptz)

#### Paso 2: Configurar RLS (Row Level Security) - ⚠️ IMPORTANTE

**Si RLS está habilitado pero no hay políticas, los materiales NO se cargarán.**

1. Ve a Supabase → **SQL Editor**
2. Ejecuta el script `scripts/setup_rls_material.sql`:
   ```sql
   -- Habilitar RLS
   ALTER TABLE material ENABLE ROW LEVEL SECURITY;
   
   -- Permitir lectura pública
   CREATE POLICY "Permitir lectura pública de materiales"
   ON material
   FOR SELECT
   TO public
   USING (true);
   ```

3. También ejecuta `scripts/setup_rls_cotizador.sql` para permitir guardar cotizaciones:
   ```sql
   ALTER TABLE cotizador ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Permitir inserción pública de cotizaciones"
   ON cotizador
   FOR INSERT
   TO public
   WITH CHECK (true);
   ```

#### Paso 3: Verificar que hay datos
- Si la tabla está vacía, verás un mensaje: "No se encontraron materiales"
- Agrega materiales desde Supabase → **Table Editor** → `material`

#### Paso 4: Revisar la consola del navegador
- Abre las **Herramientas de Desarrollador** (F12)
- Ve a la pestaña **Console**
- Busca mensajes que empiecen con 🔄, ✅, ❌ o ⚠️
- Estos mensajes te dirán exactamente qué está pasando

#### Errores comunes y soluciones:

**Error: "Error de permisos (RLS)"**
- ✅ Solución: Ejecuta el script `setup_rls_material.sql` en Supabase

**Error: "La tabla material no existe"**
- ✅ Solución: Crea la tabla desde Supabase → **Table Editor**

**Error: "No se encontraron materiales"**
- ✅ Solución: Agrega materiales a la tabla desde Supabase

**El select muestra "Cargando materiales..." pero nunca termina**
- ✅ Solución: Revisa la consola del navegador para ver el error específico
- ✅ Verifica que las variables de entorno estén correctas
- ✅ Verifica que RLS esté configurado correctamente
