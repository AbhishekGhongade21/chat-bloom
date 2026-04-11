// Simple test script to verify backend is working
const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test registration
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'test123456'
    };
    
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
    console.log('✅ Registration successful:', registerResponse.data.user.name);
    
    console.log('\n🎉 Backend is working correctly!');
    console.log('You can now start the frontend and it should connect properly.');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running on port 5000');
      console.log('Run: cd backend && npm run dev');
    }
  }
}

testBackend();
