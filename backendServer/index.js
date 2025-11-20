const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For session tokens
const connectDB = require('./config/db');

// Import MongoDB Models
const Grade = require('./models/Grade');
const Subject = require('./models/Subject');
const Class = require('./models/Class');
const Course = require('./models/Course');
const Student = require('./models/Student');
const StudentSubject = require('./models/StudentSubject');
const StudentCourse = require('./models/StudentCourse');
const AttendanceRecord = require('./models/AttendanceRecord');
const PaymentRecord = require('./models/PaymentRecord');
const UserLogin = require('./models/UserLogin');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
// app.use(cors({
//     origin: 'http://localhost:5174', // or your frontend URL
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// --- Secret Key for JWT (Keep this secure!) ---
const JWT_SECRET = 'sew2002'; // CHANGE THIS!

// --- Database Connection ---
connectDB();

// --- API Routes ---

// Test Route
app.get('/', (req, res) => {
    return res.json("From EduSpark backend side");
});

// Signup Route (POST /signup) - Uses user_reg table
// app.post('/signup', async (req, res) => {
//     const { name, email, password, confirmPassword, userType } = req.body;

//     // Validations (as before)
//     if (!name || !email || !password || !confirmPassword || !userType) {
//         return res.status(400).json({ message: "Please fill in all fields." });
//     }
//     if (password !== confirmPassword) {
//         return res.status(400).json({ message: "Passwords do not match." });
//     }
//     if (password.length < 6) {
//         return res.status(400).json({ message: "Password must be at least 6 characters long." });
//     }
//     if (!['admin', 'staff'].includes(userType)) {
//         return res.status(400).json({ message: "Invalid user type." });
//     }

//     // Check if email exists in user_reg
//     const checkEmailSql = "SELECT email FROM user_reg WHERE email = ?";
//     db.query(checkEmailSql, [email], async (err, results) => {
//         if (err) {
//             console.error("Error checking email:", err);
//             return res.status(500).json({ message: "Database error during email check." });
//         }
//         if (results.length > 0) {
//             return res.status(409).json({ message: "Email already registered." });
//         }

//         // Hash Password
//         try {
//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash(password, salt);

//             // Insert User into user_reg table
//             const insertSql = "INSERT INTO user_reg (name, email, password, user_type) VALUES (?, ?, ?, ?)";
//             const values = [name, email, hashedPassword, userType];

//             db.query(insertSql, values, (err, result) => {
//                 if (err) {
//                     console.error("Error inserting user:", err);
//                     return res.status(500).json({ message: "Database error during registration." });
//                 }
//                 console.log("User registered in user_reg:", email);
//                 return res.status(201).json({ message: "User registered successfully!", userId: result.insertId, email: email, userType: userType });
//             });
//         } catch (hashError) {
//             console.error("Error hashing password:", hashError);
//             return res.status(500).json({ message: "Error processing registration." });
//         }
//     });
// });

// Login Route (POST /login) -
app.post('/login', async (req, res) => {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
        return res.status(400).json({ message: "Please provide email, password, and user type." });
    }

    // Hardcoded credentials check
    if (userType === 'admin') {
        if (email !== 'Admin123@gmail.com' || password !== 'admin123') {
            // Still record failed login attempt
            try {
                await UserLogin.create({
                    email: email,
                    login_time: new Date(),
                    status: 'failed',
                    user_type: userType
                });
            } catch (err) {
                console.error("Error recording failed login:", err);
            }
            return res.status(401).json({ message: "Invalid admin credentials" });
        }
    } else if (userType === 'staff') {
        if (email !== 'Staffuser@gmail.com' || password !== 'staff123') {
            // Record failed login attempt
            try {
                await UserLogin.create({
                    email: email,
                    login_time: new Date(),
                    status: 'failed',
                    user_type: userType
                });
            } catch (err) {
                console.error("Error recording failed login:", err);
            }
            return res.status(401).json({ message: "Invalid staff credentials" });
        }
    }

    // For successful logins, we'll use a mock user since we're not using user_reg table
    const mockUser = {
        id: userType === 'admin' ? 1 : 2,
        email: email,
        name: userType === 'admin' ? 'Admin User' : 'Staff User',
        user_type: userType
    };

    // Record successful login
    try {
        await UserLogin.create({
            user_id: mockUser.id,
            email: email,
            login_time: new Date(),
            status: 'success',
            user_type: userType
        });
    } catch (loginErr) {
        console.error("Error recording login:", loginErr);
        // Continue with login even if recording fails
    }

    // Generate JWT Token
    const payload = {
        user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            userType: mockUser.user_type
        }
    };

    jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
            if (err) {
                console.error("Error signing JWT:", err);
                return res.status(500).json({ message: "Error generating session token." });
            }
            console.log("User logged in:", email);
            res.json({
                message: "Login successful!",
                token: token,
                user: payload.user
            });
        }
    );
});



