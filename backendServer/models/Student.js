const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    student_id: {
        type: String,
        required: true,
        unique: true,
        maxlength: 20
    },
    first_name: {
        type: String,
        required: true,
        maxlength: 50
    },
    last_name: {
        type: String,
        required: true,
        maxlength: 50
    },
    grade_id: {
        type: String,
        required: true,
        maxlength: 10
    },
    password: {
        type: String,
        maxlength: 255
    },
    mobile: {
        type: String,
        maxlength: 15
    },
    email: {
        type: String,
        maxlength: 100
    },
    qr_code_image: {
        type: String  // LONGTEXT equivalent - stores base64 encoded image
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('Student', studentSchema);
