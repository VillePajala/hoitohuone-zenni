# System Architecture Document

## 1. Overview

This document outlines the technical architecture for the healing services booking system. The system allows clients to book appointments with real-time availability checking and provides an admin interface for managing bookings and availability.

## 2. Architecture Pattern

The system follows a **Serverless with API Routes** architecture pattern using Next.js:

- **Frontend and Backend:** Unified in a single Next.js application
- **API Endpoints:** Implemented as Next.js API routes (serverless functions)
- **Database Access:** Direct connection from API routes to database via Prisma
- **Authentication:** Handled by Clerk
- **Benefits:** 
  - Simplified deployment and maintenance
  - Cost-effective serverless scaling
  - Reduced operational complexity
  - No separate backend codebase to maintain

## 3. Technology Stack

### 3.1 Frontend
- **Framework:** Next.js (App Router)
- **UI Library:** React 18+
- **Styling:** Tailwind CSS
- **Component Library:** Shadcn UI
- **Icons:** Lucide React
- **State Management:** SWR + Zustand
  - SWR for data fetching, caching, and revalidation
  - Zustand for UI state management

### 3.2 Backend
- **API Routes:** Next.js serverless functions
- **Authentication:** Clerk
- **Email Service:** Resend.com with React Email templates
- **Validation:** Zod for schema validation

### 3.3 Database
- **ORM:** Prisma
- **Database:** PostgreSQL (hosted on Supabase)
- **Development:** Local Supabase instance

### 3.4 Deployment
- **Hosting:** Vercel
- **Environment:** Serverless with edge functions where appropriate
- **CI/CD:** Automatic deployments from GitHub

## 4. System Components

### 4.1 Core Components

#### 4.1.1 Client Booking Flow
- **Service Selection Component**
  - Displays available services
  - Allows selection of service type
  
- **Calendar Component**
  - Shows available dates
  - Indicates available/unavailable dates
  
- **Time Slot Selection Component**
  - Displays available time slots for selected date
  - Updates in real-time as bookings occur
  
- **Booking Form Component**
  - Collects client information
  - Submits booking request
  
- **Confirmation Component**
  - Displays booking confirmation
  - Provides cancellation link

#### 4.1.2 Admin Panel
- **Admin Dashboard**
  - Overview of upcoming bookings
  - Quick actions
  
- **Calendar Management**
  - Set available time slots
  - Block dates or time periods
  
- **Booking Management**
  - View and edit bookings
  - Cancel bookings
  - Add manual bookings
  
- **Service Management**
  - Define and edit service offerings

### 4.2 Supporting Components

#### 4.2.1 Authentication System
- Clerk authentication for admin access
- Role-based permissions

#### 4.2.2 Notification System
- Email notifications for booking confirmations
- Email notifications for booking cancellations
- Optional reminder emails

## 5. Data Flow

### 5.1 Booking Process Flow
1. Client selects service type
2. Client views available dates and times
3. Client selects desired time slot
   - UI optimistically updates to show slot as tentatively booked
4. Client submits booking information
5. API validates booking data
6. If valid and slot still available, booking is saved to database
7. Confirmation email is sent via Resend
8. UI confirms successful booking
9. If slot was taken during submission, error is shown and availability is refreshed

### 5.2 Real-time Availability System
- **Implementation:** Optimistic UI + Webhook Validation
- **Flow:**
  1. Initial availability data loaded via SWR
  2. User selections trigger optimistic UI updates
  3. Server confirms availability on submission
  4. Conflicts resolve with error messages and refreshed data

### 5.3 Admin Booking Management Flow
1. Admin logs in via Clerk authentication
2. Admin views calendar of bookings
3. Admin can:
   - View booking details
   - Cancel bookings (triggers cancellation email)
   - Add manual bookings
   - Block off time periods

## 6. Database Design

The database is organized around these primary entities:
- **Services:** Types of healing services offered
- **Availabilities:** Time slots when services can be booked
- **Bookings:** Actual appointments made by clients
- **Clients:** Basic information about people who book appointments