//------ --- Grade Management Routes -------------

// Get all grades
app.get('/grades', async (req, res) => {
    try {
        const grades = await Grade.find();
        res.json(grades);
    } catch (err) {
        console.error("Error fetching grades:", err);
        return res.status(500).json({ message: "Error fetching grades" });
    }
});

// Add a new grade
app.post('/grades', async (req, res) => {
    const { grade_id, name } = req.body;
    if (!grade_id || !name) {
        return res.status(400).json({ message: "Grade ID and name are required" });
    }

    try {
        const grade = await Grade.create({ grade_id, name });
        res.status(201).json({ message: "Grade added successfully", grade_id });
    } catch (err) {
        console.error("Error adding grade:", err);
        if (err.code === 11000) {
            return res.status(409).json({ message: "Grade ID already exists" });
        }
        return res.status(500).json({ message: "Error adding grade" });
    }
});

// Update a grade
app.put('/grades/:id', async (req, res) => {
    const grade_id = req.params.id;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Grade name is required" });
    }

    try {
        const result = await Grade.findOneAndUpdate(
            { grade_id: grade_id },
            { name: name },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Grade not found" });
        }
        res.json({ message: "Grade updated successfully" });
    } catch (err) {
        console.error("Error updating grade:", err);
        return res.status(500).json({ message: "Error updating grade" });
    }
});

// Delete a grade
app.delete('/grades/:id', async (req, res) => {
    const grade_id = req.params.id;

    try {
        const result = await Grade.findOneAndDelete({ grade_id: grade_id });

        if (!result) {
            return res.status(404).json({ message: "Grade not found" });
        }
        res.json({ message: "Grade deleted successfully" });
    } catch (err) {
        console.error("Error deleting grade:", err);
        return res.status(500).json({ message: "Error deleting grade" });
    }
});



// ---------- Subject Management Routes --------------------

// Get all subjects
app.get('/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        console.error("Error fetching subjects:", err);
        return res.status(500).json({ message: "Error fetching subjects" });
    }
});

// Add a new subject
app.post('/subjects', async (req, res) => {
    const { subject_id, name, fee, lecturer } = req.body;
    if (!subject_id || !name || fee === undefined || !lecturer) {
        return res.status(400).json({ message: "Subject ID, name, fee, and lecturer are required" });
    }

    try {
        const subject = await Subject.create({ subject_id, name, fee, lecturer });
        res.status(201).json({ message: "Subject added successfully", subject_id });
    } catch (err) {
        console.error("Error adding subject:", err);
        if (err.code === 11000) {
            return res.status(409).json({ message: "Subject ID already exists" });
        }
        return res.status(500).json({ message: "Error adding subject" });
    }
});

// Update a subject
app.put('/subjects/:id', async (req, res) => {
    const subject_id = req.params.id;
    const { name, fee, lecturer } = req.body;

    if (!name || fee === undefined || !lecturer) {
        return res.status(400).json({ message: "Subject name, fee, and lecturer are required" });
    }

    try {
        const result = await Subject.findOneAndUpdate(
            { subject_id: subject_id },
            { name, fee, lecturer },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json({ message: "Subject updated successfully" });
    } catch (err) {
        console.error("Error updating subject:", err);
        return res.status(500).json({ message: "Error updating subject" });
    }
});


// Add a new route to get lecturers
app.get('/lecturers', async (req, res) => {
    try {
        const lecturers = await Subject.distinct('lecturer', { lecturer: { $ne: null } });
        res.json(lecturers);
    } catch (err) {
        console.error("Error fetching lecturers:", err);
        return res.status(500).json({ message: "Error fetching lecturers" });
    }
});


// Delete a subject
app.delete('/subjects/:id', async (req, res) => {
    const subject_id = req.params.id;

    try {
        const result = await Subject.findOneAndDelete({ subject_id: subject_id });

        if (!result) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json({ message: "Subject deleted successfully" });
    } catch (err) {
        console.error("Error deleting subject:", err);
        return res.status(500).json({ message: "Error deleting subject" });
    }
});



// --- Class (Grade Subject) Management Routes ---

// Get all classes
app.get('/classes', async (req, res) => {
    try {
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
            },
            {
                $project: {
                    grade: 0,
                    subject: 0
                }
            }
        ]);
        res.json(classes);
    } catch (err) {
        console.error("Error fetching classes:", err);
        return res.status(500).json({ message: "Error fetching classes" });
    }
});

