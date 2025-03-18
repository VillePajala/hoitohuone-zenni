# Database Schema Decisions for Hoitohuone Zenni

This document outlines the database schema decisions for the Hoitohuone Zenni booking system with consideration for a future migration from SQLite to PostgreSQL (via Supabase). All design decisions aim to be compatible with both database systems while optimizing for the eventual PostgreSQL migration.

## Current Database System

- **Database Provider**: SQLite (for development)
- **ORM**: Prisma (providing database abstraction)
- **Future Target**: PostgreSQL via Supabase (when VPN restrictions allow)

## Schema Design Principles

1. **Database-Agnostic Design**
   - Avoid SQLite-specific features that don't exist in PostgreSQL
   - Design indexes that work effectively in both systems
   - Use standard data types compatible with both systems

2. **Future-Proof Relations**
   - Use explicit foreign key constraints for all relations
   - Ensure proper cascading behavior for updates and deletes
   - Design with proper normalization to support future scaling

3. **Performance Considerations**
   - Design queries to work efficiently with PostgreSQL's optimizer
   - Create appropriate indexes for common query patterns
   - Avoid operations that would cause full table scans in PostgreSQL

4. **Migration Readiness**
   - Document all custom SQL operations that might need adaptation
   - Design schema with clean separation to facilitate incremental migration
   - Avoid reliance on SQLite-specific behaviors for business logic

## Current Schema

The current Prisma schema is designed to be compatible with PostgreSQL:

```prisma
// Current schema (with SQLite)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Service {
  id            String    @id @default(cuid())
  name          String
  nameEn        String
  nameFi        String
  description   String
  descriptionEn String
  descriptionFi String
  duration      Int
  price         Float
  currency      String    @default("EUR")
  active        Boolean   @default(true)
  order         Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  bookings      Booking[]
}

model Booking {
  id             String   @id @default(cuid())
  serviceId      String
  customerName   String
  customerEmail  String
  customerPhone  String?
  date           DateTime
  startTime      DateTime
  endTime        DateTime
  status         String
  notes          String?
  language       String   @default("fi")
  cancellationId String?  @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  service        Service  @relation(fields: [serviceId], references: [id])
}

model Availability {
  id          String   @id @default(cuid())
  dayOfWeek   Int
  startTime   String
  endTime     String
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model BlockedDate {
  id        String   @id @default(cuid())
  date      DateTime
  reason    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## PostgreSQL-Specific Considerations

When migrating to PostgreSQL, the following modifications should be made:

```prisma
// Future schema (with PostgreSQL)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models remain the same, with these optimizations:
```

### PostgreSQL Optimization Opportunities

1. **Text Fields**
   - In PostgreSQL, we should use `@db.Text` for large text fields like descriptions
   - Example: `description String @db.Text`

2. **Indexing Strategies**
   - Add indexes to frequently queried fields:
     ```prisma
     model Booking {
       // existing fields
       @@index([date]) // For date range queries
       @@index([serviceId, date]) // For service-specific date queries
       @@index([status]) // For filtering by status
     }
     ```

3. **Date/Time Handling**
   - PostgreSQL has more robust DATE/TIME functions
   - For Availability model, consider using TIME type instead of STRING:
     ```prisma
     model Availability {
       // existing fields
       startTime DateTime @db.Time
       endTime   DateTime @db.Time
     }
     ```

4. **JSON Data Support**
   - PostgreSQL offers robust JSON support for flexible data
   - Consider using for metadata or settings:
     ```prisma
     model Service {
       // existing fields
       metadata Json? // For flexible service metadata
     }
     ```

5. **Unique Constraints**
   - Add additional unique constraints as needed:
     ```prisma
     model Service {
       // existing fields
       @@unique([nameFi, nameFi]) // Ensure no duplicate services with same name
     }
     ```

## Query Patterns to Optimize

The following query patterns should be optimized for PostgreSQL:

1. **Date Range Queries**
   ```typescript
   // Current pattern (optimize for PostgreSQL):
   const bookings = await prisma.booking.findMany({
     where: {
       date: {
         gte: startDate,
         lte: endDate
       }
     }
   });
   ```

2. **Aggregation Queries**
   ```typescript
   // For booking statistics (optimize for PostgreSQL):
   const bookingStats = await prisma.booking.groupBy({
     by: ['serviceId'],
     _count: {
       _all: true
     }
   });
   ```

3. **Full-Text Search**
   - When migrating to PostgreSQL, consider implementing proper full-text search for customer/service searching

## Migration Strategy

When VPN restrictions allow and migration to Supabase PostgreSQL is possible:

1. **Data Export**
   - Export all data from SQLite database
   - Transform data if necessary (especially date/time fields)

2. **Schema Migration**
   - Update Prisma schema with PostgreSQL-specific optimizations
   - Generate and run migrations

3. **Data Import**
   - Import transformed data into PostgreSQL
   - Verify data integrity and relationships

4. **Verification**
   - Run comprehensive tests to ensure application functions correctly
   - Compare query performance between SQLite and PostgreSQL

5. **Optimization**
   - Implement PostgreSQL-specific optimizations
   - Add indexes based on actual query patterns

## Conclusion

By following these schema design principles and preparing for the eventual migration to PostgreSQL, we can ensure a smooth transition while maintaining application functionality. The current SQLite implementation serves as a development environment, with all design decisions made to support the future PostgreSQL migration.

All database access should continue to use Prisma ORM to abstract the database-specific details, which will minimize the changes needed when migrating from SQLite to PostgreSQL.
