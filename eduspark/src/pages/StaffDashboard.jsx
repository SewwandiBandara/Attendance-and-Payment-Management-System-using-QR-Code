import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineUserAdd } from "react-icons/hi";
import { FaRegCalendarAlt } from "react-icons/fa";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import {QRCodeCanvas} from 'qrcode.react';
import { registerStudent,getNextStudentIdForGrade} from '../services/api';
import {getStudentById ,getStudentQRImage, uploadStudentQRImage} from '../services/api';
import {getGrades, getSubjects, getCourses} from '../services/api';


//////////////////+++++++++++++++++++++++++++++++++  register students  ++++++++++++++++++++++++++++++//////////////////
const StudentRegistrationForm = () => {
  // State for the Registration Form
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    grade: '',
    subjects: [],
    courses: [],
    password: '',
    mobile: '',
    email: ''
  });

  // State for QR Code Generation Form (still kept to allow manual input if needed, but no generate button)
  const [qrFormData, setQrFormData] = useState({
    studentId: '',
    mobile: '',
    password: ''
  });

  // State for fetched data and UI control
  const [gradesData, setGradesData] = useState([]);
  const [subjectsData, setSubjectsData] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  // State for QR Code
  const [qrData, setQrData] = useState('');
  const qrCodeRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [grades, subjects, courses] = await Promise.all([
          getGrades(),
          getSubjects(),
          getCourses()
        ]);
        setGradesData(grades);
        setSubjectsData(subjects);
        setCoursesData(courses);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Handlers for Registration Form ---
  const handleChange = async (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    if (name === 'grade') {
      const selectedGradeId = value;
      if (selectedGradeId) {
        setIsGeneratingId(true);
        setFormData({ ...updatedFormData, id: '' }); // Clear ID while generating
        try {
          const nextId = await getNextStudentIdForGrade(selectedGradeId);
          if (nextId) {
            setFormData({ ...updatedFormData, id: nextId });
          } else {
            console.warn("Received no ID from backend for grade:", selectedGradeId);
            setFormData({ ...updatedFormData, id: '' }); // Keep it empty on failure
          }
        } catch (err) {
          console.error("Failed to generate student ID:", err);
          alert("Error generating Student ID. Please check the console or contact support.");
          setFormData({ ...updatedFormData, id: '' }); // Keep it empty on error
        } finally {
          setIsGeneratingId(false);
        }
      } else {
        setFormData({ ...updatedFormData, id: '' }); // Clear ID if grade is unselected
      }
    } else {
      setFormData(updatedFormData);
    }
  };

  const handleSubjectChange = (e) => {
    const { options } = e.target;
    const selectedSubjects = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedSubjects.push(options[i].value);
      }
    }
    setFormData({ ...formData, subjects: selectedSubjects });
  };

  const handleCourseChange = (e) => {
    const { options } = e.target;
    const selectedCourses = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedCourses.push(options[i].value);
      }
    }
    setFormData({ ...formData, courses: selectedCourses });
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id || !formData.firstName || !formData.lastName || !formData.grade ||
        formData.subjects.length === 0 || !formData.password || !formData.mobile || !formData.email) {
      if (isGeneratingId) {
        alert('Please wait for the Student ID to be generated.');
        return;
      }
       // Check if ID is expected but missing after generation attempt
       const gradeSelectedButIdMissing = formData.grade && !formData.id && !isGeneratingId;
       if (gradeSelectedButIdMissing) {
          alert('Failed to generate Student ID. Please try re-selecting the grade or contact support.');
          return;
       }
      alert('Please fill in all required fields and select at least one subject.');
      return;
    }

    try {
      const studentData = {
        student_id: formData.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        grade_id: formData.grade,
        subjects: formData.subjects,
        courses: formData.courses,
        password: formData.password,
        mobile: formData.mobile,
        email: formData.email
      };

      await registerStudent(studentData);

      // Auto-populate QR code form with student data
      setQrFormData({
          studentId: formData.id,
          mobile: formData.mobile,
          password: formData.password
      });
      
      // Auto-generate QR code immediately
      const qrContent = `${formData.id}|${formData.mobile}|${formData.password}`;
      setQrData(qrContent);
      
      // Store QR code in database
      try {
          await storeStudentQRCode(formData.id, qrContent);
      } catch (err) {
          console.error("Failed to store QR code:", err);
          // Don't fail the registration if QR storage fails
      }
      
      alert('Registration Successful! QR code has been generated and stored.');

      // Reset registration form (optional, depending on desired workflow)
      // If you want to keep the form filled after registration, comment this out.
      setFormData({
        id: '',
        firstName: '',
        lastName: '',
        grade: '',
        subjects: [],
        courses: [],
        password: '',
        mobile: '',
        email: ''
      });

    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Please try again.';
      alert(`Registration failed: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    setFormData({
      id: '',
      firstName: '',
      lastName: '',
      grade: '',
      subjects: [],
      courses: [],
      password: '',
      mobile: '',
      email: ''
    });
    // Optionally clear QR data as well if registration is cancelled
    setQrFormData({ studentId: '', mobile: '', password: '' });
    setQrData('');
  };

  // --- Handlers for QR Code Section ---
  
   // the QR code will primarily be generated automatically after successful registration.
   // The QR form fields remain for display or potential manual use if needed,
  const handleQrFormChange = (e) => {
    const { name, value } = e.target;
    const newQrFormData = { ...qrFormData, [name]: value };
    setQrFormData(newQrFormData);

    // Optional: Auto-generate QR code as fields are typed
    // Uncomment the following lines if you want the QR code to update live
    // as the user types in the QR form fields.
    const { studentId, mobile, password } = newQrFormData;
    if (studentId && mobile && password) {
       setQrData(`${studentId}|${mobile}|${password}`);
    } else {
       setQrData(''); // Clear QR if fields are incomplete
    }

  };

  const handleQrFormReset = () => {
    setQrFormData({ studentId: '', mobile: '', password: '' });
    setQrData('');
  };

  const downloadQRCode = () => {
    if (!qrCodeRef.current) {
        alert("QR Code element reference not found.");
        return;
    }
    if (!qrData) {
        alert("No QR code generated to download.");
        return;
    }

    // Find the actual QR code canvas element within the ref
    const qrCanvas = qrCodeRef.current.querySelector('canvas');
     if (!qrCanvas) {
         alert("QR Code canvas element not found.");
         return;
     }


    // Use the canvas directly if html2canvas is not strictly needed for styling/padding issues
    // If html2canvas is needed to capture the padding/border etc. use the original logic below
    const link = document.createElement('a');
    link.download = `student_${qrFormData.studentId || 'qrcode'}.png`;
    link.href = qrCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  };



  ///------upload image---///
// Add this state to your component
const [uploading, setUploading] = useState(false);

// Add this function to handle file upload
const handleUploadQRImage = async () => {
    if (!qrCodeRef.current || !qrData) {
        alert("No QR code generated to upload");
        return;
    }

    try {
        setUploading(true);
        
        // Get the canvas element
        const qrCanvas = qrCodeRef.current.querySelector('canvas');
        if (!qrCanvas) {
            throw new Error("QR Code canvas not found");
        }

        // Convert canvas to base64 image
        const qrImageData = qrCanvas.toDataURL('image/png');

        // Upload to backend
        await uploadStudentQRImage(qrFormData.studentId, qrImageData);
        
        alert('QR code image uploaded successfully!');
    } catch (error) {
        console.error("Error uploading QR image:", error);
        alert(`Error uploading QR code: ${error.message || 'Please try again.'}`);
    } finally {
        setUploading(false);
    }
};





  const [retrievedQRData, setRetrievedQRData] = useState(null);


//for QR code retrieval
const handleRetrieveQRCode = async () => {
  if (!qrFormData.studentId) {
      alert("Please enter a Student ID");
      return;
  }

  try {
      const response = await getStudentQRImage(qrFormData.studentId);
      setQrData(response.qrData);
      setRetrievedQRData(response.qrData);
      alert("QR code retrieved successfully!");
  } catch (error) {
      console.error("Error retrieving QR code:", error);
      alert(`Error retrieving QR code: ${error.message || 'Please try again.'}`);
  }
};

const handleFetchStudent = async () => {
  if (!qrFormData.studentId) {
      alert("Please enter a Student ID");
      return;
  }

  try {
      const student = await getStudentById(qrFormData.studentId);
      setQrFormData({
          studentId: student.studentId,
          mobile: student.mobile,
          password: student.password
      });
      alert(`Student found: ${student.firstName} ${student.lastName}, Grade: ${student.grade}`);
  } catch (error) {
      console.error("Error fetching student:", error);
      alert(`Error fetching student: ${error.message || 'Student not found.'}`);
  }
};

const navigate = useNavigate(); // Add this at the top with other hooks

const handleShareQRCode = () => {
  if (!qrCodeRef.current || !qrData) {
    alert("No QR code generated to share.");
    return;
  }

  // Get the canvas element
  const qrCanvas = qrCodeRef.current.querySelector('canvas');
  if (!qrCanvas) {
    alert("QR Code canvas element not found for sharing.");
    return;
  }

  // Convert canvas to base64 image
  const qrImageData = qrCanvas.toDataURL('image/png');

  // Navigate to email form with the QR image data
  navigate('/email-qr', {
    state: {
      qrImage: qrImageData,
      studentId: qrFormData.studentId
    }
  });
};



  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong> {error}
        </div>
      </div>
    );
  }



//print qr code
const handlePrintQRCode = () => {
  if (!qrCodeRef.current || !qrData) {
    alert("No QR code generated to print.");
    return;
  }

  const qrCanvas = qrCodeRef.current.querySelector('canvas');
  if (!qrCanvas) {
    alert("QR Code canvas element not found for printing.");
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Print QR Code</title>
        <style>
          body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .qr-container { text-align: center; }
          .qr-title { font-size: 18px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="qr-title">Student QR Code - ID: ${qrFormData.studentId}</div>
          <img src="${qrCanvas.toDataURL('image/png')}" />
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  
  // Wait for the image to load before printing
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};


  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Section 1: Student Registration */}
      <div className="bg-green-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Student Registration</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student ID */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                type="text" name="id" value={isGeneratingId ? 'Generating...' : formData.id} readOnly
                className="w-full p-2 border rounded-md bg-gray-100 text-gray-700"
                placeholder="Select grade to generate ID" required aria-busy={isGeneratingId}
              />
              {isGeneratingId && <div className="text-xs text-blue-500 mt-1">Fetching next ID...</div>}
            </div>

            {/* First Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                className="w-full p-2 border rounded-md" required
              />
            </div>

            {/* Last Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                className="w-full p-2 border rounded-md" required
              />
            </div>

            {/* Grade */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Grade</label>
              <select
                name="grade" value={formData.grade} onChange={handleChange}
                className="w-full p-2 border rounded-md" required disabled={isGeneratingId}
              >
                <option value="">Select Grade</option>
                {gradesData.map(grade => (
                  <option key={grade.grade_id} value={grade.grade_id}>{grade.name}</option>
                ))}
              </select>
            </div>

            {/* Subjects */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Subjects (Select multiple)</label>
              <select
                name="subjects" multiple value={formData.subjects} onChange={handleSubjectChange}
                className="w-full p-2 border rounded-md h-auto min-h-[100px]" required
              >
                {subjectsData.map(subject => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.name} (Rs. {subject.fee})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Courses */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Courses (Optional)</label>
              <select
                name="courses" multiple value={formData.courses} onChange={handleCourseChange}
                className="w-full p-2 border rounded-md h-auto min-h-[100px]"
              >
                {coursesData.map(course => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.name} (Rs. {course.fee})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password" name="password" value={formData.password} onChange={handleChange}
                className="w-full p-2 border rounded-md" required
              />
            </div>

            {/* Mobile No */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Mobile No</label>
              <input
                type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                className="w-full p-2 border rounded-md" required
              />
            </div>

            {/* Email */}
            <div className="mb-4 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full p-2 border rounded-md" required
              />
            </div>
          </div>

          {/* Registration Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
              disabled={isGeneratingId}
            >
              Register
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: QR Code Generation */}
      <div className="bg-purple-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Student QR Code</h2> {/* Changed heading slightly */}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* QR Code Form (Inputs remain but no generate button) */}
          <div className="lg:w-1/2">
             <p className="text-gray-700 mb-4">
                 The QR Code below is automatically generated based on the Student ID, Mobile No, and Password
                 of the last successfully registered student.
            </p>
            <div className="grid grid-cols-1 gap-4">
                {/* Student ID */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Student ID</label>
                  <input
                    type="text" name="studentId" value={qrFormData.studentId} onChange={handleQrFormChange}
                    className="w-full p-2 border rounded-md bg-gray-100" readOnly // Made readOnly as auto-generated from registration
                  />
                </div>

                {/* Mobile No */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Mobile No</label>
                  <input
                    type="tel" name="mobile" value={qrFormData.mobile} onChange={handleQrFormChange}
                    className="w-full p-2 border rounded-md bg-gray-100" readOnly // Made readOnly as auto-generated from registration
                  />
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password" name="password" value={qrFormData.password} onChange={handleQrFormChange}
                    className="w-full p-2 border rounded-md bg-gray-100" readOnly // Made readOnly as auto-generated from registration
                  />
                </div>
             </div>

             <div className="mt-6">
                 <button
                    type="button"
                    onClick={handleQrFormReset}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
                 >
                    Clear QR Details
                 </button>
             </div>
          </div>

          {/* QR Code Display */}
          <div className="lg:w-1/2">
    <div className="bg-white p-6 rounded-lg shadow-inner h-full border border-gray-200 flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium mb-4 text-center">Generated QR Code</h3>

        {/* QR Code Retrieval Controls */}
        <div className="flex gap-2 mb-4 w-full justify-center">
            <button
                onClick={handleFetchStudent}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
                Fetch Student
            </button>
            <button
                onClick={handleRetrieveQRCode}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
            >
                Retrieve QR Code
            </button>
        </div>

        {/* The div holding the QR code */}
        <div ref={qrCodeRef} className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex items-center justify-center p-4 max-w-xs w-full">
            {qrData ? (
                <>
                    <QRCodeCanvas
                        value={qrData}
                        size={256}
                        level="H"
                        includeMargin={false}
                    />
                    {retrievedQRData && (
                        <p className="text-xs text-green-600 mt-2">
                            Retrieved from database
                        </p>
                    )}
                </>
            ) : (
                <p className="text-gray-500 text-center">
                    QR code will appear here after a student is successfully registered or retrieved.
                </p>
            )}
        </div>

        {/* Download, Print, Upload and Share Buttons */}
      {qrData && (
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={downloadQRCode}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Download QR Code
          </button>
          <button
            onClick={handlePrintQRCode}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Print QR Code
          </button>
          <button
            onClick={handleUploadQRImage}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload QR Image'}
          </button>
          <button
            onClick={handleShareQRCode}
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded"
            disabled={!navigator.share || !navigator.canShare}
          >
            Share QR Code
          </button>
        </div>
      )}
    </div>
</div>
        </div>
      </div>
    </div>
  );
};

///////////////+++++++++++++++++++++++++++++++++++ manage attendance ++++++++++++++++++++++++++++////////////////////
const ViewAttendance = () => {
  // Sample student and attendance data
  const [students] = useState([
    {
      id: 1,
      studentId: 'S001',
      firstName: 'John',
      lastName: 'Doe',
      gradeId: '10',
      classId: 'MATH101',
      qrCodeId: 'QR001',
      email: 'john.doe@example.com'
    },
    {
      id: 2,
      studentId: 'S002',
      firstName: 'Jane',
      lastName: 'Smith',
      gradeId: '11',
      classId: 'SCI201',
      qrCodeId: 'QR002',
      email: 'jane.smith@example.com'
    },
  ]);

  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      id: 1,
      studentId: 'S001',
      fullName: 'John Doe',
      gradeId: '10',
      classId: 'MATH101',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      qrCodeId: 'QR001'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [currentSubject, setCurrentSubject] = useState('MATH101');
  const [currentGrade, setCurrentGrade] = useState('10');
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  // Filter records based on search term
  const filteredRecords = attendanceRecords.filter(record =>
    record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = () => {
    console.log('Viewing selected records:', selectedRecords);
  };

  const handleDownload = () => {
    console.log('Downloading attendance data');
  };

  const handleShare = () => {
    console.log('Sharing attendance data');
  };

  const toggleRecordSelection = (recordId) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const startScanner = () => {
    setShowScanner(true);
    setScannedStudent(null);
    
    if (videoRef.current && !qrScannerRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        result => handleScan(result),
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      qrScannerRef.current.start();
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }
    setShowScanner(false);
  };

  const handleScan = (result) => {
    const qrCodeId = result.data;
    const student = students.find(s => s.qrCodeId === qrCodeId);
    
    if (student) {
      setScannedStudent(student);
      stopScanner();
      
      // Mark attendance automatically
      markAttendance(student);
    }
  };

  const markAttendance = (student) => {
    const today = new Date().toISOString().split('T')[0];
    const existingRecordIndex = attendanceRecords.findIndex(
      record => record.studentId === student.studentId && 
               record.date === today && 
               record.classId === currentSubject
    );

    if (existingRecordIndex >= 0) {
      // Update existing record
      const updatedRecords = [...attendanceRecords];
      updatedRecords[existingRecordIndex] = {
        ...updatedRecords[existingRecordIndex],
        status: 'present',
        fullName: `${student.firstName} ${student.lastName}`
      };
      setAttendanceRecords(updatedRecords);
    } else {
      // Add new record
      const newRecord = {
        id: attendanceRecords.length + 1,
        studentId: student.studentId,
        fullName: `${student.firstName} ${student.lastName}`,
        gradeId: student.gradeId,
        classId: currentSubject,
        date: today,
        status: 'present',
        qrCodeId: student.qrCodeId
      };
      setAttendanceRecords([...attendanceRecords, newRecord]);
    }
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Attendance Management</h2>
      </div>

      {/* Mark Attendance Section */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Mark Attendance</h3>
          {!showScanner ? (
            <button
              onClick={startScanner}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Scan QR Code
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Stop Scanner
            </button>
          )}
        </div>

        {/* Subject and Grade Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="MATH101">Mathematics</option>
              <option value="SCI201">Science</option>
              <option value="ENG301">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              value={currentGrade}
              onChange={(e) => setCurrentGrade(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
          </div>
        </div>

        {/* QR Scanner */}
        {showScanner && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 mb-4">
            <video ref={videoRef} className="w-full h-64 object-cover rounded"></video>
            <p className="text-center mt-2 text-sm text-gray-500">Scan student QR code</p>
          </div>
        )}

        {/* Scanned Student Info */}
        {scannedStudent && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Attendance Marked Successfully</h4>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm"><span className="font-medium">Name:</span> {scannedStudent.firstName} {scannedStudent.lastName}</p>
              <p className="text-sm"><span className="font-medium">ID:</span> {scannedStudent.studentId}</p>
              <p className="text-sm"><span className="font-medium">Grade:</span> {scannedStudent.gradeId}</p>
              <p className="text-sm"><span className="font-medium">Subject:</span> {currentSubject}</p>
              <p className="text-sm"><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
              <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-green-600">Present</span></p>
            </div>
          </div>
        )}
      </div>

      {/* View Attendance Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">View Attendance Records</h3>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Student ID or Name..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Select</th>
                <th className="py-2 px-4 border-b text-left">Student ID</th>
                <th className="py-2 px-4 border-b text-left">Full Name</th>
                <th className="py-2 px-4 border-b text-left">Grade ID</th>
                <th className="py-2 px-4 border-b text-left">Class ID</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">QR Code ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr 
                  key={record.id} 
                  className={`hover:bg-gray-50 ${selectedRecords.includes(record.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="py-2 px-4 border-b text-center">
                    <input
                      type="checkbox"
                      checked={selectedRecords.includes(record.id)}
                      onChange={() => toggleRecordSelection(record.id)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </td>
                  <td className="py-2 px-4 border-b">{record.studentId}</td>
                  <td className="py-2 px-4 border-b">{record.fullName}</td>
                  <td className="py-2 px-4 border-b">{record.gradeId}</td>
                  <td className="py-2 px-4 border-b">{record.classId}</td>
                  <td className="py-2 px-4 border-b">{record.date}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'present' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{record.qrCodeId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {selectedRecords.length} record(s) selected
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={handleView}
                disabled={selectedRecords.length === 0}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                View
              </button>
              <button 
                onClick={handleDownload}
                disabled={selectedRecords.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Download
              </button>
              <button 
                onClick={handleShare}
                disabled={selectedRecords.length === 0}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Share
              </button>
            </div>
          </div>

          {selectedRecords.length > 0 && (
            <div className="mt-4 p-3 bg-white rounded border">
              <h4 className="font-medium mb-2">Selected Records:</h4>
              <p className="text-sm">
                {selectedRecords.length} attendance record(s) selected
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


///////++++++++++++++++++++++++++++++++++++++  payment management  ++++++++++++++++++++//////////////////////////
const PaymentManagement = () => {
  // Sample student and payment data
  const [students] = useState([
    {
      id: 1,
      studentId: 'S001',
      firstName: 'John',
      lastName: 'Doe',
      gradeId: '10',
      classId: 'MATH101',
      qrCodeId: 'QR001',
      email: 'john.doe@example.com'
    },
    {
      id: 2,
      studentId: 'S002',
      firstName: 'Jane',
      lastName: 'Smith',
      gradeId: '11',
      classId: 'SCI201',
      qrCodeId: 'QR002',
      email: 'jane.smith@example.com'
    },
  ]);

  const [paymentRecords, setPaymentRecords] = useState([
    {
      id: 1,
      studentId: 'S001',
      fullName: 'John Doe',
      gradeId: '10',
      classId: 'MATH101',
      date: new Date().toISOString().split('T')[0],
      amount: 5000,
      status: 'paid',
      invoiceId: 'INV001'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [currentSubject, setCurrentSubject] = useState('MATH101');
  const [currentGrade, setCurrentGrade] = useState('10');
  const [paymentAmount, setPaymentAmount] = useState(5000);
  const [invoiceData, setInvoiceData] = useState(null);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  // Filter records based on search term
  const filteredRecords = paymentRecords.filter(record =>
    record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = () => {
    console.log('Viewing selected records:', selectedRecords);
  };

  const handleDownload = () => {
    console.log('Downloading payment data');
    // Implement download logic here
  };

  const handleShare = () => {
    console.log('Sharing payment data');
    // Implement share logic here
  };

  const toggleRecordSelection = (recordId) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const startScanner = () => {
    setShowScanner(true);
    setScannedStudent(null);
    setInvoiceData(null);
    
    if (videoRef.current && !qrScannerRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        result => handleScan(result),
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      qrScannerRef.current.start();
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }
    setShowScanner(false);
  };

  const handleScan = (result) => {
    const qrCodeId = result.data;
    const student = students.find(s => s.qrCodeId === qrCodeId);
    
    if (student) {
      setScannedStudent(student);
      stopScanner();
    }
  };

  const generateInvoice = () => {
    if (!scannedStudent) return;
    
    const today = new Date().toISOString().split('T')[0];
    const invoiceId = `INV${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newInvoice = {
      invoiceId,
      studentId: scannedStudent.studentId,
      fullName: `${scannedStudent.firstName} ${scannedStudent.lastName}`,
      gradeId: currentGrade,
      classId: currentSubject,
      date: today,
      amount: paymentAmount,
      status: 'pending'
    };
    
    setInvoiceData(newInvoice);
  };

  const confirmPayment = () => {
    if (!invoiceData) return;
    
    const updatedInvoice = {
      ...invoiceData,
      status: 'paid',
      paymentDate: new Date().toISOString()
    };
    
    // Add to payment records
    setPaymentRecords([...paymentRecords, {
      id: paymentRecords.length + 1,
      ...updatedInvoice
    }]);
    
    setInvoiceData(null);
    setScannedStudent(null);
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment Management</h2>
      </div>

      {/* Process Payment Section */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Process Payment</h3>
          {!showScanner ? (
            <button
              onClick={startScanner}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Scan QR Code
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Stop Scanner
            </button>
          )}
        </div>

        {/* Payment Details Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="MATH101">Mathematics</option>
              <option value="SCI201">Science</option>
              <option value="ENG301">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              value={currentGrade}
              onChange={(e) => setCurrentGrade(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* QR Scanner */}
        {showScanner && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 mb-4">
            <video ref={videoRef} className="w-full h-64 object-cover rounded"></video>
            <p className="text-center mt-2 text-sm text-gray-500">Scan student QR code</p>
          </div>
        )}

        {/* Scanned Student Info */}
        {scannedStudent && !invoiceData && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">Student Found</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <p className="text-sm"><span className="font-medium">Name:</span> {scannedStudent.firstName} {scannedStudent.lastName}</p>
              <p className="text-sm"><span className="font-medium">ID:</span> {scannedStudent.studentId}</p>
              <p className="text-sm"><span className="font-medium">Grade:</span> {scannedStudent.gradeId}</p>
              <p className="text-sm"><span className="font-medium">Email:</span> {scannedStudent.email}</p>
            </div>
            <button
              onClick={generateInvoice}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
            >
              Generate Invoice
            </button>
          </div>
        )}

        {/* Invoice Preview */}
        {invoiceData && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow">
            <h4 className="font-semibold text-gray-800 mb-4 text-center">INVOICE</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm"><span className="font-medium">Invoice ID:</span> {invoiceData.invoiceId}</p>
                <p className="text-sm"><span className="font-medium">Date:</span> {invoiceData.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm"><span className="font-medium">Status:</span> 
                  <span className="ml-2 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    {invoiceData.status}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="border-t border-b border-gray-200 py-4 mb-4">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <p className="font-medium">Student Details:</p>
                  <p>{invoiceData.fullName}</p>
                  <p>ID: {invoiceData.studentId}</p>
                  <p>Grade: {invoiceData.gradeId}</p>
                  <p>Class: {invoiceData.classId}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Payment Details:</p>
                  <p>Amount: ₹{invoiceData.amount}</p>
                  <p>Due Date: {invoiceData.date}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setInvoiceData(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Payment Records Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">View Payment Records</h3>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Student ID or Name..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Payment Records Table */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Select</th>
                <th className="py-2 px-4 border-b text-left">Invoice ID</th>
                <th className="py-2 px-4 border-b text-left">Student ID</th>
                <th className="py-2 px-4 border-b text-left">Full Name</th>
                <th className="py-2 px-4 border-b text-left">Grade</th>
                <th className="py-2 px-4 border-b text-left">Class</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Amount</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr 
                  key={record.id} 
                  className={`hover:bg-gray-50 ${selectedRecords.includes(record.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="py-2 px-4 border-b text-center">
                    <input
                      type="checkbox"
                      checked={selectedRecords.includes(record.id)}
                      onChange={() => toggleRecordSelection(record.id)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </td>
                  <td className="py-2 px-4 border-b">{record.invoiceId}</td>
                  <td className="py-2 px-4 border-b">{record.studentId}</td>
                  <td className="py-2 px-4 border-b">{record.fullName}</td>
                  <td className="py-2 px-4 border-b">{record.gradeId}</td>
                  <td className="py-2 px-4 border-b">{record.classId}</td>
                  <td className="py-2 px-4 border-b">{record.date}</td>
                  <td className="py-2 px-4 border-b">₹{record.amount}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {selectedRecords.length} record(s) selected
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={handleView}
                disabled={selectedRecords.length === 0}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                View
              </button>
              <button 
                onClick={handleDownload}
                disabled={selectedRecords.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Download
              </button>
              <button 
                onClick={handleShare}
                disabled={selectedRecords.length === 0}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Share
              </button>
            </div>
          </div>

          {selectedRecords.length > 0 && (
            <div className="mt-4 p-3 bg-white rounded border">
              <h4 className="font-medium mb-2">Selected Records:</h4>
              <p className="text-sm">
                {selectedRecords.length} payment record(s) selected
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const StaffDashboard = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleCardClick = (title) => {
    setSelectedCard(title);
    setActiveCard(title);
    if (title === 'Logout') {
      // Redirect to the home page when Logout is clicked
      navigate('/'); // Assuming '/' is your home page route
    }
  };

  const renderContent = () => {
    switch(selectedCard) {
      case 'Register Students':
        return <StudentRegistrationForm />;
      case 'Manage Attendance':
        return <ViewAttendance/>;
      case 'Manage Payment':
        return <PaymentManagement/>;
      case 'Logout':
        return null; // Return null to remove the right side panel content
      default:
        return <div className="text-gray-500 text-center mt-20">Select a menu item to begin</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-sky-400 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-1/4 bg-indigo-100 min-h-screen p-4 border-r border-gray-200">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Welcome Staff!</h2>
            <p className="text-gray-600 text-sm">Manage your daily tasks</p>
          </div>

          {/* Navigation Cards */}
          <div className="space-y-4">
            <DashboardCard
              title="Register Students"
              icon={<HiOutlineUserAdd className="w-8 h-8"/>}
              color="green"
              isActive={activeCard === 'Register Students'}
              onClick={() => handleCardClick('Register Students')}
            />
            <DashboardCard
              title="Manage Attendance"
              icon={<FaRegCalendarAlt className="w-8 h-8"/>}
              color="purple"
              isActive={activeCard === 'Manage Attendance'}
              onClick={() => handleCardClick('Manage Attendance')}
            />
            <DashboardCard
              title="Manage Payment"
              icon={<RiMoneyDollarCircleLine className="w-8 h-8"/>}
              color="blue"
              isActive={activeCard === 'Manage Payment'}
              onClick={() => handleCardClick('Manage Payment')}
            />
            <DashboardCard
              title="Logout"
              icon={<IoLogOutOutline className="w-8 h-8"/>}
              color="gray"
              isActive={activeCard === 'Logout'}
              onClick={() => handleCardClick('Logout')}
            />
          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-3/4 p-8 min-h-screen bg-white">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Dashboard Card Component
const DashboardCard = ({ title, icon, color, isActive, onClick }) => {
  const colorVariants = {
    green: {
      border: 'border-green-500',
      text: 'text-green-500',
      bg: 'bg-green-100'
    },
    blue: {
      border: 'border-blue-500',
      text: 'text-blue-500',
      bg: 'bg-blue-100'
    },
    purple: {
      border: 'border-purple-500',
      text: 'text-purple-500',
      bg: 'bg-purple-100'
    },
    gray: {
      border: 'border-pink-500',
      text: 'text-pink-500',
      bg: 'bg-pink-100'
    }
  };

  return (
    <div
      className={`flex items-center p-4 rounded-lg cursor-pointer transition-all
        ${isActive ? `${colorVariants[color].bg} border-l-4 ${colorVariants[color].border}` : 'hover:bg-gray-50'}`}
      onClick={onClick}
    >
      <div className={`w-8 h-8 mr-3 ${isActive ? colorVariants[color].text : 'text-gray-600'}`}>
        {icon}
      </div>
      <span className={`font-medium ${isActive ? 'text-gray-800' : 'text-gray-700'}`}>
        {title}
      </span>
    </div>
  );
};
export default StaffDashboard;