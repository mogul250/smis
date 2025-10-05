import User from './src/models/user.js';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const adminData = {
      email: 'admin@smis.com',
      password: 'admin123',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      status: 'active'
    };

    const adminId = await User.create(adminData);
    console.log('Admin user created successfully with ID:', adminId);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
