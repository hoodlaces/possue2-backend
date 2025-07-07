// Test script to verify email confirmation auto-login functionality
// Run this script after restarting Strapi to test the custom controller

const testEmailConfirmation = async () => {
  console.log('=== EMAIL CONFIRMATION TEST ===');
  
  try {
    // Test with invalid token to see response format
    const response = await fetch('http://localhost:1337/api/auth/email-confirmation?confirmation=test123', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', data);
    
    // Check if this is our custom controller response or default Strapi
    if (data.error && data.error.message === 'Invalid or expired confirmation token') {
      console.log('✅ Custom controller is working (custom error message)');
    } else if (data.error && data.error.message === 'Invalid token') {
      console.log('❌ Default Strapi controller is still being used');
    } else {
      console.log('🤔 Unexpected response format');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testEmailConfirmation();