// Add a new class
app.post('/classes', async (req, res) => {
    const { grade_id, subject_id, time, day, lecturer, mode, fee } = req.body;

    if (!grade_id || !subject_id || !time || !day || !lecturer || !mode || fee === undefined) {
        return res.status(400).json({ message: "All class details are required" });
    }

    try {
        // Get the next class_id
        const lastClass = await Class.findOne().sort({ class_id: -1 });
        const class_id = lastClass ? lastClass.class_id + 1 : 1;

        const newClass = await Class.create({
            class_id,
            grade_id,
            subject_id,
            time,
            day,
            lecturer,
            mode,
            fee
        });

        res.status(201).json({
            message: "Class added successfully",
            class_id: class_id
        });
    } catch (err) {
        console.error("Error adding class:", err);
        return res.status(500).json({ message: "Error adding class" });
    }
});

// Update a class
app.put('/classes/:id', async (req, res) => {
    const class_id = req.params.id;
    const { grade_id, subject_id, time, day, lecturer, mode, fee } = req.body;

    if (!grade_id || !subject_id || !time || !day || !lecturer || !mode || fee === undefined) {
        return res.status(400).json({ message: "All class details are required" });
    }

    try {
        const result = await Class.findOneAndUpdate(
            { class_id: parseInt(class_id) },
            { grade_id, subject_id, time, day, lecturer, mode, fee },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Class not found" });
        }
        res.json({ message: "Class updated successfully" });
    } catch (err) {
        console.error("Error updating class:", err);
        return res.status(500).json({ message: "Error updating class" });
    }
});

// Delete a class
app.delete('/classes/:id', async (req, res) => {
    const class_id = req.params.id;

    try {
        const result = await Class.findOneAndDelete({ class_id: parseInt(class_id) });

        if (!result) {
            return res.status(404).json({ message: "Class not found" });
        }
        res.json({ message: "Class deleted successfully" });
    } catch (err) {
        console.error("Error deleting class:", err);
        return res.status(500).json({ message: "Error deleting class" });
    }
});



// ---------------- Course Management Routes --------------////////////

// Get all courses
app.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        console.error("Error fetching courses:", err);
        return res.status(500).json({ message: "Error fetching courses" });
    }
});

// Add a new course
app.post('/courses', async (req, res) => {
    const { course_id, name, description, time, day, lecturer, fee } = req.body;

    if (!course_id || !name || !time || !day || !lecturer || fee === undefined) {
        return res.status(400).json({ message: "All required course details must be provided" });
    }

    try {
        const course = await Course.create({
            course_id,
            name,
            description,
            time,
            day,
            lecturer,
            fee
        });

        res.status(201).json({
            message: "Course added successfully",
            course_id
        });
    } catch (err) {
        console.error("Error adding course:", err);
        if (err.code === 11000) {
            return res.status(409).json({ message: "Course ID already exists" });
        }
        return res.status(500).json({ message: "Error adding course" });
    }
});

