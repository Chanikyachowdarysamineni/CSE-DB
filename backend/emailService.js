const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  // Check if credentials are configured
  if (!gmailUser || !gmailAppPassword || 
      gmailUser === 'your-email@gmail.com' || 
      gmailAppPassword === 'your-16-character-app-password') {
    console.log('⚠️  Gmail credentials not configured in .env file');
    console.log('📧 To enable email notifications:');
    console.log('   1. Go to https://myaccount.google.com/security');
    console.log('   2. Enable 2-Step Verification');
    console.log('   3. Go to https://myaccount.google.com/apppasswords');
    console.log('   4. Generate an app password for "Mail"');
    console.log('   5. Update GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env');
    return null;
  }

  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

// Send registration email
const sendRegistrationEmail = async (toEmail, userData) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('⚠️ Email not sent: Gmail not configured');
    return { success: false, message: 'Gmail not configured' };
  }

  const { name, email, password, registration_id, role } = userData;

  const htmlContent = `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
      .credentials { background: #f0f4ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; font-family: monospace; }
      .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      .credential-item { margin: 8px 0; }
      .credential-label { font-weight: bold; color: #667eea; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎓 Welcome to CSE Portal!</h1>
      </div>
      <div class="content">
        <h2>Registration Successful</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering with the CSE Department Portal. Your account has been created successfully!</p>
        
        <div class="credentials">
          <h3>📋 Your Account Details:</h3>
          <div class="credential-item">
            <span class="credential-label">Name:</span> ${name}
          </div>
          <div class="credential-item">
            <span class="credential-label">Email:</span> ${email}
          </div>
          <div class="credential-item">
            <span class="credential-label">Password:</span> ${password}
          </div>
          <div class="credential-item">
            <span class="credential-label">Registration ID:</span> ${registration_id}
          </div>
          <div class="credential-item">
            <span class="credential-label">Role:</span> ${role}
          </div>
        </div>
        
        <p>⚠️ <strong>Important:</strong> Please keep these credentials safe. We recommend changing your password after your first login.</p>
        
        <div style="text-align: center;">
          <a href="http://localhost:3000/login" class="button">Login Now →</a>
        </div>
        
        <div class="footer">
          <p>Computer Science & Engineering Department</p>
          <p>If you didn't register for this account, please contact support immediately.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const textContent = `
Hello ${name}!

Thank you for registering with the CSE Department Portal.

Your Account Details:
- Name: ${name}
- Email: ${email}
- Password: ${password}
- Registration ID: ${registration_id}
- Role: ${role}

You can now log in at: http://localhost:3000/login

⚠️ Important: Please keep these credentials safe. We recommend changing your password after your first login.

Best regards,
CSE Department
Computer Science & Engineering

If you didn't register for this account, please contact support immediately.
  `;

  const mailOptions = {
    from: `"CSE Department" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Registration Successful - CSE Department Portal',
    text: textContent,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Registration email sent successfully to:', toEmail);
    console.log('   Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Invalid login') || error.message.includes('Username and Password not accepted')) {
      console.error('💡 Gmail authentication failed. Please check:');
      console.error('   1. GMAIL_USER is your correct Gmail address');
      console.error('   2. GMAIL_APP_PASSWORD is a 16-character App Password (NOT your regular password)');
      console.error('   3. 2-Step Verification is enabled on your Google account');
      console.error('   4. App Password is generated from: https://myaccount.google.com/apppasswords');
    }
    
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (toEmail, resetToken, userName) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('⚠️ Password reset email not sent: Gmail not configured');
    return { success: false, message: 'Gmail not configured' };
  }

  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

  const htmlContent = `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
      .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🔒 Password Reset Request</h1>
      </div>
      <div class="content">
        <h2>Reset Your Password</h2>
        <p>Dear ${userName},</p>
        <p>We received a request to reset your password for the CSE Department Portal.</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password →</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
        
        <div class="warning">
          <p><strong>⚠️ Important:</strong></p>
          <ul>
            <li>This link will expire in 1 hour</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Your password will remain unchanged until you create a new one</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Computer Science & Engineering Department</p>
          <p>If you didn't request this password reset, please contact support immediately.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const textContent = `
Password Reset Request - CSE Department Portal

Dear ${userName},

We received a request to reset your password for the CSE Department Portal.

Click the link below to reset your password:
${resetUrl}

⚠️ Important:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you create a new one

Best regards,
CSE Department
Computer Science & Engineering

If you didn't request this password reset, please contact support immediately.
  `;

  const mailOptions = {
    from: `"CSE Department" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request - CSE Department Portal',
    text: textContent,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully to:', toEmail);
    console.log('   Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Password reset email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendRegistrationEmail,
  sendPasswordResetEmail
};
