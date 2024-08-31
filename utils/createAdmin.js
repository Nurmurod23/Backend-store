const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/backend', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    let admin = await User.findOne({ email: 'admin43@gmail.com' });
    if (!admin) {
      admin = new User({
        name: 'Admin',
        email: 'admin43@gmail.com',
        password: 'admin12',
        isAdmin: true,
      });
      await admin.save();
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    mongoose.disconnect();
  } catch (err) {
    console.error(err.message);
  }
};

createAdmin();
