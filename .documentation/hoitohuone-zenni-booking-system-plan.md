# Hoitohuone Zenni - Booking System Implementation Plan

## Overview
This document outlines the comprehensive plan for implementing the booking system for Hoitohuone Zenni. The booking system will allow customers to schedule appointments for various energy healing services offered by the business. It will be implemented using Next.js for the frontend, Prisma ORM for database interactions, and Supabase PostgreSQL as the database provider.

## Current Implementation Status
**Last Updated:** 2024-03-17

### Completed
1. **Database Schema and Setup**
   - Schema created for Services, Bookings, Availability, and BlockedDates ✓
   - Prisma configuration setup ✓

2. **Frontend Components** 
   - Core booking flow components ✓
     - ServiceSelection component ✓
     - DatePicker component ✓
     - TimeSlotSelection component ✓
     - CustomerForm component ✓
     - BookingConfirmation component ✓
   - BookingContainer with step-by-step flow logic ✓
   - Language internationalization support (Finnish/English) ✓

3. **API Routes**
   - POST /api/bookings endpoint to create bookings ✓
   - Validation and error handling for booking submissions ✓
   - POST /api/bookings/cancel endpoint to cancel bookings ✓
   - GET /api/services with optimized caching control ✓
   - Locale-aware API endpoints for services ✓
   - Debug routes for API diagnostics ✓

4. **Advanced Features**
   - Email notification system ✓
     - Confirmation emails to customers with booking details ✓
     - Notification emails to administrators for new bookings ✓
     - Multi-language support (Finnish/English) in email templates ✓
     - Gmail SMTP configuration with App Password authentication ✓
     - Testing tools for email delivery verification ✓
   - Booking cancellation functionality ✓
     - Cancellation pages in Finnish and English ✓
     - Cancellation API endpoints ✓
     - Email notifications for cancellations ✓
     - Booking status updates ✓

5. **Authentication**
   - Admin authentication with Clerk ✓
   - Login, logout flows ✓ 
   - Protected admin routes ✓
   - User session management ✓

6. **Admin Interface Structure**
   - Admin layout with responsive sidebar and mobile navigation ✓
   - Navigation between admin sections ✓
   - Loading states with skeleton loaders ✓
   - Dashboard page with booking overview ✓
   - Bookings management interface ✓
   - Bookings detail view ✓
   - Debug tools for API diagnostics ✓
   - Services management interface ✓
   - Service ordering with drag-and-drop functionality ✓
   - Service activation/deactivation ✓

7. **Availability Management**
   - Weekly schedule editor UI (functional with time slot management) ✓
   - Blocked dates management UI (functional with basic operations) ✓
   - Time slot validation to prevent overlaps ✓
   - API implementations for managing availability ✓
   - Bulk operations for availability management ✓
     - Copy day feature to duplicate one day's schedule to another ✓
     - Clear day functionality to reset a day's time slots ✓
     - Schedule templates (standard business, extended, weekend) ✓

### In Progress
1. **Availability Management Refinements**
   - Visual indicators for time conflicts
   - Enhanced calendar visualization for blocked dates
   - Recurring blocked dates functionality
   - More intuitive interface for managing time slots

2. **Booking Management Enhancements**
   - Advanced filtering and search functionality
   - Date range selection for viewing bookings
   - Export functionality
   - Mobile-responsive improvements

### Not Started
1. **Advanced Admin Features**
   - Reports and analytics
   - Settings customization
   - Email template management
   - Service categories
   - Calendar view of all bookings and blocked dates
   - Conflict detection for overlapping bookings

2. **Testing and Refinement**
   - End-to-end testing
   - Performance optimization
   - Analytics tracking

3. **Deployment**
   - Migration from development to production environment
   - Setup of production database

## Next Steps
1. **Refine Booking Management**
   - Implement booking search and advanced filtering
   - Add booking date range selection
   - Add export functionality for bookings
   - Improve responsive design for mobile admin usage

2. **Complete Availability Management**
   - Finalize weekly schedule editor functionality
   - Complete blocked dates API integration
   - Add calendar view of all bookings and blocked dates
   - Implement conflict detection

3. **Complete Services Management**
   - Finish service creation, editing and deletion
   - Add service activation/deactivation
   - Implement service ordering

4. **Testing and Deployment**
   - Implement end-to-end testing with Cypress or Playwright
   - Performance optimization and load testing
   - Deploy to production with proper environment configuration

## Recent Technical Improvements

### Next.js 15.1.7+ Compatibility
The application has been updated to support Next.js 15.1.7+ which introduced a change to params handling:

1. **Params as Promise**
   - In Next.js 15.1.7+, `params` in page components is now a Promise that needs to be unwrapped
   - All dynamic route pages have been updated to use `React.use()` to properly unwrap params
   - Proper TypeScript interfaces added for params objects

