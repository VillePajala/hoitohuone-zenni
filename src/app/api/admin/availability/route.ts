import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { parseISO, startOfDay, endOfDay, isValid } from 'date-fns';

// Validation schema for query parameters
const QuerySchema = z.object({
    from: z.string().refine((d) => !d || isValid(parseISO(d)), { message: 'Invalid from date format' }).optional(),
    to: z.string().refine((d) => !d || isValid(parseISO(d)), { message: 'Invalid to date format' }).optional(),
});

export async function GET(request: Request) {
    // TODO: Add authentication and authorization check (manage_availability permission)

    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const validation = QuerySchema.safeParse({
        from: searchParams.get('from'),
        to: searchParams.get('to'),
    });

    if (!validation.success) {
        return NextResponse.json(
            { error: { code: 'BAD_REQUEST', message: 'Invalid query parameters', details: validation.error.format() } },
            { status: 400 }
        );
    }

    const { from, to } = validation.data;

    try {
        // Get regular hours (weekday settings) - not filtered by date
        const regularHours = await prisma.regularHours.findMany({
            orderBy: { dayOfWeek: 'asc' },
        });

        // Build date filters for special dates and blocked dates if from/to provided
        const dateFilter: any = {};
        if (from) {
            dateFilter.gte = from;
        }
        if (to) {
            dateFilter.lte = to;
        }

        // Get special dates (if date filters provided)
        const specialDatesQuery = prisma.specialDate.findMany({
            ...(Object.keys(dateFilter).length > 0 && {
                where: { date: dateFilter },
            }),
            orderBy: { date: 'asc' },
        });

        // Get blocked dates (if date filters provided)
        const blockedDatesQuery = prisma.blockedDate.findMany({
            ...(Object.keys(dateFilter).length > 0 && {
                where: { date: dateFilter },
            }),
            orderBy: { date: 'asc' },
        });

        // Execute all queries in parallel
        const [specialDates, blockedDates] = await Promise.all([
            specialDatesQuery,
            blockedDatesQuery,
        ]);

        // Format the response
        return NextResponse.json({
            regularHours,
            specialDates,
            blockedDates,
        });

    } catch (error) {
        console.error("Failed to fetch availability settings:", error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch availability settings' } },
            { status: 500 }
        );
    }
} 