const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subject_id: {
        type: String,
        required: true,
        unique: true,
        maxlength: 10
    },
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    fee: {
        type: Number,
        default: 0.00
    },
    lecturer: {
        type: String,
        maxlength: 200
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('Subject', subjectSchema);
