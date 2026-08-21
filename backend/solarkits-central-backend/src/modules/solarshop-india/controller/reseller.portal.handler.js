/**
 * reseller.portal.handler.js
 *
 * Controller for Reseller Portal self-service operations:
 * Registration, Login, Logout, /me, GST verify, KYC document upload & submission, Plan subscribe.
 *
 * Phase 2 — Reseller Management System
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const {
  Reseller,
  ResellerType,
  ResellerKyc,
  ResellerPlan,
  ResellerPlanSubscription,
  ResellerTerritory,
  GstVerificationLog,
} = require('../../admin-panel/models/india_solarshop_db');
const { GeoLevel0, GeoLevel1 } = require('../../admin-panel/models/geolocation_db');
const { verifyGstin } = require('../../admin-panel/utils/gst.adapter');
const { performGstVerification } = require('../../admin-panel/services/gst.verification.service');
const { logAudit } = require('../../admin-panel/utils/audit.service');
const { generate_token } = require('../utils/jsonwebtoken');

// ─── GST State Code → State Name Map (India, as per GSTIN standard) ───────────
const GST_STATE_CODE_MAP = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa',
  '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar Islands', '36': 'Telangana',
  '37': 'Andhra Pradesh (New)', '38': 'Ladakh', '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

// ─── 1. REGISTER ─────────────────────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/auth/register
 * Body: { business_name, email, mobile, password, reseller_type_id, gst_number?, address? }
 */
