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

// POST /api/admin/services/reorder - Update service order
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
    if (!data.services || !Array.isArray(data.services)) {
      return NextResponse.json(
        { error: 'Services array is required' },
        { status: 400 }
      );
    }
    
    // Update orders in a transaction
    const updates = data.services.map((service: { id: string, order: number }) => 
      prisma.service.update({
        where: { id: service.id },
        data: { order: service.order }
      })
    );
    
    await prisma.$transaction(updates);
    
    return NextResponse.json({ 
      success: true,
      message: 'Service order updated successfully' 
    });
  } catch (error) {
    console.error('Error reordering services:', error);
    return NextResponse.json(
      { error: 'Failed to update service order. Please try again later.' },
      { status: 500 }
    );
  }
} 