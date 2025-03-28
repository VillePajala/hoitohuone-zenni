# Integration Guidelines

## Overview

This document outlines the implementation details for integrating external services into the booking system. It focuses on email notifications, authentication, database, and other third-party integrations required for the system's operation.

## Email Integration

### Service Provider: Resend

We will use Resend for transactional emails due to its reliability and developer-friendly API.

#### Setup
```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  html,
  from = 'Healing Services <bookings@yourdomain.com>'
}) => {
  return await resend.emails.send({
    from,
    to,
    subject,
    html
  });
};
```

#### Email Templates
All email templates will be created using React Email for consistency and maintainability.

```typescript
// src/emails/booking-confirmation.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text
} from '@react-email/components';

export const BookingConfirmationEmail = ({
  customerName,
  serviceName,
  dateTime,
  cancellationLink
}: BookingConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your booking confirmation for {serviceName}</Preview>
    <Body>
      <Container>
        <Heading>Booking Confirmation</Heading>
        <Text>Dear {customerName},</Text>
        <Text>Your appointment has been confirmed:</Text>
        <Text>Service: {serviceName}</Text>
        <Text>Date & Time: {dateTime}</Text>
        <Text>To cancel or reschedule: {cancellationLink}</Text>
      </Container>
    </Body>
  </Html>
);
```

### Email Triggers

| Event | Template | Timing | Recipients |
|-------|----------|---------|------------|
| Booking Confirmation | `booking-confirmation` | Immediate | Customer |
| Booking Reminder | `booking-reminder` | 24h before | Customer |
| Booking Cancellation | `booking-cancelled` | Immediate | Customer |
| New Booking Alert | `admin-new-booking` | Immediate | Admin |
| Daily Summary | `admin-daily-summary` | End of day | Admin |

## Authentication Integration

### Service Provider: Clerk

Clerk will handle user authentication and management.

#### Setup
```typescript
// src/middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/api/bookings/public/*',
    '/book/*'
  ],
  ignoredRoutes: [
    '/api/webhooks/*'
  ]
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

#### Admin Role Configuration
```typescript
// src/lib/auth.ts
import { clerkClient } from '@clerk/nextjs';

export const isAdmin = async (userId: string) => {
  const user = await clerkClient.users.getUser(userId);
  return user.publicMetadata.role === 'admin';
};
```

## Database Integration

### Service Provider: Supabase

#### Connection Setup
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

#### Prisma Integration
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## Analytics Integration

### Service Provider: Vercel Analytics

#### Setup
```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Calendar Integration

### Service: react-big-calendar

#### Setup
```typescript
// src/components/admin/Calendar.tsx
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import fi from 'date-fns/locale/fi';

const locales = {
  'en-US': enUS,
  'fi': fi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});
```

## Environment Variables

### Required Variables
```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email
RESEND_API_KEY=

# General
NEXT_PUBLIC_APP_URL=
```

## Webhook Handling

### Webhook Security
```typescript
// src/lib/webhook.ts
import { verifyWebhookSignature } from '@resend/node';

export const verifyWebhook = (
  payload: string,
  signature: string,
  secret: string
) => {
  try {
    verifyWebhookSignature({
      payload,
      signature,
      secret
    });
    return true;
  } catch (err) {
    return false;
  }
};
```

### Webhook Routes
```typescript
// src/app/api/webhooks/email/route.ts
import { verifyWebhook } from '@/lib/webhook';

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('webhook-signature') || '';

  if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET!)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Process webhook
  const data = JSON.parse(payload);
  // Handle webhook logic...

  return new Response('OK', { status: 200 });
}
```

## Error Handling

### Integration Error Handling
```typescript
// src/lib/error.ts
export class IntegrationError extends Error {
  constructor(
    message: string,
    public service: string,
    public code?: string
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export const handleIntegrationError = (error: unknown, service: string) => {
  console.error(`${service} integration error:`, error);
  // Log to error tracking service
  // Notify admin if critical
};
```

## Health Checks

### Integration Health Monitoring
```typescript
// src/lib/health.ts
export const checkIntegrationHealth = async () => {
  const checks = {
    database: await checkDatabaseConnection(),
    email: await checkEmailService(),
    auth: await checkAuthService()
  };

  return {
    healthy: Object.values(checks).every(check => check.healthy),
    services: checks
  };
};
```

## Backup Services

### Fallback Email Provider
```typescript
// src/lib/email-fallback.ts
import nodemailer from 'nodemailer';

export const sendFallbackEmail = async ({
  to,
  subject,
  html
}) => {
  const transport = nodemailer.createTransport({
    // Fallback SMTP configuration
  });

  return await transport.sendMail({
    to,
    subject,
    html
  });
};
```

## Testing Integration Points

### Integration Tests
```typescript
// src/tests/integration/email.test.ts
describe('Email Integration', () => {
  test('sends booking confirmation', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Booking',
      html: '<p>Test</p>'
    });
    expect(result.id).toBeDefined();
  });
});
```

## Monitoring and Logging

### Integration Monitoring
```typescript
// src/lib/monitoring.ts
export const logIntegrationMetrics = async (
  service: string,
  operation: string,
  duration: number,
  success: boolean
) => {
  // Log metrics to monitoring service
};
```

## Rate Limiting

### API Rate Limiting
```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
``` 