const http = require('http');
const assert = require('assert');
const app = require('./server');

let server;
let port;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      ...options
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  server = app.listen(0, '127.0.0.1', async () => {
    port = server.address().port;

    try {
      console.log('--- Testing Google Account Linking End-to-End ---');
      const email = 'kaganesh04@gmail.com';
      const password = 'Ganesh@123';
      const googleSub = 'google_sub_kaganesh04_verified';
      const clientId = process.env.GOOGLE_CLIENT_ID || 'intended_client_id';
      const googleToken = `mock_google_id_token_:${googleSub}:${email}:K%20A%20Ganesh:${clientId}:true:3600`;

      // 1. Google sign-in before linking should return 409 EMAIL_COLLISION_PASSWORD_EXISTS
      console.log('[1/4] Attempting Google sign-in before linking...');
      const googlePre = await request({
        path: '/api/auth/google',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { credential: googleToken });

      console.log('  Status:', googlePre.statusCode, googlePre.data?.code);
      assert.strictEqual(googlePre.statusCode, 409, 'Expected 409 Conflict');
      assert.strictEqual(googlePre.data.code, 'EMAIL_COLLISION_PASSWORD_EXISTS');

      // 2. Link Google account using password Ganesh@123
      console.log('[2/4] Linking Google account with password verification...');
      const linkRes = await request({
        path: '/api/auth/google/link',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email,
        password,
        credential: googleToken
      });

      console.log('  Status:', linkRes.statusCode, linkRes.data?.message);
      assert.strictEqual(linkRes.statusCode, 200, 'Expected 200 OK from link');
      assert.strictEqual(linkRes.data.user.id, 1, 'Linked user ID must be 1');
      assert.ok(linkRes.data.token, 'Must return JWT token');

      // 3. Subsequent Google sign-in should now succeed directly
      console.log('[3/4] Testing subsequent Google sign-in after linking...');
      const googlePost = await request({
        path: '/api/auth/google',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { credential: googleToken });

      console.log('  Status:', googlePost.statusCode, googlePost.data?.message);
      assert.strictEqual(googlePost.statusCode, 200, 'Expected 200 OK after link');
      assert.strictEqual(googlePost.data.user.id, 1, 'Google user ID must be 1');

      // 4. Password login should still work for the exact same user
      console.log('[4/4] Testing password login for same user after linking...');
      const pwLogin = await request({
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email,
        password
      });

      console.log('  Status:', pwLogin.statusCode, pwLogin.data?.message);
      assert.strictEqual(pwLogin.statusCode, 200, 'Expected 200 OK from password login');
      assert.strictEqual(pwLogin.data.user.id, 1, 'Password user ID must be 1');

      console.log('✅ ALL GOOGLE ACCOUNT LINKING TESTS PASSED (100%)');
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Linking test failed:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

run();
