// Test script to verify update profile endpoint
const API_URL = 'http://192.168.100.4:3000/api';

async function testUpdateProfile() {
  try {
    // First, login to get a token
    console.log('1. Testing login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.log('Login failed, trying signup...');
      const signupResponse = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
      });
      const signupData = await signupResponse.json();
      console.log('Signup response:', signupData);
      
      if (!signupData.success) {
        console.error('Failed to create test user');
        return;
      }
      loginData.token = signupData.token;
    }
    
    // Test update profile
    console.log('\n2. Testing update profile...');
    const updateResponse = await fetch(`${API_URL}/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        name: 'Updated Name',
        email: 'test@example.com'
      })
    });
    
    const updateData = await updateResponse.json();
    console.log('Update response:', updateData);
    
    if (updateData.success) {
      console.log('\n✅ Update profile endpoint works!');
    } else {
      console.log('\n❌ Update failed:', updateData.error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUpdateProfile();
