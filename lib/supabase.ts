import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Configurada' : '✗ Faltante')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Configurada' : '✗ Faltante')
  throw new Error(
    'Variables de entorno de Supabase no configuradas. Por favor, crea un archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

// Validar que las variables no sean valores por defecto
if (supabaseUrl === 'your_supabase_project_url' || supabaseAnonKey === 'your_supabase_anon_key') {
  console.error('❌ Variables de entorno de Supabase contienen valores por defecto')
  throw new Error(
    'Por favor, configura las variables de entorno reales en .env.local. Los valores actuales son placeholders.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
