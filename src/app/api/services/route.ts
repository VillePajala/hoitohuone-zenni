import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjust import path if needed

export async function GET(request: Request) {
  try {
    const services = await prisma.service.findMany({
      where: {
        active: true, // Only fetch active services
      },
      select: {
        id: true,
        title: true,
        titleEn: true,
        titleFi: true,
        description: true,
        descriptionEn: true,
        descriptionFi: true,
        duration: true,
        price: true,
        currency: true,
        color: true,
      },
      orderBy: {
        order: 'asc', // Order by the 'order' field if available
      },
    });

    // TODO: Implement logic to select title/description based on language preference (e.g., from Accept-Language header or query param)
    // For now, returning all language variants.

    return NextResponse.json({ services });

  } catch (error) {
    console.error("Failed to fetch services:", error);
    // Return a generic error response
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch services',
        },
      },
      { status: 500 }
    );
  }
} 