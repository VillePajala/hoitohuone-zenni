// Simple email test script with detailed error reporting
// Run with: node src/scripts/test-email-direct.js

try {
  const nodemailer = require('nodemailer');
  const dotenv = require('dotenv');
  
  // Load environment variables
  dotenv.config({ path: '.env.local' });
  
  console.log('⚙️ Testing email configuration with detailed logging...');
  
  // First check if env vars are loaded
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Environment variables not loaded correctly!');
    console.log('Current environment variables:');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '(set but hidden)' : '(not set)');
    process.exit(1);
  }

  // Log configuration (hiding password)
  console.log('\n📧 Email Configuration:');
  console.log(`- Host: ${process.env.EMAIL_HOST}`);
  console.log(`- Port: ${process.env.EMAIL_PORT}`);
  console.log(`- Secure: ${process.env.EMAIL_SECURE}`);
  console.log(`- User: ${process.env.EMAIL_USER}`);
  console.log(`- From: ${process.env.EMAIL_FROM}`);
  console.log(`- Password: ${'*'.repeat(process.env.EMAIL_PASSWORD?.length || 0)}`);

  async function main() {
    try {
      console.log('\n🔄 Creating transporter...');
      
      // Create transporter with debug enabled
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        logger: true,  // Log to console
        debug: true    // Enable debug logs
      });
      
      console.log('\n🔍 Verifying SMTP connection...');
      
      // Test SMTP connection
      await transporter.verify();
      console.log('✅ SMTP connection successful');
      
      console.log('\n📤 Sending test email...');
      
      // Send test email
      const info = await transporter.sendMail({
        from: `"Email Test" <${process.env.EMAIL_FROM}>`,
        to: process.env.EMAIL_USER,
        subject: 'Test Email from Hoitohuone Zenni - ' + new Date().toISOString(),
        text: 'This is a test email to verify your email configuration. If you see this, email sending works!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #4a5568;">Email Test Successful</h2>
            <p>This is a test email to verify that your email configuration is working correctly.</p>
            <p>If you're seeing this, your email settings in .env.local are correct!</p>
            <p>Test sent at: ${new Date().toLocaleString()}</p>
          </div>
        `,
      });
      
      console.log('\n✅ Test email sent successfully!');
      console.log('- Message ID:', info.messageId);
      console.log('- Response:', info.response);
      if (info.accepted && info.accepted.length > 0) console.log('- Accepted recipients:', info.accepted);
      if (info.rejected && info.rejected.length > 0) console.log('- Rejected recipients:', info.rejected);
      console.log('\n👉 Please check your inbox (and spam folder) for the test email.');
      
    } catch (error) {
      console.error('\n❌ Error in email test:');
      console.error(error);
      
      // Provide specific guidance based on error type
      if (error.code === 'EAUTH') {
        console.log('\n🔑 Authentication Error!');
        console.log('The most likely causes are:');
        console.log('1. Incorrect password in your .env.local file');
        console.log('2. Gmail security blocks - You need to:');
        console.log('   - Enable "Less secure app access" at https://myaccount.google.com/lesssecureapps');
        console.log('   - Allow access at https://accounts.google.com/DisplayUnlockCaptcha');
        console.log('3. Alternatively, set up 2FA and use App Password instead');
      } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        console.log('\n🔌 Connection Error!');
        console.log('Check your:');
        console.log('1. Internet connection');
        console.log('2. Firewall settings');
        console.log('3. VPN if you\'re using one');
        console.log('4. HOST and PORT settings in .env.local');
      } else {
        console.log('\n⚠️ General Error:');
        console.log('- Error Code:', error.code);
        console.log('- Error Message:', error.message);
        console.log('Please check your email configuration in .env.local');
      }
    }
  }

  // Run the main function
  main().catch(err => {
    console.error('Unhandled error in main function:');
    console.error(err);
  });

} catch (error) {
  console.error('❌ Fatal error running the script:');
  console.error(error);
} 