import { 
  createPostHandler, 
  createGetHandler,
  success, 
  badRequest,
  log,
  string,
  createObjectValidator,
  CookieService
} from '@/lib/api';
import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Cookie names for test email configuration
const CUSTOMER_EMAIL_COOKIE = 'test_customer_email';
const ADMIN_EMAIL_COOKIE = 'test_admin_email';

// Interface for email configuration data
interface EmailConfigData {
  email: string;
  adminEmail: string;
}

// Validation schema for email configuration
const emailConfigSchema = createObjectValidator<EmailConfigData>({
  email: string({ required: true }),
  adminEmail: string({ required: true })
});

// GET /api/test-email-config - Get current test email configuration from cookies
export const GET = createGetHandler(
  async ({ requestId, request }) => {
    log.info('Getting test email configuration', { requestId });
    
    // Use our new cookie service which handles different cookie contexts
    const cookieValues = CookieService.getMultiple(request, [CUSTOMER_EMAIL_COOKIE, ADMIN_EMAIL_COOKIE], requestId);
    
    const customerEmail = cookieValues[CUSTOMER_EMAIL_COOKIE] || '';
    const adminEmail = cookieValues[ADMIN_EMAIL_COOKIE] || '';
    
    log.info('Retrieved email configuration from cookies', { 
      requestId,
      hasCustomerEmail: !!customerEmail,
      hasAdminEmail: !!adminEmail
    });
    
    return success({
      customerEmail,
      adminEmail
    }, { requestId });
  }
);

// POST /api/test-email-config - Save test email configuration to cookies
export const POST = createPostHandler<EmailConfigData>(
  async ({ body, requestId, request }) => {
    log.info('Setting test email configuration', { requestId });
    
    const { email, adminEmail } = body;
    
    // Validate email formats manually since the validator doesn't check format
    if (!email.includes('@')) {
      log.warn('Invalid customer email format', { requestId, email });
      return badRequest('Valid customer email is required');
    }
    
    if (!adminEmail.includes('@')) {
      log.warn('Invalid admin email format', { requestId, adminEmail });
      return badRequest('Valid admin email is required');
    }
    
    log.info('Preparing email configuration response', { 
      requestId,
      customerEmail: email,
      adminEmail
    });

    // Use our CookieService to create a response with cookies attached
    return CookieService.createResponseWithCookies(
      {
        message: 'Test email configuration saved',
        customerEmail: email,
        adminEmail: adminEmail
      },
      [
        {
          name: CUSTOMER_EMAIL_COOKIE,
          value: email,
          options: {
            maxAge: 60 * 60 * 2, // 2 hours
            path: '/'
          }
        },
        {
          name: ADMIN_EMAIL_COOKIE,
          value: adminEmail,
          options: {
            maxAge: 60 * 60 * 2, // 2 hours
            path: '/'
          }
        }
      ],
      {
        requestId,
        status: 200
      }
    );
  },
  {
    bodyValidator: emailConfigSchema
  }
); 