const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/wismin_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Database Connected...');
    } catch (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
