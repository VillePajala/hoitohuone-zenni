import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Zod schema for regular hours settings
const RegularHoursSchema = z.object({
    dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, ..., 6 = Saturday
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, 'Time must be in HH:MM:SS format'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, 'Time must be in HH:MM:SS format'),
    isAvailable: z.boolean().default(true),
});

export async function POST(request: Request) {
    // TODO: Add authentication and authorization check (manage_availability permission)

    try {
        const body = await request.json();
        const validation = RegularHoursSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: { code: 'BAD_REQUEST', message: 'Invalid request body', details: validation.error.format() } },
                { status: 400 }
            );
        }

        const { dayOfWeek, startTime, endTime, isAvailable } = validation.data;

        // Ensure startTime is earlier than endTime if isAvailable=true
        if (isAvailable && startTime >= endTime) {
            return NextResponse.json(
                { error: { code: 'BAD_REQUEST', message: 'Start time must be earlier than end time' } },
                { status: 400 }
            );
        }

        // Check if day already has settings, if so, update them
        const existingRegularHours = await prisma.regularHours.findUnique({
            where: { dayOfWeek },
        });

        let availability;
        if (existingRegularHours) {
            // Update existing entry
            availability = await prisma.regularHours.update({
                where: { dayOfWeek },
                data: { startTime, endTime, isAvailable },
            });
        } else {
            // Create new entry
            availability = await prisma.regularHours.create({
                data: { dayOfWeek, startTime, endTime, isAvailable },
            });
        }

        return NextResponse.json({ availability }, { status: existingRegularHours ? 200 : 201 });

    } catch (error) {
        console.error("Failed to set regular hours:", error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to set regular hours' } },
            { status: 500 }
        );
    }
} 