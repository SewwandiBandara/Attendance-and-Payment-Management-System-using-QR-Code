# Attendance and Payment Management System using QR Code

A full-stack web application for managing student attendance and payments using QR code technology.

## Project Structure

```
.
├── backendServer/          # Express.js backend API
│   ├── index.js           # Main server file
│   ├── package.json       # Backend dependencies
│   └── node_modules/      # Backend dependencies
│
├── eduspark/              # React frontend application
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── assets/       # Images and static files
│   ├── public/           # Public assets
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration
│
└── database/             # Database files
    └── wisminac34_wismindb.sql  # MySQL database schema
```

## Technology Stack

### Frontend (eduspark)
- React 19.0.0
- Vite (Build tool)
- React Router
- Axios (HTTP client)
- QR Code libraries (qrcode.react, react-qr-code)
- Recharts (Data visualization)
- React Toastify (Notifications)
- TailwindCSS

### Backend (backendServer)
- Node.js
- Express.js 5.1.0
- MySQL 2.18.1
- JWT (Authentication)
- bcryptjs (Password hashing)
- Nodemailer (Email service)
- CORS

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Attendance-and-Payment-Management-System-using-QR-Code
   ```

2. **Setup Database**
   ```bash
   mysql -u root -p < database/wisminac34_wismindb.sql
   ```

3. **Setup Backend**
   ```bash
   cd backendServer
   npm install
   ```

4. **Configure Email Notifications**

   Email notifications are used for student registration, payment reminders, and attendance alerts.

   ```bash
   cd backendServer
   # Edit .env file and add your email credentials
   ```

   Update the following in `.env`:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM="EduSpark System <your-email@gmail.com>"
   ```

   📖 **See detailed setup instructions**: [backendServer/EMAIL_SETUP.md](backendServer/EMAIL_SETUP.md)

5. **Start Backend Server**
   ```bash
   npm start
   ```
   The backend server will run on http://localhost:8081

6. **Setup Frontend**
   ```bash
   cd eduspark
   npm install
   npm run dev
   ```
   The frontend will run on http://localhost:5173

## Features

- **QR Code-based attendance tracking** (Webcam scanning)
- **QR Code generation** for each student
- Student management
- Parent portal
- Staff dashboard
- Admin dashboard
- Course management
- Payment management via QR code scanning
- **Email notifications** (Registration, Payment reminders, Attendance alerts)

## QR Code Scanner

The system uses webcam-based QR code scanning for attendance and payment management.

📖 **Complete QR Scanner Guide**: [eduspark/QR_SCANNER_SETUP.md](eduspark/QR_SCANNER_SETUP.md)

**Quick Setup:**
- Browser must have camera permissions
- HTTPS required for production (works on localhost for development)
- Supported browsers: Chrome, Firefox, Safari, Edge (latest versions)

## Development

### Backend Development
```bash
cd backendServer
npm start  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd eduspark
npm run dev  # Vite dev server with hot reload
```

### Build for Production
```bash
cd eduspark
npm run build
```

## Author

Sewwandi Bandara

## License

ISC
