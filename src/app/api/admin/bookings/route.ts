import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/admin/bookings
export async function GET(req: NextRequest) {
  try {
    // In production, you would check if the user is authorized as an admin
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    const date = searchParams.get('date');
    const search = searchParams.get('search');

    // Build where clause based on query parameters
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (service) {
      where.service = service;
    }

    if (date) {
      where.date = date;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch bookings from the database
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: {
        date: 'asc'
      },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        service: true,
        date: true,
        startTime: true,
        endTime: true,
        notes: true,
        status: true,
        createdAt: true,
        cancelledAt: true
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