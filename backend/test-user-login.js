const { pool } = require('./config/db');
const { login } = require('./controllers/authController');

async function testLogin() {
  console.log('--- Testing User Login with Ganesh@123 ---');
  const mockReq = {
    body: {
      email: 'kaganesh04@gmail.com',
      password: 'Ganesh@123'
    }
  };
  const mockRes = {
    statusCode: null,
    jsonData: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };

  await login(mockReq, mockRes);
  console.log('Status code:', mockRes.statusCode);
  console.log('Response JSON:', JSON.stringify(mockRes.jsonData, null, 2));

  if (mockRes.statusCode !== 200 || !mockRes.jsonData?.success) {
    throw new Error('Login failed!');
  }

  console.log('✅ Login successful for kaganesh04@gmail.com with Ganesh@123!');
  process.exit(0);
}

testLogin().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

