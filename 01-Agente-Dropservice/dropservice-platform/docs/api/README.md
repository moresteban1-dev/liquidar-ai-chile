# Dropservice Platform - API Documentation

**Version:** 1.0.0  
**Base URL:** `https://api.dropservice.com` (Production)  
**Base URL:** `http://localhost:3000` (Development)

---

## 🔐 Authentication

All API endpoints require authentication via Supabase JWT tokens.

```bash
Authorization: Bearer <JWT_TOKEN>
```

## 📦 Resources

### Orders

#### Create Order
`POST /api/orders`

Description: Creates a new order in DRAFT state.

**Request Body:**
```json
{
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "eventDate": "2026-12-25T00:00:00.000Z",
  "eventType": "wedding",
  "estimatedGuests": 150,
  "deliveryAddress": "Av. Reforma 123, CDMX, México",
  "specialInstructions": "Vegetarian options required"
}
```

**Success Response (201 Created):**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "state": "DRAFT",
  "eventDate": "2026-12-25T00:00:00.000Z",
  "deliveryAddress": "Av. Reforma 123, CDMX, México",
  "isActive": true,
  "createdAt": "2026-03-19T10:30:00.000Z"
}
```

#### Get Order by ID
`GET /api/orders/:id`

**Success Response (200 OK):**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "state": "QUOTATION_PENDING",
  "pricing": {
    "finalPrice": 15532.40,
    "currency": "USD"
  }
}
```

#### Assign Provider to Order
`POST /api/orders/:id/assign-provider`

**Request Body:**
```json
{
  "providerId": "660e8400-e29b-41d4-a716-446655440001"
}
```

## 📊 Order State Machine
DRAFT → QUOTATION_PENDING → QUOTATION_SENT → QUOTATION_APPROVED → PAYMENT_PENDING → PAYMENT_RECEIVED → IN_PRODUCTION → DELIVERED → COMPLETED

## 💰 Pricing Structure
`finalPrice = providerCost + adminCommission + platformFee + taxes`
