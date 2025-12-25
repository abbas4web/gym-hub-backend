require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('./src/models/SuperAdmin');
const connectDB = require('./src/config/db');

async function createSuperAdmin() {
  await connectDB();

  const email = 'admin@gymhub.com';
  const password = 'admin123'; // Change this in production!
  const name = 'Super Admin';

  try {
    const existingAdmin = await SuperAdmin.findOne({ email });
    if (existingAdmin) {
      console.log('⚠️  Super admin already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await SuperAdmin.create({
      name,
      email,
      password: hashedPassword
    });

    console.log('✅ Super admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

createSuperAdmin();
