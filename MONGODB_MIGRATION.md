# MongoDB Migration Guide

This document describes the migration from MySQL to MongoDB for the Attendance and Payment Management System.

## Overview

The project has been successfully migrated from MySQL to MongoDB using Mongoose ODM (Object Data Modeling). This migration maintains all existing functionality while leveraging MongoDB's document-based structure and flexibility.

## Changes Made

### 1. Dependencies

**Removed:**
- `mysql` (v2.18.1)

**Added:**
- `mongoose` (v8.20.0) - MongoDB ODM for Node.js

### 2. Database Connection

**Before (MySQL):**
```javascript
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "wismin_db"
});
```

**After (MongoDB):**
```javascript
// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect('mongodb://localhost:27017/wismin_db', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('MongoDB Database Connected...');
};
```

### 3. MongoDB Models Created

All MySQL tables have been converted to MongoDB models using Mongoose schemas:

#### Collections (formerly tables):
1. **grades** - Grade management (Grade 06, Grade 07, etc.)
2. **subjects** - Subject information with fees and lecturers
3. **classes** - Class scheduling with grade and subject relationships
4. **courses** - Course management
5. **students** - Student profiles with QR code storage
6. **studentsubjects** - Student-subject relationships
7. **studentcourses** - Student-course relationships
8. **attendancerecords** - Attendance tracking
9. **paymentrecords** - Payment tracking
10. **userlogins** - Login attempt logs

### 4. Query Conversions

#### Simple Queries

**MySQL:**
```javascript
db.query("SELECT * FROM grades", (err, results) => {
    res.json(results);
});
```

**MongoDB:**
```javascript
const grades = await Grade.find();
res.json(grades);
```

#### JOIN Queries (Aggregation Pipeline)

**MySQL:**
```sql
SELECT c.*, g.name as grade_name, s.name as subject_name
FROM classes c
JOIN grades g ON c.grade_id = g.grade_id
JOIN subjects s ON c.subject_id = s.subject_id
```

**MongoDB:**
```javascript
const classes = await Class.aggregate([
    {
        $lookup: {
            from: 'grades',
            localField: 'grade_id',
            foreignField: 'grade_id',
            as: 'grade'
        }
    },
    {
        $lookup: {
            from: 'subjects',
            localField: 'subject_id',
            foreignField: 'subject_id',
            as: 'subject'
        }
    },
    {
        $unwind: { path: '$grade', preserveNullAndEmptyArrays: true }
    },
    {
        $unwind: { path: '$subject', preserveNullAndEmptyArrays: true }
    },
    {
        $addFields: {
            grade_name: '$grade.name',
            subject_name: '$subject.name'
        }
    }
]);
```

#### Transactions

**MySQL:**
```javascript
db.beginTransaction((err) => {
    // ... operations
    db.commit((err) => {
        // success
    });
    db.rollback(() => {
        // error
    });
});
```

**MongoDB (Mongoose Sessions):**
```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
    // ... operations with { session }
    await session.commitTransaction();
    session.endSession();
} catch (error) {
    await session.abortTransaction();
    session.endSession();
}
```

### 5. Auto-Increment Fields

MongoDB doesn't have built-in auto-increment. For fields like `class_id` and `course_id`:

```javascript
// Get the next class_id
const lastClass = await Class.findOne().sort({ class_id: -1 });
const class_id = lastClass ? lastClass.class_id + 1 : 1;
```

## Setup Instructions

### Prerequisites

1. **Install MongoDB:**
   - Download from https://www.mongodb.com/try/download/community
   - Or use Docker: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

2. **Verify MongoDB is running:**
   ```bash
   mongosh
   # Should connect to mongodb://localhost:27017
   ```

### Installation

1. **Install dependencies:**
   ```bash
   cd backendServer
   npm install
   ```

2. **Start the backend server:**
   ```bash
   npm start
   ```

3. **The server will connect to:**
   - Database: `wismin_db`
   - Host: `localhost:27017`

### Configuration

To change database settings, edit `backendServer/config/db.js`:

