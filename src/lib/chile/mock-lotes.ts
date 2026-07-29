/**
 * @file mock-lotes.ts
 * @description Chilean auction lots mock data for development.
 * Used across pages until Supabase is connected.
 * All prices in CLP (integer, no decimals).
 */
import type { Lote, Vendedor } from '@/types/liquidar';

// ─── Mock Vendedores ──────────────────────────────────────────────────────────

export const MOCK_VENDEDORES: Vendedor[] = [
  {
    id: 'v-001',
    nombreEmpresa: 'Falabella Liquidaciones S.A.',
    rut: '76.354.771-3',
    descripcion: 'Liquidaciones oficiales de Falabella Chile. Electrónica, ropa y hogar.',
    ciudad: 'Santiago',
    region: 'RM',
    estado: 'activo',
    totalLotes: 142,
    rating: 4.8,
    email: 'liquidaciones@falabella.cl',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'v-002',
    nombreEmpresa: 'Ripley Outlet Chile',
    rut: '96.928.180-6',
    descripcion: 'Stock de temporada anterior y retornos de Ripley. Ropa y electrónica.',
    ciudad: 'Santiago',
    region: 'RM',
    estado: 'activo',
    totalLotes: 87,
    rating: 4.6,
    email: 'outlet@ripley.cl',
    createdAt: '2025-02-10T10:00:00Z',
  },
  {
    id: 'v-003',
    nombreEmpresa: 'Paris Liquidation',
    rut: '99.543.210-1',
    descripcion: 'Lotes de liquidación Paris. Moda, hogar y artículos de temporada.',
    ciudad: 'Santiago',
    region: 'RM',
    estado: 'activo',
    totalLotes: 63,
    rating: 4.7,
    email: 'liquidacion@paris.cl',
    createdAt: '2025-03-05T10:00:00Z',
  },
];

// ─── Mock Lotes ───────────────────────────────────────────────────────────────

