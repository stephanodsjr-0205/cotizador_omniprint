'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, User, Lock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { auth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Buscar usuario en la base de datos
      const { data, error: queryError } = await supabase
        .from('usuario')
        .select('id_usuario, usuario, clave')
        .eq('usuario', usuario.toUpperCase())
        .eq('clave', clave)
        .single()

      if (queryError || !data) {
        throw new Error('Usuario o contraseña incorrectos')
      }

      // Guardar usuario en sesión
      auth.setUser({
        id_usuario: (data as any).id_usuario,
        usuario: (data as any).usuario,
        //id_usuario: data.id_usuario,
        //usuario: data.usuario,
      })

      // Redirigir a la página principal
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
      console.error('Error de login:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sistema Cotizador
          </h1>
          <p className="text-gray-600">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Campo Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              placeholder="INGRESA TU USUARIO"
              required
              autoComplete="username"
            />
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Contraseña
            </label>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Botón de Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