(Detailed schema will be defined in the Database Schema Design document)

## 7. API Structure

### 7.1 Client-facing API endpoints
- `GET /api/services` - List available services
- `GET /api/availability?date=YYYY-MM-DD&serviceId=X` - Get available time slots
- `POST /api/bookings` - Create a new booking
- `DELETE /api/bookings/:id` - Cancel a booking

### 7.2 Admin API endpoints
- `GET /api/admin/bookings` - List all bookings
- `GET /api/admin/bookings/:id` - Get booking details
- `POST /api/admin/bookings` - Create a manual booking
- `PUT /api/admin/bookings/:id` - Update a booking
- `DELETE /api/admin/bookings/:id` - Cancel a booking
- `POST /api/admin/availability` - Set available time slots
- `POST /api/admin/availability/block` - Block time periods

## 8. State Management

### 8.1 SWR Implementation
SWR will be used for:
- Fetching and caching available services
- Fetching and caching available time slots
- Submitting and validating booking requests

Example implementation:
```tsx
// Fetching available time slots
const { data, error, mutate } = useSWR(
  `/api/availability?date=${selectedDate}&serviceId=${selectedService}`,
  fetcher
);

// Optimistic updates when booking
const bookTimeSlot = async (timeSlot) => {
  // Optimistically update UI
  mutate(
    (currentData) => ({
      ...currentData,
      availableSlots: currentData.availableSlots.filter(slot => slot !== timeSlot)
    }),
    false
  );
  
  // Actual API call
  try {
    await fetch('/api/bookings', { 
      method: 'POST', 
      body: JSON.stringify({ timeSlot, serviceId, clientData }) 
    });
    // Success - no need to refresh as we already updated optimistically
  } catch (error) {
    // Error - revalidate to get current data
    mutate();
    throw error;
  }
};
```

### 8.2 Zustand Implementation
Zustand will manage:
- Form state during booking process
- Selected dates and services
- UI view states

Example implementation:
```tsx
import create from 'zustand';

const useBookingStore = create((set) => ({
  selectedService: null,
  selectedDate: null,
  clientData: {
    name: '',
    email: '',
    notes: '',
  },
  
  selectService: (serviceId) => set({ selectedService: serviceId }),
  selectDate: (date) => set({ selectedDate: date }),
  updateClientData: (data) => set({ clientData: { ...get().clientData, ...data } }),
  resetForm: () => set({ 
    selectedService: null, 
    selectedDate: null, 
    clientData: { name: '', email: '', notes: '' } 
  }),
}));
```

## 9. Email Notification System

### 9.1 Implementation with Resend
- React Email templates for consistent styling
- Triggered by successful booking creation
- Automatic sending via API routes

### 9.2 Email Types
- Booking confirmation emails
- Booking cancellation emails
- Admin notification emails
- Optional reminder emails

## 10. Deployment Strategy

### 10.1 Vercel Deployment
- Connected to GitHub repository
- Automatic deployments on push to main branch
- Preview deployments for pull requests
- Environment variables securely stored in Vercel

### 10.2 Environment Configuration
- Development: Local Next.js server with local Supabase
- Preview: Vercel preview deployments with test database
- Production: Vercel production deployment with production database

## 11. Security Considerations

### 11.1 Authentication & Authorization
- Clerk for secure admin authentication
- Server-side validation of admin status on protected routes
- CSRF protection for form submissions

### 11.2 Data Protection
- Input validation using Zod
- Prepared statements via Prisma to prevent SQL injection
- HTTPS for all communications
- Minimal PII collection per GDPR requirements

## 12. Performance Considerations

### 12.1 Optimizations
- Static generation of non-dynamic pages
- Edge caching where appropriate
- Optimized database queries
- Efficient SWR caching strategy

### 12.2 Monitoring
- Vercel Analytics for performance monitoring
- Error tracking via Vercel integrations 