const now = new Date();
const addHours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();
const addDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_LOTES: Lote[] = [
  {
    id: 'lot-001',
    titulo: 'Pallet Electrónica Samsung — 48 unidades mixtas',
    descripcion:
      'Lote de liquidación con 48 unidades de electrónica Samsung: smartphones, tablets y accesorios. Retornos de tienda con packaging dañado. Productos en excelente estado funcional.',
    categoria: 'electronica',
    precioBase: 750000,
    precioActual: 890000,
    incrementoMinimo: 10000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    fechaFin: addHours(2),
    vendedorId: 'v-001',
    vendedor: MOCK_VENDEDORES[0],
    region: 'RM',
    comuna: 'Santiago',
    loteNumero: 'FAL-2026-001',
    pesoKg: 85,
    condicion: 'como_nuevo',
    retailerOrigen: 'Falabella',
    totalPujas: 12,
    createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-002',
    titulo: 'Ropa de Invierno Paris — 200 prendas mixtas',
    descripcion:
      'Colección de invierno 2025 de Paris. 200 prendas mixtas: abrigos, chaquetas, sweaters y pantalones. Tallas S-XL. Ideal para revendedores.',
    categoria: 'ropa',
    precioBase: 280000,
    precioActual: 340000,
    incrementoMinimo: 5000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
    fechaFin: addHours(5),
    vendedorId: 'v-003',
    vendedor: MOCK_VENDEDORES[2],
    region: 'V',
    comuna: 'Viña del Mar',
    loteNumero: 'PAR-2026-045',
    pesoKg: 120,
    condicion: 'nuevo',
    retailerOrigen: 'Paris',
    totalPujas: 8,
    createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-003',
    titulo: 'Electrodomésticos Ripley — 15 unidades grandes',
    descripcion:
      'Pallet con 15 electrodomésticos grandes: lavadoras, refrigeradores y microondas. Retornos con pequeños defectos estéticos. Funcionan perfectamente.',
    categoria: 'electrodomesticos',
    precioBase: 1100000,
    precioActual: 1250000,
    incrementoMinimo: 25000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    fechaFin: addHours(27),
    vendedorId: 'v-002',
    vendedor: MOCK_VENDEDORES[1],
    region: 'VIII',
    comuna: 'Concepción',
    loteNumero: 'RIP-2026-023',
    pesoKg: 420,
    volumenM3: 8.5,
    condicion: 'bueno',
    retailerOrigen: 'Ripley',
    totalPujas: 5,
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-004',
    titulo: 'Muebles de Hogar Sodimac — Pallet completo',
    descripcion:
      'Muebles de exhibición de Sodimac. Incluye: mesas de comedor, sillas, repisas y muebles de dormitorio. Pequeños rayones superficiales.',
    categoria: 'muebles',
    precioBase: 550000,
    precioActual: 670000,
    incrementoMinimo: 10000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    fechaFin: addHours(4),
    vendedorId: 'v-001',
    vendedor: MOCK_VENDEDORES[0],
    region: 'RM',
    comuna: 'Maipú',
    loteNumero: 'SOD-2026-012',
    pesoKg: 280,
    volumenM3: 12,
    condicion: 'bueno',
    retailerOrigen: 'Sodimac',
    totalPujas: 7,
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-005',
    titulo: 'Juguetes y Bebé Lider — Lote mixto navideño',
    descripcion:
      'Stock sobrante de temporada navideña de Lider. Juguetes para 0-12 años, artículos de bebé y juegos de mesa. Packaging abierto pero productos nuevos.',
    categoria: 'juguetes',
    precioBase: 175000,
    precioActual: 210000,
    incrementoMinimo: 5000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    fechaFin: addHours(3),
    vendedorId: 'v-003',
    vendedor: MOCK_VENDEDORES[2],
    region: 'RM',
    comuna: 'Las Condes',
    loteNumero: 'LID-2026-067',
    pesoKg: 95,
    condicion: 'nuevo',
    retailerOrigen: 'Lider',
    totalPujas: 15,
    createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-006',
    titulo: 'Herramientas Corona — Kit completo de jardín',
    descripcion:
      'Kit completo de herramientas de jardín y construcción Corona. 45 artículos: palas, rastrillos, herramientas manuales y eléctricas. Estado excelente.',
    categoria: 'herramientas',
    precioBase: 380000,
    precioActual: 480000,
    incrementoMinimo: 8000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 9 * 60 * 60 * 1000).toISOString(),
    fechaFin: addHours(8),
    vendedorId: 'v-002',
    vendedor: MOCK_VENDEDORES[1],
    region: 'V',
    comuna: 'Valparaíso',
    loteNumero: 'COR-2026-034',
    pesoKg: 65,
    condicion: 'como_nuevo',
    retailerOrigen: 'Corona',
    totalPujas: 3,
    createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-007',
    titulo: 'Computación y Gaming Falabella — 20 unidades',
    descripcion:
      'Lote de computación de Falabella: laptops, monitores, teclados gaming y accesorios. Retornos en caja abierta. Garantía de fábrica vigente en mayoría.',
    categoria: 'computacion',
    precioBase: 1800000,
    precioActual: 2100000,
    incrementoMinimo: 50000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(),
    fechaFin: addDays(2),
    vendedorId: 'v-001',
    vendedor: MOCK_VENDEDORES[0],
    region: 'RM',
    comuna: 'Providencia',
    loteNumero: 'FAL-2026-089',
    pesoKg: 55,
    condicion: 'como_nuevo',
    retailerOrigen: 'Falabella',
    totalPujas: 22,
    createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-008',
    titulo: 'Ropa Deportiva Ripley — Colección Otoño 2025',
    descripcion:
      'Colección deportiva de Ripley temporada otoño 2025. 150 prendas: poleras, shorts, zapatillas y equipamiento deportivo. Marcas Nike, Adidas, Puma.',
    categoria: 'deportes',
    precioBase: 320000,
    precioActual: 390000,
    incrementoMinimo: 5000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
    fechaFin: addHours(15),
    vendedorId: 'v-002',
    vendedor: MOCK_VENDEDORES[1],
    region: 'IX',
    comuna: 'Temuco',
    loteNumero: 'RIP-2026-056',
    pesoKg: 78,
    condicion: 'nuevo',
    retailerOrigen: 'Ripley',
    totalPujas: 9,
    createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-009',
    titulo: 'Artículos de Hogar Paris — 80 unidades variadas',
    descripcion:
      'Artículos de hogar de Paris: vajilla, cojines, cuadros, lámparas y decoración. Productos de temporada con packaging dañado. Interior perfecto.',
    categoria: 'hogar',
    precioBase: 190000,
    precioActual: 230000,
    incrementoMinimo: 3000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
    fechaFin: addHours(18),
    vendedorId: 'v-003',
    vendedor: MOCK_VENDEDORES[2],
    region: 'RM',
    comuna: 'La Florida',
    loteNumero: 'PAR-2026-078',
    pesoKg: 110,
    condicion: 'nuevo',
    retailerOrigen: 'Paris',
    totalPujas: 4,
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-010',
    titulo: 'Televisores Samsung y LG — 8 unidades',
    descripcion:
      'Televisores 55" y 65" Samsung y LG de exhibición. Mínimos rayones en bisel. Paneles perfectos. Sin caja original. Cables incluidos.',
    categoria: 'electronica',
    precioBase: 890000,
    precioActual: 1050000,
    incrementoMinimo: 20000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    fechaFin: addDays(1),
    vendedorId: 'v-001',
    vendedor: MOCK_VENDEDORES[0],
    region: 'VIII',
    comuna: 'Talcahuano',
    loteNumero: 'FAL-2026-102',
    pesoKg: 180,
    volumenM3: 4.2,
    condicion: 'bueno',
    retailerOrigen: 'Falabella',
    totalPujas: 18,
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-011',
    titulo: 'Calzado Ripley — 120 pares mixtos',
    descripcion:
      'Calzado de temporada de Ripley: zapatillas, botines, sandalias y zapatos de vestir. 120 pares, tallas 35-44 hombre y mujer. Marcas nacionales e importadas.',
    categoria: 'ropa',
    precioBase: 240000,
    precioActual: 290000,
    incrementoMinimo: 5000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    fechaFin: addHours(32),
    vendedorId: 'v-002',
    vendedor: MOCK_VENDEDORES[1],
    region: 'V',
    comuna: 'Quilpué',
    loteNumero: 'RIP-2026-091',
    pesoKg: 88,
    condicion: 'nuevo',
    retailerOrigen: 'Ripley',
    totalPujas: 6,
    createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lot-012',
    titulo: 'Bicicletas y Accesorios Lider — 12 unidades',
    descripcion:
      'Bicicletas de montaña y urbanas de Lider más accesorios. 12 unidades: 7 adulto, 3 niños, 2 eléctricas. Exhibición con uso mínimo. Incluye cascos y candados.',
    categoria: 'deportes',
    precioBase: 650000,
    precioActual: 780000,
    incrementoMinimo: 15000,
    estado: 'activo',
    fechaInicio: new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString(),
    fechaFin: addDays(3),
    vendedorId: 'v-003',
    vendedor: MOCK_VENDEDORES[2],
    region: 'RM',
    comuna: 'Puente Alto',
    loteNumero: 'LID-2026-112',
    pesoKg: 145,
    volumenM3: 6,
    condicion: 'como_nuevo',
    retailerOrigen: 'Lider',
    totalPujas: 11,
    createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Returns a lote by ID from mock data.
 * @param id - Lot ID
 */
export function getLoteById(id: string): Lote | undefined {
  return MOCK_LOTES.find((l) => l.id === id);
}

/**
 * Returns lotes filtered by category.
 * @param categoria - Category slug
 */
export function getLotesByCategoria(categoria: string): Lote[] {
  return MOCK_LOTES.filter((l) => l.categoria === categoria);
}

/**
 * Returns lotes sorted by time remaining (ascending — ending soonest first).
 */
export function getLotesTerminandoPronto(limit = 6): Lote[] {
  return [...MOCK_LOTES]
    .filter((l) => l.estado === 'activo')
    .sort((a, b) => new Date(a.fechaFin).getTime() - new Date(b.fechaFin).getTime())
    .slice(0, limit);
}
