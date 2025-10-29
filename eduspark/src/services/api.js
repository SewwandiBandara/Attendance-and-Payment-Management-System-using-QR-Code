
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

//////// Grade functions /////////////

export const getGrades = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/grades`);
        return response.data;
    } catch (error) {
        console.error("Error fetching grades:", error);
        throw error;
    }
};

export const addGrade = async (grade) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/grades`, grade);
        return response.data;
    } catch (error) {
        console.error("Error adding grade:", error);
        throw error;
    }
};

export const updateGrade = async (gradeId, gradeData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/grades/${gradeId}`, gradeData);
        return response.data;
    } catch (error) {
        console.error("Error updating grade:", error);
        throw error;
    }
};

export const deleteGrade = async (gradeId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/grades/${gradeId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting grade:", error);
        throw error;
    }
};




////subject functions////////

export const getSubjects = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/subjects`);
        return response.data;
    } catch (error) {
        console.error("Error fetching subjects:", error);
        throw error;
    }
};

export const addSubject = async (subject) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/subjects`, subject);
        return response.data;
    } catch (error) {
        console.error("Error adding subject:", error);
        throw error;
    }
};


export const updateSubject = async (subjectId, subjectData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/subjects/${subjectId}`, subjectData);
        return response.data;
    } catch (error) {
        console.error("Error updating subject:", error);
        throw error;
    }
};



export const deleteSubject = async (subjectId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/subjects/${subjectId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting subject:", error);
        throw error;
    }
};


////////classes functions/////////

export const getClasses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/classes`);
        return response.data;
    } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
    }
};

export const addClass = async (classData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/classes`, classData);
        return response.data;
    } catch (error) {
        console.error("Error adding class:", error);
        throw error;
    }
};

export const updateClass = async (classId, classData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/classes/${classId}`, classData);
        return response.data;
    } catch (error) {
        console.error("Error updating class:", error);
        throw error;
    }
};

export const deleteClass = async (classId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/classes/${classId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting class:", error);
        throw error;
    }
};



//////////courses functions//////////////

export const getCourses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/courses`);
        return response.data;
    } catch (error) {
        console.error("Error fetching courses:", error);
        throw error;
    }
};

export const addCourse = async (courseData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/courses`, courseData);
        return response.data;
    } catch (error) {
        console.error("Error adding course:", error);
        throw error;
    }
};

export const updateCourse = async (courseId, courseData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/courses/${courseId}`, courseData);
        return response.data;
    } catch (error) {
        console.error("Error updating course:", error);
        throw error;
    }
};

export const deleteCourse = async (courseId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/courses/${courseId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting course:", error);
        throw error;
    }
};



///--------student registration-----//////

export const registerStudent = async (studentData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/students`, studentData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error registering student:", error);
        // Return the error response from server if available
        throw error.response?.data || error.message;
    }
};

export const getNextStudentIdForGrade = async (gradeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students/next-id/${gradeId}`);
        return response.data.nextStudentId;
    } catch (error) {
        console.error("Error fetching next student ID:", error);
        throw error.response?.data || error.message;
    }
};



//////----------------generate student qr section functions-////////

// Get student data by ID
export const getStudentById = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students/${studentId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching student:", error);
        throw error.response?.data || error.message;
    }
};

// Store QR code data for a student
// Store QR code image for a student
export const storeStudentQRImage = async (studentId, qrImageData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/students/${studentId}/qrcode`, { 
            qrImageData 
        });
        return response.data;
    } catch (error) {
        console.error("Error storing QR code image:", error);
        throw error.response?.data || error.message;
    }
};

// Get QR code image for a student
export const getStudentQRImage = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students/${studentId}/qrcode-image`);
        return response.data;
    } catch (error) {
        console.error("Error fetching QR code image:", error);
        throw error.response?.data || error.message;
    }
};


// store qr image functions
export const uploadStudentQRImage = async (studentId, qrImage) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/students/${studentId}/upload-qr`, { 
            qrImage 
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading QR code image:", error);
        throw error.response?.data || error.message;
    }
};



//----------manage student data form functions---////
// Get all students
export const getStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students`);
      return response.data;
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error.response?.data || error.message;
    }
  };
  
  // Delete a student
  export const deleteStudent = async (studentId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error.response?.data || error.message;
    }
  };

  //update a student
  export const updateStudent = async (studentId, studentData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/students/${studentId}`, studentData);
        return response.data;
    } catch (error) {
        console.error("Error updating student:", error);
        throw error.response?.data || error.message;
    }
};