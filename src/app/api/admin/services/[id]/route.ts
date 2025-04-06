import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Define params type for context
interface RouteContext {
    params: { id: string };
}

// Zod schema to validate the ID parameter
const ParamSchema = z.object({
    id: z.string().uuid('Invalid service ID format in URL')
});

// Zod schema for updating a service (all fields optional)
const UpdateServiceSchema = z.object({
    title: z.string().min(2).max(100).optional(),
    titleEn: z.string().min(2).max(100).optional(),
    titleFi: z.string().min(2).max(100).optional(),
    description: z.string().max(1000).optional(),
    descriptionEn: z.string().max(1000).optional(),
    descriptionFi: z.string().max(1000).optional(),
    duration: z.number().int().positive().optional(),
    price: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format').optional(),
    active: z.boolean().optional(),
    order: z.number().int().optional(),
});

// --- PUT Handler (Update a service) --- 
export async function PUT(request: Request, context: RouteContext) {
    // TODO: Add authentication and authorization check (manage_services permission)

    // Validate the ID from the URL path
    const paramsValidation = ParamSchema.safeParse(context.params);
    if (!paramsValidation.success) {
        return NextResponse.json(
            { error: { code: 'BAD_REQUEST', message: 'Invalid service ID format', details: paramsValidation.error.format() } },
            { status: 400 }
        );
    }
    const { id } = paramsValidation.data;

    // Validate request body
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const bodyValidation = UpdateServiceSchema.safeParse(body);
    if (!bodyValidation.success) {
        return NextResponse.json(
            { error: { code: 'BAD_REQUEST', message: 'Invalid request body', details: bodyValidation.error.format() } },
            { status: 400 }
        );
    }
    const updateData = bodyValidation.data;

    // Prevent updating with an empty object
    if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
            { error: { code: 'BAD_REQUEST', message: 'Request body cannot be empty' } },
            { status: 400 }
        );
    }

    try {
        // Check if service exists
        const existingService = await prisma.service.findUnique({
            where: { id }
        });

        if (!existingService) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Service not found' } }, { status: 404 });
        }

        // Update the service
        const updatedService = await prisma.service.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ service: updatedService });

    } catch (error) {
        console.error(`Failed to update service ${id}:`, error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update service' } },
            { status: 500 }
        );
    }
}

// --- DELETE Handler (Delete a service) --- 
export async function DELETE(request: Request, context: RouteContext) {
    // TODO: Add authentication and authorization check (manage_services permission)

    // Validate the ID from the URL path
    const paramsValidation = ParamSchema.safeParse(context.params);
    if (!paramsValidation.success) {
        return NextResponse.json(
            { error: { code: 'BAD_REQUEST', message: 'Invalid service ID format', details: paramsValidation.error.format() } },
            { status: 400 }
        );
    }
    const { id } = paramsValidation.data;

    try {
        // Check if service exists
        const existingService = await prisma.service.findUnique({
            where: { id }
        });

        if (!existingService) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Service not found' } }, { status: 404 });
        }

        // TODO: Check if service has associated bookings - might want to prevent deletion or make this a soft delete

        // Delete the service
        await prisma.service.delete({
            where: { id }
        });

        return NextResponse.json(
            { success: true, message: 'Service has been successfully deleted' },
            { status: 200 }
        );

    } catch (error) {
        console.error(`Failed to delete service ${id}:`, error);
        
        // Handle potential foreign key constraint violations (if bookings reference this service)
        if (error instanceof Error && 'code' in error && error.code === 'P2003') {
            return NextResponse.json(
                { error: { code: 'CONFLICT', message: 'Cannot delete service with existing bookings' } },
                { status: 409 }
            );
        }
        
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete service' } },
            { status: 500 }
        );
    }
} 