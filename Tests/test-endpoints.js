import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
    console.log('🧪 Testing NutriFit Backend Endpoints\n');
    console.log('='.repeat(50));

    // Test 1: Health Check
    console.log('\n1️⃣ Testing Health Check...');
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Health Check Failed:', error.message);
        return;
    }

    // Test 2: API Ninjas - Nutrition
    console.log('\n2️⃣ Testing API Ninjas - Nutrition...');
    try {
        const response = await axios.get(`${BASE_URL}/api/ninjas/nutrition`, {
            params: { query: 'apple' }
        });
        console.log('✅ Nutrition API:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Nutrition API Failed:', error.response?.data || error.message);
    }

    // Test 3: API Ninjas - Nutrition Item
    console.log('\n3️⃣ Testing API Ninjas - Nutrition Item...');
    try {
        const response = await axios.get(`${BASE_URL}/api/ninjas/nutrition-item`, {
            params: { item: 'chicken breast', quantity: '100g' }
        });
        console.log('✅ Nutrition Item API:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Nutrition Item API Failed:', error.response?.data || error.message);
    }

    // Test 4: API Ninjas - Recipes
    console.log('\n4️⃣ Testing API Ninjas - Recipes...');
    try {
        const response = await axios.get(`${BASE_URL}/api/ninjas/recipes`, {
            params: { query: 'pasta', limit: 3 }
        });
        console.log('✅ Recipes API:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Recipes API Failed:', error.response?.data || error.message);
    }

    // Test 5: API Ninjas - Exercises
    console.log('\n5️⃣ Testing API Ninjas - Exercises...');
    try {
        const response = await axios.get(`${BASE_URL}/api/ninjas/exercises`, {
            params: { muscle: 'biceps', difficulty: 'beginner' }
        });
        console.log('✅ Exercises API:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Exercises API Failed:', error.response?.data || error.message);
    }

    // Test 6: AI Chat - Testing Berry Recognition
    console.log('\n6️⃣ Testing AI Chat - Berry Recognition...');
    try {
        const response = await axios.post(`${BASE_URL}/api/ai/chat`, {
            message: 'Hey Berry, can you help me with nutrition?'
        });
        console.log('✅ AI Chat Response:', response.data.response);
        console.log('   (Check if Berry acknowledges its name)');
    } catch (error) {
        console.log('❌ AI Chat Failed:', error.response?.data || error.message);
    }

    // Test 7: AI Chat - Regular question
    console.log('\n7️⃣ Testing AI Chat - Regular Question...');
    try {
        const response = await axios.post(`${BASE_URL}/api/ai/chat`, {
            message: 'What are some good exercises for beginners?'
        });
        console.log('✅ AI Chat Response:', response.data.response.substring(0, 200) + '...');
    } catch (error) {
        console.log('❌ AI Chat Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Testing Complete!');
}

testEndpoints().catch(console.error);
