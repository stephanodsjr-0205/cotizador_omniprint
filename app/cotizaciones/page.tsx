'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Search, FileText, Calendar, Package, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { Database } from '@/types/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Cotizacion = Database['public']['Tables']['cotizador']['Row']
type Material = Database['public']['Tables']['material']['Row']
type Cliente = Database['public']['Tables']['clientes']['Row']

// Datos fijos de la empresa (Razón Social)
const EMPRESA = {
  RAZON_SOCIAL: 'Omni Print',
  RUC: '10474515961',
  DIRECCION: 'Ica 435 Urb. Palermo - Trujillo - La Libertad',
  EMAIL: 'servicios.omniprint@gmail.com',
  CELL: '953261120',
}
const CONDICION_PAGO = '07 DÍAS'

export default function CotizacionesPage() {
  const router = useRouter()
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar autenticación
    if (!auth.isAuthenticated()) {
      router.push('/login')
      return
    }

    cargarDatos()
  }, [router])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Iniciando carga de cotizaciones...')

      // Cargar cotizaciones
      const { data: cotizacionesData, error: cotizacionesError, status, statusText } = await supabase
        .from('cotizador')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('📊 Respuesta de cotizaciones:', { 
        status, 
        statusText, 
        dataCount: cotizacionesData?.length, 
        error: cotizacionesError 
      })

      if (cotizacionesError) {
        console.error('❌ Error de Supabase (cotizaciones):', cotizacionesError)
        
        // Mensajes de error más descriptivos
        if (cotizacionesError.code === '42501' || cotizacionesError.message.includes('RLS') || cotizacionesError.message.includes('permission denied')) {
          throw new Error(
            `Error de permisos (RLS): La política de seguridad está bloqueando la lectura de cotizaciones. Verifica las políticas RLS de la tabla "cotizador". Código: ${cotizacionesError.code}`
          )
        }
        if (cotizacionesError.message.includes('relation') || cotizacionesError.message.includes('does not exist') || cotizacionesError.code === '42P01') {
          throw new Error(
            `La tabla "cotizador" no existe. Verifica que la base de datos esté configurada correctamente. Código: ${cotizacionesError.code}`
          )
        }
        throw cotizacionesError
      }

      // Cargar materiales
      const { data: materialesData, error: materialesError } = await supabase
        .from('material')
        .select('*')

      if (materialesError) {
        console.error('❌ Error de Supabase (materiales):', materialesError)
        throw materialesError
      }

      console.log(`✅ ${cotizacionesData?.length || 0} cotización(es) cargada(s)`)
      console.log(`✅ ${materialesData?.length || 0} material(es) cargado(s)`)

      setCotizaciones(cotizacionesData || [])
      setMateriales(materialesData || [])

      if (!cotizacionesData || cotizacionesData.length === 0) {
        console.warn('⚠️ No se encontraron cotizaciones en la base de datos')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido al cargar datos'
      setError(`Error al cargar datos: ${errorMessage}`)
      console.error('❌ Error completo:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack
      })
    } finally {
      setLoading(false)
    }
  }

  const getMaterialNombre = (idMaterial: string) => {
    const material = materiales.find((m) => m.id_material === idMaterial)
    return material?.nombre || 'N/A'
  }

  const formatearMoneda = (valor: number) => {
    return `S/. ${valor.toFixed(2)}`
  }

  const formatearMonedaMiles = (valor: number) => {
    return `S/. ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const exportarPDF = async (cotizacion: Cotizacion) => {
    const material = materiales.find((m) => m.id_material === cotizacion.fk_id_material)
    let cliente: Cliente | null = null
    if (cotizacion.fk_id_cliente) {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('id_cliente', cotizacion.fk_id_cliente)
        .single()
      cliente = data ?? null
    }
    const fechaActual = new Date(cotizacion.created_at).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const numeroCotizacion = cotizacion.numero_cotizacion || '—'
    const clienteId = cliente?.email ? cliente.email.split('@')[0].trim() : '—'

    const doc = new jsPDF()

    // Intentar cargar el logo de forma asíncrona
    let logoCargado = false
    let logoWidth = 0
    let logoHeight = 0
    const logoX = 20
    const logoY = 10
    
    try {
      const logoUrl = '/logo.png'
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Logo no encontrado'))
        image.src = logoUrl
      })
      
      // Tamaño del logo un poco más grande (en mm)
      const maxWidth = 45
      const maxHeight = 20
      
      const originalWidth = img.width
      const originalHeight = img.height
      const widthMM = originalWidth * 0.264583
      const heightMM = originalHeight * 0.264583
      const ratioWidth = maxWidth / widthMM
      const ratioHeight = maxHeight / heightMM
      const ratio = Math.min(ratioWidth, ratioHeight)
      
      // Calcular dimensiones finales en mm
      logoWidth = widthMM * ratio
      logoHeight = heightMM * ratio
      
      // Agregar el logo al PDF
      doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight)
      logoCargado = true
      
      console.log(`✅ Logo agregado: ${logoWidth.toFixed(2)}mm x ${logoHeight.toFixed(2)}mm (original: ${widthMM.toFixed(2)}mm x ${heightMM.toFixed(2)}mm)`)
    } catch (err) {
      console.log('Logo no encontrado o error al cargar, usando texto:', err)
      logoCargado = false
    }
    
    // Encabezado de texto (ajustar posición si hay logo)
    if (logoCargado) {
      // Si hay logo, poner el texto centrado pero más abajo
      doc.setFontSize(18)
      doc.setTextColor(37, 99, 235) // Azul
      doc.text('COTIZADOR OMNI', 105, logoY + logoHeight / 2 + 3, { align: 'center' })
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text('Sistema de Cotización de Impresión', 105, logoY + logoHeight / 2 + 10, { align: 'center' })
    } else {
      // Si no hay logo, centrar el texto
      doc.setFontSize(20)
      doc.setTextColor(37, 99, 235) // Azul
      doc.text('COTIZADOR OMNI', 105, 20, { align: 'center' })
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('Sistema de Cotización de Impresión', 105, 28, { align: 'center' })
    }
    
    // Línea separadora
    const separatorY = logoCargado ? Math.max(logoY + logoHeight + 8, 35) : 35
    doc.setDrawColor(200, 200, 200)
    doc.line(20, separatorY, 190, separatorY)

    const blockStartY = separatorY + 8
    const leftX = 20
    const razonSocialTableWidth = 70
    const cotizacionTableX = 108  // Posición fija a la derecha (ajustar si hace falta)
    const cotizacionTableWidth = 190 - cotizacionTableX - 5
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)

    // ——— RAZÓN SOCIAL y COTIZACIÓN: tablas lado a lado ———
    // Dibujar COTIZACIÓN primero (derecha) para evitar que autoTable ignore posición
    // RAZÓN SOCIAL después (izquierda)

    // 1. COTIZACIÓN — tabla derecha (margin.left define posición horizontal)
    autoTable(doc, {
      startY: blockStartY,
      margin: { left: cotizacionTableX },
      head: [['COTIZACIÓN', '']],
      body: [
        ['FECHA', fechaActual],
        ['COTIZACIÓN N°', numeroCotizacion],
        ['CONDICIÓN PAGO', CONDICION_PAGO],
        ['CLIENTE ID', clienteId],
      ],
      columnStyles: {
        0: { cellWidth: 36, fontStyle: 'bold' },
        1: { cellWidth: cotizacionTableWidth - 36 },
      },
      tableWidth: cotizacionTableWidth,
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', halign: 'left' },
      styles: { fontSize: 9 },
    })
    const cotizacionBottom = (doc as any).lastAutoTable.finalY

    // 2. RAZÓN SOCIAL — tabla izquierda
    autoTable(doc, {
      startY: blockStartY,
      margin: { left: leftX },
      head: [['RAZÓN SOCIAL', '']],
      body: [
        ['Razón Social', EMPRESA.RAZON_SOCIAL],
        ['RUC', EMPRESA.RUC],
        ['DIRECCIÓN', EMPRESA.DIRECCION],
        ['EMAIL', EMPRESA.EMAIL],
        ['CELL', EMPRESA.CELL],
      ],
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold' },
        1: { cellWidth: razonSocialTableWidth - 28 },
      },
      tableWidth: razonSocialTableWidth,
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', halign: 'left' },
      styles: { fontSize: 9 },
    })
    const razonSocialBottom = (doc as any).lastAutoTable.finalY

    // ——— CLIENTE — debajo de ambas tablas, barra azul + datos ———
    const clienteSectionY = Math.max(razonSocialBottom, cotizacionBottom) + 10
    doc.setFillColor(37, 99, 235)
    doc.rect(20, clienteSectionY, 170, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.setFontSize(10)
    doc.text('CLIENTE', 25, clienteSectionY + 5.5)
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)

    let yCliente = clienteSectionY + 12
    if (cliente) {
      doc.setFont(undefined, 'bold')
      doc.text('Nombre:', leftX, yCliente)
      doc.setFont(undefined, 'normal')
      doc.text(cliente.nombre, 45, yCliente)
      yCliente += 5
      doc.setFont(undefined, 'bold')
      doc.text('Email:', leftX, yCliente)
      doc.setFont(undefined, 'normal')
      doc.text(cliente.email || '—', 45, yCliente)
      yCliente += 5
      doc.setFont(undefined, 'bold')
      doc.text('Teléfono:', leftX, yCliente)
      doc.setFont(undefined, 'normal')
      doc.text(cliente.telefono || '—', 45, yCliente)
      yCliente += 5
      doc.setFont(undefined, 'bold')
      doc.text('Área:', leftX, yCliente)
      doc.setFont(undefined, 'normal')
      doc.text(cliente.area || '—', 45, yCliente)
      yCliente += 5
      doc.setFont(undefined, 'bold')
      doc.text('Empresa:', leftX, yCliente)
      doc.setFont(undefined, 'normal')
      doc.text(cliente.empresa || '—', 45, yCliente)
      yCliente += 5
    } else {
      doc.text('—', leftX, yCliente)
      yCliente += 5
    }

    const esFormal = cotizacion.formal === true

    if (esFormal) {
      // Cotización formal: una sola tabla. Primera fila = REFERENCIA + nombre proyecto; luego ítem con descripción; últimas filas = SUBTOTAL, IGV, TOTAL
      const precioDir = cotizacion.precio_directo != null && !Number.isNaN(cotizacion.precio_directo) ? Number(cotizacion.precio_directo) : 0
      const subtotal = precioDir
      const igv = subtotal * 0.18
      const totalFinal = subtotal + igv
      const desc = cotizacion.descripcion?.trim() || '—'
      const refTexto = 'REFERENCIA ' + (cotizacion.nombre_proyecto || '—').toUpperCase()

      const y = yCliente + 8
      autoTable(doc, {
        startY: y,
        head: [['ÍTEM', 'DESCRIPCIÓN', 'UNIDAD DE MEDIDA', 'CANTIDAD', 'PRECIO UNITARIO (S/.)', 'TOTAL']],
        body: [
          ['', refTexto, '', '', '', ''],
          [1, desc, 'GLB', '1', formatearMonedaMiles(precioDir), formatearMonedaMiles(precioDir)],
          ['', 'SUBTOTAL', '', '', '', formatearMonedaMiles(subtotal)],
          ['', 'IGV (18%)', '', '', '', formatearMonedaMiles(igv)],
          ['', 'TOTAL', '', '', '', formatearMonedaMiles(totalFinal)],
        ],
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 65, cellPadding: 2 },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 28, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' },
        },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index === 4) {
            data.cell.styles.fontStyle = 'bold'
          }
        },
      })
    } else {
      // Cotización no formal: Resumen de Costos (valores ingresados y resultantes de la página de registro)
      const y = yCliente + 8
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(37, 99, 235)
      doc.text('Resumen de Costos', 20, y)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)

      autoTable(doc, {
        startY: y + 8,
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 110, fontStyle: 'normal' },
          1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
        },
        body: [
          ['Costo Material', formatearMoneda(cotizacion.costo_mat_impr)],
          ['Costo Energía', formatearMoneda(cotizacion.costo_energ_impr)],
          ['Costo Uso Máquina', formatearMoneda(cotizacion.costo_uso_maq)],
          ['Sobrecosto por Fallo', formatearMoneda(cotizacion.sobrecosto_fallo)],
          ['Costo de Fabricación', formatearMoneda(cotizacion.costo_fabr)],
          ['Precio de Venta', formatearMoneda(cotizacion.costo_venta)],
        ],
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          if (data.section === 'body') {
            if (data.row.index === 4) {
              data.cell.styles.fillColor = [219, 234, 254]
              data.cell.styles.fontStyle = 'bold'
            }
            if (data.row.index === 5) {
              data.cell.styles.fillColor = [34, 197, 94]
              data.cell.styles.textColor = [255, 255, 255]
              data.cell.styles.fontStyle = 'bold'
            }
          }
        },
      })
    }

    // Pie de página
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Generado el ${new Date().toLocaleDateString('es-PE')} - Sistema Cotizador OMNI`,
      105,
      280,
      { align: 'center' }
    )

    // Guardar PDF
    doc.save(`Cotizacion_${cotizacion.nombre_proyecto}_${new Date().getTime()}.pdf`)
  }

  const cotizacionesFiltradas = cotizaciones.filter((cot) =>
    cot.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cotizaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Lista de Cotizaciones
            </h1>

            {/* Buscador */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre de proyecto..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="font-semibold mb-1">Error</p>
                  <p className="text-sm">{error}</p>
                  {error.includes('RLS') && (
                    <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-xs font-semibold mb-1">Solución:</p>
                      <p className="text-xs">
                        Ejecuta el script <code className="bg-red-100 px-1 rounded">scripts/setup_rls_cotizador.sql</code> en Supabase
                        para permitir la lectura de cotizaciones.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {cotizacionesFiltradas.length === 0 && !loading && !error ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'No se encontraron cotizaciones' : 'No hay cotizaciones registradas'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Proyecto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Material</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Consumo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tiempo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Costo Fabricación</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Precio Venta</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacionesFiltradas.map((cotizacion) => (
                    <tr
                      key={cotizacion.id_cotizador}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {cotizacion.nombre_proyecto}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {getMaterialNombre(cotizacion.fk_id_material)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {cotizacion.consumo_impresion.toFixed(2)} gr
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {cotizacion.tiempo_impr_min.toFixed(2)} min
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatearMoneda(cotizacion.costo_fabr)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {formatearMoneda(cotizacion.costo_venta)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatearFecha(cotizacion.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => exportarPDF(cotizacion)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Total: {cotizacionesFiltradas.length} cotización(es)
          </div>
        </div>
      </div>
    </div>
  )
}
