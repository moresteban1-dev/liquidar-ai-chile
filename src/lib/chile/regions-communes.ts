/**
 * @file regions-communes.ts
 * @description Official Chilean administrative regions and their communes.
 * Data source: División Político-Administrativa de Chile (SUBDERE).
 *
 * 16 Regiones oficiales con todas sus comunas.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Commune {
  id: string;
  name: string;
  regionId: string;
}

export interface Region {
  id: string;
  name: string;
  romanNumeral: string;
  capital: string;
  communes: Commune[];
}

// ─── Dataset ──────────────────────────────────────────────────────────────────

const REGIONS_DATA: Region[] = [
  {
    id: 'XV',
    name: 'Arica y Parinacota',
    romanNumeral: 'XV',
    capital: 'Arica',
    communes: [
      { id: 'XV-001', name: 'Arica', regionId: 'XV' },
      { id: 'XV-002', name: 'Camarones', regionId: 'XV' },
      { id: 'XV-003', name: 'Putre', regionId: 'XV' },
      { id: 'XV-004', name: 'General Lagos', regionId: 'XV' },
    ],
  },
  {
    id: 'I',
    name: 'Tarapacá',
    romanNumeral: 'I',
    capital: 'Iquique',
    communes: [
      { id: 'I-001', name: 'Iquique', regionId: 'I' },
      { id: 'I-002', name: 'Alto Hospicio', regionId: 'I' },
      { id: 'I-003', name: 'Pozo Almonte', regionId: 'I' },
      { id: 'I-004', name: 'Camiña', regionId: 'I' },
      { id: 'I-005', name: 'Colchane', regionId: 'I' },
      { id: 'I-006', name: 'Huara', regionId: 'I' },
      { id: 'I-007', name: 'Pica', regionId: 'I' },
    ],
  },
  {
    id: 'II',
    name: 'Antofagasta',
    romanNumeral: 'II',
    capital: 'Antofagasta',
    communes: [
      { id: 'II-001', name: 'Antofagasta', regionId: 'II' },
      { id: 'II-002', name: 'Mejillones', regionId: 'II' },
      { id: 'II-003', name: 'Sierra Gorda', regionId: 'II' },
      { id: 'II-004', name: 'Taltal', regionId: 'II' },
      { id: 'II-005', name: 'Calama', regionId: 'II' },
      { id: 'II-006', name: 'Ollagüe', regionId: 'II' },
      { id: 'II-007', name: 'San Pedro de Atacama', regionId: 'II' },
      { id: 'II-008', name: 'Tocopilla', regionId: 'II' },
      { id: 'II-009', name: 'María Elena', regionId: 'II' },
    ],
  },
  {
    id: 'III',
    name: 'Atacama',
    romanNumeral: 'III',
    capital: 'Copiapó',
    communes: [
      { id: 'III-001', name: 'Copiapó', regionId: 'III' },
      { id: 'III-002', name: 'Caldera', regionId: 'III' },
      { id: 'III-003', name: 'Tierra Amarilla', regionId: 'III' },
      { id: 'III-004', name: 'Chañaral', regionId: 'III' },
      { id: 'III-005', name: 'Diego de Almagro', regionId: 'III' },
      { id: 'III-006', name: 'Vallenar', regionId: 'III' },
      { id: 'III-007', name: 'Alto del Carmen', regionId: 'III' },
      { id: 'III-008', name: 'Freirina', regionId: 'III' },
      { id: 'III-009', name: 'Huasco', regionId: 'III' },
    ],
  },
  {
    id: 'IV',
    name: 'Coquimbo',
    romanNumeral: 'IV',
    capital: 'La Serena',
    communes: [
      { id: 'IV-001', name: 'La Serena', regionId: 'IV' },
      { id: 'IV-002', name: 'Coquimbo', regionId: 'IV' },
      { id: 'IV-003', name: 'Andacollo', regionId: 'IV' },
      { id: 'IV-004', name: 'La Higuera', regionId: 'IV' },
      { id: 'IV-005', name: 'Paiguano', regionId: 'IV' },
      { id: 'IV-006', name: 'Vicuña', regionId: 'IV' },
      { id: 'IV-007', name: 'Illapel', regionId: 'IV' },
      { id: 'IV-008', name: 'Canela', regionId: 'IV' },
      { id: 'IV-009', name: 'Los Vilos', regionId: 'IV' },
      { id: 'IV-010', name: 'Salamanca', regionId: 'IV' },
      { id: 'IV-011', name: 'Ovalle', regionId: 'IV' },
      { id: 'IV-012', name: 'Combarbalá', regionId: 'IV' },
      { id: 'IV-013', name: 'Monte Patria', regionId: 'IV' },
      { id: 'IV-014', name: 'Punitaqui', regionId: 'IV' },
      { id: 'IV-015', name: 'Río Hurtado', regionId: 'IV' },
    ],
  },
  {
    id: 'V',
    name: 'Valparaíso',
    romanNumeral: 'V',
    capital: 'Valparaíso',
    communes: [
      { id: 'V-001', name: 'Valparaíso', regionId: 'V' },
      { id: 'V-002', name: 'Casablanca', regionId: 'V' },
      { id: 'V-003', name: 'Concón', regionId: 'V' },
      { id: 'V-004', name: 'Juan Fernández', regionId: 'V' },
      { id: 'V-005', name: 'Puchuncaví', regionId: 'V' },
      { id: 'V-006', name: 'Quintero', regionId: 'V' },
      { id: 'V-007', name: 'Viña del Mar', regionId: 'V' },
      { id: 'V-008', name: 'Isla de Pascua', regionId: 'V' },
      { id: 'V-009', name: 'Los Andes', regionId: 'V' },
      { id: 'V-010', name: 'Calle Larga', regionId: 'V' },
      { id: 'V-011', name: 'Rinconada', regionId: 'V' },
      { id: 'V-012', name: 'San Esteban', regionId: 'V' },
      { id: 'V-013', name: 'La Ligua', regionId: 'V' },
      { id: 'V-014', name: 'Cabildo', regionId: 'V' },
      { id: 'V-015', name: 'Papudo', regionId: 'V' },
      { id: 'V-016', name: 'Petorca', regionId: 'V' },
      { id: 'V-017', name: 'Zapallar', regionId: 'V' },
      { id: 'V-018', name: 'Quillota', regionId: 'V' },
      { id: 'V-019', name: 'Calera', regionId: 'V' },
      { id: 'V-020', name: 'Hijuelas', regionId: 'V' },
      { id: 'V-021', name: 'La Cruz', regionId: 'V' },
      { id: 'V-022', name: 'Nogales', regionId: 'V' },
      { id: 'V-023', name: 'San Antonio', regionId: 'V' },
      { id: 'V-024', name: 'Algarrobo', regionId: 'V' },
      { id: 'V-025', name: 'Cartagena', regionId: 'V' },
      { id: 'V-026', name: 'El Quisco', regionId: 'V' },
      { id: 'V-027', name: 'El Tabo', regionId: 'V' },
      { id: 'V-028', name: 'Santo Domingo', regionId: 'V' },
      { id: 'V-029', name: 'San Felipe', regionId: 'V' },
      { id: 'V-030', name: 'Catemu', regionId: 'V' },
      { id: 'V-031', name: 'Llaillay', regionId: 'V' },
      { id: 'V-032', name: 'Panquehue', regionId: 'V' },
      { id: 'V-033', name: 'Putaendo', regionId: 'V' },
      { id: 'V-034', name: 'Santa María', regionId: 'V' },
      { id: 'V-035', name: 'Quilpué', regionId: 'V' },
      { id: 'V-036', name: 'Limache', regionId: 'V' },
      { id: 'V-037', name: 'Olmué', regionId: 'V' },
      { id: 'V-038', name: 'Villa Alemana', regionId: 'V' },
    ],
  },
  {
    id: 'RM',
    name: 'Metropolitana de Santiago',
    romanNumeral: 'RM',
    capital: 'Santiago',
    communes: [
      { id: 'RM-001', name: 'Santiago', regionId: 'RM' },
      { id: 'RM-002', name: 'Cerrillos', regionId: 'RM' },
      { id: 'RM-003', name: 'Cerro Navia', regionId: 'RM' },
      { id: 'RM-004', name: 'Conchalí', regionId: 'RM' },
      { id: 'RM-005', name: 'El Bosque', regionId: 'RM' },
      { id: 'RM-006', name: 'Estación Central', regionId: 'RM' },
      { id: 'RM-007', name: 'Huechuraba', regionId: 'RM' },
      { id: 'RM-008', name: 'Independencia', regionId: 'RM' },
      { id: 'RM-009', name: 'La Cisterna', regionId: 'RM' },
      { id: 'RM-010', name: 'La Florida', regionId: 'RM' },
      { id: 'RM-011', name: 'La Granja', regionId: 'RM' },
      { id: 'RM-012', name: 'La Pintana', regionId: 'RM' },
      { id: 'RM-013', name: 'La Reina', regionId: 'RM' },
      { id: 'RM-014', name: 'Las Condes', regionId: 'RM' },
      { id: 'RM-015', name: 'Lo Barnechea', regionId: 'RM' },
      { id: 'RM-016', name: 'Lo Espejo', regionId: 'RM' },
      { id: 'RM-017', name: 'Lo Prado', regionId: 'RM' },
      { id: 'RM-018', name: 'Macul', regionId: 'RM' },
      { id: 'RM-019', name: 'Maipú', regionId: 'RM' },
      { id: 'RM-020', name: 'Ñuñoa', regionId: 'RM' },
      { id: 'RM-021', name: 'Pedro Aguirre Cerda', regionId: 'RM' },
      { id: 'RM-022', name: 'Peñalolén', regionId: 'RM' },
      { id: 'RM-023', name: 'Providencia', regionId: 'RM' },
      { id: 'RM-024', name: 'Pudahuel', regionId: 'RM' },
      { id: 'RM-025', name: 'Quilicura', regionId: 'RM' },
      { id: 'RM-026', name: 'Quinta Normal', regionId: 'RM' },
      { id: 'RM-027', name: 'Recoleta', regionId: 'RM' },
      { id: 'RM-028', name: 'Renca', regionId: 'RM' },
      { id: 'RM-029', name: 'San Joaquín', regionId: 'RM' },
      { id: 'RM-030', name: 'San Miguel', regionId: 'RM' },
      { id: 'RM-031', name: 'San Ramón', regionId: 'RM' },
      { id: 'RM-032', name: 'Vitacura', regionId: 'RM' },
      { id: 'RM-033', name: 'Puente Alto', regionId: 'RM' },
      { id: 'RM-034', name: 'Pirque', regionId: 'RM' },
      { id: 'RM-035', name: 'San José de Maipo', regionId: 'RM' },
      { id: 'RM-036', name: 'Colina', regionId: 'RM' },
      { id: 'RM-037', name: 'Lampa', regionId: 'RM' },
      { id: 'RM-038', name: 'Tiltil', regionId: 'RM' },
      { id: 'RM-039', name: 'San Bernardo', regionId: 'RM' },
      { id: 'RM-040', name: 'Buin', regionId: 'RM' },
      { id: 'RM-041', name: 'Calera de Tango', regionId: 'RM' },
      { id: 'RM-042', name: 'Paine', regionId: 'RM' },
      { id: 'RM-043', name: 'Melipilla', regionId: 'RM' },
      { id: 'RM-044', name: 'Alhué', regionId: 'RM' },
      { id: 'RM-045', name: 'Curacaví', regionId: 'RM' },
      { id: 'RM-046', name: 'María Pinto', regionId: 'RM' },
      { id: 'RM-047', name: 'San Pedro', regionId: 'RM' },
      { id: 'RM-048', name: 'Talagante', regionId: 'RM' },
      { id: 'RM-049', name: 'El Monte', regionId: 'RM' },
      { id: 'RM-050', name: 'Isla de Maipo', regionId: 'RM' },
      { id: 'RM-051', name: 'Padre Hurtado', regionId: 'RM' },
      { id: 'RM-052', name: 'Peñaflor', regionId: 'RM' },
    ],
  },
  {
    id: 'VI',
    name: "O'Higgins",
    romanNumeral: 'VI',
    capital: 'Rancagua',
    communes: [
      { id: 'VI-001', name: 'Rancagua', regionId: 'VI' },
      { id: 'VI-002', name: 'Codegua', regionId: 'VI' },
      { id: 'VI-003', name: 'Coinco', regionId: 'VI' },
      { id: 'VI-004', name: 'Coltauco', regionId: 'VI' },
      { id: 'VI-005', name: 'Doñihue', regionId: 'VI' },
      { id: 'VI-006', name: 'Graneros', regionId: 'VI' },
      { id: 'VI-007', name: 'Las Cabras', regionId: 'VI' },
      { id: 'VI-008', name: 'Machalí', regionId: 'VI' },
      { id: 'VI-009', name: 'Malloa', regionId: 'VI' },
      { id: 'VI-010', name: 'Mostazal', regionId: 'VI' },
      { id: 'VI-011', name: 'Olivar', regionId: 'VI' },
      { id: 'VI-012', name: 'Peumo', regionId: 'VI' },
      { id: 'VI-013', name: 'Pichidegua', regionId: 'VI' },
      { id: 'VI-014', name: 'Quinta de Tilcoco', regionId: 'VI' },
      { id: 'VI-015', name: 'Rengo', regionId: 'VI' },
      { id: 'VI-016', name: 'Requínoa', regionId: 'VI' },
      { id: 'VI-017', name: 'San Vicente', regionId: 'VI' },
      { id: 'VI-018', name: 'Pichilemu', regionId: 'VI' },
      { id: 'VI-019', name: 'La Estrella', regionId: 'VI' },
      { id: 'VI-020', name: 'Litueche', regionId: 'VI' },
      { id: 'VI-021', name: 'Marchihue', regionId: 'VI' },
      { id: 'VI-022', name: 'Navidad', regionId: 'VI' },
      { id: 'VI-023', name: 'Paredones', regionId: 'VI' },
      { id: 'VI-024', name: 'San Fernando', regionId: 'VI' },
      { id: 'VI-025', name: 'Chépica', regionId: 'VI' },
      { id: 'VI-026', name: 'Chimbarongo', regionId: 'VI' },
      { id: 'VI-027', name: 'Lolol', regionId: 'VI' },
      { id: 'VI-028', name: 'Nancagua', regionId: 'VI' },
      { id: 'VI-029', name: 'Palmilla', regionId: 'VI' },
      { id: 'VI-030', name: 'Peralillo', regionId: 'VI' },
      { id: 'VI-031', name: 'Placilla', regionId: 'VI' },
      { id: 'VI-032', name: 'Pumanque', regionId: 'VI' },
      { id: 'VI-033', name: 'Santa Cruz', regionId: 'VI' },
    ],
  },
  {
    id: 'VII',
    name: 'Maule',
    romanNumeral: 'VII',
    capital: 'Talca',
    communes: [
      { id: 'VII-001', name: 'Talca', regionId: 'VII' },
      { id: 'VII-002', name: 'Constitución', regionId: 'VII' },
      { id: 'VII-003', name: 'Curepto', regionId: 'VII' },
      { id: 'VII-004', name: 'Empedrado', regionId: 'VII' },
      { id: 'VII-005', name: 'Maule', regionId: 'VII' },
      { id: 'VII-006', name: 'Pelarco', regionId: 'VII' },
      { id: 'VII-007', name: 'Pencahue', regionId: 'VII' },
      { id: 'VII-008', name: 'Río Claro', regionId: 'VII' },
      { id: 'VII-009', name: 'San Clemente', regionId: 'VII' },
      { id: 'VII-010', name: 'San Rafael', regionId: 'VII' },
      { id: 'VII-011', name: 'Cauquenes', regionId: 'VII' },
      { id: 'VII-012', name: 'Chanco', regionId: 'VII' },
      { id: 'VII-013', name: 'Pelluhue', regionId: 'VII' },
      { id: 'VII-014', name: 'Curicó', regionId: 'VII' },
      { id: 'VII-015', name: 'Hualañé', regionId: 'VII' },
      { id: 'VII-016', name: 'Licantén', regionId: 'VII' },
      { id: 'VII-017', name: 'Molina', regionId: 'VII' },
      { id: 'VII-018', name: 'Rauco', regionId: 'VII' },
      { id: 'VII-019', name: 'Romeral', regionId: 'VII' },
      { id: 'VII-020', name: 'Sagrada Familia', regionId: 'VII' },
      { id: 'VII-021', name: 'Teno', regionId: 'VII' },
      { id: 'VII-022', name: 'Vichuquén', regionId: 'VII' },
      { id: 'VII-023', name: 'Linares', regionId: 'VII' },
      { id: 'VII-024', name: 'Colbún', regionId: 'VII' },
      { id: 'VII-025', name: 'Longaví', regionId: 'VII' },
      { id: 'VII-026', name: 'Parral', regionId: 'VII' },
      { id: 'VII-027', name: 'Retiro', regionId: 'VII' },
      { id: 'VII-028', name: 'San Javier', regionId: 'VII' },
      { id: 'VII-029', name: 'Villa Alegre', regionId: 'VII' },
      { id: 'VII-030', name: 'Yerbas Buenas', regionId: 'VII' },
    ],
  },
  {
    id: 'XVI',
    name: 'Ñuble',
    romanNumeral: 'XVI',
    capital: 'Chillán',
    communes: [
      { id: 'XVI-001', name: 'Chillán', regionId: 'XVI' },
      { id: 'XVI-002', name: 'Bulnes', regionId: 'XVI' },
      { id: 'XVI-003', name: 'Chillán Viejo', regionId: 'XVI' },
      { id: 'XVI-004', name: 'El Carmen', regionId: 'XVI' },
      { id: 'XVI-005', name: 'Pemuco', regionId: 'XVI' },
      { id: 'XVI-006', name: 'Pinto', regionId: 'XVI' },
      { id: 'XVI-007', name: 'Quillón', regionId: 'XVI' },
      { id: 'XVI-008', name: 'San Ignacio', regionId: 'XVI' },
      { id: 'XVI-009', name: 'Yungay', regionId: 'XVI' },
      { id: 'XVI-010', name: 'Quirihue', regionId: 'XVI' },
      { id: 'XVI-011', name: 'Cobquecura', regionId: 'XVI' },
      { id: 'XVI-012', name: 'Coelemu', regionId: 'XVI' },
      { id: 'XVI-013', name: 'Ninhue', regionId: 'XVI' },
      { id: 'XVI-014', name: 'Portezuelo', regionId: 'XVI' },
      { id: 'XVI-015', name: 'Ránquil', regionId: 'XVI' },
      { id: 'XVI-016', name: 'Treguaco', regionId: 'XVI' },
      { id: 'XVI-017', name: 'San Carlos', regionId: 'XVI' },
      { id: 'XVI-018', name: 'Coihueco', regionId: 'XVI' },
      { id: 'XVI-019', name: 'Ñiquén', regionId: 'XVI' },
      { id: 'XVI-020', name: 'San Fabián', regionId: 'XVI' },
      { id: 'XVI-021', name: 'San Nicolás', regionId: 'XVI' },
    ],
  },
  {
    id: 'VIII',
    name: 'Biobío',
    romanNumeral: 'VIII',
    capital: 'Concepción',
    communes: [
      { id: 'VIII-001', name: 'Concepción', regionId: 'VIII' },
      { id: 'VIII-002', name: 'Coronel', regionId: 'VIII' },
      { id: 'VIII-003', name: 'Chiguayante', regionId: 'VIII' },
      { id: 'VIII-004', name: 'Florida', regionId: 'VIII' },
      { id: 'VIII-005', name: 'Hualpén', regionId: 'VIII' },
      { id: 'VIII-006', name: 'Hualqui', regionId: 'VIII' },
      { id: 'VIII-007', name: 'Lota', regionId: 'VIII' },
      { id: 'VIII-008', name: 'Penco', regionId: 'VIII' },
      { id: 'VIII-009', name: 'San Pedro de la Paz', regionId: 'VIII' },
      { id: 'VIII-010', name: 'Santa Juana', regionId: 'VIII' },
      { id: 'VIII-011', name: 'Talcahuano', regionId: 'VIII' },
      { id: 'VIII-012', name: 'Tomé', regionId: 'VIII' },
      { id: 'VIII-013', name: 'Los Ángeles', regionId: 'VIII' },
      { id: 'VIII-014', name: 'Antuco', regionId: 'VIII' },
      { id: 'VIII-015', name: 'Cabrero', regionId: 'VIII' },
      { id: 'VIII-016', name: 'Laja', regionId: 'VIII' },
      { id: 'VIII-017', name: 'Mulchén', regionId: 'VIII' },
      { id: 'VIII-018', name: 'Nacimiento', regionId: 'VIII' },
      { id: 'VIII-019', name: 'Negrete', regionId: 'VIII' },
      { id: 'VIII-020', name: 'Quilaco', regionId: 'VIII' },
      { id: 'VIII-021', name: 'Quilleco', regionId: 'VIII' },
      { id: 'VIII-022', name: 'San Rosendo', regionId: 'VIII' },
      { id: 'VIII-023', name: 'Santa Bárbara', regionId: 'VIII' },
      { id: 'VIII-024', name: 'Tucapel', regionId: 'VIII' },
      { id: 'VIII-025', name: 'Yumbel', regionId: 'VIII' },
      { id: 'VIII-026', name: 'Alto Biobío', regionId: 'VIII' },
      { id: 'VIII-027', name: 'Arauco', regionId: 'VIII' },
      { id: 'VIII-028', name: 'Cañete', regionId: 'VIII' },
      { id: 'VIII-029', name: 'Contulmo', regionId: 'VIII' },
      { id: 'VIII-030', name: 'Curanilahue', regionId: 'VIII' },
      { id: 'VIII-031', name: 'Lebu', regionId: 'VIII' },
      { id: 'VIII-032', name: 'Los Álamos', regionId: 'VIII' },
      { id: 'VIII-033', name: 'Tirúa', regionId: 'VIII' },
    ],
  },
  {
    id: 'IX',
    name: 'La Araucanía',
    romanNumeral: 'IX',
    capital: 'Temuco',
    communes: [
      { id: 'IX-001', name: 'Temuco', regionId: 'IX' },
      { id: 'IX-002', name: 'Carahue', regionId: 'IX' },
      { id: 'IX-003', name: 'Cunco', regionId: 'IX' },
      { id: 'IX-004', name: 'Curarrehue', regionId: 'IX' },
      { id: 'IX-005', name: 'Freire', regionId: 'IX' },
      { id: 'IX-006', name: 'Galvarino', regionId: 'IX' },
      { id: 'IX-007', name: 'Gorbea', regionId: 'IX' },
      { id: 'IX-008', name: 'Lautaro', regionId: 'IX' },
      { id: 'IX-009', name: 'Loncoche', regionId: 'IX' },
      { id: 'IX-010', name: 'Melipeuco', regionId: 'IX' },
      { id: 'IX-011', name: 'Nueva Imperial', regionId: 'IX' },
      { id: 'IX-012', name: 'Padre Las Casas', regionId: 'IX' },
      { id: 'IX-013', name: 'Perquenco', regionId: 'IX' },
      { id: 'IX-014', name: 'Pitrufquén', regionId: 'IX' },
      { id: 'IX-015', name: 'Pucón', regionId: 'IX' },
      { id: 'IX-016', name: 'Renaico', regionId: 'IX' },
      { id: 'IX-017', name: 'Saavedra', regionId: 'IX' },
      { id: 'IX-018', name: 'Teodoro Schmidt', regionId: 'IX' },
      { id: 'IX-019', name: 'Toltén', regionId: 'IX' },
      { id: 'IX-020', name: 'Vilcún', regionId: 'IX' },
      { id: 'IX-021', name: 'Villarrica', regionId: 'IX' },
      { id: 'IX-022', name: 'Cholchol', regionId: 'IX' },
      { id: 'IX-023', name: 'Angol', regionId: 'IX' },
      { id: 'IX-024', name: 'Collipulli', regionId: 'IX' },
      { id: 'IX-025', name: 'Curacautín', regionId: 'IX' },
      { id: 'IX-026', name: 'Ercilla', regionId: 'IX' },
      { id: 'IX-027', name: 'Lonquimay', regionId: 'IX' },
      { id: 'IX-028', name: 'Los Sauces', regionId: 'IX' },
      { id: 'IX-029', name: 'Lumaco', regionId: 'IX' },
      { id: 'IX-030', name: 'Purén', regionId: 'IX' },
      { id: 'IX-031', name: 'Renaico', regionId: 'IX' },
      { id: 'IX-032', name: 'Traiguén', regionId: 'IX' },
      { id: 'IX-033', name: 'Victoria', regionId: 'IX' },
    ],
  },
  {
    id: 'XIV',
    name: 'Los Ríos',
    romanNumeral: 'XIV',
    capital: 'Valdivia',
    communes: [
      { id: 'XIV-001', name: 'Valdivia', regionId: 'XIV' },
      { id: 'XIV-002', name: 'Corral', regionId: 'XIV' },
      { id: 'XIV-003', name: 'Futrono', regionId: 'XIV' },
      { id: 'XIV-004', name: 'La Unión', regionId: 'XIV' },
      { id: 'XIV-005', name: 'Lago Ranco', regionId: 'XIV' },
      { id: 'XIV-006', name: 'Lanco', regionId: 'XIV' },
      { id: 'XIV-007', name: 'Los Lagos', regionId: 'XIV' },
      { id: 'XIV-008', name: 'Máfil', regionId: 'XIV' },
      { id: 'XIV-009', name: 'Mariquina', regionId: 'XIV' },
      { id: 'XIV-010', name: 'Paillaco', regionId: 'XIV' },
      { id: 'XIV-011', name: 'Panguipulli', regionId: 'XIV' },
      { id: 'XIV-012', name: 'Río Bueno', regionId: 'XIV' },
    ],
  },
  {
    id: 'X',
    name: 'Los Lagos',
    romanNumeral: 'X',
    capital: 'Puerto Montt',
    communes: [
      { id: 'X-001', name: 'Puerto Montt', regionId: 'X' },
      { id: 'X-002', name: 'Calbuco', regionId: 'X' },
      { id: 'X-003', name: 'Cochamó', regionId: 'X' },
      { id: 'X-004', name: 'Fresia', regionId: 'X' },
      { id: 'X-005', name: 'Frutillar', regionId: 'X' },
      { id: 'X-006', name: 'Los Muermos', regionId: 'X' },
      { id: 'X-007', name: 'Llanquihue', regionId: 'X' },
      { id: 'X-008', name: 'Maullín', regionId: 'X' },
      { id: 'X-009', name: 'Puerto Varas', regionId: 'X' },
      { id: 'X-010', name: 'Castro', regionId: 'X' },
      { id: 'X-011', name: 'Ancud', regionId: 'X' },
      { id: 'X-012', name: 'Chonchi', regionId: 'X' },
      { id: 'X-013', name: 'Curaco de Vélez', regionId: 'X' },
      { id: 'X-014', name: 'Dalcahue', regionId: 'X' },
      { id: 'X-015', name: 'Puqueldón', regionId: 'X' },
      { id: 'X-016', name: 'Queilén', regionId: 'X' },
      { id: 'X-017', name: 'Quellón', regionId: 'X' },
      { id: 'X-018', name: 'Quemchi', regionId: 'X' },
      { id: 'X-019', name: 'Quinchao', regionId: 'X' },
      { id: 'X-020', name: 'Osorno', regionId: 'X' },
      { id: 'X-021', name: 'Puerto Octay', regionId: 'X' },
      { id: 'X-022', name: 'Purranque', regionId: 'X' },
      { id: 'X-023', name: 'Puyehue', regionId: 'X' },
      { id: 'X-024', name: 'Río Negro', regionId: 'X' },
      { id: 'X-025', name: 'San Juan de la Costa', regionId: 'X' },
      { id: 'X-026', name: 'San Pablo', regionId: 'X' },
      { id: 'X-027', name: 'Chaitén', regionId: 'X' },
      { id: 'X-028', name: 'Futaleufú', regionId: 'X' },
      { id: 'X-029', name: 'Hualaihué', regionId: 'X' },
      { id: 'X-030', name: 'Palena', regionId: 'X' },
    ],
  },
  {
    id: 'XI',
    name: 'Aysén',
    romanNumeral: 'XI',
    capital: 'Coyhaique',
    communes: [
      { id: 'XI-001', name: 'Coyhaique', regionId: 'XI' },
      { id: 'XI-002', name: 'Lago Verde', regionId: 'XI' },
      { id: 'XI-003', name: 'Aysén', regionId: 'XI' },
      { id: 'XI-004', name: 'Cisnes', regionId: 'XI' },
      { id: 'XI-005', name: 'Guaitecas', regionId: 'XI' },
      { id: 'XI-006', name: 'Cochrane', regionId: 'XI' },
      { id: 'XI-007', name: "O'Higgins", regionId: 'XI' },
      { id: 'XI-008', name: 'Tortel', regionId: 'XI' },
      { id: 'XI-009', name: 'Chile Chico', regionId: 'XI' },
      { id: 'XI-010', name: 'Río Ibáñez', regionId: 'XI' },
    ],
  },
  {
    id: 'XII',
    name: 'Magallanes y la Antártica Chilena',
    romanNumeral: 'XII',
    capital: 'Punta Arenas',
    communes: [
      { id: 'XII-001', name: 'Punta Arenas', regionId: 'XII' },
      { id: 'XII-002', name: 'Laguna Blanca', regionId: 'XII' },
      { id: 'XII-003', name: 'Río Verde', regionId: 'XII' },
      { id: 'XII-004', name: 'San Gregorio', regionId: 'XII' },
      { id: 'XII-005', name: 'Cabo de Hornos', regionId: 'XII' },
      { id: 'XII-006', name: 'Antártica', regionId: 'XII' },
      { id: 'XII-007', name: 'Porvenir', regionId: 'XII' },
      { id: 'XII-008', name: 'Primavera', regionId: 'XII' },
      { id: 'XII-009', name: 'Timaukel', regionId: 'XII' },
      { id: 'XII-010', name: 'Natales', regionId: 'XII' },
      { id: 'XII-011', name: 'Torres del Paine', regionId: 'XII' },
    ],
  },
];

// ─── Service Class ────────────────────────────────────────────────────────────

/**
 * Provides static access to Chilean administrative regions and communes.
 * Data is pre-compiled at module load; no I/O or async operations.
 */
