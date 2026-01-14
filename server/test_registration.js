const http = require('http');

const data = JSON.stringify({
    email: "testuser_" + Date.now() + "@opcore.ng",
    businessName: "Test Automation Corp",
    accountType: "business",
    subscriptionTier: "pro"
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log('Response Body:', responseBody);
        if (res.statusCode === 200) {
            console.log("TEST PASSED: User Registered");
        } else {
            console.log("TEST FAILED");
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
