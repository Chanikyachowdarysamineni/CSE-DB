import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Load .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If python-dotenv not installed, try to read .env manually
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# Usage: python send_email.py "recipient@email.com" "message text"

if len(sys.argv) < 3:
    print('Usage: python send_email.py "recipient@email.com" "message"')
    sys.exit(1)

to_email = sys.argv[1]
message = sys.argv[2]

# If message has more args, join them
if len(sys.argv) > 3:
    message = ' '.join(sys.argv[2:])

# Get Gmail credentials
gmail_user = os.getenv('GMAIL_USER')
gmail_app_password = os.getenv('GMAIL_APP_PASSWORD')

if not gmail_user or not gmail_app_password:
    print('ERROR: Missing Gmail credentials!')
    print('Set GMAIL_USER and GMAIL_APP_PASSWORD in .env')
    sys.exit(2)

print(f'Sending email to {to_email}')
print(f'Message: {message}')

try:
    # Create email
    msg = MIMEMultipart('alternative')
    msg['From'] = gmail_user
    msg['To'] = to_email
    msg['Subject'] = 'Registration Successful - CSE Department Portal'
    
    # Plain text version
    text = f"""
Hello!

Thank you for registering with the CSE Department Portal.

{message}

You can now log in at: http://localhost:3000/login

Best regards,
CSE Department
Computer Science & Engineering
"""
    
    # HTML version
    html = f"""
<html>
  <head>
    <style>
      body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
      .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }}
      .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }}
      .content {{ background: white; padding: 30px; border-radius: 0 0 8px 8px; }}
      .credentials {{ background: #f0f4ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }}
      .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
      .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎓 Welcome to CSE Portal!</h1>
      </div>
      <div class="content">
        <h2>Registration Successful</h2>
        <p>Thank you for registering with the CSE Department Portal. Your account has been created successfully!</p>
        
        <div class="credentials">
          <h3>📋 Your Account Details:</h3>
          <pre style="font-family: monospace; white-space: pre-wrap;">{message}</pre>
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
"""
    
    # Attach both versions
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(html, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    # Send via Gmail SMTP
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(gmail_user, gmail_app_password)
    
    text = msg.as_string()
    server.sendmail(gmail_user, to_email, text)
    server.quit()
    
    print('Email sent successfully!')
    sys.exit(0)
except Exception as e:
    print(f'Failed to send email: {e}')
    sys.exit(3)
