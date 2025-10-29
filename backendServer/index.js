const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For session tokens



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
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "wismin_db"
});

// Connect to Database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('MySQL Database Connected...');
});

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
app.post('/login', (req, res) => {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
        return res.status(400).json({ message: "Please provide email, password, and user type." });
    }

    // Hardcoded credentials check
    if (userType === 'admin') {
        if (email !== 'Admin123@gmail.com' || password !== 'admin123') {
            // Still record failed login attempt
            const insertFailedLoginSql = "INSERT INTO user_login (email, login_time, status, user_type) VALUES (?, NOW(), 'failed', ?)";
            db.query(insertFailedLoginSql, [email, userType], (err) => {
                if (err) console.error("Error recording failed login:", err);
            });
            return res.status(401).json({ message: "Invalid admin credentials" });
        }
    } else if (userType === 'staff') {
        if (email !== 'Staffuser@gmail.com' || password !== 'staff123') {
            // Record failed login attempt
            const insertFailedLoginSql = "INSERT INTO user_login (email, login_time, status, user_type) VALUES (?, NOW(), 'failed', ?)";
            db.query(insertFailedLoginSql, [email, userType], (err) => {
                if (err) console.error("Error recording failed login:", err);
            });
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
    const insertLoginSql = "INSERT INTO user_login (user_id, email, login_time, status, user_type) VALUES (?, ?, NOW(), 'success', ?)";
    db.query(insertLoginSql, [mockUser.id, email, userType], (loginErr, loginResult) => {
        if (loginErr) {
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
});



//------ --- Grade Management Routes -------------

// Get all grades
app.get('/grades', (req, res) => {
    const sql = "SELECT * FROM grades";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching grades:", err);
            return res.status(500).json({ message: "Error fetching grades" });
        }
        res.json(results);
    });
});

// Add a new grade
app.post('/grades', (req, res) => {
    const { grade_id, name } = req.body;
    if (!grade_id || !name) {
        return res.status(400).json({ message: "Grade ID and name are required" });
    }
    
    const sql = "INSERT INTO grades (grade_id, name) VALUES (?, ?)";
    db.query(sql, [grade_id, name], (err, result) => {
        if (err) {
            console.error("Error adding grade:", err);
            return res.status(500).json({ message: "Error adding grade" });
        }
        res.status(201).json({ message: "Grade added successfully", grade_id });
    });
});

// Update a grade
app.put('/grades/:id', (req, res) => {
    const grade_id = req.params.id;
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: "Grade name is required" });
    }
    
    const sql = "UPDATE grades SET name = ? WHERE grade_id = ?";
    db.query(sql, [name, grade_id], (err, result) => {
        if (err) {
            console.error("Error updating grade:", err);
            return res.status(500).json({ message: "Error updating grade" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Grade not found" });
        }
        res.json({ message: "Grade updated successfully" });
    });
});

// Delete a grade
app.delete('/grades/:id', (req, res) => {
    const grade_id = req.params.id;
    
    const sql = "DELETE FROM grades WHERE grade_id = ?";
    db.query(sql, [grade_id], (err, result) => {
        if (err) {
            console.error("Error deleting grade:", err);
            return res.status(500).json({ message: "Error deleting grade" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Grade not found" });
        }
        res.json({ message: "Grade deleted successfully" });
    });
});



// ---------- Subject Management Routes --------------------

// Get all subjects
app.get('/subjects', (req, res) => {
    const sql = "SELECT * FROM subjects";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching subjects:", err);
            return res.status(500).json({ message: "Error fetching subjects" });
        }
        res.json(results);
    });
});

// Add a new subject
app.post('/subjects', (req, res) => {
    const { subject_id, name, fee, lecturer } = req.body;
    if (!subject_id || !name || fee === undefined || !lecturer) {
        return res.status(400).json({ message: "Subject ID, name, fee, and lecturer are required" });
    }
    
    const sql = "INSERT INTO subjects (subject_id, name, fee, lecturer) VALUES (?, ?, ?, ?)";
    db.query(sql, [subject_id, name, fee, lecturer], (err, result) => {
        if (err) {
            console.error("Error adding subject:", err);
            return res.status(500).json({ message: "Error adding subject" });
        }
        res.status(201).json({ message: "Subject added successfully", subject_id });
    });
});

