const axios = require('axios');

const API_URL = 'http://localhost:3001/api/brand/update';
const TENANT_ID = '11111111-1111-1111-1111-111111111111'; // God Mode Business

async function testRateLimit() {
    console.log("Starting Brand Consistency Rate Limit Test...");

    const updateColor = (color) => ({
        tenantId: TENANT_ID,
        updates: { brand_color: color }
    });

    try {
        // Attempt 1
        console.log("Attempt 1: Changing to Red...");
        await axios.post(API_URL, updateColor('#ff0000'));
        console.log("-> Success (1/2)");

        // Attempt 2
        console.log("Attempt 2: Changing to Blue...");
        await axios.post(API_URL, updateColor('#0000ff'));
        console.log("-> Success (2/2)");

        // Attempt 3 (Should Fail)
        console.log("Attempt 3: Changing to Green...");
        await axios.post(API_URL, updateColor('#00ff00'));
        console.log("-> Success (Unexpected!)");

    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log("-> Blocked (Expected):", error.response.data.error);
            console.log("TEST PASSED: Rate limit enforced correctly.");
        } else {
            console.error("-> Failed with unexpected error:", error.message);
            if (error.response) console.error("Response:", error.response.data);
        }
    }
}

testRateLimit();
