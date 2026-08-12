/**
 * mock.provider.js
 *
 * Mock GST Verification Provider.
 * Simulates GSTIN lookup for development and testing.
 */

const STATE_CODE_MAP = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
  '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
  '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
  '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

async function verifyGstinMock(cleanGstin) {
  const stateCode = cleanGstin.substring(0, 2);
  const stateName = STATE_CODE_MAP[stateCode] || 'Unknown State';
  const pan = cleanGstin.substring(2, 12);

  // Treat GSTINs ending with "0" as invalid for testing invalid responses
  const isMockValid = !cleanGstin.endsWith('0');

  if (!isMockValid) {
    return {
      is_valid: false,
      gstin: cleanGstin,
      provider: 'mock',
      error_message: 'GSTIN status is INACTIVE or Cancelled in Tax Portal (mock result)',
      legal_name: null,
      trade_name: null,
      business_status: 'CANCELLED',
      registration_state: stateName,
      state_code: stateCode,
      provider_reference_id: null,
      registration_date: null,
      principal_address: null,
      taxpayer_type: 'Regular',
      normalized_status: 'inactive',
      raw_response: { mock: true, status: 'CANCELLED' },
    };
  }

  return {
    is_valid: true,
    gstin: cleanGstin,
    provider: 'mock',
    legal_name: `SOLAR ENTERPRISES (${pan})`,
    trade_name: `SOLARKITS PARTNER - ${stateName}`,
    business_status: 'ACTIVE',
    registration_state: stateName,
    state_code: stateCode,
    provider_reference_id: `MOCK-REF-${Date.now()}`,
    registration_date: new Date('2020-01-01'),
    principal_address: {
      addr: '101, Solar Hub Commercial Complex',
      ntr: 'Principal Place of Business',
      pncd: '380001',
      dst: 'Ahmedabad',
      stcd: stateName,
    },
    taxpayer_type: 'Regular',
    normalized_status: 'active',
    error_message: null,
    raw_response: {
      mock: true,
      gstin: cleanGstin,
      stj: `State Tax Office ${stateName}`,
      dtr: new Date().toISOString(),
    },
  };
}

module.exports = {
  verifyGstinMock,
  STATE_CODE_MAP,
};
