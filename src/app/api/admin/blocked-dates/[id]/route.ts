import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/blocked-dates/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, you would check if the user is authorized as an admin
    
    const id = params.id;
    
    // Fetch the blocked date by ID
    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id }
    });
    
    if (!blockedDate) {
      return NextResponse.json(
        { error: 'Blocked date not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(blockedDate);
  } catch (error) {
    console.error('Error fetching blocked date:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked date' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blocked-dates/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, you would check if the user is authorized as an admin
    
    const id = params.id;
    
    // Check if the blocked date exists
    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id }
    });
    
    if (!blockedDate) {
      return NextResponse.json(
        { error: 'Blocked date not found' },
        { status: 404 }
      );
    }
    
    // Delete the blocked date
    await prisma.blockedDate.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blocked date:', error);
    return NextResponse.json(
      { error: 'Failed to delete blocked date' },
      { status: 500 }
    );
  }
} 