const register_reseller = async (req, res) => {
  try {
    const {
      business_name, contact_person, email, mobile, password,
      reseller_type_id, gst_number, pan_number, aadhaar_masked,
      address, commercial_mode, gst_verified,
      gst_legal_name, gst_trade_name,
    } = req.body;

    if (!business_name || !business_name.trim()) {
      return res.status(400).json({ status: 'error', message: 'business_name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ status: 'error', message: 'email is required' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ status: 'error', message: 'mobile is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'password must be at least 6 characters' });
    }
    if (!reseller_type_id || !mongoose.Types.ObjectId.isValid(reseller_type_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller_type_id is required' });
    }

    const resellerType = await ResellerType.findOne({ _id: reseller_type_id, deleted_at: null, is_active: true });
    if (!resellerType) {
      return res.status(400).json({ status: 'error', message: 'Invalid or inactive reseller type' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();
    const cleanGst = gst_number ? gst_number.trim().toUpperCase() : null;

    // Check duplicate email or mobile
    const existing = await Reseller.findOne({
      $or: [{ email: cleanEmail }, { mobile: cleanMobile }],
      deleted_at: null,
    });
    if (existing) {
      const field = existing.email === cleanEmail ? 'Email' : 'Mobile number';
      return res.status(409).json({ status: 'error', message: `${field} is already registered.` });
    }

    // ── Auto-resolve state from GSTIN state code ──────────────────────────────
    const resolvedAddress = { ...(address || {}) };
    if (cleanGst && cleanGst.length >= 2) {
      const stateCode = cleanGst.substring(0, 2);
      const stateName = GST_STATE_CODE_MAP[stateCode];
      if (stateName) {
        resolvedAddress.gst_state_code = stateCode;
        resolvedAddress.gst_state_name = stateName;
        // If state field is not already set, pre-fill from GST
        if (!resolvedAddress.state) resolvedAddress.state = stateName;
        if (!resolvedAddress.city) resolvedAddress.city = stateName; // fallback until EPC assigns district
      }
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Determine commercial_mode: honour explicit body param, else use type default
    const finalCommercialMode = commercial_mode || resellerType.commercial_mode;

    const resellerData = {
      business_name:    business_name.trim(),
      contact_person:   contact_person ? contact_person.trim() : undefined,
      email:            cleanEmail,
      mobile:           cleanMobile,
      password_hash,
      commercial_mode:  finalCommercialMode,
      reseller_type_id: resellerType._id,
      gst_number:       cleanGst,
      pan_number:       pan_number ? pan_number.trim().toUpperCase() : null,
      aadhaar_masked:   aadhaar_masked ? aadhaar_masked.trim() : null,
      address:          resolvedAddress,
      kyc_status:       'draft',
      activation_status: 'pending',
    };

    // If GST was pre-verified on client side, store legal/trade names and set lifecycle
    if (gst_verified && cleanGst) {
      resellerData.gst_legal_name = gst_legal_name || null;
      resellerData.gst_trade_name = gst_trade_name || null;
      resellerData.gst_verified_at = new Date();
      resellerData.reseller_lifecycle_status = 'gst_verified';
    }

    const reseller = await Reseller.create(resellerData);

    // Create empty initial KYC container
    await ResellerKyc.create({
      reseller_id: reseller._id,
      status:      'draft',
    });

    // Auto-create initial GST-derived territory entry for immediate activation & visibility in admin portal
    try {
      let indiaCountry = await GeoLevel0.findOne({ name: /india/i }).lean();
      if (!indiaCountry) {
        indiaCountry = await GeoLevel0.findOne().lean();
      }
      let matchedState = null;
      if (resolvedAddress.gst_state_name) {
        const cleanStateName = resolvedAddress.gst_state_name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        matchedState = await GeoLevel1.findOne({ name: new RegExp(cleanStateName, 'i') }).lean();
      }

      if (indiaCountry) {
        await ResellerTerritory.create({
          reseller_id:     reseller._id,
          territory_level: matchedState ? 'state' : 'country',
          country_id:      indiaCountry._id,
          state_id:        matchedState ? matchedState._id : null,
          source:          'gst_derived',
          status:          'active',
          override_reason: `Auto-assigned from GSTIN registration state (${resolvedAddress.gst_state_name || 'India'})`,
        });
      }
    } catch (terErr) {
      console.warn('[register_reseller] auto territory creation notice:', terErr.message);
    }

    await logAudit({
      actor_type:  'reseller',
      actor_id:    reseller._id,
      action:      'RESELLER_REGISTER',
      entity_type: 'resellers',
      entity_id:   reseller._id,
      after_snapshot: {
        business_name:   reseller.business_name,
        email:           reseller.email,
        commercial_mode: reseller.commercial_mode,
        gst_verified:    !!gst_verified,
        gst_state:       resolvedAddress.gst_state_name || null,
      },
      req,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Registration successful! Please complete your KYC upload to activate your account.',
      data: {
        id:              reseller._id,
        business_name:   reseller.business_name,
        email:           reseller.email,
        mobile:          reseller.mobile,
        commercial_mode: reseller.commercial_mode,
        kyc_status:      reseller.kyc_status,
        gst_state:       resolvedAddress.gst_state_name || null,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'Email or Mobile is already registered' });
    }
    console.error('[reseller.portal] register_reseller error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. LOGIN ─────────────────────────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/auth/login
 * Body: { email_or_mobile, password }
 */
const login_reseller = async (req, res) => {
  try {
    const { password } = req.body;
    const loginId = req.body.email_or_mobile || req.body.email || req.body.mobile;

    if (!loginId || !password) {
      return res.status(400).json({ status: 'error', message: 'Email/Mobile and password are required' });
    }

    const query = loginId.includes('@')
      ? { email: loginId.trim().toLowerCase() }
      : { mobile: loginId.trim() };

    query.deleted_at = null;

    const reseller = await Reseller.findOne(query);
    if (!reseller) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    if (!reseller.is_active || reseller.activation_status === 'terminated') {
      return res.status(403).json({ status: 'error', message: 'Reseller account is deactivated or terminated' });
    }

    const isMatch = await bcrypt.compare(password, reseller.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Generate JWT token
    const tokenPayload = {
      id:              reseller._id,
      email:           reseller.email,
      business_name:   reseller.business_name,
      commercial_mode: reseller.commercial_mode,
      role:            'reseller',
      token_version:   reseller.token_version,
    };
    const token = generate_token(tokenPayload);

    // Set cookie
    res.cookie('reseller_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await logAudit({
      actor_type:  'reseller',
      actor_id:    reseller._id,
      action:      'RESELLER_LOGIN',
      entity_type: 'resellers',
      entity_id:   reseller._id,
      req,
    });

    return res.json({
      status: 'success',
      token,
      user: {
        id:                reseller._id,
        business_name:     reseller.business_name,
        email:             reseller.email,
        mobile:            reseller.mobile,
        commercial_mode:   reseller.commercial_mode,
        kyc_status:        reseller.kyc_status,
        agreement_status:  reseller.agreement_status,
        activation_status: reseller.activation_status,
      },
    });
  } catch (error) {
    console.error('[reseller.portal] login_reseller error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 3. LOGOUT ────────────────────────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/auth/logout
 */
const logout_reseller = async (req, res) => {
  res.clearCookie('reseller_access_token');
  res.clearCookie('access_token');
  return res.json({ status: 'success', message: 'Logged out successfully' });
};

// ─── 4. GET ME ────────────────────────────────────────────────────────────────
/**
 * GET /api/india/v1/reseller/auth/me
 */
const get_reseller_me = async (req, res) => {
  try {
    const reseller = req.reseller;
    const kyc = await ResellerKyc.findOne({ reseller_id: reseller._id }).lean();
    const activeSub = await ResellerPlanSubscription.findOne({ reseller_id: reseller._id, status: 'active' })
      .populate('plan_id')
      .lean();

    const userData = {
      id:                reseller._id,
      business_name:     reseller.business_name,
      gst_number:        reseller.gst_number,
      pan_number:        reseller.pan_number,
      aadhaar_masked:    reseller.aadhaar_masked,
      mobile:            reseller.mobile,
      email:             reseller.email,
      commercial_mode:   reseller.commercial_mode,
      address:           reseller.address,
      kyc_status:        reseller.kyc_status,
      agreement_status:  reseller.agreement_status,
      activation_status: reseller.activation_status,
    };

    return res.json({
      status: 'success',
      data: userData,
      user: userData,
      kyc: kyc || null,
      active_subscription: activeSub || null,
    });
  } catch (error) {
    console.error('[reseller.portal] get_reseller_me error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 5. VERIFY GSTIN ──────────────────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/gst/verify
 * Body: { gstin }
 */
const verify_gstin = async (req, res) => {
  try {
    const { gstin, context } = req.body;
    if (!gstin) return res.status(400).json({ status: 'error', message: 'gstin is required' });

    const cleanGst = gstin.trim().toUpperCase();

    const result = await performGstVerification({
      gstin: cleanGst,
      entity_type: context === 'epc_onboarding' ? 'epc_buyer' : 'reseller',
      entity_id: req.reseller?._id || null,
      verified_by: req.reseller?._id ? String(req.reseller._id) : 'system',
      options: { provider: process.env.QUICKEKYC_PROVIDER || process.env.GST_VERIFY_PROVIDER || 'mock' },
    });

    if (!result.is_valid) {
      return res.status(400).json({ status: 'error', message: result.error_message, data: result });
    }

    // ── EPC Buyer Onboarding Context Validation ──────────────────────────────
    if (context === 'epc_onboarding' && req.reseller?._id) {
      const { EpcAccount, ResellerTerritory } = require('../../admin-panel/models/india_solarshop_db');
      const { validateResellerTerritoryAccess } = require('../../admin-panel/utils/territory.validator');

      // 1. Resolve State from GSTIN State Code
      const epcStateCode = cleanGst.substring(0, 2);
      const epcStateName = GST_STATE_CODE_MAP[epcStateCode] || null;

      let matchedState = null;
      if (epcStateName) {
        const cleanName = epcStateName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        matchedState = await GeoLevel1.findOne({ name: new RegExp(cleanName, 'i') }).lean();
      }

      // 2. Validate Territory Match
      const territoryCheck = await validateResellerTerritoryAccess(req.reseller._id, {
        state_id: matchedState?._id || null,
      });

      // Fetch Reseller's Authorized Territories for display info
      const activeTerritories = await ResellerTerritory.find({ reseller_id: req.reseller._id, status: 'active' })
        .populate('state_id', 'name')
        .lean();

      const resellerStateNames = activeTerritories
        .map(t => t.state_id?.name)
        .filter(Boolean);

      if (resellerStateNames.length === 0 && req.reseller.address?.gst_state_name) {
        resellerStateNames.push(req.reseller.address.gst_state_name);
      }

      // 3. Unique EPC Partner Check
      const existingEpc = await EpcAccount.findOne({ gstin: cleanGst, deleted_at: null }).lean();

      return res.json({
        status: 'success',
        data: {
          ...result,
          gst_state_code: epcStateCode,
          gst_state_name: epcStateName,
          territory_matched: territoryCheck.is_allowed,
          territory_reason: territoryCheck.reason,
          authorized_territories: resellerStateNames,
          is_unique: !existingEpc,
          existing_epc: existingEpc ? {
            id: existingEpc._id,
            company_name: existingEpc.company_name || existingEpc.name,
            status: existingEpc.status,
          } : null,
        },
      });
    }

    // ── Reseller Self Registration / Profile Update ────────────────────────────
    if (req.reseller?._id) {
      await Reseller.findByIdAndUpdate(req.reseller._id, {
        $set: {
          gst_number: result.gstin,
          gst_legal_name: result.legal_name,
          gst_trade_name: result.trade_name,
          gst_registration_status: result.business_status || 'ACTIVE',
          gst_verified_at: new Date(),
          gst_verification_log_id: result.log_id,
          reseller_lifecycle_status: 'gst_verified',
        },
      });
    }

    return res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('[reseller.portal] verify_gstin error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 6. UPLOAD KYC DOCUMENT ───────────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/kyc/upload
 * Body (multipart/form-data): file, doc_type ("aadhaar_front"|"aadhaar_back"|"pan_card"|"gst_certificate"|"shop_photo"|"address_proof"|"cancelled_cheque")
 */
const upload_kyc_document = async (req, res) => {
  try {
    const { doc_type } = req.body;
    const allowedDocs = ['aadhaar_front', 'aadhaar_back', 'pan_card', 'gst_certificate', 'shop_photo', 'address_proof', 'cancelled_cheque'];

    if (!doc_type || !allowedDocs.includes(doc_type)) {
      return res.status(400).json({ status: 'error', message: `Invalid doc_type. Allowed: ${allowedDocs.join(', ')}` });
    }

    // Phase R2 Guard: Lock document upload if KYC is already verified
    if (req.reseller?.kyc_status === 'verified') {
      return res.status(403).json({
        status: 'error',
        message: 'Your KYC has already been verified and approved. Document modification is locked.',
      });
    }

    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const uploadedFile = req.file || req.files[0];

    let kyc = await ResellerKyc.findOne({ reseller_id: req.reseller._id });
    if (!kyc) {
      kyc = await ResellerKyc.create({ reseller_id: req.reseller._id, status: 'draft' });
    }

    if (kyc.status === 'verified') {
      return res.status(403).json({
        status: 'error',
        message: 'KYC record is verified and locked.',
      });
    }

    // Save document metadata (secure key stored, direct public URL omitted)
    kyc.docs[doc_type] = {
      storage_key:   uploadedFile.path || uploadedFile.filename || uploadedFile.key,
      original_name: uploadedFile.originalname,
      mime_type:     uploadedFile.mimetype,
      size_bytes:    uploadedFile.size,
      uploaded_at:   new Date(),
    };

    if (kyc.status === 'resubmission_required' || kyc.status === 'rejected') {
      kyc.status = 'draft';
    }

    await kyc.save();

    return res.json({
      status: 'success',
      message: `Document "${doc_type}" uploaded successfully`,
      data: {
        doc_type,
        original_name: uploadedFile.originalname,
        uploaded_at:   new Date(),
      },
    });
  } catch (error) {
    console.error('[reseller.portal] upload_kyc_document error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 7. SUBMIT KYC FOR REVIEW ─────────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/kyc/submit
 */
const submit_kyc = async (req, res) => {
  try {
    if (req.reseller?.kyc_status === 'verified') {
      return res.status(400).json({ status: 'error', message: 'KYC is already verified and active.' });
    }

    const kyc = await ResellerKyc.findOne({ reseller_id: req.reseller._id });
    if (!kyc) {
      return res.status(400).json({ status: 'error', message: 'No KYC record found. Please upload documents first.' });
    }

    // Require mandatory documents (pan_card and shop_photo at minimum)
    if (!kyc.docs?.pan_card || !kyc.docs?.shop_photo) {
      return res.status(400).json({
        status: 'error',
        message: 'PAN Card and Shop/Business Photo are mandatory for KYC submission.',
      });
    }

    const beforeStatus = kyc.status;
    kyc.status = 'submitted';
    kyc.history.push({
      status:     'submitted',
      actor_type: 'reseller',
      actor_id:   req.reseller._id,
      note:       'KYC documents submitted by reseller',
      timestamp:  new Date(),
    });
    await kyc.save();

    // Update Reseller status to pending review + lifecycle status
    await Reseller.findByIdAndUpdate(req.reseller._id, {
      $set: {
        kyc_status: 'submitted',
        reseller_lifecycle_status: 'kyc_submitted',
      },
    });

    await logAudit({
      actor_type:  'reseller',
      actor_id:    req.reseller._id,
      action:      'KYC_SUBMIT',
      entity_type: 'reseller_kyc',
      entity_id:   kyc._id,
      before_snapshot: { status: beforeStatus },
      after_snapshot:  { status: 'submitted' },
      req,
    });

    return res.json({
      status:  'success',
      message: 'KYC submitted successfully for admin review!',
      data:    { kyc_status: 'submitted' },
    });
  } catch (error) {
    console.error('[reseller.portal] submit_kyc error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 8. SUBSCRIBE TO PLAN ──────────────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/plans/subscribe
 * Body: { plan_id, payment_reference? }
 */
const subscribe_plan = async (req, res) => {
  try {
    const { plan_id, payment_reference } = req.body;
    if (!plan_id || !mongoose.Types.ObjectId.isValid(plan_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid plan_id is required' });
    }

    const plan = await ResellerPlan.findOne({ _id: plan_id, deleted_at: null, is_active: true });
    if (!plan) {
      return res.status(404).json({ status: 'error', message: 'Plan not found or inactive' });
    }

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    if (plan.validity_unit === 'months') {
      expiryDate.setMonth(expiryDate.getMonth() + plan.validity_value);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + plan.validity_value);
    }

    const graceExpiryDate = new Date(expiryDate);
    const graceDays = plan.renewal_rules?.grace_period_days || 15;
    graceExpiryDate.setDate(graceExpiryDate.getDate() + graceDays);

    // Deactivate previous subscriptions
    await ResellerPlanSubscription.updateMany(
      { reseller_id: req.reseller._id, status: 'active' },
      { $set: { status: 'cancelled' } }
    );

    const subscription = await ResellerPlanSubscription.create({
      reseller_id:       req.reseller._id,
      plan_id:           plan._id,
      start_date:        startDate,
      expiry_date:       expiryDate,
      grace_expiry_date: graceExpiryDate,
      amount_paid:       plan.one_time_fee,
      currency:          plan.currency,
      payment_reference: payment_reference ? payment_reference.trim() : 'ONLINE_SELF_SUBSCRIBE',
      status:            'active',
    });

    await Reseller.findByIdAndUpdate(req.reseller._id, { $set: { plan_subscription_id: subscription._id } });

    await logAudit({
      actor_type:  'reseller',
      actor_id:    req.reseller._id,
      action:      'RESELLER_PLAN_SUBSCRIBE',
      entity_type: 'reseller_plan_subscriptions',
      entity_id:   subscription._id,
      after_snapshot: subscription.toObject(),
      req,
    });

    return res.status(201).json({
      status:  'success',
      message: `Successfully subscribed to plan "${plan.name}"`,
      data:    { subscription_id: subscription._id, expiry_date: expiryDate },
    });
  } catch (error) {
    console.error('[reseller.portal] subscribe_plan error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 9. GET MY TERRITORIES ───────────────────────────────────────────────────
/**
 * GET /api/india/v1/reseller/territories
 */
const get_reseller_my_territories = async (req, res) => {
  try {
    const { ResellerTerritory } = require('../../admin-panel/models/india_solarshop_db');
    const territories = await ResellerTerritory.find({
      reseller_id: req.reseller._id,
      status: 'active',
    })
      .populate('country_id', 'name iso2')
      .populate('state_id', 'name state_code')
      .populate('district_id', 'name')
      .lean();

    return res.json({
      status: 'success',
      data: territories.map((t) => {
        let locationName = 'All Authorized Territories';
        if (t.district_id?.name) {
          locationName = t.state_id?.name ? `${t.district_id.name}, ${t.state_id.name}` : t.district_id.name;
        } else if (t.state_id?.name) {
          locationName = t.state_id.name;
        } else if (t.country_id?.name) {
          locationName = t.country_id.name;
        }

        return {
          id:                t._id,
          scope_level:       t.territory_level,
          territory_level:   t.territory_level,
          location_name:     locationName,
          country:           t.country_id,
          state:             t.state_id,
          district:          t.district_id,
          precedence_source: t.source ? t.source.replace(/_/g, ' ') : 'assigned',
          source:            t.source ? t.source.replace(/_/g, ' ') : 'assigned',
          effective_date:    t.effective_date,
          expiry_date:       t.expiry_date,
        };
      }),
    });
  } catch (error) {
    console.error('[reseller.portal] get_reseller_my_territories error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 10. GET AUTHORIZED PRODUCT RULES ─────────────────────────────────────────
/**
 * GET /api/india/v1/reseller/authorized-products
 */
const get_reseller_authorized_products = async (req, res) => {
  try {
    const { ResellerProductAuthorization, WarehouseComboKit, ResellerListing } = require('../../admin-panel/models/india_solarshop_db');
    const { ProjectCategory, ProjectSubcategory, Product } = require('../../admin-panel/models/core_db');

    const rules = await ResellerProductAuthorization.find({
      reseller_id: req.reseller._id,
      status: 'active',
      is_authorized: true,
    })
      .populate({ path: 'category_id', model: ProjectCategory, select: 'name' })
      .populate({ path: 'subcategory_id', model: ProjectSubcategory, select: 'name' })
      .populate({ path: 'product_id', model: Product, select: 'name sku_code base_price base_price_paise price' })
      // Bug fix: combo kit schema field is 'name' (not 'kit_name'), 'base_price_cached' (not 'base_price')
      .populate({ path: 'kit_id', model: WarehouseComboKit, select: 'name kit_code base_price_cached selling_price_cached kit_image description' })
      .lean();

    const listings = await ResellerListing.find({ reseller_id: req.reseller._id }).lean();
    const listingMap = {};
    listings.forEach(l => {
      if (l.product_id) listingMap[l.product_id.toString()] = l;
      if (l.kit_id) listingMap[l.kit_id.toString()] = l;
    });

    const items = [];
    rules.forEach((r) => {
      if (r.scope_type === 'product' && r.product_id) {
        const p = r.product_id;
        const listing = listingMap[p._id.toString()];
        const priceInr = listing?.cost_price_paise
          ? listing.cost_price_paise / 100
          : (p.base_price || p.price || 1000);
        items.push({
          _id: p._id,
          id: p._id,
          scope_type: 'product',
          is_kit: false,
          name: p.name,
          sku_code: p.sku_code || 'PROD-SKU',
          base_price: priceInr,
          price: priceInr,
          reseller_cost_inr: priceInr,
        });
      } else if (r.scope_type === 'kit' && r.kit_id) {
        const k = r.kit_id;
        const listing = listingMap[k._id.toString()];
        // Bug fix: use k.name (schema field), fall back to k.kit_name for legacy docs
        const kitDisplayName = k.name || k.kit_name || 'Combo Kit';
        const kitCode       = k.kit_code || 'KIT-SKU';
        // Bug fix: use base_price_cached (schema field), not base_price
        const priceInr = listing?.cost_price_paise
          ? listing.cost_price_paise / 100
          : (k.base_price_cached || k.selling_price_cached || k.base_price || k.price || 5000);
        items.push({
          _id: k._id,
          id: k._id,
          scope_type: 'kit',
          is_kit: true,
          name:      kitDisplayName,
          kit_name:  kitDisplayName,
          sku_code:  kitCode,
          kit_code:  kitCode,
          base_price: priceInr,
          price:      priceInr,
          reseller_cost_inr: priceInr,
          // Pass authorization rule metadata for the catalog UI
          is_authorized: r.is_authorized,
          source:        r.source,
          category:      r.category_id,
          subcategory:   r.subcategory_id,
        });
      }
    });

    if (items.length === 0) {
      // Fallback: If no custom authorization rules are set, allow all active products & combo kits
      const allProducts = await Product.find({ deleted_at: null, is_active: { $ne: false } }).limit(50).lean();
      allProducts.forEach(p => {
        const listing = listingMap[p._id.toString()];
        const priceInr = listing?.cost_price_paise
          ? listing.cost_price_paise / 100
          : (p.base_price || (p.base_price_paise ? p.base_price_paise / 100 : null) || p.price || 1000);
        items.push({
          _id: p._id,
          id: p._id,
          scope_type: 'product',
          is_kit: false,
          name: p.name,
          sku_code: p.sku_code || 'PROD-SKU',
          base_price: priceInr,
          price: priceInr,
          reseller_cost_inr: priceInr,
        });
      });
    }

    return res.json({
      status: 'success',
      data: items,
    });
  } catch (error) {
    console.error('[reseller.portal] get_reseller_authorized_products error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 11. REGISTER EPC BUYER (Reseller Onboarding) ─────────────────────────────
/**
 * POST /api/india/v1/reseller/epc-buyers/register
 * Body: { name, email, whatsapp, password?, company_name, state_id, district_id, reference_image? }
 */
const register_epc_buyer = async (req, res) => {
  try {
    const { registerEpcByReseller } = require('../../admin-panel/utils/epc.reseller.service');
    const result = await registerEpcByReseller(req.reseller._id, req.body);

    return res.status(201).json({
      status: 'success',
      message: 'EPC buyer sub-account registered successfully! Sent for admin approval.',
      data: result,
    });
  } catch (error) {
    console.error('[reseller.portal] register_epc_buyer error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ─── 12. LIST MY EPC BUYERS ───────────────────────────────────────────────────
/**
 * GET /api/india/v1/reseller/epc-buyers/list
 */
const list_my_epc_buyers = async (req, res) => {
  try {
    const { EpcAccount } = require('../../admin-panel/models/india_solarshop_db');
    const epcs = await EpcAccount.find({
      onboarded_by_reseller_id: req.reseller._id,
      deleted_at: null,
    })
      .populate('states', 'name state_code')
      .populate('districts', 'name')
      .sort({ created_at: -1 })
      .lean();

    return res.json({
      status: 'success',
      data: epcs.map((e) => ({
        id:                     e._id,
        name:                   e.name,
        email:                  e.email,
        whatsapp:               e.whatsapp,
        states:                 e.states,
        districts:              e.districts,
        status:                 e.status,
        reseller_assigned_date: e.reseller_assigned_date,
        created_at:             e.created_at,
      })),
    });
  } catch (error) {
    console.error('[reseller.portal] list_my_epc_buyers error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

/**
 * GET /api/india/v1/reseller/types
 * Public endpoint to fetch active reseller types for registration dropdown.
 */
const get_active_types = async (req, res) => {
  try {
    const types = await ResellerType.find({ is_active: true, deleted_at: null })
      .sort({ sort_order: 1, name: 1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      data: types.map((t) => ({
        id: t._id,
        name: t.name,
        slug: t.slug,
        commercial_mode: t.commercial_mode,
      })),
    });
  } catch (error) {
    console.error('[reseller.portal] get_active_types error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

/**
 * GET /api/india/v1/reseller/plans/list
 * Endpoint to fetch active reseller plans for subscription catalog.
 */
const get_active_plans = async (req, res) => {
  try {
    const { ProjectType, ProjectCategory, WarehouseComboKit } = require('../../admin-panel/models/core_db');

    const plans = await ResellerPlan.find({ is_active: true, deleted_at: null })
      .populate({ path: 'allowed_project_type_ids', model: ProjectType, select: 'name' })
      .populate({ path: 'allowed_category_ids', model: ProjectCategory, select: 'name' })
      .populate({ path: 'allowed_combo_kit_ids', model: WarehouseComboKit, select: 'name capacity kit_code' })
      .sort({ sort_order: 1, one_time_fee: 1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      data: plans.map((p) => {
        const projectTypesDisplay = Array.isArray(p.allowed_project_type_ids) && p.allowed_project_type_ids.length > 0
          ? p.allowed_project_type_ids.map((pt) => (pt && pt.name ? pt.name : pt)).join(', ')
          : (p.moq_project_type || 'All Project Types (Residential / Commercial / Industrial)');

        const comboKitsDisplay = Array.isArray(p.allowed_combo_kit_ids) && p.allowed_combo_kit_ids.length > 0
          ? p.allowed_combo_kit_ids.map((ck) => (ck && ck.name ? ck.name : ck)).join(', ')
          : 'All Admin Combo Kits';

        return {
          id:                        p._id,
          name:                      p.name,
          plan_name:                 p.name,
          slug:                      p.slug,
          territory_level:           p.territory_level,
          one_time_fee:              p.one_time_fee,
          annual_fee:                p.one_time_fee,
          currency:                  p.currency,
          validity_value:            p.validity_value,
          validity_unit:             p.validity_unit,
          allowed_territories_count: p.allowed_territories_count,
          allowed_project_types:     p.allowed_project_type_ids || [],
          allowed_categories:        p.allowed_category_ids || [],
          allowed_combo_kits:        p.allowed_combo_kit_ids || [],
          project_types_display:     projectTypesDisplay,
          combo_kits_display:        comboKitsDisplay,
          max_states_allowed:        p.territory_level === 'district' ? `${p.allowed_territories_count} District(s)` : `${p.allowed_territories_count} State(s)`,
          default_commission_rate:   p.territory_level === 'district' ? 8 : p.territory_level === 'state' ? 12 : 15,
          default_dealer_margin:     p.territory_level === 'district' ? 5 : p.territory_level === 'state' ? 8 : 10,
          
          // ─── 1. Warehouse Requirements ─────────────────────────────────────────
          warehouse_required:        p.warehouse_required ?? false,
          warehouse_count:           p.warehouse_count ?? 0,
          warehouse_space_sqft:      p.warehouse_space_sqft ?? 0,

          // ─── 2. MOQ & Capacity Specifications ──────────────────────────────────
          moq_capacity_kw:          p.moq_capacity_kw ?? 10000,
          moq_kits_count:           p.moq_kits_count ?? 1,
          moq_project_type:         projectTypesDisplay,
          moq_kit_name:             comboKitsDisplay,
          moq_description:          p.moq_description || null,

          // ─── 3. Order Type Support ─────────────────────────────────────────────
          order_type_allowed:       p.order_type_allowed || 'both',

          description:               p.description,
          is_popular:                p.sort_order === 2 || p.sort_order === 3,
          is_active:                 p.is_active,
        };
      }),
    });
  } catch (error) {
    console.error('[reseller.portal] get_active_plans error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  register_reseller,
  login_reseller,
  logout_reseller,
  get_reseller_me,
  verify_gstin,
  upload_kyc_document,
  submit_kyc,
  subscribe_plan,
  get_reseller_my_territories,
  get_reseller_authorized_products,
  register_epc_buyer,
  list_my_epc_buyers,
  get_active_types,
  get_active_plans,
};




