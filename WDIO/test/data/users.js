import 'dotenv/config';

export default {
  validUser: {
    email: process.env.USER_EMAIL || '',
    password: process.env.USER_PASSWORD || ''
  },
  invalidUser: {
    email: process.env.INVALID_USER_EMAIL || 'invalid-user@example.com',
    password: process.env.INVALID_USER_PASSWORD || 'WrongPassword123'
  }
};