// Update a subject
app.put('/subjects/:id', (req, res) => {
    const subject_id = req.params.id;
    const { name, fee, lecturer } = req.body;
    
    if (!name || fee === undefined || !lecturer) {
        return res.status(400).json({ message: "Subject name, fee, and lecturer are required" });
    }
    
    const sql = "UPDATE subjects SET name = ?, fee = ?, lecturer = ? WHERE subject_id = ?";
    db.query(sql, [name, fee, lecturer, subject_id], (err, result) => {
        if (err) {
            console.error("Error updating subject:", err);
            return res.status(500).json({ message: "Error updating subject" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json({ message: "Subject updated successfully" });
    });
});


// Add a new route to get lecturers
app.get('/lecturers', (req, res) => {
    const sql = "SELECT DISTINCT lecturer FROM subjects WHERE lecturer IS NOT NULL";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching lecturers:", err);
            return res.status(500).json({ message: "Error fetching lecturers" });
        }
        res.json(results.map(item => item.lecturer));
    });
});


// Delete a subject
app.delete('/subjects/:id', (req, res) => {
    const subject_id = req.params.id;
    
    const sql = "DELETE FROM subjects WHERE subject_id = ?";
    db.query(sql, [subject_id], (err, result) => {
        if (err) {
            console.error("Error deleting subject:", err);
            return res.status(500).json({ message: "Error deleting subject" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json({ message: "Subject deleted successfully" });
    });
});



// --- Class (Grade Subject) Management Routes ---

// Get all classes
app.get('/classes', (req, res) => {
    const sql = `
        SELECT c.*, g.name as grade_name, s.name as subject_name 
        FROM classes c
        JOIN grades g ON c.grade_id = g.grade_id
        JOIN subjects s ON c.subject_id = s.subject_id
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching classes:", err);
            return res.status(500).json({ message: "Error fetching classes" });
        }
        res.json(results);
    });
});

// Add a new class
app.post('/classes', (req, res) => {
    const { grade_id, subject_id, time, day, lecturer, mode, fee } = req.body;
    
    if (!grade_id || !subject_id || !time || !day || !lecturer || !mode || fee === undefined) {
        return res.status(400).json({ message: "All class details are required" });
    }
    
    const sql = `
        INSERT INTO classes 
        (grade_id, subject_id, time, day, lecturer, mode, fee) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [grade_id, subject_id, time, day, lecturer, mode, fee];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding class:", err);
            return res.status(500).json({ message: "Error adding class" });
        }
        res.status(201).json({ 
            message: "Class added successfully", 
            class_id: result.insertId 
        });
    });
});

// Update a class
app.put('/classes/:id', (req, res) => {
    const class_id = req.params.id;
    const { grade_id, subject_id, time, day, lecturer, mode, fee } = req.body;
    
    if (!grade_id || !subject_id || !time || !day || !lecturer || !mode || fee === undefined) {
        return res.status(400).json({ message: "All class details are required" });
    }
    
    const sql = `
        UPDATE classes 
        SET grade_id = ?, subject_id = ?, time = ?, day = ?, 
            lecturer = ?, mode = ?, fee = ?
        WHERE class_id = ?
    `;
    const values = [grade_id, subject_id, time, day, lecturer, mode, fee, class_id];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating class:", err);
            return res.status(500).json({ message: "Error updating class" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Class not found" });
        }
        res.json({ message: "Class updated successfully" });
    });
});

// Delete a class
app.delete('/classes/:id', (req, res) => {
    const class_id = req.params.id;
    
    const sql = "DELETE FROM classes WHERE class_id = ?";
    db.query(sql, [class_id], (err, result) => {
        if (err) {
            console.error("Error deleting class:", err);
            return res.status(500).json({ message: "Error deleting class" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Class not found" });
        }
        res.json({ message: "Class deleted successfully" });
    });
});



// ---------------- Course Management Routes --------------////////////

// Get all courses
app.get('/courses', (req, res) => {
    const sql = "SELECT * FROM courses";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching courses:", err);
            return res.status(500).json({ message: "Error fetching courses" });
        }
        res.json(results);
    });
});

