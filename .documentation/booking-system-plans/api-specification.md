# API Specification

## 1. Overview

This document outlines the API endpoints for the healing services booking system. These endpoints facilitate client bookings, availability management, and administrative operations. The API follows REST principles and uses JSON for data exchange.

## 2. Base URL

All API routes are relative to the Next.js API base path:

- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

## 3. Authentication

### 3.1 Client Endpoints

Public client-facing endpoints don't require authentication:
- `GET /api/services`
- `GET /api/availability/*`
- `POST /api/bookings/public/*`
- `DELETE /api/bookings/public/cancel`

### 3.2 Admin Endpoints

Admin endpoints are protected using Clerk authentication with role-based access control:

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";
 
export default authMiddleware({
  publicRoutes: [
    "/",
    "/book/:path*",
    "/api/bookings/public/:path*",
    "/api/services",
    "/api/availability/:path*"
  ],
  ignoredRoutes: [
    "/api/webhooks/:path*"
  ]
});

// lib/auth.ts
import { clerkClient } from "@clerk/nextjs";

export async function hasPermission(userId: string, permission: string) {
  const user = await clerkClient.users.getUser(userId);
  const role = user.publicMetadata.role;
  
  const permissions = {
    admin: ["manage_bookings", "manage_services", "manage_availability"],
    staff: ["view_bookings"]
  };
  
  return role && permissions[role]?.includes(permission);
}

