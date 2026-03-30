# Sprint 1 Planning

**Objetivo:** Implementar el dominio core funcional e integrar el primer flujo E2E real.

---

## 📋 Backlog Priorizado

1. **Order Aggregate Root**
   - Implementar FSM (Finite State Machine) para transiciones de estados.
   - Invariantes de negocio (no cancelar órdenes completadas, etc).
   - Domain Events integrados.

2. **QuotationPricing Aggregate**
   - Lógica de cálculo: `Costo + Comisión Admin + Fee Transaccional + Impuestos`.
   - Garantizar precios no negativos y consistencia decimal.

3. **Supabase Persistence Adapters**
   - Implementar `SupabaseOrderRepository`.
   - Implementar `SupabaseQuotationRepository`.

4. **Primer Caso de Uso (E2E)**
   - `CreateOrderHandler`: Orquestar creación, validación, persistencia y eventos.

---

## 📅 Definición de Done (DoD)

✅ Cobertura > 80% en lógica nueva.
✅ Cero errores de TypeScript y Lint.
✅ Deuda técnica documentada.
✅ Code Review por 2 ingenieros senior.
