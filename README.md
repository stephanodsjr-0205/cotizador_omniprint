# Sistema Cotizador de Impresión

Sistema profesional para cotizar proyectos de impresión 3D desarrollado con Next.js, Tailwind CSS, Lucide React y Supabase.

## Características

- ✅ Formulario reactivo con cálculos en tiempo real
- ✅ Interfaz moderna de dos columnas
- ✅ Integración con Supabase
- ✅ Manejo de errores y validaciones
- ✅ Diseño responsive

## Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Configura las variables de entorno en `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_CONSUMO_WH_IMPR=100
NEXT_PUBLIC_COSTO_ENERG=0.15
NEXT_PUBLIC_COSTO_MIN_MAQ=50
```

3. Ejecuta el script SQL para crear el usuario DJARA:
   - Abre el SQL Editor en Supabase
   - Ejecuta el contenido de `scripts/create_user_djara.sql`

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto

```
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── CotizadorForm.tsx
├── lib/
│   └── supabase.ts
├── types/
│   └── supabase.ts
├── scripts/
│   └── create_user_djara.sql
└── .env.local
```

## Fórmulas Implementadas

- `costo_mat_impr = consumo_impresion * material.costoxgr`
- `costo_energ_impr = (((1 * consumo_wh_impr) / 1000) * costo_energ / 60) * tiempo_impr_min`
- `costo_uso_maq = tiempo_impr_min * costo_min_maq`
- `sobrecosto_x_fallo = (costo_uso_maq + costo_energ_impr + costo_mat_impr) * (porcentaje_fallo / 100)`
- `costo_fabr = Suma de los anteriores`
- `costo_venta = costo_fabr + (costo_fabr * (porcentaje_ganancia / 100))`

## Tecnologías

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React
- Supabase
