const mongoose = require('mongoose');

const studentSubjectSchema = new mongoose.Schema({
    student_id: {
        type: String,
        required: true,
        maxlength: 20
    },
    subject_id: {
        type: String,
        required: true,
        maxlength: 10
    }
}, {
    timestamps: false
});

// Create a compound unique index on student_id and subject_id
studentSubjectSchema.index({ student_id: 1, subject_id: 1 }, { unique: true });

module.exports = mongoose.model('StudentSubject', studentSubjectSchema);