// Add a new course
app.post('/courses', (req, res) => {
    const { course_id, name, description, time, day, lecturer, fee } = req.body;
    
    if (!course_id || !name || !time || !day || !lecturer || fee === undefined) {
        return res.status(400).json({ message: "All required course details must be provided" });
    }
    
    const sql = `
        INSERT INTO courses 
        (course_id, name, description, time, day, lecturer, fee) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [course_id, name, description, time, day, lecturer, fee];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding course:", err);
            return res.status(500).json({ message: "Error adding course" });
        }
        res.status(201).json({ 
            message: "Course added successfully", 
            course_id 
        });
    });
});

// Update a course
app.put('/courses/:id', (req, res) => {
    const course_id = req.params.id;
    const { name, description, time, day, lecturer, fee } = req.body;
    
    if (!name || !time || !day || !lecturer || fee === undefined) {
        return res.status(400).json({ message: "All required course details must be provided" });
    }
    
    const sql = `
        UPDATE courses 
        SET name = ?, description = ?, time = ?, day = ?, 
            lecturer = ?, fee = ?
        WHERE course_id = ?
    `;
    const values = [name, description, time, day, lecturer, fee, course_id];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating course:", err);
            return res.status(500).json({ message: "Error updating course" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.json({ message: "Course updated successfully" });
    });
});

// Delete a course
app.delete('/courses/:id', (req, res) => {
    const course_id = req.params.id;
    
    const sql = "DELETE FROM courses WHERE course_id = ?";
    db.query(sql, [course_id], (err, result) => {
        if (err) {
            console.error("Error deleting course:", err);
            return res.status(500).json({ message: "Error deleting course" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.json({ message: "Course deleted successfully" });
    });
});


// -----------Student Registration Routes----------//////////

// Get next available student ID for a grade
app.get('/students/next-id/:gradeId', (req, res) => {
    const gradeId = req.params.gradeId;
    
    // Example logic - adjust based on your ID generation scheme
    const sql = "SELECT MAX(student_id) as maxId FROM students WHERE student_id LIKE ?";
    const prefix = `St${gradeId}`;
    
    db.query(sql, [`${prefix}%`], (err, results) => {
        if (err) {
            console.error("Error fetching next student ID:", err);
            return res.status(500).json({ message: "Error generating student ID" });
        }
        
        let nextId;
        if (results[0].maxId) {
            const lastNum = parseInt(results[0].maxId.replace(prefix, '')) || 0;
            nextId = `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
        } else {
            nextId = `${prefix}001`; // First student for this grade
        }
        
        res.json({ nextStudentId: nextId });
    });
});

