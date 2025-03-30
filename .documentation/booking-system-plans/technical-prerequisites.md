# Technical Prerequisites

## Core Dependencies

| Dependency | Version | Notes |
|------------|---------|-------|
| Node.js | >=18.17.0 | Required for Next.js 14+ |
| Next.js | 15.1.7 | App Router enabled |
| React | 19.0.0 | Required by Next.js |
| Prisma | 6.5.0 | ORM for database access |
| TypeScript | ^5 | Type safety and developer experience |

## Database Setup (Supabase)

### Local Development Environment

1. **Install Supabase CLI**
```bash
# Using npm
npm install -g supabase

# Verify installation
supabase --version  # Should be >= 1.127.1
```

2. **Initialize Local Supabase**
```bash
# Start local Supabase
supabase init
supabase start

# This will provide you with:
# - Local PostgreSQL connection string
# - Local Studio URL
# - Default credentials
```

3. **Required PostgreSQL Extensions**
```sql
-- These extensions should be enabled in your local Supabase instance
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance monitoring
```

4. **Environment Variables**
```env
# Local Development
DATABASE_URL="postgresql://postgres:[local-password]@localhost:54322/postgres"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-local-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-local-service-role-key]"
```

5. **Database Initialization**
```bash
# Apply Prisma migrations
npx prisma migrate dev

# Seed initial data
npm run seed
```

### Production Environment Requirements

| Component | Specification |
|-----------|--------------|
| Supabase Project | Free Tier (minimum) |
| Database Size | 500MB base (scalable) |
| Compute | Starter compute (scalable) |
| Row Limit | 50,000 (Free Tier) |

### Connection Pooling Configuration

```typescript
// src/lib/prisma.ts
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  maxConnections: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

## Development Tools

| Tool | Version | Purpose |
|------|---------|----------|
| VS Code | Latest | Recommended IDE |
| Supabase CLI | >=1.127.1 | Local development |
| Git | Latest | Version control |

## Required VS Code Extensions

- Prisma (Prisma.prisma)
- ESLint (dbaeumer.vscode-eslint)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- PostgreSQL (ckolkman.vscode-postgres)

## System Requirements

- Minimum 8GB RAM
- 10GB free disk space
- Docker Desktop (for local Supabase)

## Network Requirements

- Outbound access to:
  - supabase.com
  - vercel.com
  - clerk.dev
  - npm registry

## Additional Services

| Service | Plan | Purpose |
|---------|------|----------|
| Clerk | Free Tier | Authentication |
| Vercel | Hobby | Hosting |
| Resend | Free Tier | Email service |

## Authentication Setup

### Clerk Configuration

1. **Initial Setup**
```bash
# Install Clerk SDK
npm install @clerk/nextjs
```

2. **Environment Variables**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/admin/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/admin/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/admin
```

3. **Protected Routes**
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
 
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

4. **Admin Role Setup**
```typescript
// types/clerk.d.ts
type AdminRole = "admin" | "staff";

interface UserPublicMetadata {
  role?: AdminRole;
}

// lib/auth.ts
export async function isAdmin(userId: string) {
  const user = await clerkClient.users.getUser(userId);
  return user.publicMetadata.role === "admin";
}

export async function hasPermission(userId: string, permission: string) {
  const user = await clerkClient.users.getUser(userId);
  const role = user.publicMetadata.role;
  
  // Define role permissions
  const permissions = {
    admin: ["manage_bookings", "manage_services", "manage_availability"],
    staff: ["view_bookings"]
  };
  
  return role && permissions[role]?.includes(permission);
}
```

5. **Initial Admin Setup**
```bash
# Using Clerk Admin API to set role
curl -X PATCH \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"public_metadata":{"role":"admin"}}' \
  "https://api.clerk.dev/v1/users/$USER_ID"
```

### Route Protection Matrix

| Route | Public | Auth Required | Admin Only |
|-------|--------|--------------|------------|
| / | ✅ | | |
| /book/* | ✅ | | |
| /admin | | ✅ | ✅ |
| /admin/bookings | | ✅ | ✅ |
| /admin/services | | ✅ | ✅ |
| /admin/availability | | ✅ | ✅ |
| /api/services | ✅ | | |
| /api/availability/* | ✅ | | |
| /api/bookings/public/* | ✅ | | |
| /api/admin/* | | ✅ | ✅ |

## Post-Setup Verification

Run the following commands to verify your setup:

```bash
# Verify database connection
npx prisma db push --preview-feature

# Verify Supabase connection
supabase status

# Run test suite
npm test

# Start development server
npm run dev
```

Expected output should show:
- Successful database connection
- All Supabase services running
- All tests passing
- Development server running on http://localhost:3000

## Troubleshooting Common Issues

1. **Database Connection Issues**
   ```bash
   # Reset local Supabase instance
   supabase stop
   supabase start
   ```

2. **Prisma Schema Sync Issues**
   ```bash
   # Reset database and apply migrations
   npx prisma migrate reset
   npx prisma generate
   ```

3. **Port Conflicts**
   - Default Supabase ports: 54321, 54322
   - Default Next.js port: 3000
   - Ensure these ports are available

## Next Steps

After completing the setup:
1. Verify all environment variables are set
2. Run the seeding script for initial data
3. Test the admin login flow
4. Verify email service configuration 