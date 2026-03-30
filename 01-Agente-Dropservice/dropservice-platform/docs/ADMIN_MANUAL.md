# Admin Manual - Drop-Servicing Dashboard

## 🔐 Acceso

El panel de administración está ubicado en `/admin`. Solo usuarios con rol `ADMIN` pueden acceder.

## 🎛️ Dashboard Principal

Al ingresar, verás un resumen ejecutivo con:

- **KPIs**: Ingresos, Órdenes Activas, Cotizaciones Pendientes.
- **Actividad Reciente**: Últimas órdenes y cotizaciones generadas.
- **Distribución de Estados**: Gráfico visual del estado de todas las cotizaciones.

## 🛠️ Gestión de Servicios (Catálogo)

**Ubicación:** `/admin/services`

Desde aquí controlas lo que ven los clientes en el "Cotizador".

### Crear Nuevo Servicio

1. Haz clic en **+ Nuevo Servicio**.
2. Completa los campos:
   - **Nombre**: Título público del servicio.
   - **Categoría**: Agrupación lógica.
   - **Precio Referencia**: Valor interno (NO visible al cliente, usado para tus cálculos).
   - **Imagen**: URL pública de la imagen representativa.
   - **Estado**: Activo/Inactivo (Inactivo no aparece en el catálogo).

### Editar Servicio

Haz clic en el botón "Editar" en la tabla de servicios para modificar cualquier dato.

---

## ⚡ Gestión de Cotizaciones

**Ubicación:** `/admin/quotations`

El corazón de la operación. Aquí gestionas el flujo desde que el cliente pide hasta que se entrega.

### Flujo de Vida

1. **RECIBIDA**: El cliente llenó el formulario.
2. **PENDIENTE ASIGNACIÓN**: Debes abrir la cotización y asignar un Proveedor.
3. **AUDITADA**: El proveedor ha sido notificado y debe enviar su costo.
4. **READY FOR APPROVAL**: Tienes los costos. El sistema calcula el margen. Tú apruebas el precio final para el cliente.
5. **COTIZADA**: El cliente recibe el precio y puede pagar.
6. **APROBADA/PAGADA**: El cliente pagó. Se genera una Orden automática.

### Logística del Evento 🚚

En el detalle de cada cotización (`/admin/quotations/[id]`), verás un bloque **"Logística del Evento"** con:

- Fecha y Hora del evento.
- Dirección de entrega.
- Horarios de Montaje y Desmontaje.
**Usa esta info para asignar al proveedor más adecuado por zona/horario.**

---

## 👥 Gestión de Proveedores

**Ubicación:** `/admin/providers` (Futura implementación visual completa)

Actualmente, los proveedores se gestionan desde la base de datos o registro directo. Al asignar en una cotización, verás su **Rating** y **Nivel de cumplimiento**.

## 🛡️ Seguridad y Roles

- **NUNCA** compartas tu acceso de Admin.
- Los Proveedores **NUNCA** ven los datos de contacto del Cliente.
- Los Clientes **NUNCA** ven el precio de costo ni quién es el proveedor.

---
*Generado por Drop-Service AI Platform*
