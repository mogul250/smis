import bcrypt from 'bcryptjs';

async function generateHash() {
  try {
    const password = 'finance123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Password:', password);
    console.log('Hash:', hash);
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();
