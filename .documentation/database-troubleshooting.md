# Database Troubleshooting Guide

## Known Issues

### Missing "order" Column in Service Table

**Issue Description:**  
The Prisma schema contained an `order` field for the Service model, but this column was missing in the actual SQLite database. This caused runtime errors when API endpoints attempted to query or sort using this non-existent column.

**Symptoms:**
- Errors in the console: "Unknown column 'order' in field list"
- Services not displaying in the admin interface
- Failed POST/PATCH requests when updating service order
- TypeScript linting errors: "Property 'order' does not exist on type..."

**Resolution (March 20, 2024):**
1. Diagnosed the issue by inspecting the SQLite schema directly:
   ```sql
   sqlite3 prisma/dev.db '.schema Service'
   ```

2. Added the missing column to the database:
   ```sql
   sqlite3 prisma/dev.db 'ALTER TABLE Service ADD COLUMN "order" INTEGER DEFAULT 0;'
   ```

3. Regenerated the Prisma client:
   ```bash
   npx prisma generate
   ```

4. Verified the fix by checking the schema and testing service ordering functionality.

**Root Cause:**
The discrepancy occurred likely due to:
- Inconsistencies between Prisma migrations and actual database schema
- Manual modifications to the database without updating migrations
- Potential issues with SQLite's handling of schema migrations

**Prevention:**
1. When adding new fields to Prisma schema, always create a proper migration:
   ```bash
   npx prisma migrate dev --name add_field_name
   ```

2. Validate schema changes by inspecting the actual database structure after migrations
   ```bash
   npx prisma db pull
   ```

3. If discrepancies are found, consider resetting the database with
   ```bash
   npx prisma migrate reset
   ```
   (Note: this will delete all data)

4. For production environments, create more careful migration strategies that don't involve data loss

## General Database Troubleshooting

### Inspecting Database Schema
```bash
# View a specific table's schema
sqlite3 prisma/dev.db '.schema TableName'

# List all tables
sqlite3 prisma/dev.db '.tables'

# Dump entire database schema
sqlite3 prisma/dev.db '.schema'
```

### Resetting Database
```bash
# Full reset (apply migrations and seed)
npx prisma migrate reset

# Pull schema from database
npx prisma db pull

# Update Prisma client
npx prisma generate
```

### Common SQLite Operations
```bash
# Query data
sqlite3 prisma/dev.db 'SELECT * FROM TableName'

# Add a column
sqlite3 prisma/dev.db 'ALTER TABLE TableName ADD COLUMN column_name TYPE DEFAULT default_value;'
``` 