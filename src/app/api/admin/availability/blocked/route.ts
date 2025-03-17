import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

// Helper function to check authentication
function checkAuth(req: NextRequest) {
  // Check if user is authenticated via Clerk
  const { userId } = getAuth(req);
  if (userId) return true;
  
  // Check for Bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return true;
  }
  
  return false;
}

// GET /api/admin/availability/blocked
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    // Fetch all blocked dates
    const blockedDates = await prisma.blockedDate.findMany({
      orderBy: {
        date: 'asc'
      }
    });
    
    return NextResponse.json(blockedDates);
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked dates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/availability/blocked
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    const data = await req.json();
    
    // Validate required fields
    if (!data.date || !data.reason) {
      return NextResponse.json(
        { error: 'Missing required fields (date, reason)' },
        { status: 400 }
      );
    }
    
    // Create new blocked date
    const blockedDate = await prisma.blockedDate.create({
      data: {
        date: new Date(data.date),
        reason: data.reason
      }
    });
    
    return NextResponse.json(blockedDate);
  } catch (error) {
    console.error('Error creating blocked date:', error);
    return NextResponse.json(
      { error: 'Failed to create blocked date' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/availability/blocked
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field (id)' },
        { status: 400 }
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