import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export interface RouteContext {
    params: {
        dayOfWeek: string;
    };
}

// Validate dayOfWeek parameter
const ParamSchema = z.object({
    dayOfWeek: z.string().regex(/^[0-6]$/, 'Day of week must be a number between 0 and 6'),
});

export async function DELETE(_request: Request, context: RouteContext) {
    // TODO: Add authentication and authorization check (manage_availability permission)

    try {
        const validation = ParamSchema.safeParse(context.params);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: { code: 'BAD_REQUEST', message: 'Invalid day of week', details: validation.error.format() } },
                { status: 400 }
            );
        }

        const dayOfWeek = parseInt(validation.data.dayOfWeek);

        // Check if regular hours exist for this day
        const regularHours = await prisma.regularHours.findUnique({
            where: { dayOfWeek }
        });

        if (!regularHours) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'No regular hours found for this day' } },
                { status: 404 }
            );
        }

        // Delete the regular hours
        await prisma.regularHours.delete({
            where: { dayOfWeek }
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete regular hours:", error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete regular hours' } },
            { status: 500 }
        );
    }
} 