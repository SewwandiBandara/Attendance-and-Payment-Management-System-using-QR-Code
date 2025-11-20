const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    grade_id: {
        type: String,
        required: true,
        unique: true,
        maxlength: 10
    },
    name: {
        type: String,
        required: true,
        maxlength: 50
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('Grade', gradeSchema);