// Register a new student
app.post('/students', (req, res) => {
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

    // Start transaction
    db.beginTransaction(async (err) => {
        if (err) {
            console.error("Transaction error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        try {
            // 1. Insert student basic info
            const insertStudentSql = `
                INSERT INTO students 
                (student_id, first_name, last_name, grade_id, password, mobile, email) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const studentValues = [student_id, first_name, last_name, grade_id, password, mobile, email];
            
            await new Promise((resolve, reject) => {
                db.query(insertStudentSql, studentValues, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            // 2. Insert student subjects
            if (subjects.length > 0) {
                const subjectSql = `
                    INSERT INTO student_subjects 
                    (student_id, subject_id) 
                    VALUES ?
                `;
                const subjectValues = subjects.map(subject_id => [student_id, subject_id]);
                
                await new Promise((resolve, reject) => {
                    db.query(subjectSql, [subjectValues], (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });
            }

            // 3. Insert student courses (if any)
            if (courses && courses.length > 0) {
                const courseSql = `
                    INSERT INTO student_courses 
                    (student_id, course_id) 
                    VALUES ?
                `;
                const courseValues = courses.map(course_id => [student_id, course_id]);
                
                await new Promise((resolve, reject) => {
                    db.query(courseSql, [courseValues], (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });
            }

            // Commit transaction
            db.commit((err) => {
                if (err) {
                    console.error("Commit error:", err);
                    return db.rollback(() => {
                        res.status(500).json({ message: "Error saving student data" });
                    });
                }
                res.status(201).json({ 
                    message: "Student registered successfully",
                    studentId: student_id
                });
            });
        } catch (error) {
            // Rollback on error
            db.rollback(() => {
                console.error("Registration error:", error);
                if (error.code === 'ER_DUP_ENTRY') {
                    res.status(409).json({ message: "Student ID already exists" });
                } else {
                    res.status(500).json({ message: "Error registering student" });
                }
            });
        }
    });
});

//////////////-----------generate student qr code ------//////////
// Get student data by ID (for QR code generation)
app.get('/students/:id', (req, res) => {
    const studentId = req.params.id;
    
    const sql = `
        SELECT s.student_id, s.first_name, s.last_name, s.mobile, s.password, 
               g.name as grade_name
        FROM students s
        JOIN grades g ON s.grade_id = g.grade_id
        WHERE s.student_id = ?
    `;
    
    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Error fetching student:", err);
            return res.status(500).json({ message: "Error fetching student data" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        const student = results[0];
        res.json({
            studentId: student.student_id,
            firstName: student.first_name,
            lastName: student.last_name,
            mobile: student.mobile,
            password: student.password,
            grade: student.grade_name
        });
    });
});

// Store QR code image data in database
app.post('/students/:id/upload-qr', (req, res) => {
    const studentId = req.params.id;
    const { qrImage } = req.body; // This will be base64 encoded image data
    
    if (!qrImage) {
        return res.status(400).json({ message: "QR image data is required" });
    }
    
    // Store the base64 image data in the database
    const sql = "UPDATE students SET qr_code_image = ? WHERE student_id = ?";
    db.query(sql, [qrImage, studentId], (err, result) => {
        if (err) {
            console.error("Error storing QR code image:", err);
            return res.status(500).json({ message: "Error storing QR code image" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.json({ message: "QR code image uploaded successfully" });
    });
});
// Get QR code image for a student
app.get('/students/:id/qrcode-image', (req, res) => {
    const studentId = req.params.id;
    
    const sql = "SELECT qr_code_image FROM students WHERE student_id = ?";
    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Error fetching QR code image:", err);
            return res.status(500).json({ message: "Error fetching QR code image" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        if (!results[0].qr_code_image) {
            return res.status(404).json({ message: "QR code image not generated for this student" });
        }
        
        res.json({ qrImage: results[0].qr_code_image });
    });
});


//------------manage student's data-//

// Get all students
app.get('/students', (req, res) => {
    const sql = `
      SELECT s.*, g.name as grade_name 
      FROM students s
      LEFT JOIN grades g ON s.grade_id = g.grade_id
    `;
    
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching students:", err);
        return res.status(500).json({ message: "Error fetching students" });
      }
      res.json(results);
    });
  });
  
  // Delete a student
  app.delete('/students/:id', (req, res) => {
    const studentId = req.params.id;
    
    const sql = "DELETE FROM students WHERE student_id = ?";
    db.query(sql, [studentId], (err, result) => {
      if (err) {
        console.error("Error deleting student:", err);
        return res.status(500).json({ message: "Error deleting student" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ message: "Student deleted successfully" });
    });
  });


// Update a student
app.put('/students/:id', (req, res) => {
    const studentId = req.params.id;
    const { first_name, last_name, grade_id, mobile, email } = req.body;
    
    if (!first_name || !last_name || !grade_id || !mobile || !email) {
        return res.status(400).json({ message: "All student details are required" });
    }
    
    const sql = `
        UPDATE students 
        SET first_name = ?, last_name = ?, grade_id = ?, 
            mobile = ?, email = ?
        WHERE student_id = ?
    `;
    const values = [first_name, last_name, grade_id, mobile, email, studentId];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating student:", err);
            return res.status(500).json({ message: "Error updating student" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        // Get the updated student data to return
        const getSql = "SELECT * FROM students WHERE student_id = ?";
        db.query(getSql, [studentId], (err, results) => {
            if (err) {
                console.error("Error fetching updated student:", err);
                return res.json({ message: "Student updated successfully" });
            }
            res.json({ 
                message: "Student updated successfully",
                student: results[0]
            });
        });
    });
});


// --- Start Server ---
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}...`);
});