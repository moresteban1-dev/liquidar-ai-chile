# Dropservice Platform - API Reference v2.0

**Version:** 2.0.0  
**Updated:** Sprint 2  
**Total Endpoints:** 22

---

## 📑 Table of Contents

### Orders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/orders | client, admin | Create order |
| GET | /api/orders | all | List orders (role-filtered) |
| GET | /api/orders/:id | all | Get order by ID |
| PATCH | /api/orders/:id/state | all | Transition state |
| DELETE | /api/orders/:id | client, admin | Delete order |
| POST | /api/orders/:id/assign-provider | admin | Assign provider |
| GET | /api/orders/:id/quotations | all | List quotations |

### Quotations
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/quotations | provider, admin | Create quotation |
| PATCH | /api/quotations/:id | provider, admin | Update quotation |
| POST | /api/quotations/:id/submit | provider | Submit to admin |
| POST | /api/quotations/:id/send-to-client | admin | Send to client |
| POST | /api/quotations/:id/approve | client, admin | Approve |
| POST | /api/quotations/:id/reject | client, admin | Reject |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/admin/dashboard | admin | Dashboard data |
| GET | /api/admin/feature-flags | admin | List flags |
| PATCH | /api/admin/feature-flags | admin | Update flag |
| GET | /api/admin/migration/status | admin | Migration status |
| POST | /api/admin/migration/advance | admin | Advance rollout |
| PUT | /api/admin/migration/rollback | admin | Rollback |
| POST | /api/admin/migration/emergency | admin | Emergency stop |

### System
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | none | Health check |

---

## 🔐 Authentication

All endpoints (except /api/health) require JWT Bearer token:

```bash
Authorization: Bearer <SUPABASE_JWT_TOKEN>
```

---

## 👔 Role Permissions Matrix

| Action | Admin | Provider | Client |
|--------|-------|----------|--------|
| Create Order | ✅ | ❌ | ✅ |
| List Orders | ✅ (All) | ✅ (Assigned) | ✅ (Own) |
| Transition State | ✅ (All) | ⚠️ (Delivered) | ⚠️ (Approve/Cancel) |
| Delete Order | ✅ | ❌ | ⚠️ (Draft only) |
| Create Quotation| ✅ | ✅ (Assigned) | ❌ |

---

## 📦 Orders API

### POST /api/orders
Creates a new order in DRAFT state.

**Request:**
```json
{
  "clientId": "uuid",
  "eventDate": "2026-12-25T00:00:00.000Z",
  "deliveryAddress": "Address..."
}
```

### GET /api/orders
List orders with pagination.
`GET /api/orders?page=1&pageSize=20&state=DRAFT`

---

## 💰 Quotations API

### POST /api/quotations
Provider creates a quotation.

**Request:**
```json
{
  "orderId": "uuid",
  "providerCost": 50000,
  "currency": "MXN",
  "commissionRate": 0.25,
  "serviceDescription": "..."
}
```

---

## 🏥 System API

### GET /api/health
Public endpoint to check system status.
