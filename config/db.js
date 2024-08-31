const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbURI = 'mongodb://localhost:27017/backend'; 
    await mongoose.connect(dbURI);

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to the database');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from the database');
});

module.exports = connectDB;
