import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export interface RouteContext {
    params: {
        date: string;
    };
}

// Validate date parameter
const ParamSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export async function DELETE(_request: Request, context: RouteContext) {
    // TODO: Add authentication and authorization check (manage_availability permission)

    try {
        const validation = ParamSchema.safeParse(context.params);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: { code: 'BAD_REQUEST', message: 'Invalid date format', details: validation.error.format() } },
                { status: 400 }
            );
        }

        const { date } = validation.data;

        // Check if date exists
        const specialDate = await prisma.specialDate.findUnique({
            where: { date }
        });

        if (!specialDate) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'No special hours found for this date' } },
                { status: 404 }
            );
        }

        // Delete the special date hours
        await prisma.specialDate.delete({
            where: { date }
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete special date hours:", error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete special date hours' } },
            { status: 500 }
        );
    }
} 