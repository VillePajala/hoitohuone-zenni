# API Endpoints Catalog

This document catalogs all the existing API endpoints in the application and provides information about their structure, purpose, and migration priority.

## Categorization

The endpoints are categorized into the following groups:

1. **Admin Endpoints** - Administrative endpoints for managing services, availability, and bookings
2. **Public Endpoints** - Public-facing endpoints for customer bookings and service information
3. **Debug/Test Endpoints** - Endpoints used for debugging, testing, and development

## Migration Priority Levels

Priority levels are assigned based on the following criteria:

- **High**: Frequently used endpoints that are core to the application's functionality
- **Medium**: Important endpoints that are used occasionally but not critical for day-to-day operations
- **Low**: Rarely used endpoints, debug endpoints, or endpoints that may be deprecated

## Endpoints Catalog

| Endpoint | Category | HTTP Methods | Purpose | Complexity | Priority |
|----------|----------|--------------|---------|------------|----------|
| **Admin Endpoints** |
| `/api/admin/services` | Admin | GET, POST | Manage treatment services | Medium | High |
| `/api/admin/services/[id]` | Admin | GET, PUT, DELETE | Manage specific treatment service | Medium | High |
| `/api/admin/services/reorder` | Admin | POST | Reorder services | Low | Medium |
| `/api/admin/bookings` | Admin | GET, POST | Manage bookings | High | High |
| `/api/admin/bookings/[id]` | Admin | GET, PUT, DELETE | Manage specific booking | Medium | High |
| `/api/admin/bookings/status` | Admin | PUT | Update booking status | Low | High |
| `/api/admin/bookings/debug` | Admin | GET | Debug booking data | Low | Low |
| `/api/admin/bookings/debug-data` | Admin | GET | Additional debug booking data | Low | Low |
| `/api/admin/availability/weekly` | Admin | GET, PUT | Manage weekly availability schedule | Medium | High |
| `/api/admin/availability/blocked` | Admin | GET, POST | Manage blocked time slots | Medium | High |
| `/api/admin/blocked-dates` | Admin | GET, POST | Manage blocked dates | Medium | High |
| `/api/admin/blocked-dates/[id]` | Admin | GET, PUT, DELETE | Manage specific blocked date | Low | Medium |
| **Public Endpoints** |
| `/api/services` | Public | GET | Get available treatment services | Low | High |
| `/api/services/[id]` | Public | GET | Get specific treatment service details | Low | High |
| `/api/bookings` | Public | POST | Create a new booking | High | High |
| `/api/bookings/cancel` | Public | POST | Cancel a booking | Medium | High |
| `/api/availability/[date]` | Public | GET | Get availability for a specific date | Medium | High |
| `/api/available-dates` | Public | GET | Get available dates for booking | Medium | High |
| `/api/time-slots` | Public | GET | Get available time slots | Medium | High |
| **Debug/Test Endpoints** |
| `/api/debug/seed` | Debug | POST | Seed the database with test data | Medium | Low |
| `/api/debug/services-check` | Debug | GET | Check services data | Low | Low |
| `/api/test-email` | Debug | POST | Test email sending | Low | Low |
| `/api/test-email-config` | Debug | GET | Test email configuration | Low | Low |
| `/api/example` | Example | GET, POST | Example endpoint using new API utilities | Low | Low |

## Next Steps

The migration process will follow these general steps for each endpoint:

1. **Analysis**: Analyze the current implementation to understand its functionality and requirements
2. **Planning**: Create a migration plan with specific changes required
3. **Implementation**: Implement the changes using the new API utilities
4. **Testing**: Test the migrated endpoint to ensure it works correctly
5. **Documentation**: Update documentation to reflect the changes

We will prioritize endpoints based on the priority level assigned above, starting with high-priority public and admin endpoints. 