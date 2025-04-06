import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { parseISO, addMinutes, isValid } from 'date-fns';
import { checkSlotAvailability } from '@/lib/availability'; // Re-use for time changes

// Define params type for context
interface RouteContext {
    params: { id: string };
}

// Zod schema to validate the ID parameter
const ParamSchema = z.object({
    id: z.string().uuid('Invalid booking ID format in URL')
});

// Zod schema for validating the update request body (all fields optional)
const UpdateBookingSchema = z.object({
  startTime: z.string().refine((time) => isValid(parseISO(time)), {
    message: "Invalid ISO 8601 startTime string",
  }).optional(),
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  language: z.enum(['en', 'fi']).optional(),
  notes: z.string().max(500).optional().nullable(), // Allow setting notes to null
  status: z.string().optional(), // Consider defining allowed statuses? e.g., z.enum([...])
});

// Optional schema for DELETE request body
const DeleteBodySchema = z.object({
    sendNotification: z.boolean().default(true).optional(),
    cancellationReason: z.string().max(200).optional(), // Optional reason from admin
});

export async function GET(request: Request, context: RouteContext) {
    // TODO: Add authentication and authorization check here or rely on middleware
    // const { userId } = auth(); -> Requires Clerk setup
    // if (!userId || !(await hasPermission(userId, 'manage_bookings'))) { ... }

    // Validate the ID from the URL path
    const paramsValidation = ParamSchema.safeParse(context.params);
    if (!paramsValidation.success) {
        return NextResponse.json(
            { error: { code: 'BAD_REQUEST', message: 'Invalid booking ID format', details: paramsValidation.error.format() } },
            { status: 400 }
        );
    }

    const { id } = paramsValidation.data;

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: id },
            include: {
                service: {
                    select: {
                        title: true,
                        titleEn: true,
                        titleFi: true,
                    }
                }
            }
        });

        if (!booking) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Booking not found' } },
                { status: 404 }
            );
        }

        // Format the response according to API spec section 6.2
        const formattedBooking = {
            id: booking.id,
            serviceId: booking.serviceId,
            serviceName: booking.service[booking.language === 'en' ? 'titleEn' : 'titleFi'] || booking.service.title,
            startTime: booking.startTime.toISOString(),
            endTime: booking.endTime.toISOString(),
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            language: booking.language,
            notes: booking.notes,
            status: booking.status,
            cancellationId: booking.cancellationId, // Included in detail view
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(), // Included in detail view
        };

        return NextResponse.json({ booking: formattedBooking });

    } catch (error) {
        console.error(`Failed to fetch booking ${id}:`, error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch booking details' } },
            { status: 500 }
        );
    }
}

