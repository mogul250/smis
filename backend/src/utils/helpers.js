import bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const generateRandomString = (length = 8) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
export  function now(format,noFormatting) {
    let time = DateTime.now();
    time = time.setZone('Africa/Kigali')
    if (noFormatting) {
        return time
    }
    if (format) {
      return time.toFormat(format)
    }
    time = time.toFormat('yyyy-MM-dd HH:mm:ss')
    return time
}
export default {
  hashPassword,
  comparePassword,
  generateRandomString,
  formatDate,
  validateEmail
};

