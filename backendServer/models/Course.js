const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    course_id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String
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
    fee: {
        type: Number,
        default: 0.00
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('Course', courseSchema);
