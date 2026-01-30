// Test script to verify login works correctly
const fetch = require('node-fetch');

async function testLogin() {
    console.log('=== Testing Login Flow ===\n');

    const loginUrl = 'http://localhost:3000/api/auth/login';
    const credentials = {
        email: 'super@futbol.com',
        password: 'admin123' // Change this to the actual password
    };

    console.log('1. Attempting login with:', credentials.email);

    try {
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        console.log('\n2. Response Status:', response.status);
        console.log('3. Response Headers:');
        console.log('   Set-Cookie:', response.headers.get('set-cookie'));
        console.log('\n4. Response Body:');
        console.log(JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Login successful!');
            console.log('   Role:', data.role);
            console.log('   ComplexId:', data.complexId);

            if (data.role === 'SUPERADMIN') {
                console.log('\n✅ User has SUPERADMIN role - should be able to access /saas-admin');
            } else {
                console.log('\n❌ User does NOT have SUPERADMIN role');
            }
        } else {
            console.log('\n❌ Login failed!');
            console.log('   Error:', data.error);
            console.log('   Details:', data.details);
        }

    } catch (error) {
        console.error('\n❌ Network error:', error.message);
    }
}

testLogin();