2. **API Routes Enhancement**
   - Added `export const dynamic = 'force-dynamic'` to API routes
   - Added `fetchCache = 'force-no-store'` and `revalidate = 0` directives
   - Implemented proper cache control headers in API responses
   - Created duplicate API endpoints for locale paths to handle middleware redirects

### Middleware Improvements
1. **Redirect Logic**
   - Updated middleware to skip locale redirects for API routes
   - Enhanced public routes configuration for better authentication management
   - Added debugging tools to track middleware behavior

2. **Error Handling**
   - Improved console error handling in admin layout
   - Added more detailed error logging across API endpoints
   - Created fallback mechanisms for service and booking data loading

### Diagnostic Tools
1. **Debug Endpoints**
   - Added `/api/debug/services-check` for diagnosing service API issues
   - Created `/api/debug/seed` to populate test data
   - Implemented `/api/admin/bookings/status` for booking API diagnostics

2. **User Interface**
   - Added debug pages in admin interface
   - Implemented fallback UI for data loading failures
   - Created better error visualization

## Architecture & Data Flow

### Architecture Components
1. **Frontend**: Next.js React components for the user interface
2. **API Layer**: Next.js API routes for handling requests
3. **Data Access Layer**: Prisma ORM for database operations
4. **Database**: Supabase PostgreSQL for data storage

### Data Flow
1. **User selects service** → Frontend displays available time slots
2. **User selects time slot** → Frontend validates selection
3. **User enters personal information** → Frontend validates input
4. **User confirms booking** → API creates booking in database
5. **System confirms booking** → Email notifications sent to user and admin
6. **Admin views bookings** → Admin dashboard displays all bookings

## Database Schema

### Services Table
```prisma
model Service {
  id          String    @id @default(cuid())
  name        String
  nameEn      String    // English name
  nameFi      String    // Finnish name
  description String    @db.Text
  descriptionEn String  @db.Text // English description
  descriptionFi String  @db.Text // Finnish description
  duration    Int       // Duration in minutes
  price       Float
  currency    String    @default("EUR")
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  bookings    Booking[]
}
```

