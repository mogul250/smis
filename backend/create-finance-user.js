import User from './src/models/user.js';
import dotenv from 'dotenv';

dotenv.config();

async function createFinanceUser() {
  try {
    console.log('Creating finance user...');
    
    const financeData = {
      email: 'finance.test@smis.com',
      password: 'finance123',
      role: 'finance',
      first_name: 'Finance',
      last_name: 'Test',
      status: 'active'
    };

    const financeId = await User.create(financeData);
    console.log('Finance user created successfully with ID:', financeId);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating finance user:', error);
    process.exit(1);
  }
}

createFinanceUser();
