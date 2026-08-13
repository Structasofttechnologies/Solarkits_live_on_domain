require('dotenv').config({ path: '.env' });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const axios = require('axios');

async function testCartFlow() {
  const baseURL = 'http://localhost:5000/api';
  console.log('Testing Cart API via HTTP...');

  try {
    // 1. Login as EPC user structasoft.epc@gmail.com
    const loginRes = await axios.post(`${baseURL}/india/v1/auth/login`, {
      email: 'structasoft.epc@gmail.com',
      password: '1234'
    });
    console.log('Login status:', loginRes.data.success ? 'SUCCESS' : 'FAILED');
    const token = loginRes.data.accessToken;

    if (!token) {
      console.log('Failed to acquire token.');
      return;
    }

    // 2. GET Cart
    console.log('\nFetching Cart...');
    const getCartRes = await axios.get(`${baseURL}/india/v1/shop/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('GET /cart Status:', getCartRes.status, getCartRes.data);

    // 3. POST /cart (update cart with a reseller product item)
    console.log('\nUpdating Cart with Reseller Product Item...');
    const sampleCartItem = {
      id: '6a7d8894143dc752360b126d',
      listing_id: '6a7d8894143dc752360b126d',
      cartItemId: '6a7d8894143dc752360b126d',
      title: 'Mono PERC 550W Bifacial Solar Panel',
      name: 'Mono PERC 550W Bifacial Solar Panel',
      selling_price_inr: '24190.00',
      ourPrice: 24190,
      qty: 1,
      is_catalogue_item: true,
      is_custom: true,
    };

    const updateCartRes = await axios.post(`${baseURL}/india/v1/shop/cart`, {
      cart: [sampleCartItem]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('POST /cart Status:', updateCartRes.status, updateCartRes.data);

    // 4. Verify GET Cart again
    const getCartRes2 = await axios.get(`${baseURL}/india/v1/shop/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\nGET /cart after update Status:', getCartRes2.status, getCartRes2.data);

    console.log('\n✅ CART TEST COMPLETED SUCCESSFULLY WITH ZERO 500 ERRORS!');

  } catch (err) {
    console.error('Cart test failed with error:', err.response?.data || err.message);
  }
}

testCartFlow();
