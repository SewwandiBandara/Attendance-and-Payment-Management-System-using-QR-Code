import React, { useState, useEffect , useRef} from 'react';
import { HiOutlineUserAdd } from "react-icons/hi";
import { BsFiles } from "react-icons/bs";
import { FaRegCalendarAlt } from "react-icons/fa";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineAccountBalance } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { getGrades, addGrade, updateGrade, deleteGrade } from '../services/api';
import { getSubjects, addSubject, updateSubject, deleteSubject } from '../services/api';
import { getClasses, addClass, updateClass, deleteClass } from '../services/api';
import {  getCourses, addCourse, updateCourse, deleteCourse } from '../services/api';
import { registerStudent,getNextStudentIdForGrade} from '../services/api';
import {getStudentById ,getStudentQRImage, uploadStudentQRImage} from '../services/api';
import {QRCodeCanvas} from 'qrcode.react';
//import html2canvas from 'html2canvas';
import { getStudents, deleteStudent , updateStudent} from '../services/api';
///report
import { FiCalendar, FiDollarSign, FiDownload } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


////////////+++++++++++++++++++++++++++++++++++++++++++ Register students +++++++++++++++++++++++++++++++++++++++++//////////////
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


///////////////++++++++++++++++++++++++++++++++++++++ Manage students data +++++++++++++++++++++++++++++++++++++++///////////////
const ManageStudentsData = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrImages, setQrImages] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      grade_id: '',
      mobile: '',
      email: ''
  });
  const qrCodeRef = useRef(null);

  // Fetch students from API
  useEffect(() => {
      const fetchStudents = async () => {
          try {
              setLoading(true);
              const data = await getStudents();
              setStudents(data);
              setError(null);
              
              // Pre-fetch QR codes for all students
              const qrPromises = data.map(async student => {
                  try {
                      const response = await getStudentQRImage(student.student_id);
                      return { id: student.student_id, qrImage: response.qrImage };
                  } catch (err) {
                      console.error(`Error fetching QR for ${student.student_id}:`, err);
                      return { id: student.student_id, qrImage: null };
                  }
              });
              
              const qrResults = await Promise.all(qrPromises);
              const qrImageMap = qrResults.reduce((acc, curr) => {
                  acc[curr.id] = curr.qrImage;
                  return acc;
              }, {});
              
              setQrImages(qrImageMap);
          } catch (err) {
              console.error("Failed to fetch students:", err);
              setError("Failed to load student data. Please try again later.");
          } finally {
              setLoading(false);
          }
      };
      fetchStudents();
  }, []);

  const handleView = () => {
      if (selectedStudent) {
          console.log('View student:', selectedStudent);
          // Implement view logic here or navigate to view page
      }
  };

  const handleUpdate = async () => {
      if (!selectedStudent) return;

      try {
          // If not already in edit mode, switch to edit mode
          if (!isEditing) {
              setIsEditing(true);
              setFormData({
                  first_name: selectedStudent.first_name,
                  last_name: selectedStudent.last_name,
                  grade_id: selectedStudent.grade_id,
                  mobile: selectedStudent.mobile,
                  email: selectedStudent.email
              });
              return;
          }

          // If in edit mode, submit the changes
          await updateStudent(selectedStudent.student_id, formData);
          
          // Refresh the student list
          const updatedStudents = await getStudents();
          setStudents(updatedStudents);
          
          // Find and set the updated student as selected
          const updatedStudent = updatedStudents.find(
              s => s.student_id === selectedStudent.student_id
          );
          setSelectedStudent(updatedStudent);
          
          setIsEditing(false);
          alert('Student updated successfully');
      } catch (error) {
          console.error('Error updating student:', error);
          alert(`Failed to update student: ${error.message || 'Please try again.'}`);
      }
  };

  const handleDelete = async () => {
      if (!selectedStudent) return;

      // Confirm before deleting
      if (!window.confirm(`Are you sure you want to delete ${selectedStudent.first_name} ${selectedStudent.last_name}?`)) {
          return;
      }

      try {
          await deleteStudent(selectedStudent.student_id);
          setStudents(students.filter(student => student.student_id !== selectedStudent.student_id));
          
          // Remove QR image from state
          setQrImages(prev => {
              const newQrImages = {...prev};
              delete newQrImages[selectedStudent.student_id];
              return newQrImages;
          });
          
          setSelectedStudent(null);
          alert('Student deleted successfully');
      } catch (error) {
          console.error('Error deleting student:', error);
          alert(`Failed to delete student: ${error.message || 'Please try again.'}`);
      }
  };

  const handleCancel = () => {
      setSelectedStudent(null);
      setIsEditing(false);
  };

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: value
      }));
  };

  const downloadQRCode = (studentId) => {
      const qrImage = qrImages[studentId];
      if (!qrImage) {
          alert("QR code not available for this student");
          return;
      }

      const link = document.createElement('a');
      link.download = `student_${studentId}_qrcode.png`;
      link.href = qrImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (loading) {
      return (
          <div className="container mx-auto p-4 flex items-center justify-center">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-700">Loading student data...</p>
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

  return (
      <div className="bg-blue-50 p-6 rounded-lg shadow-md">
          <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Manage Students Data</h2>
          </div>

          {students.length === 0 ? (
              <div className="text-center py-8">
                  <p className="text-gray-600">No students found.</p>
              </div>
          ) : (
              <>
                  <div className="overflow-x-auto mb-6">
                      <table className="min-w-full bg-white border border-black">
                          <thead className="bg-green-100">
                              <tr>
                                  <th className="py-2 px-6 border-b min-w-[120px]">Student ID</th>
                                  <th className="py-2 px-6 border-b min-w-[150px]">First Name</th>
                                  <th className="py-2 px-6 border-b min-w-[150px]">Last Name</th>
                                  <th className="py-2 px-6 border-b min-w-[100px]">Grade</th>
                                  <th className="py-2 px-6 border-b min-w-[150px]">Mobile No</th>
                                  <th className="py-2 px-6 border-b min-w-[200px]">Email</th>
                                  <th className="py-2 px-6 border-b min-w-[120px]">QR Code</th>
                                  <th className="py-2 px-6 border-b min-w-[120px]">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {students.map((student) => (
                                  <tr 
                                      key={student.student_id} 
                                      className={`hover:bg-yellow-50 ${selectedStudent?.student_id === student.student_id ? 'bg-blue-200' : ''}`}
                                  >
                                      <td className="py-2 px-6 border-b text-center">{student.student_id}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.first_name}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.last_name}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.grade_id}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.mobile}</td>
                                      <td className="py-2 px-6 border-b text-center">{student.email}</td>
                                      <td className="py-2 px-6 border-b text-center">
                                          {qrImages[student.student_id] ? (
                                              <img 
                                                  src={qrImages[student.student_id]} 
                                                  alt="QR Code" 
                                                  className="w-12 h-12 mx-auto cursor-pointer"
                                                  onClick={() => downloadQRCode(student.student_id)}
                                              />
                                          ) : (
                                              <div className="w-10 h-10 mx-auto flex items-center justify-center">
                                                  <QRCodeCanvas
                                                      value={`${student.student_id}|${student.mobile}|${student.password}`}
                                                      size={80}
                                                      level="H"
                                                      includeMargin={false}
                                                      className="w-full h-full"
                                                  />
                                              </div>
                                          )}
                                      </td>
                                      <td className="py-2 px-6 border-b text-center">
                                          <button
                                              onClick={() => setSelectedStudent(student)}
                                              className="text-blue-500 hover:text-blue-700"
                                          >
                                              Select
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-center">
                          <select
                              className="flex-1 p-2 border rounded"
                              value={selectedStudent?.student_id || ''}
                              onChange={(e) => {
                                  const student = students.find(s => s.student_id === e.target.value);
                                  setSelectedStudent(student || null);
                              }}
                          >
                              <option value="">Select a student...</option>
                              {students.map((student) => (
                                  <option key={student.student_id} value={student.student_id}>
                                      {student.student_id} - {student.first_name} {student.last_name}
                                  </option>
                              ))}
                          </select>

                          <div className="flex space-x-2">
                              <button 
                                  onClick={handleView}
                                  disabled={!selectedStudent}
                                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                  View
                              </button>
                              <button 
                                  onClick={handleUpdate}
                                  disabled={!selectedStudent}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                  {isEditing ? 'Save Changes' : 'Update'}
                              </button>
                              <button 
                                  onClick={handleDelete}
                                  disabled={!selectedStudent}
                                  className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                  Delete
                              </button>
                              <button 
                                  onClick={handleCancel}
                                  disabled={!selectedStudent}
                                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                  Cancel
                              </button>
                          </div>
                      </div>

                      {selectedStudent && (
                          <div className="mt-4 p-3 bg-white rounded border">
                              {isEditing ? (
                                  <div className="space-y-4">
                                      <h4 className="font-medium text-lg">Edit Student Details</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm font-medium text-gray-700">First Name</label>
                                              <input
                                                  type="text"
                                                  name="first_name"
                                                  value={formData.first_name}
                                                  onChange={handleInputChange}
                                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                              <input
                                                  type="text"
                                                  name="last_name"
                                                  value={formData.last_name}
                                                  onChange={handleInputChange}
                                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-gray-700">Grade</label>
                                              <input
                                                  type="text"
                                                  name="grade_id"
                                                  value={formData.grade_id}
                                                  onChange={handleInputChange}
                                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-gray-700">Mobile</label>
                                              <input
                                                  type="text"
                                                  name="mobile"
                                                  value={formData.mobile}
                                                  onChange={handleInputChange}
                                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                              />
                                          </div>
                                          <div className="md:col-span-2">
                                              <label className="block text-sm font-medium text-gray-700">Email</label>
                                              <input
                                                  type="email"
                                                  name="email"
                                                  value={formData.email}
                                                  onChange={handleInputChange}
                                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                              />
                                          </div>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex flex-col md:flex-row gap-4">
                                      <div className="flex-1">
                                          <h4 className="font-medium mb-2">Student Details:</h4>
                                          <p className="text-sm"><span className="font-medium">Name:</span> {selectedStudent.first_name} {selectedStudent.last_name}</p>
                                          <p className="text-sm"><span className="font-medium">ID:</span> {selectedStudent.student_id}</p>
                                          <p className="text-sm"><span className="font-medium">Grade:</span> {selectedStudent.grade_id}</p>
                                          <p className="text-sm"><span className="font-medium">Mobile:</span> {selectedStudent.mobile}</p>
                                          <p className="text-sm"><span className="font-medium">Email:</span> {selectedStudent.email}</p>
                                      </div>
                                      <div className="flex flex-col items-center">
                                          <h4 className="font-medium mb-2">QR Code:</h4>
                                          {qrImages[selectedStudent.student_id] ? (
                                              <img 
                                                  src={qrImages[selectedStudent.student_id]} 
                                                  alt="QR Code" 
                                                  className="w-32 h-32 border border-gray-300"
                                              />
                                          ) : (
                                              <div className="w-32 h-32 border border-gray-300 flex items-center justify-center">
                                                  <QRCodeCanvas
                                                      value={`${selectedStudent.student_id}|${selectedStudent.mobile}|${selectedStudent.password}`}
                                                      size={128}
                                                      level="H"
                                                      includeMargin={false}
                                                  />
                                              </div>
                                          )}
                                          <button
                                              onClick={() => downloadQRCode(selectedStudent.student_id)}
                                              className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                          >
                                              Download QR
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </>
          )}
      </div>
  );
};

////////////////++++++++++++++++++++++++++++++++++++ View attendance ++++++++++++++++++++++++++++++++++++++++++///////////////////
const ViewAttendance = () => {
  // Sample attendance data
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      id: 1,
      studentId: 'S001',
      firstName: 'Madusha',
      lastName: 'Sewwandi',
      gradeId: '10',
      classId: 'MATH101',
      date: '2023-05-15',
      status: 'present',
      qrCodeId: 'QR001'
    },
    {
      id: 2,
      studentId: 'S002',
      firstName: 'Imasha',
      lastName: 'Dilshani',
      gradeId: '11',
      classId: 'SCI201',
      date: '2023-05-15',
      status: 'absent',
      qrCodeId: 'QR002'
    },
    {
      id: 3,
      studentId: 'S003',
      firstName: 'Ridma',
      lastName: 'Ajani',
      gradeId: '10',
      classId: 'MATH101',
      date: '2023-05-15',
      status: 'present',
      qrCodeId: 'QR003'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState([]);

  // Filter records based on search term
  const filteredRecords = attendanceRecords.filter(record =>
    record.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = () => {
    console.log('Viewing selected records:', selectedRecords);
    // Implement view logic here
  };

  const handleDownload = () => {
    console.log('Downloading attendance data');
    // Implement download logic here
  };

  const handleShare = () => {
    console.log('Sharing attendance data');
    // Implement share logic here
  };

  const toggleRecordSelection = (recordId) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">View Attendance</h2>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Student ID..."
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
              <th className="py-2 px-4 border-b text-left">Last Name</th>
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
                className={`hover:bg-gray-50 ${selectedRecords.includes(record.id) ? 'bg-blue-50' : ''}`}>
                <td className="py-2 px-4 border-b text-center">
                  <input
                    type="checkbox"
                    checked={selectedRecords.includes(record.id)}
                    onChange={() => toggleRecordSelection(record.id)}
                    className="h-4 w-4 text-blue-600 rounded" />
                </td>
                <td className="py-2 px-4 border-b">{record.studentId}</td>
                <td className="py-2 px-4 border-b">{record.firstName}</td>
                <td className="py-2 px-4 border-b">{record.lastName}</td>
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
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed" >
              View
            </button>
            <button 
              onClick={handleDownload}
              disabled={selectedRecords.length === 0}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"  >
              Download
            </button>
            <button 
              onClick={handleShare}
              disabled={selectedRecords.length === 0}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed" >
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
  );
};


///////////////+++++++++++++++++++++++++++++++++++++ View payment +++++++++++++++++++++++++++++++++++++++++++///////////////////////
const PaymentManagement = () => {
  // Sample payment data
  const [paymentRecords, setPaymentRecords] = useState([
    {
      id: 1,
      studentId: 'S001',
      fullName: 'Madusha Sewwandi',
      gradeId: '10',
      classId: 'MATH101',
      date: new Date().toISOString().split('T')[0],
      amount: 2000,
      status: 'paid',
      invoiceId: 'INV001'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState([]);

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

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment Management</h2>
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
              onChange={(e) => setSearchTerm(e.target.value)} />
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
                  className={`hover:bg-gray-50 ${selectedRecords.includes(record.id) ? 'bg-blue-50' : ''}`} >
                  <td className="py-2 px-4 border-b text-center">
                    <input
                      type="checkbox"
                      checked={selectedRecords.includes(record.id)}
                      onChange={() => toggleRecordSelection(record.id)}
                      className="h-4 w-4 text-blue-600 rounded"  />
                  </td>
                  <td className="py-2 px-4 border-b">{record.invoiceId}</td>
                  <td className="py-2 px-4 border-b">{record.studentId}</td>
                  <td className="py-2 px-4 border-b">{record.fullName}</td>
                  <td className="py-2 px-4 border-b">{record.gradeId}</td>
                  <td className="py-2 px-4 border-b">{record.classId}</td>
                  <td className="py-2 px-4 border-b">{record.date}</td>
                  <td className="py-2 px-4 border-b">RS:{record.amount}</td>
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
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed">
                View
              </button>
              <button
                onClick={handleDownload}
                disabled={selectedRecords.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"  >
                Download
              </button>
              <button
                onClick={handleShare}
                disabled={selectedRecords.length === 0}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"  >
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


//////////////////////+++++++++++++++++++++++++++++ View reports +++++++++++++++++++++++++++++++++++++++++//////////////////////////
const ReportsView = () => {
  const [reportType, setReportType] = useState('attendance');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Sample data - replace with your actual data
  const attendanceData = [
    { name: 'Week 1', present: 85, absent: 15 },
    { name: 'Week 2', present: 78, absent: 22 },
    { name: 'Week 3', present: 92, absent: 8 },
    { name: 'Week 4', present: 88, absent: 12 },
  ];

  const paymentData = [
    { name: 'Week 1', paid: 65, pending: 35 },
    { name: 'Week 2', paid: 72, pending: 28 },
    { name: 'Week 3', paid: 85, pending: 15 },
    { name: 'Week 4', paid: 78, pending: 22 },
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleDownloadReport = () => {
    // Implement your download logic here
    alert(`Downloading ${reportType} report for ${months[selectedMonth - 1]} ${selectedYear}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Monthly Reports</h2>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Report Type Selector */}
        <div className="flex space-x-4 mb-6">
          <button
            className={`flex items-center px-4 py-2 rounded-lg ${reportType === 'attendance' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setReportType('attendance')}
          >
            <FiCalendar className="mr-2" />
            Attendance Report
          </button>
          <button
            className={`flex items-center px-4 py-2 rounded-lg ${reportType === 'payment' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setReportType('payment')}
          >
            <FiDollarSign className="mr-2" />
            Payment Report
          </button>
        </div>

        {/* Month and Year Selector */}
        <div className="flex space-x-4 mb-6">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={handleDownloadReport}
          >
            <FiDownload className="mr-2" />
            Download Report
          </button>
        </div>

        {/* Report Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            {reportType === 'attendance' ? 'Attendance' : 'Payment'} Summary for {months[selectedMonth - 1]} {selectedYear}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-gray-500 text-sm">Total {reportType === 'attendance' ? 'Students' : 'Payments'}</p>
              <p className="text-xl font-bold">
                {reportType === 'attendance' ? '120' : '85'}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-gray-500 text-sm">
                {reportType === 'attendance' ? 'Average Attendance' : 'Payment Completion'}
              </p>
              <p className="text-xl font-bold">
                {reportType === 'attendance' ? '85%' : '76%'}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-gray-500 text-sm">
                {reportType === 'attendance' ? 'Best Performing Class' : 'Highest Payment Rate'}
              </p>
              <p className="text-xl font-bold">
                {reportType === 'attendance' ? 'Grade 5A' : 'Grade 3B'}
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={reportType === 'attendance' ? attendanceData : paymentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {reportType === 'attendance' ? (
                <>
                  <Bar dataKey="present" fill="#4f46e5" name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </>
              ) : (
                <>
                  <Bar dataKey="paid" fill="#10b981" name="Paid" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Table (optional) */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Detailed Records</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {reportType === 'attendance' ? 'Student' : 'Payment ID'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {reportType === 'attendance' ? 'Days Present' : 'Amount'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reportType === 'attendance' ? `Student ${i + 1}` : `PAY-${selectedMonth}${selectedYear}-00${i + 1}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Grade {i % 3 + 3}{String.fromCharCode(65 + i % 3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reportType === 'attendance' ? `${20 - i} days` : `$${(i + 1) * 150}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${reportType === 'attendance' ? 
                          (i % 3 === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800') : 
                          (i % 2 === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}`}>
                        {reportType === 'attendance' ? 
                          (i % 3 === 0 ? 'Excellent' : 'Good') : 
                          (i % 2 === 0 ? 'Paid' : 'Pending')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};



////////////////////++++++++++++++++++++++++++++++++ Manage classes, grades, and courses ++++++++++++++++++++++++////////////////////
const ManageClassesAndCourses = () => {
  const [gradesData, setGradesData] = useState([]);
  const [newGradeName, setNewGradeName] = useState('');
  const [editingGrade, setEditingGrade] = useState(null);

  const [subjectsData, setSubjectsData] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectFee, setNewSubjectFee] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);

  const [gradeSubjects, setGradeSubjects] = useState([]);
  const [newGradeSubjectGradeId, setNewGradeSubjectGradeId] = useState('');
  const [newGradeSubjectSubjectId, setNewGradeSubjectSubjectId] = useState('');
  const [newGradeSubjectTime, setNewGradeSubjectTime] = useState('');
  const [newGradeSubjectDay, setNewGradeSubjectDay] = useState('Monday');
  const [newGradeSubjectLecturer, setNewGradeSubjectLecturer] = useState('');
  const [newGradeSubjectMode, setNewGradeSubjectMode] = useState('Physical');
  const [newGradeSubjectFee, setNewGradeSubjectFee] = useState('');
  const [editingGradeSubject, setEditingGradeSubject] = useState(null);

  const [coursesData, setCoursesData] = useState([]);
  const [newCourseId, setNewCourseId] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseTime, setNewCourseTime] = useState('');
  const [newCourseDay, setNewCourseDay] = useState('Monday');
  const [newCourseLecturer, setNewCourseLecturer] = useState('');
  const [newCourseFee, setNewCourseFee] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);


  //state for medium
  const [newGradeSubjectMedium, setNewGradeSubjectMedium] = useState('Sinhala');
  const [newGradeSubjectPeriod, setNewGradeSubjectPeriod] = useState('');
  
  // Add medium options
  const classMediums = ['Sinhala', 'English'];

  const [availableFees, setAvailableFees] = useState([]);


  // Helper functions for generating unique IDs on the frontend
  const generateUniqueId = () => Math.random().toString(36).substring(2, 15);

  //---------------- --- Grade Handlers -------------------------//

  // Load grades from backend on component mount
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const grades = await getGrades();
        setGradesData(grades);
      } catch (error) {
        console.error("Failed to load grades:", error);
        alert("Failed to load grades. Please try again.");
      }
    };
    
    fetchGrades();
  }, []);

  // ---  Grade Handlers ---
  const generateGradeId = (gradeName) => {
    const parts = gradeName.split(' ');
    if (parts.length === 2 && parts[0] === 'Grade' && !isNaN(parseInt(parts[1]))) {
      const gradeNumber = parseInt(parts[1]);
      return `GR${gradeNumber.toString().padStart(2, '0')}`;
    }
    return `GR${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
  };

  const handleAddGrade = async () => {
    if (!newGradeName) {
      alert('Please enter Grade Name.');
      return;
    }

    try {
      const newId = generateGradeId(newGradeName);
      await addGrade({ grade_id: newId, name: newGradeName });
      
      // Refresh the grades list
      const grades = await getGrades();
      setGradesData(grades);
      setNewGradeName('');
    } catch (error) {
      console.error("Failed to add grade:", error);
      alert("Failed to add grade. Please try again.");
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Are you sure you want to delete this grade?')) return;
    
    try {
      await deleteGrade(gradeId);
      
      // Refresh the grades list
      const grades = await getGrades();
      setGradesData(grades);
      
      if (editingGrade?.grade_id === gradeId) {
        setEditingGrade(null);
        setNewGradeName('');
      }
    } catch (error) {
      console.error("Failed to delete grade:", error);
      alert("Failed to delete grade. Please try again.");
    }
  };

  const handleEditGrade = (grade) => {
    setEditingGrade(grade);
    setNewGradeName(grade.name);
  };

  const handleUpdateGrade = async () => {
    if (!editingGrade) return;
    if (!newGradeName) {
      alert('Please enter Grade Name.');
      return;
    }

    try {
      await updateGrade(editingGrade.grade_id, { name: newGradeName });
      
      // Refresh the grades list
      const grades = await getGrades();
      setGradesData(grades);
      
      setEditingGrade(null);
      setNewGradeName('');
    } catch (error) {
      console.error("Failed to update grade:", error);
      alert("Failed to update grade. Please try again.");
    }
  };


  // -------------------Subject Handlers -----------------------//


// Add this state for lecturer in subjects section
const [newSubjectLecturer, setNewSubjectLecturer] = useState('');

// Add this function to fetch lecturers
// const fetchLecturers = async () => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}/lecturers`);
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching lecturers:", error);
//         return [];
//     }
// };

// Add this state for lecturers list
// const [lecturers, setLecturers] = useState([]);

// Fetch lecturers on component mount
useEffect(() => {
    const loadLecturers = async () => {
        const lecturerList = await fetchLecturers();
        setLecturers(lecturerList);
    };
    loadLecturers();
}, []);


  // Load subjects from backend on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
        try {
            const subjects = await getSubjects();
            setSubjectsData(subjects);
        } catch (error) {
            console.error("Failed to load subjects:", error);
            alert("Failed to load subjects. Please try again.");
        }
    };
    
    fetchSubjects();
}, []);

// --- Modified Subject Handlers ---
const generateSubjectId = (subjectName, existingSubjects) => {
    if (!subjectName) return '';
    
    // Get the first 3 letters of the subject name in lowercase
    const prefix = subjectName.substring(0, 3).toLowerCase();
    
    // Find all existing IDs with the same prefix
    const samePrefixSubjects = existingSubjects.filter(sub => 
        sub.subject_id.toLowerCase().startsWith(prefix)
    );
    
    // Determine the next available number
    let nextNumber = 1;
    if (samePrefixSubjects.length > 0) {
        // Extract numbers from existing IDs and find the highest
        const numbers = samePrefixSubjects.map(sub => {
            const numPart = sub.subject_id.substring(prefix.length);
            return parseInt(numPart) || 0;
        });
        const maxNumber = Math.max(...numbers);
        nextNumber = maxNumber + 1;
    }
    
    // Format the number with leading zero
    const numberPart = nextNumber.toString().padStart(2, '0');
    
    return `${prefix}${numberPart}`;
};

const handleAddSubject = async () => {
  if (!newSubjectName || !newSubjectFee || !newSubjectLecturer) {
      alert('Please enter Subject Name, Fee, and Lecturer.');
      return;
  }

  try {
      const newId = generateSubjectId(newSubjectName, subjectsData);
      await addSubject({ 
          subject_id: newId, 
          name: newSubjectName, 
          fee: parseFloat(newSubjectFee),
          lecturer: newSubjectLecturer
      });
      
      // Refresh the subjects list
      const subjects = await getSubjects();
      setSubjectsData(subjects);
      setNewSubjectName('');
      setNewSubjectFee('');
      setNewSubjectLecturer('');
  } catch (error) {
      console.error("Failed to add subject:", error);
      alert("Failed to add subject. Please try again.");
  }
};



const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    
    try {
        await deleteSubject(subjectId);
        
        // Refresh the subjects list
        const subjects = await getSubjects();
        setSubjectsData(subjects);
        
        if (editingSubject?.subject_id === subjectId) {
            setEditingSubject(null);
            setNewSubjectName('');
            setNewSubjectFee('');
        }
    } catch (error) {
        console.error("Failed to delete subject:", error);
        alert("Failed to delete subject. Please try again.");
    }
};

const handleEditSubject = (subject) => {
  setEditingSubject(subject);
  setNewSubjectName(subject.name);
  setNewSubjectFee(subject.fee.toString());
  setNewSubjectLecturer(subject.lecturer || '');
};


const handleUpdateSubject = async () => {
  if (!editingSubject) return;
  if (!newSubjectName || !newSubjectFee || !newSubjectLecturer) {
      alert('Please enter Subject Name, Fee, and Lecturer.');
      return;
  }

  try {
      await updateSubject(editingSubject.subject_id, { 
          name: newSubjectName, 
          fee: parseFloat(newSubjectFee),
          lecturer: newSubjectLecturer
      });
      
      // Refresh the subjects list
      const subjects = await getSubjects();
      setSubjectsData(subjects);
      
      setEditingSubject(null);
      setNewSubjectName('');
      setNewSubjectFee('');
      setNewSubjectLecturer('');
  } catch (error) {
      console.error("Failed to update subject:", error);
      alert("Failed to update subject. Please try again.");
  }
};



// Add this useEffect to automatically set lecturer when subject is selected
useEffect(() => {
  if (newGradeSubjectSubjectId) {
      const selectedSubject = subjectsData.find(sub => sub.subject_id === newGradeSubjectSubjectId);
      if (selectedSubject) {
          setNewGradeSubjectFee(selectedSubject.fee.toString());
          setNewGradeSubjectLecturer(selectedSubject.lecturer || '');
      }
  }
}, [newGradeSubjectSubjectId, subjectsData]);







  // ----------------- Class (Grade Subject) Handlers -------------------//
  // Load classes from backend on component mount
  useEffect(() => {
    const fetchClasses = async () => {
        try {
            const classes = await getClasses();
            setGradeSubjects(classes);
        } catch (error) {
            console.error("Failed to load classes:", error);
            alert("Failed to load classes. Please try again.");
        }
    };
    
    fetchClasses();
}, []);


// update available fees when subject changes
useEffect(() => {
  if (newGradeSubjectSubjectId) {
    const selectedSubject = subjectsData.find(sub => sub.subject_id === newGradeSubjectSubjectId);
    if (selectedSubject) {
      setNewGradeSubjectFee(selectedSubject.fee.toString());
    }
  }
}, [newGradeSubjectSubjectId, subjectsData]);

// --- Modified Class (Grade Subject) Handlers ---
const handleAddGradeSubject = async () => {
    if (!newGradeSubjectGradeId || !newGradeSubjectSubjectId || !newGradeSubjectTime ||
        !newGradeSubjectDay || !newGradeSubjectLecturer || !newGradeSubjectMode || 
        !newGradeSubjectFee || !newGradeSubjectPeriod) {
        alert('Please fill in all grade subject details.');
        return;
    }

    try {
        await addClass({
            grade_id: newGradeSubjectGradeId,
            subject_id: newGradeSubjectSubjectId,
            time: newGradeSubjectTime,
            day: newGradeSubjectDay,
            lecturer: newGradeSubjectLecturer,
            mode: newGradeSubjectMode,
            medium: newGradeSubjectMedium,
            period: newGradeSubjectPeriod,
            fee: parseFloat(newGradeSubjectFee)
        });
        
        // [Rest of the function remains the same...]
    } catch (error) {
        console.error("Failed to add class:", error);
        alert("Failed to add class. Please try again.");
    }
  };

const handleDeleteGradeSubject = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    
    try {
        await deleteClass(classId);
        
        // Refresh the classes list
        const classes = await getClasses();
        setGradeSubjects(classes);
        
        if (editingGradeSubject?.class_id === classId) {
            setEditingGradeSubject(null);
            setNewGradeSubjectGradeId('');
            setNewGradeSubjectSubjectId('');
            setNewGradeSubjectTime('');
            setNewGradeSubjectDay('Monday');
            setNewGradeSubjectLecturer('');
            setNewGradeSubjectMode('Physical');
            setNewGradeSubjectFee('');
        }
    } catch (error) {
        console.error("Failed to delete class:", error);
        alert("Failed to delete class. Please try again.");
    }
};

const handleEditGradeSubject = (gs) => {
  setEditingGradeSubject(gs);
  setNewGradeSubjectGradeId(gs.grade_id);
  setNewGradeSubjectSubjectId(gs.subject_id);
  setNewGradeSubjectTime(gs.time);
  setNewGradeSubjectDay(gs.day);
  setNewGradeSubjectLecturer(gs.lecturer);
  setNewGradeSubjectMode(gs.mode);
  setNewGradeSubjectMedium(gs.medium || 'Sinhala');
  setNewGradeSubjectPeriod(gs.period || '');
  setNewGradeSubjectFee(gs.fee.toString());
  
  // Set fee options based on the selected subject
  const selectedSubject = subjectsData.find(sub => sub.subject_id === gs.subject_id);
  if (selectedSubject) {
    setAvailableFees([selectedSubject.fee]);
  }
};

// Update the handleUpdateGradeSubject function
const handleUpdateGradeSubject = async () => {
  if (!editingGradeSubject) return;
  if (!newGradeSubjectGradeId || !newGradeSubjectSubjectId || !newGradeSubjectTime ||
      !newGradeSubjectDay || !newGradeSubjectLecturer || !newGradeSubjectMode || 
      !newGradeSubjectFee || !newGradeSubjectPeriod) {
      alert('Please fill in all grade subject details.');
      return;
  }

  try {
      await updateClass(editingGradeSubject.class_id, {
          grade_id: newGradeSubjectGradeId,
          subject_id: newGradeSubjectSubjectId,
          time: newGradeSubjectTime,
          day: newGradeSubjectDay,
          lecturer: newGradeSubjectLecturer,
          mode: newGradeSubjectMode,
          medium: newGradeSubjectMedium,
          period: newGradeSubjectPeriod,
          fee: parseFloat(newGradeSubjectFee)
      });
    } catch (error) {
      console.error("Failed to update class:", error);
      alert("Failed to update class. Please try again.");
    }
};


  // ---------------------- Course Handlers -----------------//
 // Load courses from backend on component mount
 useEffect(() => {
  const fetchCourses = async () => {
      try {
          const courses = await getCourses();
          setCoursesData(courses);
      } catch (error) {
          console.error("Failed to load courses:", error);
          alert("Failed to load courses. Please try again.");
      }
  };
  
  fetchCourses();
}, []);

// --- Modified Course Handlers ---
const handleAddCourse = async () => {
  if (!newCourseId || !newCourseName || !newCourseTime || 
      !newCourseDay || !newCourseLecturer || !newCourseFee) {
      alert('Please fill in all required course details.');
      return;
  }

  try {
      await addCourse({
          course_id: parseInt(newCourseId),
          name: newCourseName,
          description: newCourseDescription,
          time: newCourseTime,
          day: newCourseDay,
          lecturer: newCourseLecturer,
          fee: parseFloat(newCourseFee)
      });
      
      // Refresh the courses list
      const courses = await getCourses();
      setCoursesData(courses);

      // Reset form
      setNewCourseId('');
      setNewCourseName('');
      setNewCourseDescription('');
      setNewCourseTime('');
      setNewCourseDay('Monday');
      setNewCourseLecturer('');
      setNewCourseFee('');
  } catch (error) {
      console.error("Failed to add course:", error);
      alert("Failed to add course. Please try again.");
  }
};

const handleDeleteCourse = async (courseId) => {
  if (!window.confirm('Are you sure you want to delete this course?')) return;
  
  try {
      await deleteCourse(courseId);
      
      // Refresh the courses list
      const courses = await getCourses();
      setCoursesData(courses);
      
      if (editingCourse?.course_id === courseId) {
          setEditingCourse(null);
          setNewCourseId('');
          setNewCourseName('');
          setNewCourseDescription('');
          setNewCourseTime('');
          setNewCourseDay('Monday');
          setNewCourseLecturer('');
          setNewCourseFee('');
      }
  } catch (error) {
      console.error("Failed to delete course:", error);
      alert("Failed to delete course. Please try again.");
  }
};

const handleEditCourse = (course) => {
  setEditingCourse(course);
  setNewCourseId(course.course_id.toString());
  setNewCourseName(course.name);
  setNewCourseDescription(course.description || '');
  setNewCourseTime(course.time);
  setNewCourseDay(course.day);
  setNewCourseLecturer(course.lecturer);
  setNewCourseFee(course.fee.toString());
};

const handleUpdateCourse = async () => {
  if (!editingCourse) return;
  if (!newCourseId || !newCourseName || !newCourseTime || 
      !newCourseDay || !newCourseLecturer || !newCourseFee) {
      alert('Please fill in all required course details.');
      return;
  }

  try {
      await updateCourse(editingCourse.course_id, {
          name: newCourseName,
          description: newCourseDescription,
          time: newCourseTime,
          day: newCourseDay,
          lecturer: newCourseLecturer,
          fee: parseFloat(newCourseFee)
      });
      
      // Refresh the courses list
      const courses = await getCourses();
      setCoursesData(courses);

      // Reset form
      setEditingCourse(null);
      setNewCourseId('');
      setNewCourseName('');
      setNewCourseDescription('');
      setNewCourseTime('');
      setNewCourseDay('Monday');
      setNewCourseLecturer('');
      setNewCourseFee('');
  } catch (error) {
      console.error("Failed to update course:", error);
      alert("Failed to update course. Please try again.");
  }
};
  // Prepare dropdown options
  const grades = gradesData.map(grade => ({ value: grade.grade_id, label: grade.name }));
  const subjects = subjectsData.map(subject => ({ value: subject.subject_id, label: subject.name }));
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const classModes = ['Physical', 'Online', 'Both'];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Section 1: Manage Grades */}
      <div className="bg-cyan-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Grades</h2>
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <input
              type="text"
              placeholder="Grade Name"
              className="w-full p-2 border border-gray-300 rounded"
              value={newGradeName}
              onChange={(e) => setNewGradeName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Grade ID (Auto Generated)"
              className="w-full p-2 border border-gray-300 rounded"
              value={editingGrade ? editingGrade.grade_id : (newGradeName ? generateGradeId(newGradeName) : '')}
              readOnly
            />
          </div>
          <button
            onClick={editingGrade ? handleUpdateGrade : handleAddGrade}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            {editingGrade ? 'Update Grade' : 'Add Grade'}
          </button>
          {editingGrade && (
            <button
              onClick={() => { setEditingGrade(null); setNewGradeName(''); }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded ml-2"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Grade ID</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gradesData.map(grade => (
                <tr key={grade.grade_id}>
                  <td className="py-2 px-4 border-b">{grade.grade_id}</td>
                  <td className="py-2 px-4 border-b">{grade.name}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEditGrade(grade)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs mr-1"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteGrade(grade.grade_id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Manage Subjects */}
      <div className="bg-blue-100 p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Subjects</h2>
    <div className="mb-4">
        <div className="grid grid-cols-4 gap-4 mb-2">
            <input
                type="text"
                placeholder="Subject Name"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Subject ID (Auto Generated)"
                className="w-full p-2 border border-gray-300 rounded"
                value={editingSubject ? editingSubject.subject_id : (newSubjectName ? generateSubjectId(newSubjectName, subjectsData) : '')}
                readOnly
            />
            <input
                type="number"
                placeholder="Fee"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSubjectFee}
                onChange={(e) => setNewSubjectFee(e.target.value)}
            />
            <input
                type="text"
                placeholder="Lecturer's Name"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSubjectLecturer}
                onChange={(e) => setNewSubjectLecturer(e.target.value)}
            />
        </div>
        <button
            onClick={editingSubject ? handleUpdateSubject : handleAddSubject}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
            {editingSubject ? 'Update Subject' : 'Add Subject'}
        </button>
        {editingSubject && (
            <button
                onClick={() => { 
                    setEditingSubject(null); 
                    setNewSubjectName(''); 
                    setNewSubjectFee('');
                    setNewSubjectLecturer('');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded ml-2"
            >
                Cancel
            </button>
        )}
    </div>
    <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
                <tr>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Subject ID</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Fee</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Lecturer</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody>
                {subjectsData.map(subject => (
                    <tr key={subject.subject_id}>
                        <td className="py-2 px-4 border-b">{subject.subject_id}</td>
                        <td className="py-2 px-4 border-b">{subject.name}</td>
                        <td className="py-2 px-4 border-b">{subject.fee}</td>
                        <td className="py-2 px-4 border-b">{subject.lecturer}</td>
                        <td className="py-2 px-4 border-b">
                            <button
                                onClick={() => handleEditSubject(subject)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs mr-1"
                            >
                                Update
                            </button>
                            <button
                                onClick={() => handleDeleteSubject(subject.subject_id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
      </div>

      {/* Section 3: Manage All Grades in Subjects (Classes) */}
      <div className="bg-green-100 p-6 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage All Grades in Subjects</h2>
  <div className="mb-4">
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-2">
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectGradeId}
        onChange={(e) => setNewGradeSubjectGradeId(e.target.value)}
      >
        <option value="">Select Grade</option>
        {grades.map(grade => (
          <option key={grade.value} value={grade.value}>{grade.label}</option>
        ))}
      </select>
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectSubjectId}
        onChange={(e) => setNewGradeSubjectSubjectId(e.target.value)}
      >
        <option value="">Select Subject</option>
        {subjects.map(subject => (
          <option key={subject.value} value={subject.value}>{subject.label}</option>
        ))}
      </select>
      <input
        type="time"
        placeholder="Time"
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectTime}
        onChange={(e) => setNewGradeSubjectTime(e.target.value)}
      />
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectDay}
        onChange={(e) => setNewGradeSubjectDay(e.target.value)}
      >
        {daysOfWeek.map(day => (
          <option key={day} value={day}>{day}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Lecturer's Name"
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectLecturer}
        onChange={(e) => setNewGradeSubjectLecturer(e.target.value)}
      />
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectMode}
        onChange={(e) => setNewGradeSubjectMode(e.target.value)}
      >
        {classModes.map(mode => (
          <option key={mode} value={mode}>{mode}</option>
        ))}
      </select>
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectFee}
        onChange={(e) => setNewGradeSubjectFee(e.target.value)}
        disabled={!newGradeSubjectSubjectId}
      >
        {newGradeSubjectSubjectId ? (
          subjectsData
            .filter(sub => sub.subject_id === newGradeSubjectSubjectId)
            .map(subject => (
              <option key={subject.subject_id} value={subject.fee}>
                Rs. {subject.fee}
              </option>
            ))
        ) : (
          <option value="">Select subject first</option>
        )}
      </select>
      <select
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectMedium}
        onChange={(e) => setNewGradeSubjectMedium(e.target.value)}
      >
        {classMediums.map(medium => (
          <option key={medium} value={medium}>{medium}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Class Period (e.g., 2 hours)"
        className="w-full p-2 border border-gray-300 rounded"
        value={newGradeSubjectPeriod}
        onChange={(e) => setNewGradeSubjectPeriod(e.target.value)}
      />
    </div>
    <button
      onClick={editingGradeSubject ? handleUpdateGradeSubject : handleAddGradeSubject}
      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
    >
      {editingGradeSubject ? 'Update Class' : 'Add Class'}
    </button>
    {editingGradeSubject && (
      <button
        onClick={() => {
          setEditingGradeSubject(null);
          setNewGradeSubjectGradeId('');
          setNewGradeSubjectSubjectId('');
          setNewGradeSubjectTime('');
          setNewGradeSubjectDay('Monday');
          setNewGradeSubjectLecturer('');
          setNewGradeSubjectMode('Physical');
          setNewGradeSubjectMedium('Sinhala');
          setNewGradeSubjectPeriod('');
          setNewGradeSubjectFee('');
        }}
        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded ml-2"
      >
        Cancel
      </button>
    )}
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border border-gray-200">
      <thead className="bg-gray-100">
        <tr>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">ID</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Grade</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Subject</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Time</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Day</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Lecturer</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Mode</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Medium</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Period</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Fee</th>
          <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody>
        {gradeSubjects.map(gs => (
          <tr key={gs.class_id}>
            <td className="py-2 px-4 border-b">{gs.class_id}</td>
            <td className="py-2 px-4 border-b">{grades.find(g => g.value === gs.grade_id)?.label}</td>
            <td className="py-2 px-4 border-b">{subjects.find(s => s.value === gs.subject_id)?.label}</td>
            <td className="py-2 px-4 border-b">{gs.time}</td>
            <td className="py-2 px-4 border-b">{gs.day}</td>
            <td className="py-2 px-4 border-b">{gs.lecturer}</td>
            <td className="py-2 px-4 border-b">{gs.mode}</td>
            <td className="py-2 px-4 border-b">{gs.medium || 'Sinhala'}</td>
            <td className="py-2 px-4 border-b">{gs.period || '-'}</td>
            <td className="py-2 px-4 border-b">{gs.fee}</td>
            <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEditGradeSubject(gs)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs mr-1"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteGradeSubject(gs.class_id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Manage Courses */}
      <div className="bg-purple-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Courses</h2>
        <div className="mb-4">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-2">
            <input
              type="number"
              placeholder="Course ID"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseId}
              onChange={(e) => setNewCourseId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Course Name"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseDescription}
              onChange={(e) => setNewCourseDescription(e.target.value)}
            />
            <input
              type="time"
              placeholder="Time"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseTime}
              onChange={(e) => setNewCourseTime(e.target.value)}
            />
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseDay}
              onChange={(e) => setNewCourseDay(e.target.value)}
            >
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Lecturer's Name"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseLecturer}
              onChange={(e) => setNewCourseLecturer(e.target.value)}
            />
            <input
              type="number"
              placeholder="Fee"
              className="w-full p-2 border border-gray-300 rounded"
              value={newCourseFee}
              onChange={(e) => setNewCourseFee(e.target.value)}
            />
          </div>
          <button
            onClick={editingCourse ? handleUpdateCourse : handleAddCourse}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            {editingCourse ? 'Update Course' : 'Add Course'}
          </button>
          {editingCourse && (
            <button
              onClick={() => {
                setEditingCourse(null);
                setNewCourseId('');
                setNewCourseName('');
                setNewCourseDescription('');
                setNewCourseTime('');
                setNewCourseDay('Monday');
                setNewCourseLecturer('');
                setNewCourseFee('');
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded ml-2"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Course ID</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Description</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Time</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Day</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Lecturer</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Fee</th>
                <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coursesData.map(course => (
                <tr key={course.course_id}>
                  <td className="py-2 px-4 border-b">{course.course_id}</td>
                  <td className="py-2 px-4 border-b">{course.name}</td>
                  <td className="py-2 px-4 border-b">{course.description}</td>
                  <td className="py-2 px-4 border-b">{course.time}</td>
                  <td className="py-2 px-4 border-b">{course.day}</td>
                  <td className="py-2 px-4 border-b">{course.lecturer}</td>
                  <td className="py-2 px-4 border-b">{course.fee}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs mr-1"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.course_id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};



const AdminDasboard = () => {
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
      case 'Manage Student\'s Data':
        return <ManageStudentsData />;
      case 'View Attendance':
        return <ViewAttendance/>;
      case 'View Payment':
        return <PaymentManagement/>;
      case 'View Reports':
        return <ReportsView />;
      case 'Manage Classes':
        return <ManageClassesAndCourses/>;
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-1/4 bg-indigo-100 min-h-screen p-4 border-r border-gray-200">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Welcome Admin!</h2>
            <p className="text-gray-600 text-sm">Manage your institution system</p>
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
              title="Manage Student's Data"
              icon={<BsFiles className="w-8 h-8"/>}
              color="blue"
              isActive={activeCard === 'Manage Student\'s Data'}
              onClick={() => handleCardClick('Manage Student\'s Data')}
            />
            <DashboardCard
              title="View Attendance"
              icon={<FaRegCalendarAlt className="w-8 h-8"/>}
              color="purple"
              isActive={activeCard === 'View Attendance'}
              onClick={() => handleCardClick('View Attendance')}
            />
            <DashboardCard
              title="View Payment"
              icon={<RiMoneyDollarCircleLine className="w-8 h-8"/>}
              color="yellow"
              isActive={activeCard === 'View Payment'}
              onClick={() => handleCardClick('View Payment')}
            />
            <DashboardCard
              title="View Reports"
              icon={<TbReportSearch className="w-8 h-8"/>}
              color="red"
              isActive={activeCard === 'View Reports'}
              onClick={() => handleCardClick('View Reports')}
            />
            <DashboardCard
              title="Manage Classes"
              icon={<MdOutlineAccountBalance className="w-8 h-8"/>}
              color="indigo"
              isActive={activeCard === 'Manage Classes'}
              onClick={() => handleCardClick('Manage Classes')}
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

// Updated Dashboard Card Component
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
    yellow: {
      border: 'border-yellow-500',
      text: 'text-yellow-500',
      bg: 'bg-yellow-100'
    },
    red: {
      border: 'border-red-500',
      text: 'text-red-500',
      bg: 'bg-red-100'
    },
    indigo: {
      border: 'border-indigo-500',
      text: 'text-indigo-500',
      bg: 'bg-indigo-100'
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



export default AdminDasboard