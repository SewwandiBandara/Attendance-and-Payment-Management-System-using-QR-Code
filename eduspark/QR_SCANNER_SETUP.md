# QR Code Scanner Setup and Usage Guide

This guide explains how the QR code scanning functionality works in the EduSpark system and how to use it.

## Overview

The EduSpark system uses QR codes for two main purposes:
1. **Attendance Management** - Students scan their QR codes to mark attendance
2. **Payment Processing** - Students scan QR codes to process payments

## Technology Stack

### QR Code Generation
- **qrcode.react** - Used to generate QR codes during student registration
- Each QR code contains: Student ID, Mobile Number, and Password

### QR Code Scanning
- **qr-scanner** - Modern, lightweight QR code scanner library
- Uses device camera (webcam/mobile camera) to scan QR codes
- Supports both front and rear cameras

## Features

### Attendance Management QR Scanner
- Scan student QR codes to mark attendance
- Automatic attendance marking upon successful scan
- Real-time display of scanned student information
- Subject and grade selection before scanning

### Payment Management QR Scanner
- Scan student QR codes for payment processing
- Generate invoices automatically
- Confirm payment after verification

## Setup Requirements

### Browser Permissions

The QR scanner requires **camera access**. When you first try to scan a QR code:

1. Browser will ask for camera permission
2. Click "Allow" to grant camera access
3. If denied, you'll need to enable it in browser settings

### Enabling Camera Permissions

#### Chrome
1. Click the lock icon in the address bar
2. Click "Site settings"
3. Find "Camera" and change to "Allow"
4. Refresh the page

#### Firefox
1. Click the lock icon in the address bar
2. Click "Connection secure" > "More information"
3. Go to "Permissions" tab
4. Find "Use the Camera" and select "Allow"
5. Refresh the page

#### Edge
1. Click the lock icon in the address bar
2. Click "Permissions for this site"
3. Find "Camera" and change to "Allow"
4. Refresh the page

### HTTPS Requirement

**Important:** Most browsers require HTTPS for camera access (except localhost).

- ✅ Works: `https://yourdomain.com`
- ✅ Works: `http://localhost:5173`
- ❌ Blocked: `http://192.168.1.100:5173`

## How to Use

### For Attendance Management

1. **Navigate to Staff Dashboard**
   - Click "Manage Attendance" from the sidebar

2. **Select Subject and Grade**
   - Choose the subject for which you're marking attendance
   - Select the appropriate grade

3. **Start QR Scanner**
   - Click the "Scan QR Code" button
   - Allow camera access if prompted

4. **Scan Student QR Code**
   - Hold the QR code in front of the camera
   - Scanner will automatically detect and process the code
   - Attendance will be marked automatically

5. **Verify Attendance**
   - Student information will be displayed after successful scan
   - Check the attendance records table below

### For Payment Processing

1. **Navigate to Staff Dashboard**
   - Click "Manage Payment" from the sidebar

2. **Set Payment Details**
   - Select subject
   - Choose grade
   - Enter payment amount

3. **Start QR Scanner**
   - Click "Scan QR Code" button
   - Allow camera access if prompted

4. **Scan Student QR Code**
   - Hold the QR code in front of the camera
   - Student information will be displayed

5. **Generate and Confirm Invoice**
   - Click "Generate Invoice" button
   - Review invoice details
   - Click "Confirm Payment" to complete

## Troubleshooting

### Camera Not Starting

**Problem:** "Failed to start camera" error message

**Solutions:**
1. **Check Permissions**
   - Ensure browser has camera permission
   - Check OS camera privacy settings

2. **Check Camera Availability**
   - Close other apps using the camera
   - Restart browser if needed

3. **Try Different Browser**
   - Chrome (recommended)
   - Firefox
   - Edge

### QR Code Not Scanning

**Problem:** Camera starts but doesn't detect QR code

**Solutions:**
1. **Improve Lighting**
   - Ensure good lighting conditions
   - Avoid glare on the QR code

2. **Hold Steady**
   - Keep QR code steady in view
   - Position 10-15 cm from camera

3. **Check QR Code Quality**
   - Ensure QR code is not damaged
   - Print in high quality if possible

