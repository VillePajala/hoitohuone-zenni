# Testing Strategy

## Overview

This document outlines the comprehensive testing approach for the healing services booking system. It covers all testing levels from unit tests to end-to-end testing, including performance and load testing scenarios.

## Testing Levels

### 1. Unit Testing

#### Component Tests
```typescript
// src/components/__tests__/ServiceCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceCard } from '../ServiceCard';

describe('ServiceCard', () => {
  const mockService = {
    id: '1',
    name: 'Energy Healing',
    duration: 75,
    price: 100,
    description: 'Test description'
  };

  test('renders service information correctly', () => {
    render(<ServiceCard service={mockService} />);
    expect(screen.getByText('Energy Healing')).toBeInTheDocument();
    expect(screen.getByText('75 min | 100€')).toBeInTheDocument();
  });

  test('handles selection', () => {
    const onSelect = jest.fn();
    render(<ServiceCard service={mockService} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockService.id);
  });
});
```

#### Utility Function Tests
```typescript
// src/utils/__tests__/date.test.ts
import { isAvailableTime, getTimeSlots } from '../date';

describe('Date utilities', () => {
  test('validates available time slots', () => {
    const blockedTimes = ['2024-01-01T10:00:00Z'];
    expect(isAvailableTime('2024-01-01T11:00:00Z', blockedTimes)).toBe(true);
    expect(isAvailableTime('2024-01-01T10:00:00Z', blockedTimes)).toBe(false);
  });

  test('generates correct time slots', () => {
    const slots = getTimeSlots('2024-01-01', 75);
    expect(slots).toHaveLength(8); // 8 slots for 75-minute sessions
    expect(slots[0]).toBe('10:00');
    expect(slots[slots.length - 1]).toBe('17:15');
  });
});
```

### 2. Integration Testing

#### API Integration Tests
```typescript
// src/tests/integration/booking-flow.test.ts
import { createBooking, getAvailability } from '@/lib/api';

describe('Booking Flow Integration', () => {
  test('creates booking with valid data', async () => {
    const bookingData = {
      serviceId: '1',
      dateTime: '2024-01-01T10:00:00Z',
      customerName: 'John Doe',
      customerEmail: 'john@example.com'
    };

    const result = await createBooking(bookingData);
    expect(result.id).toBeDefined();
    expect(result.status).toBe('confirmed');
  });

  test('checks availability correctly', async () => {
    const availability = await getAvailability('2024-01-01');
    expect(availability).toBeInstanceOf(Array);
    expect(availability[0]).toHaveProperty('time');
    expect(availability[0]).toHaveProperty('available');
  });
});
```

#### Database Integration Tests
```typescript
// src/tests/integration/database.test.ts
import { prisma } from '@/lib/prisma';

describe('Database Operations', () => {
  beforeEach(async () => {
    await prisma.booking.deleteMany();
  });

  test('creates and retrieves booking', async () => {
    const booking = await prisma.booking.create({
      data: {
        serviceId: '1',
        dateTime: new Date('2024-01-01T10:00:00Z'),
        customerName: 'John Doe',
        customerEmail: 'john@example.com'
      }
    });

    const retrieved = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

    expect(retrieved).toMatchObject({
      customerName: 'John Doe',
      customerEmail: 'john@example.com'
    });
  });
});
```

### 3. End-to-End Testing

#### Booking Flow Tests
```typescript
// src/tests/e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('completes full booking process', async ({ page }) => {
    // Step 1: Service Selection
    await page.goto('/book');
    await page.click('text=Energy Healing');
    await page.click('text=Continue');

    // Step 2: Date Selection
    await page.click('text=15'); // Select 15th of current month
    await page.click('text=Continue');

    // Step 3: Time Selection
    await page.click('text=10:00');
    await page.click('text=Continue');

    // Step 4: Customer Information
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.click('text=Review Booking');

    // Step 5: Confirmation
    await page.click('text=Confirm Booking');
    
    // Verify success
    await expect(page.locator('text=Booking Confirmed')).toBeVisible();
  });
});
```

### 4. Performance Testing

