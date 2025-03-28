# Booking System Requirements Specification

## 1. Overview
This document outlines the requirements for developing an online booking system for alternative healing services. The system will allow clients to view real-time availability and book appointments directly.

## 2. Functional Requirements

### 2.1 Service Booking
- The system shall allow booking for alternative healing services (energy healing, shiatsu, etc.)
- Time slots shall be managed in 15-minute intervals
- Each booking shall block a total of 1h 30min (1h 15min for treatment + 15min buffer)
- Clients shall be able to view real-time availability of time slots
- Clients shall be able to book available time slots directly without admin confirmation
- Clients shall select a specific service type before booking
- Multiple service bookings in a single session shall not be supported

### 2.2 User Management
- The system shall support two user types:
  - Clients: People interested in booking services
  - Admin: Service provider who manages bookings and availability
- Client registration shall not be required to book appointments
- Admin shall have a secure login system

### 2.3 Client Booking Flow
- The system shall collect the following information from clients:
  - Name
  - Email address (for confirmation)
  - Optional additional information/notes
- Clients shall receive email confirmation after booking
- Clients shall be able to cancel their bookings
- Clients shall receive email notification of cancellation

### 2.4 Admin Features
- Admin shall be able to view all bookings in a calendar interface
- Admin shall be able to set availability:
  - Define bookable time slots in 15-minute intervals
  - Block specific days as unavailable
  - Define time periods (seasonal availability)
- Admin shall be able to block off unavailable times
- Admin shall be able to cancel client bookings
- Admin shall be able to manually add bookings for clients who book through other channels
- Admin shall be able to view and edit individual bookings
- Admin shall be able to manage service offerings
- Admin shall receive email notifications of new bookings
- The system shall be designed to accommodate future reporting capabilities

### 2.5 Notifications
- The system shall send email notifications for:
  - New booking confirmations
  - Booking cancellations
  - Booking reminders (optional, 24 hours before appointment)

### 2.6 Cancellation Policy
- The system shall be designed with cancellation policy functionality
- Cancellation policy enforcement shall be initially inactive
- The system shall be designed to allow activation of cancellation policies in the future

## 3. Non-Functional Requirements

### 3.1 Performance
- The booking interface shall load within 2 seconds
- The system shall support at least 50 concurrent users
- Database operations shall be optimized to minimize requests
  - UI should update without requiring new database requests for minor changes
  - Database communication should only occur when making changes/modifications

### 3.2 Usability
- The user interface shall be simple, clean, and intuitive
- The booking process shall be completable in 3 steps or fewer
- The system shall be responsive and work on mobile devices
- The system shall provide clear feedback for all user actions

### 3.3 Security & Privacy
- The system shall comply with GDPR and Finnish data protection laws
- Client data shall be stored securely with appropriate encryption
- The system shall have privacy policies clearly accessible to users
- The system shall only collect necessary client information
- The system shall provide functionality to:
  - Delete specific customer data upon request
  - Provide transparency about what data is stored for each customer

### 3.4 Reliability
- The system shall have 99.5% uptime
- The system shall prevent double-booking of time slots
- The system shall maintain data integrity across all operations
- The system shall enforce buffer times (15 minutes) between appointments

#### 3.4.1 Concurrent Booking Handling
- The system shall implement optimistic concurrency control for booking operations
- The system shall handle multiple simultaneous booking attempts for the same time slot by:
  1. First-success principle: First request to pass validation gets the slot
  2. Immediate slot locking: Lock time slot during booking transaction
  3. Clear user feedback: Show immediate feedback if slot becomes unavailable
  4. Automatic refresh: Update availability for all active users when slot is booked
- The system shall maintain booking atomicity:
  1. Either complete the entire booking process or fail completely
  2. No partial bookings shall be saved
  3. Locked slots shall be automatically released if booking transaction fails
- The system shall provide real-time availability updates:
  1. Maximum 5-second delay for availability updates to other users
  2. Immediate optimistic UI updates for the booking user
  3. Clear error handling if optimistic update fails

### 3.5 Maintainability
- The system shall have comprehensive logging for troubleshooting
- The code shall be well-documented and follow best practices
- The system shall be designed for easy updates and extensions

## 4. Constraints
- The system shall be developed using the existing tech stack (React, Next.js, Prisma, PostgreSQL)
- The system shall not require payment processing
- The system shall not require integration with external calendar systems
- All times shall be handled in Finnish time (Europe/Helsinki) as services are delivered locally
- The system assumes all users are booking from Finland

## 5. Future Considerations
- Potential integration with payment processing
- Expansion to support multiple service providers
- Addition of recurring appointment booking
- Client account creation for booking history
- Advanced reporting and analytics
- Cancellation policy enforcement 