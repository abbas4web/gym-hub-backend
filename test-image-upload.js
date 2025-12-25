// Test script to verify profile image update
const API_URL = 'http://192.168.100.4:3000/api';

async function testProfileImageUpdate() {
  try {
    // Login first
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login success:', loginData.success);
    
    if (!loginData.success) {
      console.log('Login failed');
      return;
    }
    
    const token = loginData.token;
    
    // Create a small test base64 image (1x1 red pixel)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    
    // Update profile with image
    console.log('\n2. Updating profile with image...');
    const updateResponse = await fetch(`${API_URL}/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        profileImage: testImage
      })
    });
    
    const updateData = await updateResponse.json();
    console.log('Update response:', updateData);
    
    if (updateData.success) {
      console.log('Profile image saved:', updateData.user.profile_image ? 'YES' : 'NO');
      if (updateData.user.profile_image) {
        console.log('Image preview:', updateData.user.profile_image.substring(0, 50) + '...');
      }
    }
    
    // Get current user to verify
    console.log('\n3. Fetching user to verify...');
    const getUserResponse = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const userData = await getUserResponse.json();
    console.log('User data:', userData);
    
    if (userData.success && userData.user.profile_image) {
      console.log('\n✅ Profile image is persisted in database!');
      console.log('Image length:', userData.user.profile_image.length, 'characters');
    } else {
      console.log('\n❌ Profile image NOT found in database!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProfileImageUpdate();
