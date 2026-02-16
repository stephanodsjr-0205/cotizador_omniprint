export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuario: {
        Row: {
          id_usuario: string
          usuario: string
          clave: string
        }
        Insert: {
          id_usuario?: string
          usuario: string
          clave: string
        }
        Update: {
          id_usuario?: string
          usuario?: string
          clave?: string
        }
      }
      clientes: {
        Row: {
          id_cliente: string
          nombre: string
          email: string | null
          telefono: string | null
          area: string | null
          empresa: string | null
          created_at: string
        }
        Insert: {
          id_cliente?: string
          nombre: string
          email?: string | null
          telefono?: string | null
          area?: string | null
          empresa?: string | null
          created_at?: string
        }
        Update: {
          id_cliente?: string
          nombre?: string
          email?: string | null
          telefono?: string | null
          area?: string | null
          empresa?: string | null
          created_at?: string
        }
      }
      material: {
        Row: {
          id_material: string
          nombre: string
          costoxkg: number
          costoxgr: number
          created_at: string
        }
        Insert: {
          id_material?: string
          nombre: string
          costoxkg: number
          costoxgr: number
          created_at?: string
        }
        Update: {
          id_material?: string
          nombre?: string
          costoxkg?: number
          costoxgr?: number
          created_at?: string
        }
      }
      cotizador: {
        Row: {
          id_cotizador: string
          nombre_proyecto: string
          fk_id_material: string
          fk_id_cliente: string | null
          numero_cotizacion: string | null
          consumo_impresion: number
          tiempo_impr_min: number
          costo_mat_impr: number
          costo_energ_impr: number
          costo_uso_maq: number
          sobrecosto_fallo: number
          costo_fabr: number
          costo_venta: number
          porcentaje_fallo_usado: number
          porcentaje_ganancia_usado: number
          costo_energ: number
          consumo_wh_impr: number
          costo_min_maq: number
          formal: boolean
          precio_directo: number | null
          descripcion: string | null
          created_at: string
        }
        Insert: {
          id_cotizador?: string
          nombre_proyecto: string
          fk_id_material: string
          fk_id_cliente?: string | null
          numero_cotizacion?: string | null
          consumo_impresion: number
          tiempo_impr_min: number
          costo_mat_impr: number
          costo_energ_impr: number
          costo_uso_maq: number
          sobrecosto_fallo: number
          costo_fabr: number
          costo_venta: number
          porcentaje_fallo_usado: number
          porcentaje_ganancia_usado: number
          costo_energ: number
          consumo_wh_impr: number
          costo_min_maq: number
          formal?: boolean
          precio_directo?: number | null
          descripcion?: string | null
          created_at?: string
        }
        Update: {
          id_cotizador?: string
          nombre_proyecto?: string
          fk_id_material?: string
          fk_id_cliente?: string | null
          numero_cotizacion?: string | null
          consumo_impresion?: number
          tiempo_impr_min?: number
          costo_mat_impr?: number
          costo_energ_impr?: number
          costo_uso_maq?: number
          sobrecosto_fallo?: number
          costo_fabr?: number
          costo_venta?: number
          porcentaje_fallo_usado?: number
          porcentaje_ganancia_usado?: number
          costo_energ?: number
          consumo_wh_impr?: number
          costo_min_maq?: number
          formal?: boolean
          precio_directo?: number | null
          descripcion?: string | null
          created_at?: string
        }
      }
    }
  }
}
