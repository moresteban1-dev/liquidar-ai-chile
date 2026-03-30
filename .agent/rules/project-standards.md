# Constitución del Proyecto: EventHub-AI (Pivote Estratégico)

## 1. Ley de Arquitectura Hexagonal (Puertos y Adaptadores)

* **El Núcleo (Domain) es sagrado**: Nunca debe importar librerías de infraestructura (Prisma, Next.js, UI Components).
* **Inversión de Dependencia**: La UI y la BD dependen del Dominio, nunca al revés.
* **UI Agnostica**: El Frontend es un "Adaptador Tonto". No calcula reglas de negocio (ej. precios o disponibilidad); solo visualiza lo que el puerto del Dominio le entrega.

## 2. Ley de Localización (Español Estricto)

* **Código Interno (Tripas)**: Variables, clases y funciones en **INGLÉS** técnico (ej: `EventService`, `checkAvailability`).
* **Capa de Presentación (Piel)**: Todo texto visible (Botones, Títulos, Alertas, Logs de usuario) debe estar en **ESPAÑOL** nativo.
* **Glosario Obligatorio**:
  * Quote → "Cotización"
  * Booking → "Reserva"
  * Rental → "Arriendo"
  * Schedule → "Agenda/Calendario"

## 3. Ley de Seguridad (RBAC)

* **Seguridad en Puertos**: La seguridad se define en los Puertos de Entrada (Casos de Uso), no solo en la UI.
* **Ocultar != Proteger**: Ocultar un botón no es seguridad; el endpoint debe validar el rol.
