# Database Schema Design

## 1. Overview

This document outlines the database schema design for the healing services booking system. The schema is designed to support the functional requirements while maintaining simplicity and performance. It incorporates useful elements from the existing project schema.

## 2. Entity Relationship Diagram (ERD)

```
+----------------+       +----------------+       +------------------+      +-----------------+
|                |       |                |       |                  |      |                 |
|    Service     |       |   Availability |       |     Booking      |      |  BlockedDate    |
|                |       |                |       |                  |      |                 |
+----------------+       +----------------+       +------------------+      +-----------------+
| PK id          |<---+  | PK id          |       | PK id            |      | PK id           |
| title          |    |  | date           |       | serviceId        |------+ | date           |
| titleEn        |    |  | startTime      |       | startTime        |      | reason          |
| titleFi        |    |  | endTime        |<------| endTime          |      | createdAt       |
| description    |    |  | dayOfWeek      |       | customerName     |      | updatedAt       |
| descriptionEn  |    |  | recurrenceRule |       | customerEmail    |      |                 |
| descriptionFi  |    |  | isAvailable    |       | customerPhone    |      |                 |
| duration       |    |  | serviceId      |------>| notes            |      |                 |
| price          |    |  | createdAt      |       | language         |      |                 |
| currency       |    |  | updatedAt      |       | status           |      |                 |
| color          |    +--|                |       | cancellationId   |      |                 |
| active         |       |                |       | createdAt        |      |                 |
| order          |       |                |       | updatedAt        |      |                 |
| createdAt      |       |                |       |                  |      |                 |
| updatedAt      |       |                |       |                  |      |                 |
+----------------+       +----------------+       +------------------+      +-----------------+
```

## 3. Entity Descriptions

### 3.1 Service

Represents a type of healing service that can be booked.

| Field         | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| id            | UUID     | Primary key                                      |
| title         | String   | Default name of the service                      |
| titleEn       | String   | English name of the service                      |
| titleFi       | String   | Finnish name of the service                      |
| description   | String   | Default description of the service               |
| descriptionEn | String   | English description of the service               |
| descriptionFi | String   | Finnish description of the service               |
| duration      | Integer  | Duration in minutes (default 75 for 1h 15m)      |
| price         | Decimal  | Price of the service                             |
| currency      | String   | Currency code (default "EUR")                    |
| color         | String   | Color code for UI display                        |
| active        | Boolean  | Whether the service is currently bookable        |
| order         | Integer  | Display order of the service                     |
| createdAt     | DateTime | When the service was created                     |
| updatedAt     | DateTime | When the service was last updated                |

### 3.2 Availability

Represents time slots when services are available for booking.

| Field          | Type     | Description                                                |
|----------------|----------|------------------------------------------------------------|
| id             | UUID     | Primary key                                                |
| date           | Date     | The specific date (null if recurring pattern)              |
| startTime      | DateTime | Start time of the availability slot                        |
| endTime        | DateTime | End time of the availability slot                          |
| dayOfWeek      | Integer  | Day of week (0-6) for recurring patterns                   |
| recurrenceRule | String?  | Optional iCalendar RRULE format for recurring availability |
| isAvailable    | Boolean  | True for available, false for blocked                      |
| serviceId      | UUID?    | Optional link to a specific service                        |
| createdAt      | DateTime | When the availability was created                          |
| updatedAt      | DateTime | When the availability was last updated                     |

### 3.3 Booking

Represents an actual appointment booking made by a client.

| Field          | Type     | Description                                   |
|----------------|----------|-----------------------------------------------|
| id             | UUID     | Primary key                                   |
| serviceId      | UUID     | Reference to the service being booked         |
| startTime      | DateTime | Start time of the booking                     |
| endTime        | DateTime | End time of the booking                       |
| customerName   | String   | Name of the client                            |
| customerEmail  | String   | Email of the client                           |
| customerPhone  | String?  | Optional phone number of the client           |
| language       | String   | Preferred language (default "fi")             |
| notes          | String?  | Optional notes provided by the client         |
| status         | String   | Status of booking (confirmed, canceled, etc.) |
| cancellationId | String?  | Unique ID for cancellation tracking           |
| createdAt      | DateTime | When the booking was created                  |
| updatedAt      | DateTime | When the booking was last updated             |

### 3.4 BlockedDate

Represents dates when no bookings can be made.

| Field     | Type     | Description                             |
|-----------|----------|-----------------------------------------|
| id        | UUID     | Primary key                             |
| date      | Date     | Date that is blocked                    |
| reason    | String?  | Optional reason for blocking the date   |
| createdAt | DateTime | When the blocked date was created       |
| updatedAt | DateTime | When the blocked date was last updated  |

## 4. Relationships

1. **Service to Availability**: One-to-many (optional)
   - A service can have multiple availability slots
   - An availability slot can optionally be associated with a specific service

2. **Service to Booking**: One-to-many
   - A service can have multiple bookings
   - A booking is for exactly one service

## 5. Prisma Schema

