import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Zod schema for blocking dates
const BlockDateSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    reason: z.string().max(255).optional(),
});

export async function POST(request: Request) {
    // TODO: Add authentication and authorization check (manage_availability permission)

    try {
        const body = await request.json();
        const validation = BlockDateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: { code: 'BAD_REQUEST', message: 'Invalid request body', details: validation.error.format() } },
                { status: 400 }
            );
        }

        const { date, reason } = validation.data;

        // Check if date already has special hours - if so, should fail
        const existingSpecialDate = await prisma.specialDate.findUnique({
            where: { date }
        });

        if (existingSpecialDate) {
            return NextResponse.json(
                { 
                    error: { 
                        code: 'CONFLICT', 
                        message: 'Date already has special hours set. Remove special hours first before blocking the date.' 
                    } 
                },
                { status: 409 }
            );
        }

        // Check if date already has bookings - if so, should fail
        const dateObj = new Date(date);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const existingBookings = await prisma.booking.findFirst({
            where: {
                startTime: {
                    gte: dateObj,
                    lt: nextDay
                },
                status: { in: ['CONFIRMED', 'PENDING'] }
            }
        });

        if (existingBookings) {
            return NextResponse.json(
                { 
                    error: { 
                        code: 'CONFLICT', 
                        message: 'Cannot block date with existing bookings. Cancel all bookings for this date first.' 
                    } 
                },
                { status: 409 }
            );
        }

        // Check if date is already blocked, if so, update reason
        const existingBlockedDate = await prisma.blockedDate.findUnique({
            where: { date }
        });

        let blockedDate;
        if (existingBlockedDate) {
            // Update existing entry
            blockedDate = await prisma.blockedDate.update({
                where: { date },
                data: { reason }
            });
        } else {
            // Create new entry
            blockedDate = await prisma.blockedDate.create({
                data: { date, reason }
            });
        }

        return NextResponse.json({ blockedDate }, { status: existingBlockedDate ? 200 : 201 });

    } catch (error) {
        console.error("Failed to block date:", error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to block date' } },
            { status: 500 }
        );
    }
} 