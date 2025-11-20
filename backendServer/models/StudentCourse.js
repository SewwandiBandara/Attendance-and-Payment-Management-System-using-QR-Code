const mongoose = require('mongoose');

const studentCourseSchema = new mongoose.Schema({
    student_id: {
        type: String,
        required: true,
        maxlength: 20
    },
    course_id: {
        type: Number,
        required: true
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('StudentCourse', studentCourseSchema);