// Update a course
app.put('/courses/:id', async (req, res) => {
    const course_id = req.params.id;
    const { name, description, time, day, lecturer, fee } = req.body;

    if (!name || !time || !day || !lecturer || fee === undefined) {
        return res.status(400).json({ message: "All required course details must be provided" });
    }

    try {
        const result = await Course.findOneAndUpdate(
            { course_id: parseInt(course_id) },
            { name, description, time, day, lecturer, fee },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.json({ message: "Course updated successfully" });
    } catch (err) {
        console.error("Error updating course:", err);
        return res.status(500).json({ message: "Error updating course" });
    }
});

// Delete a course
app.delete('/courses/:id', async (req, res) => {
    const course_id = req.params.id;

    try {
        const result = await Course.findOneAndDelete({ course_id: parseInt(course_id) });

        if (!result) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.json({ message: "Course deleted successfully" });
    } catch (err) {
        console.error("Error deleting course:", err);
        return res.status(500).json({ message: "Error deleting course" });
    }
});


// -----------Student Registration Routes----------//////////

// Get next available student ID for a grade
app.get('/students/next-id/:gradeId', async (req, res) => {
    const gradeId = req.params.gradeId;

    try {
        const prefix = `St${gradeId}`;

        // Find all students with this prefix and get the maximum ID
        const students = await Student.find({
            student_id: new RegExp(`^${prefix}`)
        }).sort({ student_id: -1 }).limit(1);

        let nextId;
        if (students.length > 0 && students[0].student_id) {
            const lastNum = parseInt(students[0].student_id.replace(prefix, '')) || 0;
            nextId = `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
        } else {
            nextId = `${prefix}001`; // First student for this grade
        }

        res.json({ nextStudentId: nextId });
    } catch (err) {
        console.error("Error fetching next student ID:", err);
        return res.status(500).json({ message: "Error generating student ID" });
    }
});

// Register a new student
app.post('/students', async (req, res) => {
    const {
        student_id,
        first_name,
        last_name,
        grade_id,
        subjects,
        courses,
        password,
        mobile,
        email
    } = req.body;

    // Basic validation
    if (!student_id || !first_name || !last_name || !grade_id ||
        !Array.isArray(subjects) || !password || !mobile || !email) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Insert student basic info
        const student = await Student.create([{
            student_id,
            first_name,
            last_name,
            grade_id,
            password,
            mobile,
            email
        }], { session });

        // 2. Insert student subjects
        if (subjects.length > 0) {
            const subjectDocs = subjects.map(subject_id => ({
                student_id,
                subject_id
            }));
            await StudentSubject.insertMany(subjectDocs, { session });
        }

        // 3. Insert student courses (if any)
        if (courses && courses.length > 0) {
            const courseDocs = courses.map(course_id => ({
                student_id,
                course_id
            }));
            await StudentCourse.insertMany(courseDocs, { session });
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: "Student registered successfully",
            studentId: student_id
        });
    } catch (error) {
        // Rollback on error
        await session.abortTransaction();
        session.endSession();

        console.error("Registration error:", error);
        if (error.code === 11000) {
            res.status(409).json({ message: "Student ID already exists" });
        } else {
            res.status(500).json({ message: "Error registering student" });
        }
    }
});

//////////////-----------generate student qr code ------//////////
// Get student data by ID (for QR code generation)
app.get('/students/:id', async (req, res) => {
    const studentId = req.params.id;

    try {
        const student = await Student.findOne({ student_id: studentId });

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const grade = await Grade.findOne({ grade_id: student.grade_id });

        res.json({
            studentId: student.student_id,
            firstName: student.first_name,
            lastName: student.last_name,
            mobile: student.mobile,
            password: student.password,
            grade: grade ? grade.name : ''
        });
    } catch (err) {
        console.error("Error fetching student:", err);
        return res.status(500).json({ message: "Error fetching student data" });
    }
});

// Store QR code image data in database
app.post('/students/:id/upload-qr', async (req, res) => {
    const studentId = req.params.id;
    const { qrImage } = req.body; // This will be base64 encoded image data

    if (!qrImage) {
        return res.status(400).json({ message: "QR image data is required" });
    }

    try {
        const result = await Student.findOneAndUpdate(
            { student_id: studentId },
            { qr_code_image: qrImage },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.json({ message: "QR code image uploaded successfully" });
    } catch (err) {
        console.error("Error storing QR code image:", err);
        return res.status(500).json({ message: "Error storing QR code image" });
    }
});

// Get QR code image for a student
app.get('/students/:id/qrcode-image', async (req, res) => {
    const studentId = req.params.id;

    try {
        const student = await Student.findOne(
            { student_id: studentId },
            { qr_code_image: 1 }
        );

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        if (!student.qr_code_image) {
            return res.status(404).json({ message: "QR code image not generated for this student" });
        }

        res.json({ qrImage: student.qr_code_image });
    } catch (err) {
        console.error("Error fetching QR code image:", err);
        return res.status(500).json({ message: "Error fetching QR code image" });
    }
});


//------------manage student's data-//

// Get all students
app.get('/students', async (req, res) => {
    try {
        const students = await Student.aggregate([
            {
                $lookup: {
                    from: 'grades',
                    localField: 'grade_id',
                    foreignField: 'grade_id',
                    as: 'grade'
                }
            },
            {
                $unwind: { path: '$grade', preserveNullAndEmptyArrays: true }
            },
            {
                $addFields: {
                    grade_name: '$grade.name'
                }
            },
            {
                $project: {
                    grade: 0
                }
            }
        ]);
        res.json(students);
    } catch (err) {
        console.error("Error fetching students:", err);
        return res.status(500).json({ message: "Error fetching students" });
    }
});

// Delete a student
app.delete('/students/:id', async (req, res) => {
    const studentId = req.params.id;

    try {
        const result = await Student.findOneAndDelete({ student_id: studentId });

        if (!result) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Also delete related student_subjects and student_courses
        await StudentSubject.deleteMany({ student_id: studentId });
        await StudentCourse.deleteMany({ student_id: studentId });

        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        console.error("Error deleting student:", err);
        return res.status(500).json({ message: "Error deleting student" });
    }
});


// Update a student
app.put('/students/:id', async (req, res) => {
    const studentId = req.params.id;
    const { first_name, last_name, grade_id, mobile, email } = req.body;

    if (!first_name || !last_name || !grade_id || !mobile || !email) {
        return res.status(400).json({ message: "All student details are required" });
    }

    try {
        const updatedStudent = await Student.findOneAndUpdate(
            { student_id: studentId },
            { first_name, last_name, grade_id, mobile, email },
            { new: true }
        );

        if (!updatedStudent) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({
            message: "Student updated successfully",
            student: updatedStudent
        });
    } catch (err) {
        console.error("Error updating student:", err);
        return res.status(500).json({ message: "Error updating student" });
    }
});


// --- Start Server ---
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}...`);
});