import { expect } from 'chai';
import sinon from 'sinon';

import helpers, {
  hashPassword,
  comparePassword,
  generateRandomString,
  formatDate,
  validateEmail
} from '../../src/utils/helpers.js';

describe('Utils Helpers', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('hashPassword should return a hashed string and comparePassword should validate it', async () => {
    const plain = 'P@ssw0rd!';
    const hash = await hashPassword(plain);

    expect(hash).to.be.a('string');
    expect(hash).to.not.equal(plain);
    expect(hash.length).to.be.greaterThan(20);

    const match = await comparePassword(plain, hash);
    expect(match).to.equal(true);

    const mismatch = await comparePassword('wrong', hash);
    expect(mismatch).to.equal(false);
  });

  it('generateRandomString should return string with requested length', () => {
    const s1 = generateRandomString(8);
    const s2 = generateRandomString(16);

    expect(s1).to.be.a('string');
    expect(s1.length).to.equal(8);

    expect(s2).to.be.a('string');
    expect(s2.length).to.equal(16);

    // default length 8
    const s3 = generateRandomString();
    expect(s3.length).to.equal(8);
  });

  it('formatDate should return YYYY-MM-DD', () => {
    const date = new Date('2024-12-25T10:20:30Z');
    const formatted = formatDate(date);
    expect(formatted).to.equal('2024-12-25');

    const fromString = formatDate('2023-01-05T03:04:05Z');
    expect(fromString).to.equal('2023-01-05');
  });

  it('validateEmail should validate proper emails', () => {
    expect(validateEmail('user@example.com')).to.equal(true);
    expect(validateEmail('first.last@domain.co')).to.equal(true);
    expect(validateEmail('invalid-email')).to.equal(false);
    expect(validateEmail('user@com')).to.equal(false);
    expect(validateEmail('user@.com')).to.equal(false);
  });

  it('default export should contain all helpers', () => {
    expect(helpers).to.have.property('hashPassword').that.is.a('function');
    expect(helpers).to.have.property('comparePassword').that.is.a('function');
    expect(helpers).to.have.property('generateRandomString').that.is.a('function');
    expect(helpers).to.have.property('formatDate').that.is.a('function');
    expect(helpers).to.have.property('validateEmail').that.is.a('function');
  });
});
