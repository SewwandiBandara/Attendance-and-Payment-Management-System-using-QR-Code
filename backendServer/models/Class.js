const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    class_id: {
        type: Number,
        required: true,
        unique: true
    },
    grade_id: {
        type: String,
        required: true,
        maxlength: 10
    },
    subject_id: {
        type: String,
        required: true,
        maxlength: 10
    },
    time: {
        type: String,
        maxlength: 20
    },
    day: {
        type: String,
        maxlength: 10
    },
    lecturer: {
        type: String,
        maxlength: 100
    },
    mode: {
        type: String,
        enum: ['Physical', 'Online', 'Both'],
        default: 'Physical'
    },
    fee: {
        type: Number,
        default: 0.00
    },
    medium: {
        type: String,
        maxlength: 20,
        default: 'Sinhala'
    },
    period: {
        type: String,
        maxlength: 50,
        default: ''
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('Class', classSchema);
