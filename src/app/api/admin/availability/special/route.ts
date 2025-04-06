import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Zod schema for special date settings
const SpecialDateSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, 'Time must be in HH:MM:SS format'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, 'Time must be in HH:MM:SS format'),
    isAvailable: z.boolean().default(true),
});

export async function POST(request: Request) {
    // TODO: Add authentication and authorization check (manage_availability permission)

    try {
        const body = await request.json();
        const validation = SpecialDateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: { code: 'BAD_REQUEST', message: 'Invalid request body', details: validation.error.format() } },
                { status: 400 }
            );
        }

        const { date, startTime, endTime, isAvailable } = validation.data;

        // Ensure startTime is earlier than endTime if isAvailable=true
        if (isAvailable && startTime >= endTime) {
            return NextResponse.json(
                { error: { code: 'BAD_REQUEST', message: 'Start time must be earlier than end time' } },
                { status: 400 }
            );
        }

        // Check if date is already blocked - if so, should fail
        const existingBlockedDate = await prisma.blockedDate.findUnique({
            where: { date }
        });

        if (existingBlockedDate) {
            return NextResponse.json(
                { error: { code: 'CONFLICT', message: 'Date is already blocked. Unblock it first before setting special hours.' } },
                { status: 409 }
            );
        }

        // Check if date already has special settings, if so, update them
        const existingSpecialDate = await prisma.specialDate.findUnique({
            where: { date }
        });

        let availability;
        if (existingSpecialDate) {
            // Update existing entry
            availability = await prisma.specialDate.update({
                where: { date },
                data: { startTime, endTime, isAvailable }
            });
        } else {
            // Create new entry
            availability = await prisma.specialDate.create({
                data: { date, startTime, endTime, isAvailable }
            });
        }

        return NextResponse.json({ availability }, { status: existingSpecialDate ? 200 : 201 });

    } catch (error) {
        console.error("Failed to set special date:", error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to set special date' } },
            { status: 500 }
        );
    }
} 