// --- PUT Handler --- 
export async function PUT(request: Request, context: RouteContext) {
    // TODO: Add authentication and authorization check

    // Validate ID from URL
    const paramsValidation = ParamSchema.safeParse(context.params);
    if (!paramsValidation.success) {
        return NextResponse.json(
            { error: { code: 'BAD_REQUEST', message: 'Invalid booking ID format', details: paramsValidation.error.format() } },
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

    const bodyValidation = UpdateBookingSchema.safeParse(body);
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
        const existingBooking = await prisma.booking.findUnique({
            where: { id },
            include: { service: { select: { duration: true } } }
        });

        if (!existingBooking) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Booking not found' } }, { status: 404 });
        }

        // Prepare the data object for the Prisma update call
        const dataToUpdate: Record<string, any> = { ...updateData };
        let newStartTime: Date | undefined = undefined;
        let calculatedEndTime: Date | undefined = undefined;

        // If startTime is being updated, validate and calculate endTime
        if (updateData.startTime) {
            newStartTime = parseISO(updateData.startTime);
            
            // *** IMPORTANT: Availability check needs refinement to exclude current booking ***
            const availabilityResult = await checkSlotAvailability(newStartTime, existingBooking.serviceId);

            if (!availabilityResult.available || !availabilityResult.endTime) {
                return NextResponse.json(
                    { error: { code: 'CONFLICT', message: availabilityResult.error || 'Requested time slot is not available' } }, 
                    { status: 409 }
                );
            }
            calculatedEndTime = availabilityResult.endTime;
            
            // Use the validated Date objects for the update
            dataToUpdate.startTime = newStartTime; 
            dataToUpdate.endTime = calculatedEndTime;
        }
        // Remove the original string startTime from updateData if it existed
        // It's now handled correctly in dataToUpdate with Date objects
        if (dataToUpdate.hasOwnProperty('startTime') && typeof dataToUpdate.startTime === 'string'){
             delete dataToUpdate.startTime;
        }
        
        // If startTime was not provided for update, ensure endTime isn't accidentally changed
        if (!newStartTime) {
            delete dataToUpdate.endTime; // Prevent overriding endTime if startTime didn't change
        }
        
        // Perform the update using the prepared data object
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: dataToUpdate, // Use the prepared object
            // Select fields according to API spec for update response (section 6.4)
            select: { 
                id: true,
                startTime: true,
                endTime: true,
                customerName: true,
                notes: true,
                status: true,
                updatedAt: true, // Spec includes updatedAt
                // Include other potentially updated fields if needed
                customerEmail: true, 
                customerPhone: true, 
                language: true,
                serviceId: true,
            }
        });

        // TODO: Send update notification email?

        // Re-fetch service details to include serviceName in response (as GET detail does)
        const serviceDetails = await prisma.service.findUnique({
            where: { id: updatedBooking.serviceId },
            select: { title: true, titleEn: true, titleFi: true }
        });

        // Format response similar to GET detail, but only fields mentioned in PUT spec section 6.4?
        // Spec example only shows a subset, let's return the richer set for consistency?
        const formattedResponse = {
             ...updatedBooking,
             startTime: updatedBooking.startTime.toISOString(),
             endTime: updatedBooking.endTime.toISOString(),
             updatedAt: updatedBooking.updatedAt.toISOString(),
             serviceName: serviceDetails ? (serviceDetails[updatedBooking.language === 'en' ? 'titleEn' : 'titleFi'] || serviceDetails.title) : 'Unknown Service'
        };

        return NextResponse.json({ booking: formattedResponse });

    } catch (error) {
        console.error(`Failed to update booking ${id}:`, error);
         if (error instanceof Error && 'code' in error && error.code === 'P2002') { // Prisma unique constraint error
            return NextResponse.json(
                { error: { code: 'CONFLICT', message: 'Time slot conflict occurred during update.' } }, 
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update booking' } },
            { status: 500 }
        );
    }
}

// --- DELETE Handler --- 
export async function DELETE(request: Request, context: RouteContext) {
    // TODO: Add authentication and authorization check

    // Validate ID from URL
    const paramsValidation = ParamSchema.safeParse(context.params);
    if (!paramsValidation.success) {
        return NextResponse.json(
            { error: { code: 'BAD_REQUEST', message: 'Invalid booking ID format', details: paramsValidation.error.format() } },
            { status: 400 }
        );
    }
    const { id } = paramsValidation.data;

    // Try to parse body for optional flags, ignore if no body or invalid
    let sendNotification = true; // Default
    let cancellationReason: string | undefined = undefined;
    try {
        const body = await request.json();
        const bodyValidation = DeleteBodySchema.safeParse(body);
        if (bodyValidation.success) {
            sendNotification = bodyValidation.data.sendNotification ?? true;
            cancellationReason = bodyValidation.data.cancellationReason;
        }
        // If parsing or validation fails, proceed with defaults
    } catch (e) { /* Ignore errors, use defaults */ }

    try {
        // Find the booking to ensure it exists
        const booking = await prisma.booking.findUnique({
            where: { id: id },
            select: { id: true, status: true, customerEmail: true }, // Need email for notification
        });

        if (!booking) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Booking not found' } },
                { status: 404 }
            );
        }

        // Check if already cancelled
        if (booking.status === 'cancelled') {
            return NextResponse.json(
                { success: true, message: 'Booking was already cancelled.' },
                { status: 200 }
            );
        }

        // Update status to cancelled
        await prisma.booking.update({
            where: { id: id },
            data: {
                status: 'cancelled',
                // Could potentially store cancellationReason in notes or a dedicated field?
                // notes: booking.notes ? `${booking.notes}\nAdmin Cancel Reason: ${cancellationReason}` : `Admin Cancel Reason: ${cancellationReason}`
            },
        });

        // TODO: If sendNotification is true, send email to booking.customerEmail
        if (sendNotification) {
            console.log(`TODO: Send cancellation notification for booking ${id} to ${booking.customerEmail}. Reason: ${cancellationReason || 'N/A'}`);
        }

        return NextResponse.json(
            { success: true, message: 'Booking has been successfully canceled' },
            { status: 200 }
        );

    } catch (error) {
        console.error(`Failed to admin-cancel booking ${id}:`, error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to cancel booking' } },
            { status: 500 }
        );
    }
} 