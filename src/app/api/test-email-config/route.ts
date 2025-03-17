import { NextResponse } from 'next/server';

// This endpoint is for testing only and should be removed in production
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, adminEmail } = body;

    // Validate inputs
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid customer email is required' }, { status: 400 });
    }

    if (!adminEmail || !adminEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid admin email is required' }, { status: 400 });
    }

    // Create a response
    const response = NextResponse.json({ 
      success: true,
      message: 'Test email configuration saved',
      customerEmail: email,
      adminEmail: adminEmail
    });
    
    // Set cookies with a short expiration (2 hours)
    response.cookies.set({
      name: 'test_customer_email',
      value: email,
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/'
    });
    
    response.cookies.set({
      name: 'test_admin_email',
      value: adminEmail,
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error setting test email configuration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save email configuration' 
      }, 
      { status: 500 }
    );
  }
} 