4. **Clean Camera Lens**
   - Wipe camera lens if blurry

### QR Code Format Issues

**Problem:** QR code scans but no student found

**Possible Causes:**
- QR code format incorrect
- Student not registered in system
- QR code data corrupted

**Solution:**
- QR codes should contain: `StudentID|Mobile|Password`
- Example: `St1001|0771234567|pass123`
- Regenerate QR code from student registration

### HTTPS Errors

**Problem:** Camera blocked due to insecure context

**Solutions:**
1. **Use on localhost** (for development)
   ```bash
   npm run dev
   # Access via http://localhost:5173
   ```

2. **Use HTTPS** (for production)
   - Deploy with SSL certificate
   - Use services like Let's Encrypt

3. **Use ngrok** (for testing on mobile)
   ```bash
   npm install -g ngrok
   npm run dev
   # In another terminal:
   ngrok http 5173
   # Use the HTTPS URL provided
   ```

## Technical Implementation

### QR Scanner Configuration

```javascript
qrScanner = new QrScanner(
  videoElement,
  result => handleScan(result),
  {
    preferredCamera: 'environment',  // Use rear camera on mobile
    highlightScanRegion: true,      // Show scan area
    highlightCodeOutline: true,     // Highlight detected QR code
  }
);
```

### QR Data Format

Generated during student registration:
```
StudentID|MobileNumber|Password
```

Example:
```
St1001|0771234567|student123
```

### Error Handling

The scanner includes comprehensive error handling:
- Camera permission denied
- Camera not available
- QR code format invalid
- Student not found

## Best Practices

### For Administrators

1. **Test Camera Access**
   - Test on target devices before deployment
   - Verify camera permissions are working

2. **Print Quality QR Codes**
   - Use high resolution (minimum 300 DPI)
   - Ensure good contrast (black on white)
   - Add border/quiet zone around QR code

3. **Provide Clear Instructions**
   - Train staff on QR scanner usage
   - Post instructions near scanning stations

### For Staff

1. **Position QR Codes Correctly**
   - Hold 10-15 cm from camera
   - Ensure entire QR code is visible
   - Avoid shadows and glare

2. **Verify Student Information**
   - Check displayed name matches student
   - Verify grade and class information
   - Confirm attendance/payment details

3. **Handle Errors Gracefully**
   - If scan fails, try again
   - Manual entry available as backup
   - Report persistent issues to admin

## Mobile Device Tips

### Android
- Works best in Chrome browser
- Ensure Chrome has camera permission
- Test both front and rear cameras

### iOS (iPhone/iPad)
- Works in Safari and Chrome
- May need to allow camera in Settings > Safari
- HTTPS required (even on local network)

### Tablets
- Larger screen makes QR scanning easier
- Mount tablet at comfortable height
- Consider using tablet stands

## System Requirements

### Minimum Requirements
- **Browser:** Chrome 87+, Firefox 85+, Safari 14+, Edge 87+
- **Camera:** Any webcam or mobile camera (minimum 2MP)
- **Internet:** Active connection for data processing

### Recommended
- **Browser:** Latest Chrome or Edge
- **Camera:** 5MP or higher
- **Internet:** Stable broadband or 4G connection
- **Display:** 1080p or higher resolution

## Security Considerations

1. **QR Code Contains Credentials**
   - Treat QR codes like passwords
   - Don't share publicly
   - Store securely

2. **Camera Privacy**
   - Camera only active when scanning
   - No video recording or storage
   - Stops when "Stop Scanner" clicked

3. **Data Transmission**
   - QR data processed locally
   - Only validation sent to server
   - HTTPS recommended for production

## Support

If you encounter issues not covered in this guide:

1. **Check Browser Console**
   - Press F12 to open developer tools
   - Look for error messages in Console tab

2. **Verify Installation**
   ```bash
   cd eduspark
   npm list qr-scanner
   # Should show: qr-scanner@X.X.X
   ```

3. **Contact Support**
   - Provide browser name and version
   - Include error message (if any)
   - Describe steps taken before error

---

**Last Updated:** 2025-11-20
**Version:** 1.0
**EduSpark Development Team**
