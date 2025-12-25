const db = require('./src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createSuperAdmin() {
  const email = 'admin@gymhub.com';
  const password = 'admin123'; // Change this in production!
  const name = 'Super Admin';

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = uuidv4();

  db.run(
    'INSERT OR REPLACE INTO super_admins (id, email, password, name) VALUES (?, ?, ?, ?)',
    [id, email, hashedPassword, name],
    (err) => {
      if (err) {
        console.error('Error creating super admin:', err);
      } else {
        console.log('✅ Super admin created successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');
      }
      process.exit(0);
    }
  );
}

// Also update users table to add status column if not exists
db.run('ALTER TABLE users ADD COLUMN status TEXT DEFAULT "active"', (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding status column:', err);
  }
});

db.run('ALTER TABLE users ADD COLUMN total_revenue REAL DEFAULT 0', (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding total_revenue column:', err);
  }
});

db.run('ALTER TABLE users ADD COLUMN gym_name TEXT', (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding gym_name column:', err);
  }
  createSuperAdmin();
});
