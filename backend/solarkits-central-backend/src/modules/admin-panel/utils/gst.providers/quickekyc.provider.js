/**
 * quickekyc.provider.js
 *
 * Production / Sandbox Quick eKYC GST Verification Adapter.
 * Configured via process.env.QUICKEKYC_* settings.
 */

const axios = require('axios');

async function verifyGstinQuickEkyc(cleanGstin) {
  const baseURL = process.env.QUICKEKYC_BASE_URL;
  const apiKey = process.env.QUICKEKYC_API_KEY;
  const timeout = parseInt(process.env.QUICKEKYC_TIMEOUT_MS, 10) || 10000;

  if (!baseURL || !apiKey) {
    throw new Error('Quick eKYC provider is missing QUICKEKYC_BASE_URL or QUICKEKYC_API_KEY environment variables.');
  }

  try {
    const response = await axios.post(
      `${baseURL}/gstin/verify`,
      { gstin: cleanGstin },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout,
      }
    );

    const resData = response.data || {};
    const isValid = resData.status === 'SUCCESS' && resData.data?.gstin_status === 'ACTIVE';

    return {
      is_valid: isValid,
      gstin: cleanGstin,
      provider: process.env.QUICKEKYC_PROVIDER || 'production',
      legal_name: resData.data?.lgnm || null,
      trade_name: resData.data?.tradeNam || null,
      business_status: resData.data?.gstin_status || null,
      registration_state: resData.data?.pradr?.addr?.stcd || null,
      state_code: cleanGstin.substring(0, 2),
      provider_reference_id: resData.reference_id || resData.txn_id || null,
      registration_date: resData.data?.rgdt ? new Date(resData.data.rgdt) : null,
      principal_address: resData.data?.pradr || null,
      taxpayer_type: resData.data?.dty || null,
      normalized_status: isValid ? 'active' : 'inactive',
      error_message: isValid ? null : (resData.message || 'GSTIN verification failed or status inactive'),
      raw_response: resData,
    };
  } catch (error) {
    console.error('[QuickEkycProvider] Error during GST verification:', error.message);
    return {
      is_valid: false,
      gstin: cleanGstin,
      provider: process.env.QUICKEKYC_PROVIDER || 'production',
      error_message: `Quick eKYC API error: ${error.message}`,
      legal_name: null,
      trade_name: null,
      business_status: null,
      registration_state: null,
      state_code: cleanGstin.substring(0, 2),
      provider_reference_id: null,
      registration_date: null,
      principal_address: null,
      taxpayer_type: null,
      normalized_status: 'unknown',
      raw_response: error.response?.data || { error: error.message },
    };
  }
}

module.exports = {
  verifyGstinQuickEkyc,
};
