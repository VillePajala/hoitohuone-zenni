# Hoitohuone Zenni

A professional website for an energy healing service provider, featuring a comprehensive booking system, multilingual support, and admin dashboard.

## Overview

This website serves as a digital presence for Hoitohuone Zenni, offering:
- Detailed service information with multilingual support (Finnish and English)
- Integrated booking system for scheduling appointments
- Admin dashboard for managing services, bookings, and availability
- Client testimonials and FAQ sections
- SEO optimization with structured data

## Features

### Public Website
- **Multilingual Support**: Complete Finnish and English language versions
- **Service Listings**: Detailed information about available healing services
- **Booking System**: Step-by-step appointment booking process
  - Service selection
  - Date and time slot picking
  - Customer information collection
  - Email confirmations
  - Booking cancellation capability
- **Testimonials**: Client feedback and success stories
- **FAQ Section**: Common questions and answers
- **Responsive Design**: Mobile-friendly interface

### Admin Dashboard
- **Authentication**: Secure login system using Clerk.js
- **Booking Management**: View, update, and manage appointments
- **Services Management**: Create, edit, activate/deactivate services
- **Analytics**: Track booking patterns and service popularity
- **Diagnostic Tools**: Troubleshooting endpoints and utilities

## Technical Stack

### Frontend
- **Framework**: Next.js 15.1.7+ (App Router)
- **UI**: React with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk.js
- **State Management**: React Hooks

### Backend
- **API Routes**: Next.js API routes with middleware
- **Database ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Email**: NodeMailer for email notifications

### Infrastructure
- **Hosting**: Vercel
- **Performance**: Edge caching and API optimization
- **SEO**: Structured data and metadata optimization

## Project Structure

```
/src
  /app             # Next.js App Router pages and layouts
    /[locale]      # Localized routes (fi and en)
    /admin         # Admin dashboard
    /api           # API endpoints
  /components      # Reusable React components
  /lib             # Utility functions and shared libraries
  /middleware.ts   # Request middleware (language handling)
  /types           # TypeScript type definitions
/prisma
  /schema.prisma   # Database schema
/.documentation    # Project documentation
```

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn
- PostgreSQL database (local or Supabase)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hoitohuone-zenni.git
cd hoitohuone-zenni
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hoitohuone"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# Email
EMAIL_SERVER=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Current Status

The project is currently in active development. Recent updates include:
- Next.js 15.1.7+ compatibility improvements
- Services management interface implementation
- Booking system API enhancements
- Admin interface improvements
- Diagnostic and debugging tools

## Next Steps

Planned features and improvements:
- Service ordering and categorization
- Enhanced availability management system
- Advanced admin dashboard with analytics
- Comprehensive testing and QA
- Production deployment optimization

## License

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
