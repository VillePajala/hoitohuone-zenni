import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { fi, enUS } from 'date-fns/locale';

// Email service configuration
// For production, you would use actual SMTP credentials
// For development, we use a test account or a service like Ethereal
// https://ethereal.email/ for testing
const createTransporter = async () => {
  // If SMTP credentials are provided, use them even in development
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('Using provided SMTP credentials for emails');
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  
  // For development without SMTP credentials, create a test account on Ethereal
  if (process.env.NODE_ENV !== 'production') {
    console.log('Using Ethereal test account for emails');
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  
  // For production, use actual SMTP settings
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Helper for formatting dates based on language
const formatDate = (date: Date, language: string): string => {
  const locale = language === 'en' ? enUS : fi;
  return format(date, 'PPP', { locale });
};

// Helper for formatting times based on language
const formatTime = (time: Date): string => {
  return format(time, 'HH:mm');
};

// Email templates for customer confirmation
const generateCustomerEmailContent = (
  booking: any,
  service: any,
  language: string
) => {
  const isEnglish = language === 'en';
  const serviceName = isEnglish ? service.nameEn : service.nameFi;
  const formattedDate = formatDate(booking.date, language);
  const startTime = formatTime(booking.startTime);
  const endTime = formatTime(booking.endTime);
  
  const subject = isEnglish
    ? `Booking Confirmation - Hoitohuone Zenni`
    : `Varausvahvistus - Hoitohuone Zenni`;
  
  // Use the correct language-specific paths
  const cancelPath = isEnglish ? 'en/cancel-booking' : 'fi/peruuta-varaus';
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${cancelPath}/${booking.cancellationId}`;
  
  const html = isEnglish
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmation</h2>
        <p>Dear ${booking.customerName},</p>
        <p>Thank you for booking with Hoitohuone Zenni. Your booking has been confirmed.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        </div>
        
        <p>If you need to cancel or reschedule your appointment, please click the link below:</p>
        <p><a href="${cancelUrl}" style="color: #0066cc;">Cancel or Reschedule</a></p>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>Hoitohuone Zenni</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Varausvahvistus</h2>
        <p>Hyvä ${booking.customerName},</p>
        <p>Kiitos varauksestasi Hoitohuone Zenniin. Varauksesi on vahvistettu.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Varauksen tiedot</h3>
          <p><strong>Palvelu:</strong> ${serviceName}</p>
          <p><strong>Päivämäärä:</strong> ${formattedDate}</p>
          <p><strong>Aika:</strong> ${startTime} - ${endTime}</p>
        </div>
        
        <p>Jos haluat peruuttaa tai siirtää varauksesi, klikkaa alla olevaa linkkiä:</p>
        <p><a href="${cancelUrl}" style="color: #0066cc;">Peruuta tai siirtää</a></p>
        
        <p>Jos sinulla on kysyttävää, otathan yhteyttä.</p>
        
        <p>Ystävällisin terveisin,<br>Hoitohuone Zenni</p>
      </div>
    `;
  
  return { subject, html };
};

// Email templates for admin notification
const generateAdminEmailContent = (
  booking: any,
  service: any,
  language: string
) => {
  const isEnglish = language === 'en';
  const serviceName = isEnglish ? service.nameEn : service.nameFi;
  const formattedDate = formatDate(booking.date, language);
  const startTime = formatTime(booking.startTime);
  const endTime = formatTime(booking.endTime);
  
  const subject = `New Booking: ${booking.customerName} - ${formattedDate} ${startTime}`;
  
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${booking.id}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Booking Notification</h2>
      <p>A new booking has been made at Hoitohuone Zenni.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Booking Details</h3>
        <p><strong>Customer:</strong> ${booking.customerName}</p>
        <p><strong>Email:</strong> ${booking.customerEmail}</p>
        <p><strong>Phone:</strong> ${booking.customerPhone || 'Not provided'}</p>
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Language:</strong> ${language === 'en' ? 'English' : 'Finnish'}</p>
        ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
      </div>
      
      <p><a href="${adminUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View in Admin Dashboard</a></p>
    </div>
  `;
  
  return { subject, html };
};

// Email templates for cancellation confirmation
const generateCancellationEmailContent = (
  booking: any,
  service: any
) => {
  const isEnglish = booking.language === 'en';
  const serviceName = isEnglish ? service.nameEn : service.nameFi;
  const formattedDate = formatDate(booking.date, booking.language);
  const startTime = formatTime(booking.startTime);
  const endTime = formatTime(booking.endTime);
  
  const subject = isEnglish
    ? `Booking Cancellation - Hoitohuone Zenni`
    : `Varauksen peruutus - Hoitohuone Zenni`;
  
  const html = isEnglish
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Cancellation Confirmation</h2>
        <p>Dear ${booking.customerName},</p>
        <p>Your booking with Hoitohuone Zenni has been successfully cancelled.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Cancelled Booking Details</h3>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        </div>
        
        <p>If you would like to make a new booking, please visit our website.</p>
        
        <p>Thank you for letting us know that you cannot attend. We hope to see you another time.</p>
        
        <p>Best regards,<br>Hoitohuone Zenni</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Varauksen peruutusvahvistus</h2>
        <p>Hyvä ${booking.customerName},</p>
        <p>Varauksesi Hoitohuone Zenniin on onnistuneesti peruutettu.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Peruutetun varauksen tiedot</h3>
          <p><strong>Palvelu:</strong> ${serviceName}</p>
          <p><strong>Päivämäärä:</strong> ${formattedDate}</p>
          <p><strong>Aika:</strong> ${startTime} - ${endTime}</p>
        </div>
        
        <p>Jos haluat tehdä uuden varauksen, vieraile verkkosivuillamme.</p>
        
        <p>Kiitos, että ilmoitit ettet pääse paikalle. Toivottavasti näemme toisella kertaa.</p>
        
        <p>Ystävällisin terveisin,<br>Hoitohuone Zenni</p>
      </div>
    `;
  
  return { subject, html };
};

// Email templates for admin cancellation notification
const generateAdminCancellationEmailContent = (
  booking: any,
  service: any
) => {
  const formattedDate = formatDate(booking.date, 'fi');
  const startTime = formatTime(booking.startTime);
  const endTime = formatTime(booking.endTime);
  const serviceName = service.name;
  
  const subject = `Booking Cancelled: ${booking.customerName} - ${formattedDate} ${startTime}`;
  
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${booking.id}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Cancellation Notification</h2>
      <p>A booking has been cancelled at Hoitohuone Zenni.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Cancelled Booking Details</h3>
        <p><strong>Customer:</strong> ${booking.customerName}</p>
        <p><strong>Email:</strong> ${booking.customerEmail}</p>
        <p><strong>Phone:</strong> ${booking.customerPhone || 'Not provided'}</p>
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Language:</strong> ${booking.language === 'en' ? 'English' : 'Finnish'}</p>
      </div>
      
      <p><a href="${adminUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View in Admin Dashboard</a></p>
    </div>
  `;
  
  return { subject, html };
};

// Send customer confirmation email
export const sendBookingConfirmationEmail = async (
  booking: any,
  service: any
) => {
  try {
    const transporter = await createTransporter();
    const { subject, html } = generateCustomerEmailContent(
      booking,
      service,
      booking.language
    );
    
    // Check for test customer email cookie
    let recipientEmail = booking.customerEmail;
    
    // If there's a cookie set for the test customer email, use it instead
    // This is a workaround since we can't access cookies directly in this service module
    // In a real app, you'd use a more secure approach
    if (booking._testEmailOverride) {
      console.log('Using test customer email override:', booking._testEmailOverride);
      recipientEmail = booking._testEmailOverride;
    }
    
    const info = await transporter.sendMail({
      from: `"Hoitohuone Zenni" <${process.env.EMAIL_FROM || 'noreply@hoitohuonezenni.fi'}>`,
      to: recipientEmail,
      subject,
      html,
    });
    
    console.log('Customer confirmation email sent:', info.messageId);
    console.log('Sent to:', recipientEmail);
    
    // For development, log the test URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
    throw error;
  }
};

// Send admin notification email
export const sendAdminNotificationEmail = async (
  booking: any,
  service: any
) => {
  try {
    const transporter = await createTransporter();
    const { subject, html } = generateAdminEmailContent(
      booking,
      service,
      booking.language
    );
    
    // Default admin email
    let adminEmail = process.env.ADMIN_EMAIL || 'admin@hoitohuonezenni.fi';
    
    // If there's a test admin email override, use it
    if (booking._testAdminEmailOverride) {
      console.log('Using test admin email override:', booking._testAdminEmailOverride);
      adminEmail = booking._testAdminEmailOverride;
    }
    
    const info = await transporter.sendMail({
      from: `"Hoitohuone Zenni Booking System" <${process.env.EMAIL_FROM || 'bookings@hoitohuonezenni.fi'}>`,
      to: adminEmail,
      subject,
      html,
    });
    
    console.log('Admin notification email sent:', info.messageId);
    console.log('Sent to:', adminEmail);
    
    // For development, log the test URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
};

// Send cancellation confirmation email
export const sendBookingCancellationEmail = async (
  booking: any,
  service: any
) => {
  try {
    const transporter = await createTransporter();
    const { subject, html } = generateCancellationEmailContent(
      booking,
      service
    );
    
    // Setup mail options
    const mailOptions = {
      from: `"Hoitohuone Zenni" <${process.env.EMAIL_FROM || 'noreply@hoitohuonezenni.fi'}>`,
      to: booking.customerEmail,
      subject,
      html,
    };
    
    // Send email to customer
    const info = await transporter.sendMail(mailOptions);
    console.log('Cancellation confirmation email sent:', info.messageId);
    
    // For development, log the test URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    // Also send notification to admin
    const { subject: adminSubject, html: adminHtml } = generateAdminCancellationEmailContent(
      booking,
      service
    );
    
    const adminMailOptions = {
      from: `"Hoitohuone Zenni Booking System" <${process.env.EMAIL_FROM || 'bookings@hoitohuonezenni.fi'}>`,
      to: process.env.ADMIN_EMAIL || 'admin@hoitohuonezenni.fi',
      subject: adminSubject,
      html: adminHtml,
    };
    
    const adminInfo = await transporter.sendMail(adminMailOptions);
    console.log('Admin cancellation notification email sent:', adminInfo.messageId);
    
    return { customerEmail: info, adminEmail: adminInfo };
  } catch (error) {
    console.error('Error sending cancellation emails:', error);
    throw error;
  }
}; 