// Example middleware for protected routes
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function adminMiddleware(request: Request) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const hasAccess = await hasPermission(userId, "manage_bookings");
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  return NextResponse.next();
}
```

### 3.3 Route Protection Matrix

| Route | Public | Auth Required | Required Permission |
|-------|--------|--------------|-------------------|
| `/api/services` | ✅ | | |
| `/api/availability/*` | ✅ | | |
| `/api/bookings/public/*` | ✅ | | |
| `/api/admin/bookings/*` | | ✅ | manage_bookings |
| `/api/admin/services/*` | | ✅ | manage_services |
| `/api/admin/availability/*` | | ✅ | manage_availability |

## 4. Error Handling

All endpoints use consistent error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // Optional additional details
  }
}
```

Common error codes:
- `400`: Bad Request - Invalid input parameters
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource conflict (e.g., double booking)
- `500`: Internal Server Error - Unexpected server error

## 5. Client API Endpoints

### 5.1 Get Services

Retrieve all active services.

**Endpoint:** `GET /services`

**Response:**
```json
{
  "services": [
    {
      "id": "uuid",
      "title": "Service Name",
      "titleEn": "Service Name in English",
      "titleFi": "Service Name in Finnish",
      "description": "Service description",
      "descriptionEn": "Service description in English",
      "descriptionFi": "Service description in Finnish",
      "duration": 75,
      "price": 100,
      "currency": "EUR",
      "color": "#4F46E5"
    }
  ]
}
```

### 5.2 Get Available Dates

Retrieve available dates for a month.

**Endpoint:** `GET /availability/dates?year=2023&month=5&serviceId=uuid`

**Response:**
```json
{
  "availableDates": ["2023-05-01", "2023-05-02", "2023-05-05"],
  "blockedDates": ["2023-05-03", "2023-05-04"]
}
```

### 5.3 Get Available Time Slots

Retrieve available time slots for a specific date.

**Endpoint:** `GET /availability/slots?date=2023-05-01&serviceId=uuid`

**Response:**
```json
{
  "availableSlots": [
    {
      "startTime": "2023-05-01T10:00:00Z",
      "endTime": "2023-05-01T11:15:00Z"
    },
    {
      "startTime": "2023-05-01T13:00:00Z",
      "endTime": "2023-05-01T14:15:00Z"
    }
  ]
}
```

### 5.4 Create Booking

Create a new booking.

**Endpoint:** `POST /bookings`

**Request:**
```json
{
  "serviceId": "uuid",
  "startTime": "2023-05-01T10:00:00Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+358501234567",
  "language": "en",
  "notes": "Optional booking notes"
}
```

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "serviceId": "uuid",
    "startTime": "2023-05-01T10:00:00Z",
    "endTime": "2023-05-01T11:30:00Z",
    "status": "confirmed",
    "cancellationId": "unique-id-for-cancellation"
  }
}
```

### 5.5 Cancel Booking

Cancel an existing booking.

**Endpoint:** `DELETE /bookings/cancel?id=uuid&cancellationId=unique-id`

**Response:**
```json
{
  "success": true,
  "message": "Booking has been successfully canceled"
}
```

## 6. Admin API Endpoints

All admin endpoints require authentication.

### 6.1 Get All Bookings

Retrieve all bookings with optional filtering.

**Endpoint:** `GET /admin/bookings?from=2023-05-01&to=2023-05-31&status=confirmed`

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "serviceId": "uuid",
      "serviceName": "Service Name",
      "startTime": "2023-05-01T10:00:00Z",
      "endTime": "2023-05-01T11:30:00Z",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+358501234567",
      "language": "en",
      "notes": "Optional booking notes",
      "status": "confirmed",
      "createdAt": "2023-04-15T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pageSize": 10,
    "pages": 3
  }
}
```

### 6.2 Get Booking Details

Retrieve details for a specific booking.

**Endpoint:** `GET /admin/bookings/:id`

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "serviceId": "uuid",
    "serviceName": "Service Name",
    "startTime": "2023-05-01T10:00:00Z",
    "endTime": "2023-05-01T11:30:00Z",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+358501234567",
    "language": "en",
    "notes": "Optional booking notes",
    "status": "confirmed",
    "cancellationId": "unique-id",
    "createdAt": "2023-04-15T14:30:00Z",
    "updatedAt": "2023-04-15T14:30:00Z"
  }
}
```

### 6.3 Create Admin Booking

Create a booking as an admin (bypasses some validations).

**Endpoint:** `POST /admin/bookings`

**Request:**
```json
{
  "serviceId": "uuid",
  "startTime": "2023-05-01T10:00:00Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+358501234567",
  "language": "en",
  "notes": "Booking made by admin",
  "sendConfirmation": true
}
```

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "serviceId": "uuid",
    "startTime": "2023-05-01T10:00:00Z",
    "endTime": "2023-05-01T11:30:00Z",
    "status": "confirmed"
  }
}
```

### 6.4 Update Booking

Update an existing booking.

**Endpoint:** `PUT /admin/bookings/:id`

**Request:**
```json
{
  "startTime": "2023-05-01T14:00:00Z",
  "customerName": "John Doe Updated",
  "notes": "Updated notes",
  "status": "confirmed"
}
```

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "startTime": "2023-05-01T14:00:00Z",
    "endTime": "2023-05-01T15:30:00Z",
    "customerName": "John Doe Updated",
    "notes": "Updated notes",
    "status": "confirmed",
    "updatedAt": "2023-04-20T09:15:00Z"
  }
}
```

### 6.5 Cancel Booking (Admin)

Cancel a booking as admin.

**Endpoint:** `DELETE /admin/bookings/:id`

**Request:**
```json
{
  "sendNotification": true,
  "cancellationReason": "Service provider unavailable"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking has been successfully canceled"
}
```

### 6.6 Manage Services

#### Get All Services

**Endpoint:** `GET /admin/services`

**Response:**
```json
{
  "services": [
    {
      "id": "uuid",
      "title": "Service Name",
      "titleEn": "Service Name in English",
      "titleFi": "Service Name in Finnish",
      "description": "Service description",
      "descriptionEn": "Service description in English",
      "descriptionFi": "Service description in Finnish",
      "duration": 75,
      "price": 100,
      "currency": "EUR",
      "color": "#4F46E5",
      "active": true,
      "order": 1
    }
  ]
}
```

#### Create Service

**Endpoint:** `POST /admin/services`

**Request:**
```json
{
  "title": "New Service",
  "titleEn": "New Service in English",
  "titleFi": "New Service in Finnish",
  "description": "Service description",
  "descriptionEn": "Service description in English",
  "descriptionFi": "Service description in Finnish",
  "duration": 75,
  "price": 100,
  "currency": "EUR",
  "color": "#4F46E5",
  "active": true,
  "order": 2
}
```

**Response:**
```json
{
  "service": {
    "id": "uuid",
    "title": "New Service",
    "titleEn": "New Service in English",
    "titleFi": "New Service in Finnish",
    "description": "Service description",
    "descriptionEn": "Service description in English",
    "descriptionFi": "Service description in Finnish",
    "duration": 75,
    "price": 100,
    "currency": "EUR",
    "color": "#4F46E5",
    "active": true,
    "order": 2
  }
}
```

#### Update Service

**Endpoint:** `PUT /admin/services/:id`

**Request:**
```json
{
  "title": "Updated Service",
  "duration": 90,
  "active": false
}
```

**Response:**
```json
{
  "service": {
    "id": "uuid",
    "title": "Updated Service",
    "duration": 90,
    "active": false
  }
}
```

#### Delete Service

**Endpoint:** `DELETE /admin/services/:id`

**Response:**
```json
{
  "success": true,
  "message": "Service has been successfully deleted"
}
```

### 6.7 Manage Availability

#### Get Availability Settings

**Endpoint:** `GET /admin/availability?from=2023-05-01&to=2023-05-31`

**Response:**
```json
{
  "regularHours": [
    {
      "id": "uuid",
      "dayOfWeek": 1,
      "startTime": "10:00:00",
      "endTime": "18:00:00",
      "isAvailable": true
    }
  ],
  "specialDates": [
    {
      "id": "uuid",
      "date": "2023-05-15",
      "startTime": "12:00:00",
      "endTime": "20:00:00",
      "isAvailable": true
    }
  ],
  "blockedDates": [
    {
      "id": "uuid",
      "date": "2023-05-01",
      "reason": "Public Holiday"
    }
  ]
}
```

#### Set Regular Hours

**Endpoint:** `POST /admin/availability/regular`

**Request:**
```json
{
  "dayOfWeek": 1,
  "startTime": "10:00:00",
  "endTime": "18:00:00",
  "isAvailable": true
}
```

**Response:**
```json
{
  "availability": {
    "id": "uuid",
    "dayOfWeek": 1,
    "startTime": "10:00:00",
    "endTime": "18:00:00",
    "isAvailable": true
  }
}
```

#### Set Special Date

**Endpoint:** `POST /admin/availability/special`

**Request:**
```json
{
  "date": "2023-05-15",
  "startTime": "12:00:00",
  "endTime": "20:00:00",
  "isAvailable": true
}
```

**Response:**
```json
{
  "availability": {
    "id": "uuid",
    "date": "2023-05-15",
    "startTime": "12:00:00",
    "endTime": "20:00:00",
    "isAvailable": true
  }
}
```

#### Block Date

**Endpoint:** `POST /admin/availability/block`

**Request:**
```json
{
  "date": "2023-05-01",
  "reason": "Public Holiday"
}
```

**Response:**
```json
{
  "blockedDate": {
    "id": "uuid",
    "date": "2023-05-01",
    "reason": "Public Holiday"
  }
}
```

#### Delete Availability Setting

**Endpoint:** `DELETE /admin/availability/:id`

**Response:**
```json
{
  "success": true,
  "message": "Availability setting has been successfully deleted"
}
```

#### Delete Blocked Date

**Endpoint:** `DELETE /admin/availability/block/:id`

**Response:**
```json
{
  "success": true,
  "message": "Blocked date has been successfully deleted"
}
```

## 7. Webhook Endpoints

### 7.1 Email Delivery Webhooks

Endpoint for email delivery status updates from Resend.

**Endpoint:** `POST /webhooks/email`

**Request:**
```json
{
  "type": "delivery",
  "data": {
    "id": "message-id",
    "email_id": "email-id",
    "status": "delivered"
  }
}
```

**Response:**
```json
{
  "received": true
}
```

## 8. Request Validation

All API endpoints validate incoming requests using Zod schemas:

```typescript
// Example schema for booking creation
import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  language: z.enum(['en', 'fi']).default('fi'),
  notes: z.string().optional()
});
```

## 9. Rate Limiting

To prevent abuse, rate limits are applied to public endpoints:

```typescript
// Example rate limiting middleware
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1m'), // 10 requests per minute
});

export async function middleware(request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const result = await ratelimit.limit(ip);
  
  if (!result.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/bookings', '/api/availability/:path*'],
};
```

## 10. API Versioning

The API does not use explicit versioning in the URL path. Instead, it will evolve with backward compatibility in mind. Breaking changes, if necessary, would be communicated with ample notice. 