const mongoose = require('mongoose');

const userLoginSchema = new mongoose.Schema({
    user_id: {
        type: Number
    },
    email: {
        type: String,
        maxlength: 255
    },
    login_time: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success'
    },
    user_type: {
        type: String,
        enum: ['admin', 'staff']
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('UserLogin', userLoginSchema);
