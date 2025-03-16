import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/bookings
export async function GET(req: NextRequest) {
  try {
    // In production, you would check if the user is authorized as an admin
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const serviceId = searchParams.get('service');
    const dateStr = searchParams.get('date');
    const search = searchParams.get('search');

    // Build where clause based on query parameters
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (dateStr) {
      // Parse and handle date filtering
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        where.date = {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        };
      }
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { notes: { contains: search } }
      ];
    }

    // Fetch bookings from the database
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: {
        date: 'asc'
      },
      include: {
        service: true
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
} 