export class RegionsCommunes {
  private static readonly data: readonly Region[] = Object.freeze(REGIONS_DATA);

  /** Returns all 16 official regions with their communes. */
  public static getAll(): Region[] {
    return [...this.data];
  }

  /**
   * Finds a region by its official ID.
   * @param id - Region ID (e.g. 'RM', 'V', 'VIII')
   */
  public static getById(id: string): Region | undefined {
    return this.data.find((r) => r.id === id);
  }

  /**
   * Returns all communes for a given region.
   * @param regionId - Region ID (e.g. 'RM')
   */
  public static getCommunesByRegion(regionId: string): Commune[] {
    return this.getById(regionId)?.communes ?? [];
  }

  /**
   * Searches for a commune by name (case-insensitive, accent-tolerant).
   * @param name - Commune name to search
   */
  public static findCommune(name: string): Commune | undefined {
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const region of this.data) {
      const found = region.communes.find((c) => {
        const cn = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return cn === normalized;
      });
      if (found) return found;
    }
    return undefined;
  }

  /** Returns region names as a flat array for select dropdowns. */
  public static getRegionOptions(): Array<{ value: string; label: string }> {
    return this.data.map((r) => ({ value: r.id, label: r.name }));
  }

  /** Returns commune names for a region as options for select dropdowns. */
  public static getCommuneOptions(regionId: string): Array<{ value: string; label: string }> {
    return this.getCommunesByRegion(regionId).map((c) => ({
      value: c.id,
      label: c.name,
    }));
  }
}
