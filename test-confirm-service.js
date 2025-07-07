// Test script to check what confirmEmail service returns
console.log('Testing confirmEmail service...');

// Since we can't easily get the actual confirmation token,
// let's test the service behavior with invalid token to see the error format
const testConfirmService = async () => {
  try {
    const response = await fetch('http://localhost:1337/api/auth/confirm-email-login?confirmation=fakeinvalidtoken123', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Check if this looks like our custom controller response
    if (data.error && data.error.message === 'Email confirmation failed') {
      console.log('✅ Custom controller is being used');
    } else {
      console.log('❌ Not using custom controller');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testConfirmService();