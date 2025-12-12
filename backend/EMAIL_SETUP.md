# Email Setup Instructions

## Prerequisites
- Python 3.7 or higher
- Gmail account with 2-Step Verification enabled

## Installation Steps

### 1. Install Python (if not already installed)
Download from: https://www.python.org/downloads/

During installation, make sure to check "Add Python to PATH"

### 2. Install Python Dependencies
```powershell
cd backend
pip install python-dotenv
```

Or install from requirements.txt:
```powershell
pip install -r requirements.txt
```

### 3. Configure Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled
3. Go to https://myaccount.google.com/apppasswords
4. Select app: **Mail**
5. Select device: **Windows Computer** (or other)
6. Click **Generate**
7. Copy the 16-character password (format: xxxx-xxxx-xxxx-xxxx)

### 4. Update Environment Variables

Edit `backend/.env` and add:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

Replace:
- `your-email@gmail.com` with your actual Gmail address
- `xxxx-xxxx-xxxx-xxxx` with the 16-character app password from step 3

## Testing Email Functionality

### Test from Command Line:
```powershell
cd backend
python send_email.py "test@example.com" "This is a test message"
```

### Test via Registration:
1. Start the backend server
2. Register a new user from the frontend
3. Check the registered email inbox for welcome message

## Email Features

- ✅ HTML formatted emails with styling
- ✅ Includes plain text fallback
- ✅ Sends registration credentials
- ✅ Provides login link
- ✅ Professional CSE Department branding

## Troubleshooting

### Python not found
- Install Python from https://www.python.org/downloads/
- Make sure "Add Python to PATH" is checked during installation
- Restart terminal after installation

### Gmail authentication failed
- Verify 2-Step Verification is enabled
- Generate a new App Password
- Check for typos in GMAIL_USER and GMAIL_APP_PASSWORD
- Don't use your regular Gmail password (use App Password)

### Email not received
- Check spam/junk folder
- Verify recipient email is correct
- Check backend console logs for error messages
- Test with command line first

### Module not found: dotenv
```powershell
pip install python-dotenv
```

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to version control
- `.env` is already in `.gitignore`
- App passwords are safer than regular passwords
- Revoke app passwords if compromised

## Email Content

The registration email includes:
- Welcome message
- Email address
- Password (for first login)
- Registration ID
- Role (Student/Faculty/HOD)
- Direct login link
- Warning to change password after first login
