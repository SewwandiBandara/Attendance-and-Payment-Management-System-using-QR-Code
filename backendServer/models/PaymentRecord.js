const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
    student_id: {
        type: String,
        required: true,
        maxlength: 255
    },
    invoice_id: {
        type: String,
        maxlength: 255
    },
    class_id: {
        type: String,
        maxlength: 255
    },
    class_type: {
        type: String,
        enum: ['subject', 'course']
    },
    amount: {
        type: Number,
        default: 0.00
    },
    date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    payment_date: {
        type: Date
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('PaymentRecord', paymentRecordSchema);
