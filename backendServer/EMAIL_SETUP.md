# Email Notification Setup Guide

This guide will help you configure email notifications for the EduSpark system.

## Prerequisites

- Gmail account (recommended) or any SMTP email service
- Node.js and npm installed
- Backend server dependencies installed

## Step 1: Configure Environment Variables

1. Open the `.env` file in the `backendServer` folder
2. Update the following email configuration:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM="EduSpark System <your-email@gmail.com>"
```

## Step 2: Gmail Setup (Recommended)

### Option A: Using App Password (Recommended)

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** (if not already enabled)
4. Go to **App passwords**: https://myaccount.google.com/apppasswords
5. Select app: **Mail**
6. Select device: **Other (Custom name)** - enter "EduSpark"
7. Click **Generate**
8. Copy the 16-character password (remove spaces)
9. Paste it into the `.env` file as `EMAIL_PASSWORD`

### Option B: Using Less Secure Apps (Not Recommended)

⚠️ **Warning**: This method is less secure and not recommended by Google.

1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn ON "Allow less secure apps"
3. Use your regular Gmail password in `.env` as `EMAIL_PASSWORD`

## Step 3: Configure .env File

Example `.env` configuration:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=eduspark.notifications@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM="EduSpark System <eduspark.notifications@gmail.com>"
```

## Step 4: Test Email Configuration

Start the backend server:

```bash
cd backendServer
npm start
```

You should see:
```
✓ Email server is ready to send notifications
```

If you see an error, check your email credentials.

### Send Test Email

Use the test endpoint to verify email is working:

```bash
curl -X POST http://localhost:8081/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

Or use Postman/Thunder Client with:
- **Method**: POST
- **URL**: http://localhost:8081/send-test-email
- **Body** (JSON):
```json
{
  "email": "your-test-email@gmail.com"
}
```

## Email Features

### 1. Student Registration Email
- **Automatically sent** when a new student is registered
- Contains: Student ID, credentials, grade information
- Endpoint: Automatic (no manual call needed)

### 2. Payment Reminder
- **Endpoint**: `POST /send-payment-reminder`
- **Body**:
```json
{
  "studentId": "St1001",
  "amount": "5000",
  "dueDate": "2025-12-31",
  "description": "Monthly class fees"
}
```

### 3. Attendance Alert
- **Endpoint**: `POST /send-attendance-alert`
- **Body**:
```json
{
  "studentId": "St1001",
  "parentEmail": "parent@example.com",
  "absenceDays": 5,
  "totalClasses": 20
}
```

### 4. Resend Registration Email
- **Endpoint**: `POST /resend-registration-email/:studentId`
- **Example**: `POST /resend-registration-email/St1001`

## Troubleshooting

### Error: "Invalid login"
- Check your email and password are correct
- For Gmail, use App Password (not regular password)
- Make sure 2-Step Verification is enabled

### Error: "ECONNREFUSED"
- Check your internet connection
- Verify firewall isn't blocking port 587/465

### Error: "Username and Password not accepted"
- Enable "Less secure app access" (if not using App Password)
- Try using App Password method instead

### Emails going to Spam
- Send test emails to yourself first
- Check SPF/DKIM records if using custom domain
- Use a dedicated email address for sending notifications

## Using Other Email Services

### Outlook/Hotmail

```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo Mail

```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

### Custom SMTP Server

```env
EMAIL_SERVICE=
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-password
```

Then update the transporter configuration in `index.js`:

```javascript
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
```

## Security Best Practices

1. ✅ **Never commit `.env` file to Git**
2. ✅ **Use App Passwords instead of account passwords**
3. ✅ **Use a dedicated email account for system notifications**
4. ✅ **Enable 2-Factor Authentication on your email account**
5. ✅ **Regularly rotate your email passwords**
6. ✅ **Monitor email sending activity**

## Support

If you continue to have issues, check:
- Backend console logs for detailed error messages
- Gmail security alerts: https://myaccount.google.com/notifications
- Google Account Activity: https://myaccount.google.com/device-activity

---

**EduSpark Development Team**
