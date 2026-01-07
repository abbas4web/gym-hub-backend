const mongoose = require('mongoose');
const User = require('./src/models/User');
const Client = require('./src/models/Client');
const connectDB = require('./src/config/db');
require('dotenv').config();

const checkData = async () => {
  await connectDB();

  try {
    const users = await User.find();
    console.log(`Found ${users.length} users:`);

    for (const user of users) {
      const clientCount = await Client.countDocuments({ user_id: user._id });
      console.log(`- User: ${user.name} (${user.email}) | ID: ${user._id} | Clients: ${clientCount}`);
    }

    // Find clients with unknown user_ids
    const userIds = users.map(u => u._id);
    const orphanedClients = await Client.countDocuments({ user_id: { $nin: userIds } });
    console.log(`\nOrphaned Clients (no valid user): ${orphanedClients}`);
    
    if (orphanedClients > 0) {
       const orphans = await Client.find({ user_id: { $nin: userIds } }).limit(5);
       console.log('Sample orphaned client user_ids:', orphans.map(c => c.user_id));
    }

    const totalClients = await Client.countDocuments();
    console.log(`\nTotal Clients in DB: ${totalClients}`);

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

checkData();