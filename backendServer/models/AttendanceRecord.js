const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    student_id: {
        type: String,
        maxlength: 20
    },
    class_id: {
        type: String,
        maxlength: 10
    },
    class_type: {
        type: String,
        enum: ['subject', 'course', 'N/A'],
        default: 'N/A'
    },
    class_name: {
        type: String,
        maxlength: 100
    },
    date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['present', 'absent'],
        default: 'present'
    },
    full_name: {
        type: String,
        maxlength: 100
    },
    grade: {
        type: String,
        maxlength: 50
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
