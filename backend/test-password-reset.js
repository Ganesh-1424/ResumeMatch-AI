const { pool } = require('./config/db');
const { forgotPassword, resetPassword } = require('./controllers/authController');
const bcrypt = require('bcryptjs');

async function testPasswordResetFlow() {
  console.log('--- Testing Password Reset Flow ---');

  // 1. Test forgotPassword for kaganesh04@gmail.com
  let resetToken = null;
  const mockReqForgot = {
    body: { email: 'kaganesh04@gmail.com' }
  };
  const mockResForgot = {
    statusCode: null,
    jsonData: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };

  await forgotPassword(mockReqForgot, mockResForgot);
  console.log('Forgot Password Status:', mockResForgot.statusCode);
  console.log('Forgot Password Success:', mockResForgot.jsonData?.success);
  console.log('Reset token received:', Boolean(mockResForgot.jsonData?.resetToken));

  if (!mockResForgot.jsonData?.resetToken) {
    throw new Error('No reset token returned');
  }
  resetToken = mockResForgot.jsonData.resetToken;

  // 2. Test resetPassword setting password to Ganesh@123
  const newPassword = 'Ganesh@123';
  const mockReqReset = {
    body: {
      email: 'kaganesh04@gmail.com',
      token: resetToken,
      newPassword
    }
  };
  const mockResReset = {
    statusCode: null,
    jsonData: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };

  await resetPassword(mockReqReset, mockResReset);
  console.log('Reset Password Status:', mockResReset.statusCode);
  console.log('Reset Password Message:', mockResReset.jsonData?.message);

  if (mockResReset.statusCode !== 200) {
    throw new Error(`Reset password failed: ${JSON.stringify(mockResReset.jsonData)}`);
  }

  // 3. Verify in MySQL that Ganesh@123 now matches
  const [rows] = await pool.execute(
    'SELECT id, email, password_hash, previous_password_hash, reset_password_token FROM users WHERE email = ?',
    ['kaganesh04@gmail.com']
  );
  const user = rows[0];
  const isMatchCurrent = await bcrypt.compare('Ganesh@123', user.password_hash);
  const isMatchPrevious = await bcrypt.compare('OriginalPassword123!', user.previous_password_hash);

  console.log('User ID:', user.id);
  console.log('Matches Ganesh@123:', isMatchCurrent);
  console.log('Previous hash matches OriginalPassword123!:', isMatchPrevious);
  console.log('Reset token cleared in DB:', user.reset_password_token === null);

  if (!isMatchCurrent) {
    throw new Error('New password does not match hash in DB');
  }
  console.log('✅ Password reset test passed successfully!');
  process.exit(0);
}

testPasswordResetFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

