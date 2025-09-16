import chai from 'chai';
import pool from '../src/config/database.js';
import User from '../src/models/user.js';

const { expect } = chai;

describe('User Model Tests (HOD coverage focus)', () => {
  let deptId;
  let userId;
  const email = 'coveragehod@example.com';
  const password = 'pass12345';

  before(async () => {
    // Cleanup any leftovers from previous runs
    await pool.execute('DELETE FROM users WHERE email = ?', [email]);
    await pool.execute('DELETE FROM departments WHERE code = ?', ['COV']);

    // Create department
    await pool.execute('INSERT INTO departments (code, name) VALUES (?, ?)', ['COV', 'Coverage Dept']);
    const [deptRows] = await pool.execute('SELECT id FROM departments WHERE code = ?', ['COV']);
    deptId = deptRows[0].id;

    // Create user (role must be in ENUM)
    userId = await User.create({
      first_name: 'Coverage',
      last_name: 'HOD',
      email,
      password,
      role: 'hod',
      department_id: deptId,
      status: 'active'
    });
  });

  after(async () => {
    // Cleanup
    await pool.execute('UPDATE departments SET head_id = NULL WHERE head_id = ?', [userId || null]);
    await pool.execute('DELETE FROM users WHERE email = ?', [email]);
    await pool.execute('DELETE FROM departments WHERE code = ?', ['COV']);
  });

  it('findById should retrieve the inserted user', async () => {
    const user = await User.findById(userId);
    expect(user).to.be.an('object');
    expect(user.id).to.equal(userId);
    expect(user.email).to.equal(email);
    expect(user.role).to.equal('hod');
    expect(user.department_id).to.equal(deptId);
  });

  it('findByDepartment should include the inserted user', async () => {
    const users = await User.findByDepartment(deptId);
    expect(users).to.be.an('array');
    const found = users.find(u => u.email === email);
    expect(found).to.be.an('object');
    expect(found.role).to.equal('hod');
  });

  it('verifyPassword should return true for correct password', async () => {
    // Fetch hash via findByEmail
    const user = await User.findByEmail(email);
    expect(user).to.be.an('object');
    const ok = await User.verifyPassword(password, user.password_hash);
    expect(ok).to.equal(true);
  });

  it('update should modify fields and persist', async () => {
    await User.update(userId, { phone: '123456789', address: 'Coverage Street 1' });
    const updated = await User.findById(userId);
    expect(updated.phone).to.equal('123456789');
    expect(updated.address).to.equal('Coverage Street 1');
  });
});
