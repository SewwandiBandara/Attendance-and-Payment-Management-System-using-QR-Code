# Backend Server - MongoDB

This is the backend server for the Attendance and Payment Management System using MongoDB.

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

## Installation

1. **Install MongoDB:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mongodb

   # macOS
   brew install mongodb-community

   # Windows - Download from https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB:**
   ```bash
   # Ubuntu/Debian
   sudo systemctl start mongod

   # macOS
   brew services start mongodb-community

   # Windows - MongoDB runs as a service
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

## Configuration

Database connection is configured in `config/db.js`:
- **Host:** localhost
- **Port:** 27017
- **Database:** wismin_db

## Running the Server

### Development Mode (with auto-restart):
```bash
npm start
```

### Production Mode:
```bash
node index.js
```

The server will start on port **8081**.

## API Endpoints

### Authentication
- `POST /login` - User login (admin/staff)

### Grades Management
- `GET /grades` - Get all grades
- `POST /grades` - Create new grade
- `PUT /grades/:id` - Update grade
- `DELETE /grades/:id` - Delete grade

### Subjects Management
- `GET /subjects` - Get all subjects
- `POST /subjects` - Create new subject
- `PUT /subjects/:id` - Update subject
- `DELETE /subjects/:id` - Delete subject
- `GET /lecturers` - Get all lecturers

### Classes Management
- `GET /classes` - Get all classes
- `POST /classes` - Create new class
- `PUT /classes/:id` - Update class
- `DELETE /classes/:id` - Delete class

### Courses Management
- `GET /courses` - Get all courses
- `POST /courses` - Create new course
- `PUT /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course

### Students Management
- `GET /students` - Get all students
- `GET /students/:id` - Get student by ID
- `GET /students/next-id/:gradeId` - Generate next student ID
- `POST /students` - Register new student
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student
- `POST /students/:id/upload-qr` - Upload QR code image
- `GET /students/:id/qrcode-image` - Get QR code image

## Database Models

The application uses the following MongoDB collections:

1. **grades** - Grade levels (Grade 06, 07, etc.)
2. **subjects** - Subjects with fees and lecturers
3. **classes** - Class schedules
4. **courses** - Courses information
5. **students** - Student profiles
6. **studentsubjects** - Student-subject relationships
7. **studentcourses** - Student-course relationships
8. **attendancerecords** - Attendance tracking
9. **paymentrecords** - Payment tracking
10. **userlogins** - Login history

## Default Credentials

**Admin:**
- Email: Admin123@gmail.com
- Password: admin123

**Staff:**
- Email: Staffuser@gmail.com
- Password: staff123

> ⚠️ **Security Warning:** Change these credentials in production!

## Project Structure

```
backendServer/
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── Grade.js
│   ├── Subject.js
│   ├── Class.js
│   ├── Course.js
│   ├── Student.js
│   ├── StudentSubject.js
│   ├── StudentCourse.js
│   ├── AttendanceRecord.js
│   ├── PaymentRecord.js
│   └── UserLogin.js
├── index.js               # Main server file
├── package.json
└── README.md
```

## Development

### Adding New Routes

1. Create model in `models/` directory
2. Add routes in `index.js`
3. Test using Postman or frontend

### Testing

Use tools like:
- **Postman** - API testing
- **MongoDB Compass** - Database GUI
- **mongosh** - MongoDB shell

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB on startup
sudo systemctl enable mongod
```

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::8081`

**Solution:**
```bash
# Find process using port 8081
lsof -i :8081

# Kill the process
kill -9 <PID>

# Or change PORT in index.js
```

## Migration from MySQL

This project has been migrated from MySQL to MongoDB. See `../MONGODB_MIGRATION.md` for detailed migration information.

## License

ISC

## Author

Sewwandi Bandara
