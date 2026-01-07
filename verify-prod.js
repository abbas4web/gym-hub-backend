const jwt = require('jsonwebtoken');
require('dotenv').config();

const testApi = async () => {
  const userId = '5db1b5f6-67ec-4e80-bd69-9f2c7754e8ea'; // Abbas ID
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });

  console.log('Testing API with user ID:', userId);
  
  try {
    const response = await fetch('https://gym-hub-backend-prod.vercel.app/api/clients?page=1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Success:', data.success);
    
    if (data.clients) {
      console.log('Clients count:', data.clients.length);
      data.clients.forEach(c => console.log(`- ${c.name}`));
    }
    
    if (data.pagination) {
      console.log('Pagination:', data.pagination);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testApi();