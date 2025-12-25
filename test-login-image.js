// Quick test to verify login returns profile_image
const API_URL = 'http://192.168.100.4:3000/api';

async function testLogin() {
  try {
    console.log('Testing login with profile_image...\n');
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'abbas4developer@gmail.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Login successful!');
      console.log('User data:', {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        has_profile_image: !!data.user.profile_image,
        image_length: data.user.profile_image ? data.user.profile_image.length : 0
      });
      
      if (data.user.profile_image) {
        console.log('\n✅ Profile image IS included in login response!');
        console.log('Image preview:', data.user.profile_image.substring(0, 50) + '...');
      } else {
        console.log('\n❌ Profile image NOT included in login response');
      }
    } else {
      console.log('❌ Login failed:', data.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
