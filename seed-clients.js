const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Client = require('./src/models/Client');
const User = require('./src/models/User');
const connectDB = require('./src/config/db');
require('dotenv').config();

const seedClients = async () => {
  await connectDB();

  try {
    // Find the first user to assign clients to
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found. Please signup first.');
      process.exit(1);
    }

    console.log(`Creating clients for user: ${user.name} (${user.email})`);

    const clients = [];
    for (let i = 1; i <= 20; i++) {
      const startDate = new Date().toISOString();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      clients.push({
        _id: uuidv4(),
        user_id: user._id,
        name: `Client ${i}`,
        phone: `90000000${i.toString().padStart(2, '0')}`,
        email: `client${i}@example.com`,
        membership_type: 'monthly',
        start_date: startDate,
        end_date: endDate.toISOString(),
        fee: 1500,
        is_active: 1
      });
    }

    await Client.insertMany(clients);
    console.log('✅ Successfully added 20 test clients!');
  } catch (error) {
    console.error('Error seeding clients:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

seedClients();