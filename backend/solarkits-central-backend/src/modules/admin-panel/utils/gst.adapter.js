/**
 * gst.adapter.js
 *
 * Modular GSTIN Verification Adapter.
 * Phase 2 — Reseller Management System
 *
 * Pluggable structure supporting:
 *   - 'mock' provider (development/sandbox testing)
 *   - 'sandbox' / 'production' providers (plug in Karza, MasterGST, SignDesk via env)
 *
 * GSTIN structure in India:
 *   - 2 digits state code (e.g. 24 = Gujarat, 27 = Maharashtra, 07 = Delhi)
 *   - 10 digits PAN
 *   - 1 digit entity code
 *   - 1 digit 'Z'
 *   - 1 digit checksum
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

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Validate GSTIN format locally before calling external provider.
 */
function isValidGstinFormat(gstin) {
  if (!gstin || typeof gstin !== 'string') return false;
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

/**
 * Verify GSTIN using configured adapter provider.
 *
 * @param {string} gstin - 15 digit GSTIN
 * @param {object} options - { provider: 'mock'|'sandbox'|'production' }
 * @returns {Promise<object>} Verification result snapshot
 */
async function verifyGstin(gstin, options = {}) {
  const cleanGstin = (gstin || '').trim().toUpperCase();
  const provider = options.provider || process.env.GST_VERIFY_PROVIDER || 'mock';

  // 1. Format check
  if (!isValidGstinFormat(cleanGstin)) {
    return {
      is_valid: false,
      gstin: cleanGstin,
      provider,
      error_message: 'Invalid GSTIN format. Expected 15-character alphanumeric GSTIN.',
      legal_name: null,
      trade_name: null,
      business_status: null,
      registration_state: null,
      state_code: null,
      raw_response: null,
    };
  }

  const stateCode = cleanGstin.substring(0, 2);
  const stateName = STATE_CODE_MAP[stateCode] || 'Unknown State';

  // 2. Mock Provider logic
  if (provider === 'mock') {
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
        raw_response: { mock: true, status: 'CANCELLED' },
      };
    }

    const pan = cleanGstin.substring(2, 12);
    return {
      is_valid: true,
      gstin: cleanGstin,
      provider: 'mock',
      legal_name: `SOLAR ENTERPRISES (${pan})`,
      trade_name: `SOLARKITS PARTNER - ${stateName}`,
      business_status: 'ACTIVE',
      registration_state: stateName,
      state_code: stateCode,
      error_message: null,
      raw_response: {
        mock: true,
        gstin: cleanGstin,
        stj: `State Tax Office ${stateName}`,
        dtr: new Date().toISOString(),
      },
    };
  }

  // 3. Real Provider (Stub structure for Karza / MasterGST)
  // Expand here when API key credentials are added to environment variables
  throw new Error(`GST Provider "${provider}" is not implemented yet. Set GST_VERIFY_PROVIDER=mock in .env`);
}

module.exports = {
  isValidGstinFormat,
  verifyGstin,
  STATE_CODE_MAP,
};
