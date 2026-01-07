const mongoose = require('mongoose');
const Client = require('./src/models/Client');
const User = require('./src/models/User');
const connectDB = require('./src/config/db');
require('dotenv').config();

const testPagination = async () => {
  await connectDB();

  try {
    const user = await User.findOne({ email: 'abbas4developer@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`Testing pagination for user: ${user.name} (${user._id})`);

    const page = 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const total = await Client.countDocuments({ user_id: user._id });
    console.log(`Total clients: ${total}`);

    const clients = await Client.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Retrieved ${clients.length} clients`);
    clients.forEach(c => console.log(`- ${c.name}`));

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

testPagination();