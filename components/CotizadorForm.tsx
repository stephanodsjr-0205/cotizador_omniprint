'use client'

import { useState, useEffect } from 'react'
import { Calculator, Save, Package, Clock, Zap, Settings, TrendingUp, DollarSign, RefreshCw, AlertCircle, User, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type Material = Database['public']['Tables']['material']['Row']
type CotizadorInsert = Database['public']['Tables']['cotizador']['Insert']
type Cliente = Database['public']['Tables']['clientes']['Row']
type ClienteInsert = Database['public']['Tables']['clientes']['Insert']

interface Calculos {
  costo_mat_impr: number
  costo_energ_impr: number
  costo_uso_maq: number
  sobrecosto_fallo: number
  costo_fabr: number
  costo_venta: number
}

export default function CotizadorForm() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [materialSeleccionado, setMaterialSeleccionado] = useState<string>('')
  const [nombreProyecto, setNombreProyecto] = useState('')
  const [consumoImpresion, setConsumoImpresion] = useState<number>(0)
  const [tiempoImprMin, setTiempoImprMin] = useState<number>(0)
  const [porcentajeFallo, setPorcentajeFallo] = useState<number>(30)
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number>(50)
  const [calculos, setCalculos] = useState<Calculos>({
    costo_mat_impr: 0,
    costo_energ_impr: 0,
    costo_uso_maq: 0,
    sobrecosto_fallo: 0,
    costo_fabr: 0,
    costo_venta: 0,
  })
  const [loading, setLoading] = useState(false)
  const [loadingMateriales, setLoadingMateriales] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Modal cliente: al guardar cotización
  const [showModalCliente, setShowModalCliente] = useState(false)
  const [modoCliente, setModoCliente] = useState<'buscar' | 'nuevo'>('buscar')
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([])
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [formCliente, setFormCliente] = useState({
    nombre: '',
    email: '',
    telefono: '',
    area: '',
    empresa: '',
  })

  // Cotización formal: precio directo y descripción (modal al marcar FORMAL)
  const [formal, setFormal] = useState(false)
  const [showModalFormal, setShowModalFormal] = useState(false)
  const [precioDirecto, setPrecioDirecto] = useState<string>('')
  const [descripcionFormal, setDescripcionFormal] = useState('')

  // Variables de configuración (pueden venir de .env o ser constantes)
  const consumoWhImpr = parseFloat(process.env.NEXT_PUBLIC_CONSUMO_WH_IMPR || '400')
  const costoEnerg = parseFloat(process.env.NEXT_PUBLIC_COSTO_ENERG || '0.90')
  const costoMinMaq = parseFloat(process.env.NEXT_PUBLIC_COSTO_MIN_MAQ || '0.002')

  // Cargar materiales al montar el componente
  useEffect(() => {
    cargarMateriales()
  }, [])

  // Calcular automáticamente cuando cambian los valores
  useEffect(() => {
    calcularCostos()
  }, [consumoImpresion, tiempoImprMin, porcentajeFallo, porcentajeGanancia, materialSeleccionado])

  const cargarMateriales = async () => {
    setLoadingMateriales(true)
    setError(null)
    
    try {
      console.log('🔄 Iniciando carga de materiales...')
      
      // Verificar que las variables de entorno estén configuradas
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Variables de entorno no configuradas. Por favor, crea un archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY'
        )
      }

      if (supabaseUrl === 'your_supabase_project_url' || supabaseAnonKey === 'your_supabase_anon_key') {
        throw new Error(
          'Por favor, configura las variables de entorno reales en .env.local. Los valores actuales son placeholders.'
        )
      }

      console.log('✅ Variables de entorno configuradas')
      console.log('📡 Consultando tabla "material"...')

      const { data, error, status, statusText } = await supabase
        .from('material')
        .select('*')
        .order('nombre', { ascending: true })

      console.log('📊 Respuesta de Supabase:', { status, statusText, dataCount: data?.length, error })

      if (error) {
        console.error('❌ Error de Supabase:', error)
        
        // Mensajes de error más descriptivos
        if (error.message.includes('Invalid API key') || error.message.includes('JWT') || error.code === 'PGRST301') {
          throw new Error(
            'API Key inválida. Verifica que NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local sea correcta. Código: ' + error.code
          )
        }
        if (error.message.includes('relation') || error.message.includes('does not exist') || error.code === '42P01') {
          throw new Error(
            'La tabla "material" no existe. Verifica que la base de datos esté configurada correctamente. Código: ' + error.code
          )
        }
        if (error.code === '42501' || error.message.includes('RLS') || error.message.includes('permission denied')) {
          throw new Error(
            'Error de permisos (RLS): La política de seguridad de Supabase está bloqueando la lectura. Verifica las políticas RLS de la tabla "material". Código: ' + error.code
          )
        }
        if (error.code === 'PGRST116') {
          throw new Error(
            'No se encontraron filas. La tabla "material" existe pero está vacía. Agrega materiales desde Supabase.'
          )
        }
        throw new Error(`${error.message} (Código: ${error.code || 'N/A'})`)
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ La tabla está vacía')
        setMateriales([])
        setError('No se encontraron materiales. La tabla está vacía. Agrega materiales desde Supabase.')
      } else {
        console.log(`✅ ${data.length} material(es) cargado(s) exitosamente`)
        setMateriales(data)
        setError(null) // Limpiar error si se carga correctamente
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido al cargar materiales'
      setError(`Error al cargar materiales: ${errorMessage}`)
      console.error('❌ Error completo:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack
      })
    } finally {
      setLoadingMateriales(false)
    }
  }

  const formatearMoneda = (valor: number) => {
    // Formato de soles peruanos (S/.)
    return `S/. ${valor.toFixed(2)}`
  }

  const calcularCostos = () => {
    if (!materialSeleccionado || consumoImpresion <= 0 || tiempoImprMin <= 0) {
      setCalculos({
        costo_mat_impr: 0,
        costo_energ_impr: 0,
        costo_uso_maq: 0,
        sobrecosto_fallo: 0,
        costo_fabr: 0,
        costo_venta: 0,
      })
      return
    }

    const material = materiales.find((m) => m.id_material === materialSeleccionado)
    if (!material) return

    // Fórmula 1: costo_mat_impr = consumo_impresion * material.costoxgr
    const costo_mat_impr = consumoImpresion * material.costoxgr

    // Fórmula 2: costo_energ_impr = (((1 * consumo_wh_impr) / 1000) * costo_energ / 60) * tiempo_impr_min
    const costo_energ_impr = (((1 * consumoWhImpr) / 1000) * costoEnerg / 60) * tiempoImprMin

    // Fórmula 3: costo_uso_maq = tiempo_impr_min * costo_min_maq
    const costo_uso_maq = tiempoImprMin * costoMinMaq

    // Fórmula 4: sobrecosto_x_fallo = (costo_uso_maq + costo_energ_impr + costo_mat_impr) * (porcentaje_fallo / 100)
    const sobrecosto_fallo = (costo_uso_maq + costo_energ_impr + costo_mat_impr) * (porcentajeFallo / 100)

    // Fórmula 5: costo_fabr = Suma de los anteriores
    const costo_fabr = costo_mat_impr + costo_energ_impr + costo_uso_maq + sobrecosto_fallo

    // Fórmula 6: costo_venta = costo_fabr + (costo_fabr * (porcentaje_ganancia / 100))
    let costo_venta = costo_fabr + costo_fabr * (porcentajeGanancia / 100)

    // Validación: El costo de venta no puede exceder 90,000 soles
    const MAX_COSTO_VENTA = 90000
    if (costo_venta > MAX_COSTO_VENTA) {
      setError(`⚠️ El precio de venta calculado (${formatearMoneda(costo_venta)}) excede el límite máximo de ${formatearMoneda(MAX_COSTO_VENTA)}. Por favor, ajusta los valores.`)
      costo_venta = MAX_COSTO_VENTA // Limitar al máximo
    } else {
      // Limpiar error si el valor es válido
      if (error && error.includes('excede el límite máximo')) {
        setError(null)
      }
    }

    setCalculos({
      costo_mat_impr,
      costo_energ_impr,
      costo_uso_maq,
      sobrecosto_fallo,
      costo_fabr,
      costo_venta,
    })
  }

  const handleCalcular = () => {
    calcularCostos()
    setSuccess(false)
    setError(null)
  }

  const abrirModalGuardar = () => {
    if (!materialSeleccionado || !nombreProyecto.trim()) {
      setError('Por favor completa todos los campos requeridos')
      return
    }
    if (calculos.costo_fabr === 0) {
      setError('Por favor calcula los costos antes de guardar')
      return
    }
    setError(null)
    setShowModalCliente(true)
    setModoCliente('buscar')
    setBusquedaNombre('')
    setClientesEncontrados([])
    setClienteSeleccionado(null)
    setFormCliente({ nombre: '', email: '', telefono: '', area: '', empresa: '' })
  }

  const buscarClientes = async () => {
    if (!busquedaNombre.trim()) {
      setClientesEncontrados([])
      return
    }
    setBuscandoCliente(true)
    try {
      const { data, error: err } = await supabase
        .from('clientes')
        .select('*')
        .ilike('nombre', `%${busquedaNombre.trim()}%`)
        .limit(20)
      if (err) throw err
      setClientesEncontrados(data || [])
    } catch (e: any) {
      setError(`Error al buscar clientes: ${e.message}`)
      setClientesEncontrados([])
    } finally {
      setBuscandoCliente(false)
    }
  }

  const guardarCotizacionConCliente = async () => {
    let idCliente: string | null = null

    if (modoCliente === 'nuevo') {
      if (!formCliente.nombre.trim()) {
        setError('El nombre del cliente es obligatorio')
        return
      }
      setLoading(true)
      setError(null)
      try {
        const nuevoCliente: ClienteInsert = {
          nombre: formCliente.nombre.trim(),
          email: formCliente.email.trim() || null,
          telefono: formCliente.telefono.trim() || null,
          area: formCliente.area.trim() || null,
          empresa: formCliente.empresa.trim() || null,
        }
        const { data: creado, error: errCliente } = await supabase
          .from('clientes')
          .insert(nuevoCliente as any)
          .select('id_cliente')
          .single()
        if (errCliente) throw errCliente
        idCliente = (creado as any)?.id_cliente ?? null
      } catch (e: any) {
        setError(`Error al crear cliente: ${e.message}`)
        setLoading(false)
        return
      }
    } else {
      if (!clienteSeleccionado) {
        setError('Selecciona un cliente o crea uno nuevo')
        return
      }
      idCliente = (clienteSeleccionado as any)?.id_cliente ?? null  
    }

    setError(null)
    setSuccess(false)

    try {
      const { count, error: countErr } = await supabase
        .from('cotizador')
        .select('*', { count: 'exact', head: true })
      if (countErr) throw countErr
      const siguienteNumero = String((count ?? 0) + 1).padStart(4, '0')

      const valorPrecioDirecto = precioDirecto !== '' && !Number.isNaN(parseFloat(precioDirecto)) ? parseFloat(precioDirecto) : null
      const nuevaCotizacion: CotizadorInsert = {
        nombre_proyecto: nombreProyecto,
        fk_id_material: materialSeleccionado,
        fk_id_cliente: idCliente,
        numero_cotizacion: siguienteNumero,
        consumo_impresion: consumoImpresion,
        tiempo_impr_min: tiempoImprMin,
        costo_mat_impr: calculos.costo_mat_impr,
        costo_energ_impr: calculos.costo_energ_impr,
        costo_uso_maq: calculos.costo_uso_maq,
        sobrecosto_fallo: calculos.sobrecosto_fallo,
        costo_fabr: calculos.costo_fabr,
        costo_venta: calculos.costo_venta,
        porcentaje_fallo_usado: porcentajeFallo,
        porcentaje_ganancia_usado: porcentajeGanancia,
        costo_energ: costoEnerg,
        consumo_wh_impr: consumoWhImpr,
        costo_min_maq: costoMinMaq,
        formal: formal,
        precio_directo: valorPrecioDirecto,
        descripcion: descripcionFormal.trim() || null,
      }

      const { error: insertError } = await supabase
        .from('cotizador')
        .insert(nuevaCotizacion as any)

      if (insertError) {
        if (insertError.code === '42501' || insertError.message.includes('RLS')) {
          throw new Error('Error de permisos: Verifica la configuración de RLS en Supabase')
        }
        throw insertError
      }

      setSuccess(true)
      setShowModalCliente(false)
      setClienteSeleccionado(null)
      setFormal(false)
      setPrecioDirecto('')
      setDescripcionFormal('')
      setTimeout(() => {
        setNombreProyecto('')
        setMaterialSeleccionado('')
        setConsumoImpresion(0)
        setTiempoImprMin(0)
        setPorcentajeFallo(30)
        setPorcentajeGanancia(50)
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(`Error al guardar: ${err.message}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = abrirModalGuardar

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Sistema Cotizador de Impresión
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda: Formulario */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Datos de la Cotización
            </h2>

            <div className="space-y-4">
              {/* Nombre del Proyecto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  value={nombreProyecto}
                  onChange={(e) => setNombreProyecto(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  placeholder="Ej: PROTOTIPO DE CARCASAS"
                />
              </div>

              {/* Select de Material */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Material *
                </label>
                <div className="relative">
                  <select
                    value={materialSeleccionado}
                    onChange={(e) => setMaterialSeleccionado(e.target.value)}
                    disabled={loadingMateriales}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingMateriales ? 'Cargando materiales...' : 'Selecciona un material'}
                    </option>
                    {materiales.map((material) => (
                      <option key={material.id_material} value={material.id_material}>
                        {material.nombre} - S/. {material.costoxgr.toFixed(4)}/gr
                      </option>
                    ))}
                  </select>
                  {loadingMateriales && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
                {!loadingMateriales && materiales.length === 0 && !error && (
                  <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    No hay materiales disponibles. Agrega materiales desde Supabase.
                  </p>
                )}
              </div>

              {/* Consumo de Impresión (gramos) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consumo de Impresión (gramos) *
                </label>
                <input
                  type="number"
                  value={consumoImpresion || ''}
                  onChange={(e) => setConsumoImpresion(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Tiempo de Impresión (minutos) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tiempo de Impresión (minutos) *
                </label>
                <input
                  type="number"
                  value={tiempoImprMin || ''}
                  onChange={(e) => setTiempoImprMin(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Porcentaje de Fallo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porcentaje de Fallo (%)
                </label>
                <input
                  type="number"
                  value={porcentajeFallo || ''}
                  onChange={(e) => setPorcentajeFallo(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Porcentaje de Ganancia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Porcentaje de Ganancia (%)
                </label>
                <input
                  type="number"
                  value={porcentajeGanancia || ''}
                  onChange={(e) => setPorcentajeGanancia(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Checkbox FORMAL: abre modal para precio directo y descripción */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formal-check"
                  checked={formal}
                  onChange={(e) => {
                    const checked = e.target.checked
                    if (checked) {
                      setShowModalFormal(true)
                    } else {
                      setFormal(false)
                      setPrecioDirecto('')
                      setDescripcionFormal('')
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="formal-check" className="text-sm font-medium text-gray-700 cursor-pointer">
                  FORMAL
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCalcular}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  Calcular
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

              {/* Mensajes de Error y Éxito */}
              {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Error</p>
                      <p className="text-sm">{error}</p>
                      <button
                        onClick={cargarMateriales}
                        disabled={loadingMateriales}
                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingMateriales ? 'animate-spin' : ''}`} />
                        {loadingMateriales ? 'Cargando...' : 'Reintentar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {success && (
                <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  ¡Cotización guardada exitosamente!
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen de Costos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Resumen de Costos
            </h2>

            <div className="space-y-4">
              {/* Costo Material de Impresión */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">Costo Material</span>
                  </div>
                  <span className="text-gray-900 font-semibold">
                    {formatearMoneda(calculos.costo_mat_impr)}
                  </span>
                </div>
                {materialSeleccionado && consumoImpresion > 0 && (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    ({consumoImpresion.toFixed(2)} gr × {materiales.find(m => m.id_material === materialSeleccionado)?.costoxgr.toFixed(4)} S/./gr)
                  </p>
                )}
              </div>

              {/* Costo Energía de Impresión */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-700 font-medium">Costo Energía</span>
                  </div>
                  <span className="text-gray-900 font-semibold">
                    {formatearMoneda(calculos.costo_energ_impr)}
                  </span>
                </div>
                {tiempoImprMin > 0 && (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    (((1 × {consumoWhImpr}) / 1000) × {costoEnerg} / 60) × {tiempoImprMin.toFixed(2)} min
                  </p>
                )}
              </div>

              {/* Costo Uso de Máquina */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700 font-medium">Costo Uso Máquina</span>
                  </div>
                  <span className="text-gray-900 font-semibold">
                    {formatearMoneda(calculos.costo_uso_maq)}
                  </span>
                </div>
                {tiempoImprMin > 0 && (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    ({tiempoImprMin.toFixed(2)} min × {costoMinMaq} S/./min)
                  </p>
                )}
              </div>

              {/* Sobrecosto por Fallo */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-700 font-medium">Sobrecosto por Fallo</span>
                  </div>
                  <span className="text-gray-900 font-semibold">
                    {formatearMoneda(calculos.sobrecosto_fallo)}
                  </span>
                </div>
                {calculos.costo_uso_maq > 0 && (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    ({formatearMoneda(calculos.costo_uso_maq)} + {formatearMoneda(calculos.costo_energ_impr)} + {formatearMoneda(calculos.costo_mat_impr)}) × ({porcentajeFallo}% / 100)
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t-2 border-gray-300 my-4"></div>

              {/* Costo de Fabricación */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-700 font-semibold text-lg">Costo de Fabricación</span>
                  <span className="text-blue-900 font-bold text-lg">
                    {formatearMoneda(calculos.costo_fabr)}
                  </span>
                </div>
                {calculos.costo_fabr > 0 && (
                  <p className="text-xs text-gray-600 mt-1 text-right">
                    ({formatearMoneda(calculos.costo_mat_impr)} + {formatearMoneda(calculos.costo_energ_impr)} + {formatearMoneda(calculos.costo_uso_maq)} + {formatearMoneda(calculos.sobrecosto_fallo)})
                  </p>
                )}
              </div>

              {/* Precio de Venta Final */}
              <div className="p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-bold text-xl">Precio de Venta</span>
                  <span className="text-white font-bold text-2xl">
                    {formatearMoneda(calculos.costo_venta)}
                  </span>
                </div>
                {calculos.costo_fabr > 0 && (
                  <p className="text-xs text-green-100 mt-1 text-right">
                    ({formatearMoneda(calculos.costo_fabr)} + ({formatearMoneda(calculos.costo_fabr)} × {porcentajeGanancia}% / 100))
                  </p>
                )}
                {calculos.costo_venta >= 90000 && (
                  <p className="text-xs text-yellow-200 mt-1 text-right font-semibold">
                    ⚠️ Límite máximo aplicado: S/. 90,000.00
                  </p>
                )}
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Nota:</strong> Los cálculos se actualizan automáticamente al modificar los valores.
              </p>
            </div>
          </div>
        </div>

        {/* Modal FORMAL: precio directo y descripción */}
        {showModalFormal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Cotización formal</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowModalFormal(false)
                    setFormal(false)
                    setPrecioDirecto('')
                    setDescripcionFormal('')
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PRECIO_DIRECTO (S/.)</label>
                  <input
                    type="number"
                    value={precioDirecto}
                    onChange={(e) => setPrecioDirecto(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DESCRIPCIÓN</label>
                  <textarea
                    value={descripcionFormal}
                    onChange={(e) => setDescripcionFormal(e.target.value)}
                    rows={5}
                    placeholder="Descripción para la cotización formal..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModalFormal(false)
                      setFormal(false)
                      setPrecioDirecto('')
                      setDescripcionFormal('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormal(true)
                      setShowModalFormal(false)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Cliente al guardar cotización */}
        {showModalCliente && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Datos del cliente
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModalCliente(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-2 border-b border-gray-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setModoCliente('buscar')}
                    className={`px-4 py-2 rounded-lg font-medium ${modoCliente === 'buscar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Buscar cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoCliente('nuevo')}
                    className={`px-4 py-2 rounded-lg font-medium ${modoCliente === 'nuevo' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Nuevo cliente
                  </button>
                </div>

                {modoCliente === 'buscar' ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={busquedaNombre}
                        onChange={(e) => setBusquedaNombre(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && buscarClientes()}
                        placeholder="Buscar por nombre..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={buscarClientes}
                        disabled={buscandoCliente}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        {buscandoCliente ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                      {clientesEncontrados.length === 0 ? (
                        <p className="p-3 text-sm text-gray-500">
                          {busquedaNombre.trim() ? 'No hay resultados. Crea un nuevo cliente.' : 'Escribe un nombre y pulsa Buscar.'}
                        </p>
                      ) : (
                        <ul className="divide-y">
                          {clientesEncontrados.map((c) => (
                            <li key={c.id_cliente}>
                              <button
                                type="button"
                                onClick={() => setClienteSeleccionado(c)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${clienteSeleccionado?.id_cliente === c.id_cliente ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                              >
                                <span className="font-medium">{c.nombre}</span>
                                {c.empresa && <span className="text-gray-500"> — {c.empresa}</span>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {clienteSeleccionado && (
                      <p className="text-sm text-green-700">
                        Cliente seleccionado: <strong>{clienteSeleccionado.nombre}</strong>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={formCliente.nombre}
                        onChange={(e) => setFormCliente((f) => ({ ...f, nombre: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Nombre del cliente"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formCliente.email}
                        onChange={(e) => setFormCliente((f) => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={formCliente.telefono}
                        onChange={(e) => setFormCliente((f) => ({ ...f, telefono: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: 953261120"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                      <input
                        type="text"
                        value={formCliente.area}
                        onChange={(e) => setFormCliente((f) => ({ ...f, area: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Área o departamento"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                      <input
                        type="text"
                        value={formCliente.empresa}
                        onChange={(e) => setFormCliente((f) => ({ ...f, empresa: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModalCliente(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={guardarCotizacionConCliente}
                    disabled={loading || (modoCliente === 'buscar' && !clienteSeleccionado) || (modoCliente === 'nuevo' && !formCliente.nombre.trim())}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Guardando...' : 'Confirmar y guardar cotización'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