```javascript
await mongoose.connect('mongodb://localhost:27017/wismin_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
```

## Data Migration (Optional)

If you have existing MySQL data, you can migrate it to MongoDB:

### Option 1: Manual Export/Import

1. **Export from MySQL:**
   ```bash
   mysqldump -u root wismin_db > backup.sql
   ```

2. **Convert to MongoDB format** (you'll need a custom script or tool)

3. **Import to MongoDB:**
   ```bash
   mongoimport --db wismin_db --collection grades --file grades.json
   ```

### Option 2: Using a Migration Script

Create a migration script that reads from MySQL and writes to MongoDB:

```javascript
// migration.js (example)
const mysql = require('mysql');
const mongoose = require('mongoose');
const Grade = require('./models/Grade');

// Connect to both databases
// ... read from MySQL
// ... write to MongoDB
```

## Key Differences

### Schema Flexibility

- **MySQL:** Rigid schema, changes require ALTER TABLE
- **MongoDB:** Flexible schema, documents can have different fields

### Relationships

- **MySQL:** Foreign keys enforce relationships
- **MongoDB:** References by ID, manual relationship management

### Transactions

- **MySQL:** ACID transactions by default
- **MongoDB:** ACID transactions available (replica set required for production)

### Queries

- **MySQL:** SQL language
- **MongoDB:** Query operators and aggregation pipeline

## API Endpoints

All existing API endpoints remain unchanged:

### Grades
- `GET /grades` - Get all grades
- `POST /grades` - Add new grade
- `PUT /grades/:id` - Update grade
- `DELETE /grades/:id` - Delete grade

### Subjects
- `GET /subjects` - Get all subjects
- `POST /subjects` - Add new subject
- `PUT /subjects/:id` - Update subject
- `DELETE /subjects/:id` - Delete subject
- `GET /lecturers` - Get distinct lecturers

### Classes
- `GET /classes` - Get all classes with grade and subject names
- `POST /classes` - Add new class
- `PUT /classes/:id` - Update class
- `DELETE /classes/:id` - Delete class

### Courses
- `GET /courses` - Get all courses
- `POST /courses` - Add new course
- `PUT /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course

### Students
- `GET /students/next-id/:gradeId` - Generate next student ID
- `POST /students` - Register new student (with transaction)
- `GET /students/:id` - Get student by ID
- `GET /students` - Get all students with grade names
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student
- `POST /students/:id/upload-qr` - Upload QR code image
- `GET /students/:id/qrcode-image` - Get QR code image

### Authentication
- `POST /login` - User login (admin/staff)

## Testing

Test the API endpoints using:

1. **Browser:** http://localhost:8081
2. **Postman/Thunder Client:** Import and test all endpoints
3. **Frontend Application:** Start the React frontend

## Troubleshooting

### Connection Issues

**Error:** `MongoServerError: connect ECONNREFUSED`
**Solution:** Ensure MongoDB is running on port 27017

```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### Mongoose Deprecation Warnings

The connection options `useNewUrlParser` and `useUnifiedTopology` may show deprecation warnings in newer versions. These can be safely removed in Mongoose 6+.

### Transaction Errors

**Error:** `Transaction numbers are only allowed on a replica set member or mongos`

**Solution:** For local development, you can:
1. Skip transactions (remove session parameter)
2. Set up MongoDB as a replica set
3. Use MongoDB Atlas (cloud)

## Benefits of MongoDB Migration

1. **Flexible Schema:** Easy to add new fields without migrations
2. **JSON Native:** Direct mapping to JavaScript objects
3. **Scalability:** Horizontal scaling with sharding
4. **Document Model:** Natural fit for modern applications
5. **Aggregation Pipeline:** Powerful data transformation
6. **No JOIN overhead:** Embedded documents and denormalization

## Support

For issues or questions:
- Check MongoDB documentation: https://docs.mongodb.com/
- Mongoose documentation: https://mongoosejs.com/docs/
- Project issues: Create an issue in the repository

---

**Migration Date:** 2025-11-20
**Version:** 1.0.0
**Status:** ✅ Complete
