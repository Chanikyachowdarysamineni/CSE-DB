// MongoDB Atlas connection setup
const mongoose = require('mongoose');

const connectMongo = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB Atlas successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Make sure to whitelist your IP in MongoDB Atlas Network Access');
    // Don't exit - let the server run so frontend can still load
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

module.exports = connectMongo;
