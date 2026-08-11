/**
 * epc.reseller.service.js
 *
 * Reseller-Onboarded EPC Buyer Pipeline Service.
 * Phase 5 — Reseller Management System
 *
 * Rules:
 *   1. Reseller must be active and KYC verified before onboarding EPC buyers.
 *   2. EPC buyer's operating location MUST fall within reseller's authorized territory.
 *   3. Direct customers (onboarded_by_reseller_id === null) remain 100% backward-compatible.
 */

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const {
  Reseller,
  EpcAccount,
  EpcSignupRequest,
} = require('../models/india_solarshop_db');
const { validateEpcResellerTerritoryMatch } = require('./territory.validator');
const { logAudit } = require('./audit.service');

/**
 * Register a new EPC Buyer sub-account via Reseller onboarding.
 */
async function registerEpcByReseller(resellerId, epcData = {}) {
  const { name, email, whatsapp, password, company_name, state_id, district_id, reference_image } = epcData;

  // 1. Verify reseller active and KYC status
  const reseller = await Reseller.findOne({ _id: resellerId, deleted_at: null }).lean();
  if (!reseller) {
    throw new Error('Reseller account not found');
  }
  if (!reseller.is_active || reseller.activation_status !== 'active') {
    throw new Error('Reseller account is not active');
  }
  if (reseller.kyc_status !== 'verified') {
    throw new Error('Reseller KYC must be verified before onboarding EPC buyers');
  }

  // 2. Verify Territory match
  const territoryCheck = await validateEpcResellerTerritoryMatch(resellerId, {
    state_id,
    district_id,
  });

  if (!territoryCheck.is_matched) {
    throw new Error(`Territory validation failed: ${territoryCheck.reason}`);
  }

  // 3. Check existing email / whatsapp
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanWhatsapp = (whatsapp || '').trim();

  const existingAccount = await EpcAccount.findOne({
    $or: [{ email: cleanEmail }, { whatsapp: cleanWhatsapp }],
    deleted_at: null,
  });
  if (existingAccount) {
    throw new Error('An EPC account with this Email or WhatsApp number already exists');
  }

  const password_hash = await bcrypt.hash(password || 'EpcPass@123', 10);

  // 4. Create EPC Account
  const epcAccount = await EpcAccount.create({
    name:                     name.trim(),
    email:                    cleanEmail,
    whatsapp:                 cleanWhatsapp,
    password_hash,
    states:                   state_id ? [state_id] : [],
    districts:                district_id ? [district_id] : [],
    status:                   'pending',
    onboarded_by_reseller_id: resellerId,
    onboarding_source:        'reseller',
    reseller_assigned_date:   new Date(),
  });

  // 5. Create EPC Signup Request for Admin Review Queue
  const signupRequest = await EpcSignupRequest.create({
    account_id:               epcAccount._id,
    company_name:             (company_name || name).trim(),
    email:                    cleanEmail,
    whatsapp:                 cleanWhatsapp,
    status:                   'pending',
    state_id:                 state_id,
    reference_image:          reference_image || null,
    onboarded_by_reseller_id: resellerId,
    onboarding_source:        'reseller',
  });

  await logAudit({
    actor_type: 'reseller',
    actor_id: resellerId,
    action: 'RESELLER_EPC_ONBOARD',
    entity_type: 'epc_accounts',
    entity_id: epcAccount._id,
    after_snapshot: { epc_account_id: epcAccount._id, company_name, reseller_id: resellerId },
  });

  return {
    account_id:        epcAccount._id,
    signup_request_id: signupRequest._id,
    status:            'pending',
    company_name:      signupRequest.company_name,
  };
}

/**
 * Approve or Reject a reseller-onboarded EPC Buyer signup request (Admin function).
 */
async function reviewResellerEpcSignup(signupRequestId, adminUserId, decision, note) {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Decision must be approved or rejected');
  }

  const signupReq = await EpcSignupRequest.findById(signupRequestId);
  if (!signupReq) throw new Error('EPC signup request not found');

  signupReq.status = decision;
  signupReq.reviewed_by = adminUserId;
  signupReq.reviewed_at = new Date();
  await signupReq.save();

  // Update corresponding EPC Account
  const epcAccount = await EpcAccount.findById(signupReq.account_id);
  if (epcAccount) {
    epcAccount.status = decision;
    if (decision === 'approved') {
      epcAccount.is_email_verified = true;
      epcAccount.is_whatsapp_verified = true;
    }
    await epcAccount.save();
  }

  await logAudit({
    actor_type: 'cms_user',
    actor_id: adminUserId,
    action: decision === 'approved' ? 'RESELLER_EPC_APPROVE' : 'RESELLER_EPC_REJECT',
    entity_type: 'epc_signup_requests',
    entity_id: signupRequestId,
    after_snapshot: { status: decision, note },
  });

  return { signup_request_id: signupRequestId, status: decision };
}

module.exports = {
  registerEpcByReseller,
  reviewResellerEpcSignup,
};
