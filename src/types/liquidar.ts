/**
 * @file liquidar.ts
 * @description Domain types for Liquidar Platform Chile.
 * These are the core entities for the auction platform.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type LoteEstado = 'activo' | 'terminando_pronto' | 'terminado' | 'cancelado';
export type LoteCondicion = 'nuevo' | 'como_nuevo' | 'bueno' | 'aceptable';
export type PujaTipo = 'manual' | 'proxy';
export type VendedorEstado = 'activo' | 'inactivo' | 'suspendido';
export type MetodoPago = 'webpay' | 'khipu' | 'transferencia_manual';
export type PagoEstado = 'pendiente' | 'pendiente_verificacion' | 'completado' | 'fallido' | 'reembolsado';

export type CategoriaLote =
  | 'electronica'
  | 'ropa'
  | 'muebles'
  | 'herramientas'
  | 'juguetes'
  | 'deportes'
  | 'electrodomesticos'
  | 'computacion'
  | 'hogar'
  | 'otros';

export const CATEGORIA_LABELS: Record<CategoriaLote, string> = {
  electronica: 'Electrónica',
  ropa: 'Ropa y Moda',
  muebles: 'Muebles',
  herramientas: 'Herramientas',
  juguetes: 'Juguetes',
  deportes: 'Deportes',
  electrodomesticos: 'Electrodomésticos',
  computacion: 'Computación',
  hogar: 'Hogar',
  otros: 'Otros',
};

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface Vendedor {
  id: string;
  userId?: string;
  nombreEmpresa: string;
  rut: string;
  descripcion: string;
  logoUrl?: string;
  telefono?: string;
  email: string;
  ciudad: string;
  region: string;
  estado: VendedorEstado;
  totalLotes: number;
  rating: number;
  createdAt: Date | string;
}

export interface Lote {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaLote;
  precioBase: number;       // CLP, entero
  precioActual: number;     // CLP, entero
  incrementoMinimo: number; // CLP, entero (default: 1000)
  estado: LoteEstado;
  fechaInicio: Date | string;
  fechaFin: Date | string;
  vendedorId: string;
  vendedor?: Vendedor;
  region: string;
  comuna: string;
  loteNumero: string;
  pesoKg?: number;
  volumenM3?: number;
  condicion: LoteCondicion;
  retailerOrigen: string;
  totalPujas: number;
  imagenes?: ImagenLote[];
  createdAt: Date | string;
}

export interface ImagenLote {
  id: string;
  loteId: string;
  url: string;
  orden: number;
  esPrincipal: boolean;
}

export interface Puja {
  id: string;
  loteId: string;
  userId: string;
  userName?: string;
  monto: number;           // CLP, entero
  tipo: PujaTipo;
  proxyMontoMaximo?: number; // Solo para tipo 'proxy'
  esGanadora: boolean;
  createdAt: Date | string;
}

export interface AlertaPrecio {
  id: string;
  userId: string;
  loteId: string;
  montoAlerta: number;
  activa: boolean;
  createdAt: Date | string;
}

export interface CalculoEnvio {
  region: string;
  precioEstimado: number; // CLP
  diasEstimados: number;
  transportista: string;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface PujaFormData {
  loteId: string;
  montoMaximo: number;
  tipo: PujaTipo;
}

export interface PujaFormError {
  field: 'montoMaximo' | 'general';
  message: string;
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface FiltrosSubasta {
  categoria?: CategoriaLote;
  precioMin?: number;
  precioMax?: number;
  region?: string;
  estado?: LoteEstado | 'terminando_pronto';
  ordenar?: 'precio_asc' | 'precio_desc' | 'fecha_fin_asc' | 'recientes';
}
