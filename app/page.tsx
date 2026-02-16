'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CotizadorForm from '@/components/CotizadorForm'
import { auth } from '@/lib/auth'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!auth.isAuthenticated()) {
      router.push('/login')
    }
  }, [mounted, router])

  // Mismo markup en servidor y en el primer render del cliente para evitar error de hidratación
  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" />
  }
  if (!auth.isAuthenticated()) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" />
  }

  return <CotizadorForm />
}
