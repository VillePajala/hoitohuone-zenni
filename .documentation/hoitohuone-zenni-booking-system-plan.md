# Hoitohuone Zenni - Booking System Implementation Plan

## Overview
This document outlines the comprehensive plan for implementing the booking system for Hoitohuone Zenni. The booking system will allow customers to schedule appointments for various energy healing services offered by the business. It will be implemented using Next.js for the frontend, Prisma ORM for database interactions, and Supabase PostgreSQL as the database provider.

## Current Implementation Status
**Last Updated:** 2025-03-15

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

5. **Additional Features & Integration**
   - Social media links integration (Instagram, Facebook) ✓

### In Progress
1. **Admin Interface**
   - Development of admin booking management dashboard
   - Availability management interface

### Not Started
1. **Testing and Refinement**
   - End-to-end testing
   - Performance optimization
   - Analytics tracking

2. **Deployment**
   - Migration from development to production environment
   - Setup of production database

## Next Steps
1. **Admin Dashboard Development (Current Priority)**
   - Create admin login/authentication
   - Implement booking management interface
   - Add availability management capabilities

2. Implement availability management interface
3. Complete testing and refinement phase
4. Deploy to production

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
- `GET /api/services/:id` - Get a specific service by ID

### Availability Endpoints
- `GET /api/availability` - Get all availability settings
- `GET /api/availability/:date` - Get available time slots for a specific date
- `POST /api/availability` - Create/update availability settings (admin only)
- `DELETE /api/availability/:id` - Delete availability setting (admin only)

### Booking Endpoints
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/:id` - Get booking details by ID
- `GET /api/bookings` - Get all bookings (admin only)
- `PATCH /api/bookings/:id` - Update booking status (admin only)
- `DELETE /api/bookings/:id` - Cancel a booking

### Admin Endpoints
- `POST /api/admin/blocked-dates` - Block a date (admin only)
- `DELETE /api/admin/blocked-dates/:id` - Unblock a date (admin only)

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
- Database schema setup with Prisma
- Created necessary database models for bookings, services, etc.
- Basic frontend components (calendar, booking form)
- Multi-language support (Finnish/English)
- API routes for booking creation
- Email notification system
  - Confirmation emails to customers
  - Notification emails to administrators
  - Gmail SMTP configuration with environment variables
- Booking cancellation functionality
  - Cancellation page for customers
  - API endpoint for cancellation
  - Email notifications for cancellations
- Admin dashboard (in progress)
  - Admin login page
  - Admin dashboard overview page
  - Bookings listing and management interface
  - Admin layout with navigation

### In Progress
- Admin dashboard
  - Availability management
  - Services management
  - Settings and configuration

### Not Started
- Analytics and reporting
- Customer account management
- Advanced calendar integrations (e.g., Google Calendar, iCal)

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