#### Load Testing Scenarios
```typescript
// src/tests/performance/load.test.ts
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  scenarios: {
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },  // Ramp up
        { duration: '5m', target: 50 },  // Stay at 50 users
        { duration: '2m', target: 0 }    // Ramp down
      ]
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01']    // Less than 1% failure rate
  }
};

export default function() {
  const responses = http.batch([
    ['GET', 'http://test.k6.io/'],
    ['GET', 'http://test.k6.io/booking'],
    ['GET', 'http://test.k6.io/availability']
  ]);

  check(responses[0], {
    'homepage status was 200': (r) => r.status === 200
  });
}
```

#### Stress Testing
```typescript
// src/tests/performance/stress.test.ts
export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 }
      ]
    }
  }
};
```

## Test Cases

### 1. Booking Flow Test Cases

#### Service Selection
- [ ] Displays all available services
- [ ] Shows service details on selection
- [ ] Validates service availability
- [ ] Handles unavailable services correctly

#### Date Selection
- [ ] Shows correct calendar interface
- [ ] Highlights available dates
- [ ] Prevents selection of past dates
- [ ] Handles timezone differences correctly

#### Time Selection
- [ ] Displays available time slots
- [ ] Updates slots based on service duration
- [ ] Prevents double bookings
- [ ] Handles buffer times correctly

#### Customer Information
- [ ] Validates required fields
- [ ] Handles email format validation
- [ ] Processes phone number formatting
- [ ] Supports multiple languages

#### Confirmation
- [ ] Shows booking summary
- [ ] Sends confirmation email
- [ ] Creates correct database entry
- [ ] Handles payment if required

### 2. Admin Interface Test Cases

#### Dashboard
- [ ] Displays correct booking counts
- [ ] Shows upcoming appointments
- [ ] Updates in real-time
- [ ] Filters work correctly

#### Calendar Management
- [ ] Shows all bookings
- [ ] Allows blocking time slots
- [ ] Handles recurring blocks
- [ ] Updates availability correctly

#### Service Management
- [ ] CRUD operations for services
- [ ] Price updates
- [ ] Duration changes
- [ ] Service availability toggling

### 3. Edge Cases

#### Booking Conflicts
- [ ] Simultaneous booking attempts
- [ ] Last-minute cancellations
- [ ] Service becoming unavailable
- [ ] Time slot conflicts

#### Data Validation
- [ ] Special characters in names
- [ ] International phone numbers
- [ ] Long text inputs
- [ ] SQL injection attempts

#### Error Handling
- [ ] Network failures
- [ ] Database connection issues
- [ ] Third-party service outages
- [ ] Invalid input recovery

## Testing Tools

### Unit and Integration Testing
- Jest
- React Testing Library
- MSW (Mock Service Worker)
- Prisma Client Mock

### End-to-End Testing
- Playwright
- Cypress (as backup)

### Performance Testing
- k6
- Lighthouse
- WebPageTest

### Security Testing
- OWASP ZAP
- SonarQube
- npm audit

## Testing Environments

### Development
- Local environment
- Mock external services
- Test database

### Staging
- Production-like environment
- Sandbox external services
- Anonymized production data

### Production
- Monitoring and logging
- Feature flags
- A/B testing capability

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test
      - name: Run integration tests
        run: npm run test:integration
      - name: Run e2e tests
        run: npm run test:e2e
      - name: Run performance tests
        run: npm run test:performance
```

## Quality Metrics

### Coverage Targets
- Unit Tests: 90%
- Integration Tests: 80%
- E2E Tests: Key user flows
- Performance: 90th percentile response time < 500ms

### Performance Targets
- Page Load: < 2s
- Time to Interactive: < 3s
- First Contentful Paint: < 1s
- Lighthouse Score: > 90

## Testing Schedule

### Continuous
- Unit tests on each commit
- Integration tests on PR
- Daily performance monitoring

### Weekly
- Full E2E test suite
- Load testing
- Security scans

### Monthly
- Penetration testing
- Full regression testing
- Performance optimization

## Reporting

### Test Reports
- Jest coverage reports
- Playwright test results
- Performance metrics
- Security scan findings

### Monitoring
- Error tracking
- Performance monitoring
- User behavior analytics
- System health metrics 