```prisma
// This is your Prisma schema file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Service {
  id            String        @id @default(uuid())
  title         String        // Default name
  titleEn       String        // English name
  titleFi       String        // Finnish name
  description   String        @db.Text
  descriptionEn String        @db.Text
  descriptionFi String        @db.Text
  duration      Int           @default(75) // Default to 1h 15m in minutes
  price         Decimal       @default(0)
  currency      String        @default("EUR")
  color         String        @default("#4F46E5") // Default indigo color
  active        Boolean       @default(true)
  order         Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  // Relationships
  availabilities Availability[]
  bookings       Booking[]
}

model Availability {
  id             String    @id @default(uuid())
  date           DateTime? @db.Date
  startTime      DateTime
  endTime        DateTime
  dayOfWeek      Int?      // 0-6 for Monday-Sunday, null if specific date
  recurrenceRule String?   @db.Text // iCalendar RRULE format
  isAvailable    Boolean   @default(true) // true for available, false for blocked
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  // Relationships
  service         Service?  @relation(fields: [serviceId], references: [id])
  serviceId       String?
  
  // Indexes
  @@index([date])
  @@index([dayOfWeek])
  @@index([startTime, endTime])
  @@index([serviceId])
}

model Booking {
  id             String    @id @default(uuid())
  startTime      DateTime
  endTime        DateTime
  customerName   String
  customerEmail  String
  customerPhone  String?
  language       String    @default("fi")
  notes          String?   @db.Text
  status         String    @default("confirmed") // confirmed, canceled, etc.
  cancellationId String?   @unique
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  // Relationships
  service      Service   @relation(fields: [serviceId], references: [id])
  serviceId    String
  
  // Indexes
  @@index([startTime, endTime])
  @@index([customerEmail])
  @@index([serviceId])
  @@index([status])
}

model BlockedDate {
  id        String   @id @default(uuid())
  date      DateTime @db.Date
  reason    String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Indexes
  @@index([date])
}
```

## 6. Query Examples

### 6.1 Find Available Time Slots for a Date

```typescript
// Find all availability slots for a specific date
const availabilitySlots = await prisma.availability.findMany({
  where: {
    OR: [
      // Specific date availabilities
      {
        date: new Date('2023-05-15'),
        isAvailable: true,
      },
      // Recurring weekly availabilities
      {
        dayOfWeek: new Date('2023-05-15').getDay(),
        isAvailable: true,
      }
    ]
  },
  orderBy: {
    startTime: 'asc',
  },
});

// Check for blocked dates
const isDateBlocked = await prisma.blockedDate.findFirst({
  where: {
    date: new Date('2023-05-15'),
  }
});

// Check which slots are already booked
const bookings = await prisma.booking.findMany({
  where: {
    startTime: {
      gte: new Date('2023-05-15T00:00:00Z'),
      lt: new Date('2023-05-16T00:00:00Z'),
    },
    status: 'confirmed',
  },
  select: {
    startTime: true,
    endTime: true,
  },
});

// Filter out slots that overlap with bookings or blocked dates
const availableSlots = isDateBlocked ? [] : availabilitySlots.filter(slot => {
  return !bookings.some(booking => {
    return (
      (slot.startTime < booking.endTime && slot.endTime > booking.startTime)
    );
  });
});
```

### 6.2 Create a New Booking

```typescript
// Get the service to determine duration
const service = await prisma.service.findUnique({
  where: { id: serviceId },
});

// Calculate end time based on service duration
const endTime = new Date(startTime);
endTime.setMinutes(endTime.getMinutes() + service.duration);

// Add 15 minutes buffer
const bufferEndTime = new Date(endTime);
bufferEndTime.setMinutes(bufferEndTime.getMinutes() + 15);

// Check if the date is blocked
const isDateBlocked = await prisma.blockedDate.findFirst({
  where: {
    date: new Date(startTime.toISOString().split('T')[0]),
  },
});

if (isDateBlocked) {
  throw new Error('This date is not available for booking');
}

// Check if the slot is available
const isSlotAvailable = await prisma.availability.findFirst({
  where: {
    OR: [
      // Specific date availability
      {
        date: new Date(startTime.toISOString().split('T')[0]),
        startTime: { lte: startTime },
        endTime: { gte: bufferEndTime },
        isAvailable: true,
      },
      // Recurring weekly availability
      {
        dayOfWeek: new Date(startTime).getDay(),
        startTime: { lte: startTime },
        endTime: { gte: bufferEndTime },
        isAvailable: true,
      }
    ],
  },
});

// Check for booking conflicts
const hasConflictingBooking = await prisma.booking.findFirst({
  where: {
    status: 'confirmed',
    OR: [
      {
        startTime: { lt: bufferEndTime },
        endTime: { gt: startTime },
      },
    ],
  },
});

if (isSlotAvailable && !hasConflictingBooking) {
  // Create the booking
  const booking = await prisma.booking.create({
    data: {
      serviceId,
      startTime,
      endTime: bufferEndTime, // Include buffer in booking
      customerName,
      customerEmail,
      customerPhone,
      language,
      notes,
      status: 'confirmed',
    },
  });
}
```

## 7. Database Implementation

When implementing this schema, you'll use Prisma Migrate to create the database structure:

```bash
# Generate the initial migration
npx prisma migrate dev --name init

# Apply migrations to production
npx prisma migrate deploy
```

## 8. Performance Considerations

1. **Indexes**: Indexes have been added on frequently queried fields including date, time ranges, email, and status for fast lookups
2. **Composite Patterns**: Support for both specific dates and recurring weekly patterns
3. **Multilingual Support**: Fields for English and Finnish content
4. **Status Management**: Explicit status field rather than soft deletes for clearer state management
5. **Query Optimization**: Example queries demonstrate efficient filtering patterns

## 9. Future Expansion

The schema is designed to support future extensions:

1. **User Accounts**: If needed, a separate User model could be added and linked to bookings
2. **Multiple Service Providers**: The schema could be extended with a ServiceProvider model
3. **Payments**: A Payment model could be linked to bookings
4. **Additional Languages**: The multilingual structure supports adding more languages
5. **Appointment Types**: The service model could be extended to support different appointment types 