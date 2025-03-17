// This is a test script to verify email configuration
// Run with: node -r dotenv/config src/scripts/test-email-config.js

const nodemailer = require('nodemailer');

async function main() {
  console.log('Testing email configuration...');
  
  // Create a test transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  
  console.log('Transporter created with settings:');
  console.log(`- Host: ${process.env.EMAIL_HOST}`);
  console.log(`- Port: ${process.env.EMAIL_PORT}`);
  console.log(`- Secure: ${process.env.EMAIL_SECURE}`);
  console.log(`- User: ${process.env.EMAIL_USER}`);
  
  try {
    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully!');
    
    // Send a test email
    const info = await transporter.sendMail({
      from: `"Email Test" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email from Hoitohuone Zenni',
      text: 'This is a test email to verify that your email configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p>If you're seeing this, your email settings in .env.local are correct!</p>
          <p>You can now proceed with testing the booking system.</p>
        </div>
      `,
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error in email test:', error);
  }
}

main().catch(console.error); 