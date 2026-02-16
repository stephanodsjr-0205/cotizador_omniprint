'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { FileText, List, LogOut, Menu, X } from 'lucide-react'
import { auth } from '@/lib/auth'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const currentUser = auth.getUser()
    if (currentUser) {
      setUser(currentUser.usuario)
    } else {
      setUser(null)
    }
  }, [pathname]) // Actualizar cuando cambie la ruta

  const handleLogout = () => {
    auth.logout()
    router.push('/login')
  }

  const menuItems = [
    {
      label: 'Registrar Cotización',
      path: '/',
      icon: FileText,
    },
    {
      label: 'Listar y Exportar Cotización',
      path: '/cotizaciones',
      icon: List,
    },
  ]

  // Mostrar navbar solo si estamos en una ruta protegida (no en login)
  if (pathname === '/login') {
    return null
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Título */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-800">
                Sistema Cotizador
              </h1>
            </div>
          </div>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path)
                    setMenuOpen(false)
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Usuario y Logout */}
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden md:block text-sm text-gray-700">
                Usuario: <span className="font-semibold">{user}</span>
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>

            {/* Botón Menú Mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menú Mobile */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path)
                      setMenuOpen(false)
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