### Bookings Table
```prisma
model Booking {
  id              String   @id @default(cuid())
  serviceId       String
  service         Service  @relation(fields: [serviceId], references: [id])
  customerName    String
  customerEmail   String
  customerPhone   String?
  date            DateTime // Date of appointment
  startTime       DateTime // Start time
  endTime         DateTime // End time
  status          String   // "confirmed", "cancelled", "completed"
  notes           String?  @db.Text
  language        String   @default("fi") // "fi" or "en"
  cancellationId  String?  @unique // Unique ID for cancellation link
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Availability Table
```prisma
model Availability {
  id          String   @id @default(cuid())
  dayOfWeek   Int      // 0-6 for Sunday-Saturday
  startTime   String   // Format: "HH:MM" (24-hour format)
  endTime     String   // Format: "HH:MM" (24-hour format)
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### BlockedDates Table
```prisma
model BlockedDate {
  id          String   @id @default(cuid())
  date        DateTime // Full day block
  reason      String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API Endpoints

### Service Endpoints
- `GET /api/services` - Get all active services
  - Query params: `activeOnly` (boolean) to filter active services only
  - Returns array of service objects
- `GET /api/services/:id` - Get a specific service by ID
  - Returns single service object or 404 if not found

### Admin Service Endpoints
- `GET /api/admin/services` - Get all services (including inactive)
  - Query params: `activeOnly` (boolean) to filter active services only
  - Returns array of service objects
- `POST /api/admin/services` - Create a new service
  - Required fields: name, nameEn, nameFi, description, descriptionEn, descriptionFi, duration, price
  - Returns created service object
- `GET /api/admin/services/:id` - Get specific service details
  - Returns single service object or 404 if not found
- `PUT /api/admin/services/:id` - Full update of a service
  - Returns updated service object
- `PATCH /api/admin/services/:id` - Partial update of a service
  - Returns updated service object
- `DELETE /api/admin/services/:id` - Delete a service
  - Returns success message or sets service inactive if it has bookings

### Availability Endpoints
- `GET /api/availability/:date` - Get available time slots for a specific date
  - Query params: `serviceId` (required) to specify which service
  - Returns object with available boolean, message, and timeSlots array
- `GET /api/admin/availability/weekly` - Get all weekly availability settings
  - Returns array of availability objects ordered by dayOfWeek
- `POST /api/admin/availability/weekly` - Update weekly availability settings
  - Expects days object with enabled status and timeSlots
  - Returns success confirmation
- `GET /api/admin/blocked-dates` - Get all blocked dates
  - Returns array of blocked date objects
- `POST /api/admin/blocked-dates` - Block a date
  - Expects date and optional reason
  - Returns created blocked date object
- `GET /api/admin/blocked-dates/:id` - Get specific blocked date
  - Returns single blocked date object or 404
- `DELETE /api/admin/blocked-dates/:id` - Unblock a date
  - Returns success confirmation

### Booking Endpoints
- `POST /api/bookings` - Create a new booking
  - Required fields: serviceId, customerName, customerEmail, date, startTime, endTime
  - Returns created booking object
- `GET /api/bookings/:id` - Get booking details by ID
  - Returns single booking object or 404
- `POST /api/bookings/cancel` - Cancel a booking
  - Requires valid cancellationId
  - Returns success confirmation

### Admin Booking Endpoints
- `GET /api/admin/bookings` - Get all bookings with filtering 
  - Query params: `status`, `service` (serviceId), `date`, `search` (for customer data)
  - Returns array of booking objects with service details
- `GET /api/admin/bookings/:id` - Get detailed booking information
  - Returns single booking object with service data or 404
- `PATCH /api/admin/bookings/:id` - Update booking (status, notes)
  - Returns updated booking object

## Authentication Implementation

For the admin section, we will implement [Clerk](https://clerk.com/) for authentication:

### Why Clerk
- Easy integration with Next.js App Router
- Pre-built UI components for login/signup
- Multiple authentication methods (email/password, OAuth, etc.)
- User management dashboard
- Role-based permissions for admin access
- Excellent security out of the box

### Implementation Steps
1. Install Clerk SDK: `npm install @clerk/nextjs`
2. Set up environment variables:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
3. Add Clerk provider in root layout
4. Add middleware to protect admin routes:
   ```typescript
   // middleware.ts 
   import { authMiddleware } from "@clerk/nextjs";
   
   export default authMiddleware({
     // Only protect admin routes
     publicRoutes: [
       "/",
       "/fi(.*)",
       "/en(.*)",
       "/api/services(.*)",
       "/api/availability(.*)",
       "/api/bookings((?!admin).)*",
     ],
   });
   
   export const config = {
     matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
   };
   ```
5. Replace current hardcoded login with Clerk components
6. Add admin role verification in API routes

## Frontend Components

### User-Facing Components

#### BookingFlow
High-level component that manages the entire booking process flow and state.

#### ServiceSelection
- Displays all available services
- Allows filtering and selection
- Shows service details (description, duration, price)

#### DatePicker
- Calendar component for selecting appointment date
- Highlights available dates
- Blocks unavailable dates

#### TimeSlotSelection
- Displays available time slots for selected date and service
- Updates dynamically based on service duration
- Visually indicates available/unavailable times

#### CustomerForm
- Collects customer information (name, email, phone)
- Implements validation
- Includes privacy policy acceptance

#### BookingConfirmation
- Shows booking summary
- Provides confirmation reference
- Includes cancellation instructions

### Admin Components

#### AdminBookingDashboard
- Lists all bookings with filtering options
- Provides booking management functions
- Shows booking statistics

#### AvailabilityManager
- Interface for setting regular availability
- Allows blocking specific dates or time periods
- Provides calendar visualization of availability

## Implementation Steps

### Phase 1: Foundation Setup (Week 1)
1. Install and configure Prisma
2. Set up Supabase PostgreSQL database
3. Create initial database schema
4. Implement basic API endpoints
5. Create booking page structure

### Phase 2: Core Booking Functionality (Week 2)
1. Implement service listing and selection
2. Create date picker component
3. Develop time slot availability calculations
4. Build customer information form
5. Implement booking creation flow

### Phase 3: Admin & Confirmation Features (Week 3)
1. Create booking confirmation screens
2. Implement email notification system
3. Develop admin dashboard for bookings
4. Add availability management interface
5. Implement booking cancellation functionality

### Phase 4: Refinement & Testing (Week 4)
1. Conduct end-to-end testing of booking flow
2. Implement error handling and edge cases
3. Optimize performance
4. Add analytics tracking
5. Implement final UI polish

## Technical Considerations

### Internationalization
- All user-facing components will support both Finnish and English
- Date and time formatting will respect locale settings
- Error messages and notifications will be internationalized

### Security
- Implement CSRF protection for all API endpoints
- Validate all user inputs on both client and server
- Secure admin routes with proper authentication
- Use environment variables for sensitive information

### Performance
- Implement proper loading states
- Optimize database queries
- Use caching where appropriate
- Ensure responsive design for all screen sizes

### Testing Strategy
1. **Unit Testing**: Test individual components and functions
2. **Integration Testing**: Test API endpoints and database interactions
3. **E2E Testing**: Test complete booking flow
4. **User Testing**: Conduct user testing with real users

## Deployment Strategy
1. **Development**: Local development with local PostgreSQL database
2. **Staging**: Deploy to staging environment with test Supabase database
3. **Production**: Deploy to production environment with production Supabase database

## Monitoring & Maintenance
1. Implement error logging and monitoring
2. Set up database backup strategy
3. Create maintenance documentation
4. Plan for future enhancements

## Summary
This booking system implementation plan provides a comprehensive roadmap for building a robust, user-friendly booking system for Hoitohuone Zenni. By following this plan, we will create a booking system that meets the business requirements while providing an excellent user experience for customers. 

## Implementation Status

### Completed
- Database schema for services, bookings, and availability
- Basic frontend components for booking form
- API routes for services and bookings
- Admin interface structure
- Authentication with Clerk.js
- Email notifications for booking confirmations
- Basic admin dashboard
- Services management interface with create, edit, delete functionality
- Service activation/deactivation

### In Progress
- Admin dashboard enhancements
- Availability management system
- Booking management interface improvements

### Not Started
- Advanced admin features (analytics, reporting)
- Comprehensive testing
- Production deployment

## Next Steps

The next step in the implementation plan is to complete the admin dashboard functionality:

1. **Complete Admin Dashboard**
   - ✅ Create admin authentication
   - ✅ Implement booking management interface
   - Develop availability management interface
   - Add services management
   - Create settings page for configuration

2. **Analytics and Reporting**
   - Design and implement basic analytics dashboard
   - Create booking reports
   - Implement export functionality

3. **Refinements and Testing**
   - Conduct thorough testing of all features
   - Optimize performance
   - Implement feedback from stakeholders

4. **Customer Account Management**
   - Design and implement customer account management interface
   - Add functionality for managing bookings and preferences

5. **Advanced Calendar Integrations**
   - Implement Google Calendar integration
   - Implement iCal integration
   - Add functionality for syncing appointments with external calendars

6. **Analytics and Reporting**
   - Implement basic analytics dashboard
   - Create booking reports
   - Implement export functionality

7. **Refinements and Testing**
   - Conduct thorough testing of all features
   - Optimize performance
   - Implement feedback from stakeholders

8. **Final Deployment**
   - Deploy to production environment
   - Set up monitoring and maintenance
   - Conduct final testing
   - Gather stakeholder feedback

9. **Post-Deployment Review**
   - Conduct post-deployment review
   - Gather stakeholder feedback
   - Plan for future enhancements

## Implementation Steps

### Phase 1: Foundation Setup (Week 1)
1. Install and configure Prisma
2. Set up Supabase PostgreSQL database
3. Create initial database schema
4. Implement basic API endpoints
5. Create booking page structure

### Phase 2: Core Booking Functionality (Week 2)
1. Implement service listing and selection
2. Create date picker component
3. Develop time slot availability calculations
4. Build customer information form
5. Implement booking creation flow

### Phase 3: Admin & Confirmation Features (Week 3)
1. Create booking confirmation screens
2. Implement email notification system
3. Develop admin dashboard for bookings
4. Add availability management interface
5. Implement booking cancellation functionality

### Phase 4: Refinement & Testing (Week 4)
1. Conduct end-to-end testing of booking flow
2. Implement error handling and edge cases
3. Optimize performance
4. Add analytics tracking
5. Implement final UI polish

## Technical Considerations

### Internationalization
- All user-facing components will support both Finnish and English
- Date and time formatting will respect locale settings
- Error messages and notifications will be internationalized

### Security
- Implement CSRF protection for all API endpoints
- Validate all user inputs on both client and server
- Secure admin routes with proper authentication
- Use environment variables for sensitive information

### Performance
- Implement proper loading states
- Optimize database queries
- Use caching where appropriate
- Ensure responsive design for all screen sizes

### Testing Strategy
1. **Unit Testing**: Test individual components and functions
2. **Integration Testing**: Test API endpoints and database interactions
3. **E2E Testing**: Test complete booking flow
4. **User Testing**: Conduct user testing with real users

## Deployment Strategy
1. **Development**: Local development with local PostgreSQL database
2. **Staging**: Deploy to staging environment with test Supabase database
3. **Production**: Deploy to production environment with production Supabase database

## Monitoring & Maintenance
1. Implement error logging and monitoring
2. Set up database backup strategy
3. Create maintenance documentation
4. Plan for future enhancements

## Summary
This booking system implementation plan provides a comprehensive roadmap for building a robust, user-friendly booking system for Hoitohuone Zenni. By following this plan, we will create a booking system that meets the business requirements while providing an excellent user experience for customers. 