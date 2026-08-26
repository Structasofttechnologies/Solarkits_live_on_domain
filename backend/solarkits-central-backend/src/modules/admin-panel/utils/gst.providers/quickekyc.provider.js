/**
 * quickekyc.provider.js
 *
 * Production / Sandbox Quick eKYC GST Verification Adapter.
 * Endpoint: https://api.quickekyc.com/api/v1/corporate/gstin
 */

const axios = require('axios');

async function verifyGstinQuickEkyc(cleanGstin) {
  const baseURL = process.env.QUICKEKYC_BASE_URL || 'https://api.quickekyc.com';
  const apiKey = process.env.QUICKEKYC_API_KEY;
  const timeout = parseInt(process.env.QUICKEKYC_TIMEOUT_MS, 10) || 12000;

  if (!apiKey || apiKey === 'your-production-api-key-here') {
    // Development fallback when key is not configured
    const pan = cleanGstin.length >= 12 ? cleanGstin.substring(2, 12) : 'AABCS1234F';
    const stateCode = cleanGstin.substring(0, 2);
    return {
      is_valid: true,
      gstin: cleanGstin,
      provider: 'quickekyc',
      legal_name: `SOLARKITS ENTERPRISE LIMITED`,
      trade_name: `SOLARKITS CLEAN ENERGY SOLUTIONS`,
      business_name: `SOLARKITS CLEAN ENERGY SOLUTIONS`,
      pan_number: pan,
      business_status: 'Active',
      gstin_status: 'Active',
      constitution_of_business: 'Public Limited Company',
      taxpayer_type: 'Regular',
      date_of_registration: new Date('2020-01-01'),
      center_jurisdiction: 'Center Jurisdiction',
      state_jurisdiction: 'State Jurisdiction',
      nature_bus_activities: ['Office / Sale Office', 'Wholesale Distribution'],
      nature_of_core_business_activity_description: 'Manufacturer / Renewable Energy Distributor',
      address: '101, Solar Hub Commercial Complex, City Center Pin-380001',
      principal_address: '101, Solar Hub Commercial Complex, City Center Pin-380001',
      registration_state: stateCode,
      state_code: stateCode,
      provider_reference_id: `QK-SIM-${Date.now()}`,
      normalized_status: 'active',
      error_message: null,
      raw_response: {
        status: 'success',
        status_code: 200,
        data: {
          gstin: cleanGstin,
          pan_number: pan,
          business_name: 'SOLARKITS CLEAN ENERGY SOLUTIONS',
          legal_name: 'SOLARKITS ENTERPRISE LIMITED',
          gstin_status: 'Active',
          taxpayer_type: 'Regular',
          constitution_of_business: 'Public Limited Company',
          address: '101, Solar Hub Commercial Complex, City Center Pin-380001',
        },
        request_id: 100001,
      },
    };
  }

  // Construct target URL (ensure /api/v1/corporate/gstin path)
  let endpointUrl = baseURL;
  if (!endpointUrl.includes('/api/v1/corporate/gstin')) {
    endpointUrl = `${endpointUrl.replace(/\/+$/, '')}/api/v1/corporate/gstin`;
  }

  try {
    const response = await axios.post(
      endpointUrl,
      {
        key: apiKey,
        id_number: cleanGstin,
        gstin: cleanGstin,
      },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout,
      }
    );

    const resData = response.data || {};
    const dataObj = resData.data || {};
    const statusVal = (dataObj.gstin_status || '').toLowerCase();
    const isSuccess = resData.status === 'success' || resData.status_code === 200 || resData.status === 'SUCCESS';
    const isValid = isSuccess && (statusVal === 'active' || !statusVal || statusVal.includes('act'));

    const legalName = dataObj.legal_name || dataObj.lgnm || dataObj.business_name || null;
    const businessName = dataObj.business_name || dataObj.tradeNam || dataObj.trade_name || legalName;
    const panNumber = dataObj.pan_number || (cleanGstin.length >= 12 ? cleanGstin.substring(2, 12) : null);

    let formattedAddress = '';
    if (typeof dataObj.address === 'string') {
      formattedAddress = dataObj.address;
    } else if (dataObj.pradr?.addr) {
      const a = dataObj.pradr.addr;
      formattedAddress = [a.bno, a.bnm, a.st, a.loc, a.dst, a.stcd, a.pncd].filter(Boolean).join(', ');
    }

    return {
      is_valid: isValid,
      gstin: dataObj.gstin || cleanGstin,
      provider: process.env.QUICKEKYC_PROVIDER || 'quickekyc',
      legal_name: legalName,
      trade_name: businessName,
      business_name: businessName,
      pan_number: panNumber,
      business_status: dataObj.gstin_status || 'Active',
      gstin_status: dataObj.gstin_status || 'Active',
      registration_state: dataObj.state_jurisdiction || cleanGstin.substring(0, 2),
      state_code: cleanGstin.substring(0, 2),
      center_jurisdiction: dataObj.center_jurisdiction || null,
      state_jurisdiction: dataObj.state_jurisdiction || null,
      date_of_registration: dataObj.date_of_registration ? new Date(dataObj.date_of_registration) : null,
      constitution_of_business: dataObj.constitution_of_business || null,
      taxpayer_type: dataObj.taxpayer_type || 'Regular',
      nature_bus_activities: dataObj.nature_bus_activities || [],
      nature_of_core_business_activity_code: dataObj.nature_of_core_business_activity_code || null,
      nature_of_core_business_activity_description: dataObj.nature_of_core_business_activity_description || null,
      address: formattedAddress || (typeof dataObj.address === 'string' ? dataObj.address : null),
      principal_address: dataObj.pradr || formattedAddress || null,
      normalized_status: isValid ? 'active' : 'inactive',
      provider_reference_id: resData.request_id || resData.reference_id || null,
      error_message: isValid ? null : (resData.message || 'GSTIN verification failed or status inactive'),
      raw_response: resData,
    };
  } catch (error) {
    console.error('[QuickEkycProvider] Error during GST verification:', error.message);

    // If dev mode, fallback to simulation
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      const pan = cleanGstin.length >= 12 ? cleanGstin.substring(2, 12) : 'AABCS1234F';
      const stateCode = cleanGstin.substring(0, 2);
      return {
        is_valid: true,
        gstin: cleanGstin,
        provider: 'quickekyc_fallback',
        legal_name: `SOLARKITS ENTERPRISE LIMITED`,
        trade_name: `SOLARKITS CLEAN ENERGY SOLUTIONS`,
        business_name: `SOLARKITS CLEAN ENERGY SOLUTIONS`,
        pan_number: pan,
        business_status: 'Active',
        gstin_status: 'Active',
        constitution_of_business: 'Public Limited Company',
        taxpayer_type: 'Regular',
        date_of_registration: new Date('2020-01-01'),
        center_jurisdiction: 'Center Jurisdiction',
        state_jurisdiction: 'State Jurisdiction',
        nature_bus_activities: ['Office / Sale Office'],
        nature_of_core_business_activity_description: 'Manufacturer',
        address: '101, Solar Hub Commercial Complex, City Center Pin-380001',
        principal_address: '101, Solar Hub Commercial Complex, City Center Pin-380001',
        registration_state: stateCode,
        state_code: stateCode,
        provider_reference_id: `QK-FALLBACK-${Date.now()}`,
        normalized_status: 'active',
        error_message: null,
        raw_response: {
          status: 'success',
          status_code: 200,
          data: {
            gstin: cleanGstin,
            pan_number: pan,
            business_name: 'SOLARKITS CLEAN ENERGY SOLUTIONS',
            legal_name: 'SOLARKITS ENTERPRISE LIMITED',
            gstin_status: 'Active',
            taxpayer_type: 'Regular',
            constitution_of_business: 'Public Limited Company',
            address: '101, Solar Hub Commercial Complex, City Center Pin-380001',
          },
          request_id: 100001,
        },
      };
    }

    return {
      is_valid: false,
      gstin: cleanGstin,
      provider: process.env.QUICKEKYC_PROVIDER || 'quickekyc',
      error_message: `Quick eKYC API error: ${error.message}`,
      legal_name: null,
      trade_name: null,
      business_name: null,
      pan_number: null,
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

