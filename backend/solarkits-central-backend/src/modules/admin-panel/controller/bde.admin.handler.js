/**
 * bde.admin.handler.js
 *
 * Admin controller for SolarKits BDE Management.
 * Handles BDE CRUD, KYC review, territory/plan/goal assignment, status control, and audit logs.
 */

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const {
  BDEProfile,
  BDEKYC,
  BDETerritoryAssignment,
  BDEPlanAssignment,
  BDEGoal,
  BDEActivityLog,
  BDENotification,
  ResellerPlan,
} = require('../models/india_solarshop_db');
const { GeoLevel1, GeoLevel2 } = require('../models/geolocation_db');
const { logAudit } = require('../utils/audit.service');

// Helper to record BDE Activity Log
async function recordBdeActivity({ bde_id, actor_type = 'admin', actor_id, actor_name, action, details, notes, req }) {
  try {
    const ip_address = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null) : null;
    const user_agent = req ? req.headers['user-agent'] : null;

    return await BDEActivityLog.create({
      bde_id,
      actor_type,
      actor_id,
      actor_name,
      action: action.toUpperCase(),
      details,
      notes,
      ip_address,
      user_agent,
    });
  } catch (err) {
    console.error('[BDE Activity Log Error]', err.message);
  }
}

// Generate Next Unique BDE ID (e.g. BDE-2026-0001)
async function generateNextBdeId() {
  const currentYear = new Date().getFullYear();
  const prefix = `BDE-${currentYear}-`;
  const count = await BDEProfile.countDocuments({
    bde_id: { $regex: `^${prefix}` }
  });
  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}${sequence}`;
}

// Masking helpers
function maskAadhaar(val) {
  if (!val || val.length < 4) return 'XXXXXXXXXXXX';
  return 'XXXXXXXX' + val.slice(-4);
}

function maskPan(val) {
  if (!val || val.length < 4) return 'XXXXXXXXXX';
  return val.slice(0, 2) + 'XXXXXX' + val.slice(-2);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE BDE
// ─────────────────────────────────────────────────────────────────────────────
exports.create_bde = async (req, res) => {
  try {
    const {
      full_name,
      mobile_number,
      email,
      address,
      state_id,
      state_name,
      district_id,
      district_name,
      joining_date,
      bde_id: customBdeId,
      aadhaar_number,
      pan_number,
      aadhaar_document_url,
      pan_document_url,
      kyc_remarks,
      initial_password,
    } = req.body;

    // 1. Basic validation
    if (!full_name || !mobile_number || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Full name, mobile number, and email address are required',
      });
    }

    const cleanMobile = String(mobile_number).trim();
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile number must be a valid 10-digit Indian mobile number starting with 6-9',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email address format',
      });
    }

    // 2. KYC validation
    if (!aadhaar_number || !pan_number) {
      return res.status(400).json({
        status: 'error',
        message: 'Aadhaar number and PAN number are required for BDE creation',
      });
    }

    const cleanAadhaar = String(aadhaar_number).replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return res.status(400).json({
        status: 'error',
        message: 'Aadhaar number must be exactly 12 digits',
      });
    }

    const cleanPan = String(pan_number).trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      return res.status(400).json({
        status: 'error',
        message: 'PAN number must be 10 characters in format ABCDE1234F',
      });
    }

    if (!aadhaar_document_url || !pan_document_url) {
      return res.status(400).json({
        status: 'error',
        message: 'Both Aadhaar document and PAN document uploads are required',
      });
    }

    // 3. Duplicate checks
    const existingEmail = await BDEProfile.findOne({ email: cleanEmail, deleted_at: null });
    if (existingEmail) {
      return res.status(400).json({ status: 'error', message: 'A BDE with this email address already exists' });
    }

    const existingMobile = await BDEProfile.findOne({ mobile_number: cleanMobile, deleted_at: null });
    if (existingMobile) {
      return res.status(400).json({ status: 'error', message: 'A BDE with this mobile number already exists' });
    }

    const existingAadhaar = await BDEKYC.findOne({ aadhaar_number: cleanAadhaar });
    if (existingAadhaar) {
      return res.status(400).json({ status: 'error', message: 'A BDE with this Aadhaar number already exists' });
    }

    const existingPan = await BDEKYC.findOne({ pan_number: cleanPan });
    if (existingPan) {
      return res.status(400).json({ status: 'error', message: 'A BDE with this PAN number already exists' });
    }

    // Resolve or generate BDE ID
    let finalBdeId = customBdeId ? String(customBdeId).trim().toUpperCase() : await generateNextBdeId();
    const existingId = await BDEProfile.findOne({ bde_id: finalBdeId });
    if (existingId) {
      if (customBdeId) {
        return res.status(400).json({ status: 'error', message: `BDE ID "${finalBdeId}" is already taken` });
      }
      finalBdeId = await generateNextBdeId();
    }

    // Hash default / initial password (default: Bde@1234)
    const rawPassword = initial_password || 'Bde@1234';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // 4. Create BDE Profile
    const bde = await BDEProfile.create({
      bde_id: finalBdeId,
      full_name: full_name.trim(),
      profile_photo: req.body.profile_photo || null,
      mobile_number: cleanMobile,
      email: cleanEmail,
      address: address ? address.trim() : null,
      state_id: state_id || null,
      state_name: state_name || null,
      district_id: district_id || null,
      district_name: district_name || null,
      joining_date: joining_date ? new Date(joining_date) : new Date(),
      status: 'kyc_pending',
      password_hash: passwordHash,
      is_first_login: true,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    });

    // 5. Create BDE KYC record
    const kyc = await BDEKYC.create({
      bde_id: bde._id,
      aadhaar_number: cleanAadhaar,
      pan_number: cleanPan,
      aadhaar_document_url,
      pan_document_url,
      kyc_status: 'pending',
      kyc_remarks: kyc_remarks || null,
    });

    // Link KYC to profile
    bde.kyc_id = kyc._id;
    await bde.save();

    // 6. Notifications and Audit Log
    await BDENotification.create({
      bde_id: bde._id,
      title: 'Welcome to Solarkits!',
      message: `Your BDE account has been registered with ID: ${bde.bde_id}. Your KYC verification is currently pending.`,
      type: 'general',
    });

    await recordBdeActivity({
      bde_id: bde._id,
      actor_type: 'admin',
      actor_id: req.user?.id,
      actor_name: req.user?.name || 'Admin',
      action: 'BDE_CREATED',
      details: { bde_id: bde.bde_id, full_name: bde.full_name, email: bde.email },
      notes: `BDE created with initial status KYC Pending.`,
      req,
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'BDE_CREATED',
      entity_type: 'bde_profiles',
      entity_id: bde._id,
      after_snapshot: { bde_id: bde.bde_id, full_name: bde.full_name, email: bde.email, status: bde.status },
      req,
    });

    return res.status(201).json({
      status: 'success',
      message: `BDE "${bde.full_name}" created successfully with ID: ${bde.bde_id}`,
      data: {
        id: bde._id,
        bde_id: bde.bde_id,
        full_name: bde.full_name,
        email: bde.email,
        mobile_number: bde.mobile_number,
        status: bde.status,
        kyc_status: kyc.kyc_status,
        joining_date: bde.joining_date,
      },
    });
  } catch (error) {
    console.error('[create_bde Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create BDE profile',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. UPDATE BDE
// ─────────────────────────────────────────────────────────────────────────────
exports.update_bde = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      profile_photo,
      mobile_number,
      email,
      address,
      state_id,
      state_name,
      district_id,
      district_name,
      joining_date,
    } = req.body;

    const bde = await BDEProfile.findOne({ _id: id, deleted_at: null });
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    const beforeSnapshot = bde.toObject();

    if (full_name) bde.full_name = full_name.trim();
    if (profile_photo !== undefined) bde.profile_photo = profile_photo;
    if (address !== undefined) bde.address = address ? address.trim() : null;
    if (state_id !== undefined) bde.state_id = state_id;
    if (state_name !== undefined) bde.state_name = state_name;
    if (district_id !== undefined) bde.district_id = district_id;
    if (district_name !== undefined) bde.district_name = district_name;
    if (joining_date) bde.joining_date = new Date(joining_date);

    if (mobile_number && mobile_number !== bde.mobile_number) {
      const cleanMobile = String(mobile_number).trim();
      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        return res.status(400).json({ status: 'error', message: 'Invalid 10-digit Indian mobile number' });
      }
      const existing = await BDEProfile.findOne({ mobile_number: cleanMobile, _id: { $ne: id }, deleted_at: null });
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'Mobile number is already registered to another BDE' });
      }
      bde.mobile_number = cleanMobile;
    }

    if (email && email.toLowerCase() !== bde.email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        return res.status(400).json({ status: 'error', message: 'Invalid email address' });
      }
      const existing = await BDEProfile.findOne({ email: cleanEmail, _id: { $ne: id }, deleted_at: null });
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'Email address is already registered to another BDE' });
      }
      bde.email = cleanEmail;
    }

    bde.updated_by = req.user?.id || null;
    await bde.save();

    await recordBdeActivity({
      bde_id: bde._id,
      actor_type: 'admin',
      actor_id: req.user?.id,
      actor_name: req.user?.name || 'Admin',
      action: 'BDE_UPDATED',
      details: { updated_fields: Object.keys(req.body) },
      req,
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'BDE_UPDATED',
      entity_type: 'bde_profiles',
      entity_id: bde._id,
      before_snapshot: beforeSnapshot,
      after_snapshot: bde.toObject(),
      req,
    });

    return res.status(200).json({
      status: 'success',
      message: 'BDE profile updated successfully',
      data: bde,
    });
  } catch (error) {
    console.error('[update_bde Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update BDE profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. UPLOAD / RE-UPLOAD KYC
// ─────────────────────────────────────────────────────────────────────────────
exports.upload_kyc = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      aadhaar_number,
      pan_number,
      aadhaar_document_url,
      pan_document_url,
      kyc_remarks,
    } = req.body;

    const bde = await BDEProfile.findOne({ _id: id, deleted_at: null });
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    let kyc = await BDEKYC.findOne({ bde_id: id });
    if (!kyc) {
      kyc = new BDEKYC({ bde_id: id });
    }

    if (aadhaar_number) {
      const cleanAadhaar = String(aadhaar_number).replace(/\s+/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return res.status(400).json({ status: 'error', message: 'Aadhaar must be 12 digits' });
      }
      kyc.aadhaar_number = cleanAadhaar;
    }

    if (pan_number) {
      const cleanPan = String(pan_number).trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        return res.status(400).json({ status: 'error', message: 'Invalid PAN format' });
      }
      kyc.pan_number = cleanPan;
    }

    if (aadhaar_document_url) kyc.aadhaar_document_url = aadhaar_document_url;
    if (pan_document_url) kyc.pan_document_url = pan_document_url;
    if (kyc_remarks !== undefined) kyc.kyc_remarks = kyc_remarks;

    kyc.kyc_status = 'pending';
    kyc.rejection_reason = null;
    await kyc.save();

    if (bde.status === 'draft') {
      bde.status = 'kyc_pending';
      await bde.save();
    }

    await recordBdeActivity({
      bde_id: bde._id,
      actor_type: 'admin',
      actor_id: req.user?.id,
      actor_name: req.user?.name || 'Admin',
      action: 'KYC_SUBMITTED',
      notes: 'KYC documents updated and reset to pending verification',
      req,
    });

    return res.status(200).json({
      status: 'success',
      message: 'KYC documents submitted for review',
      data: {
        bde_id: bde.bde_id,
        kyc_status: kyc.kyc_status,
        aadhaar_masked: kyc.aadhaar_masked,
        pan_masked: kyc.pan_masked,
      },
    });
  } catch (error) {
    console.error('[upload_kyc Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to upload KYC documents', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. VERIFY / REJECT KYC
// ─────────────────────────────────────────────────────────────────────────────
exports.review_kyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks, rejection_reason } = req.body;

    if (!['verify', 'reject'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action. Must be either "verify" or "reject"',
      });
    }

    const bde = await BDEProfile.findOne({ _id: id, deleted_at: null });
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    const kyc = await BDEKYC.findOne({ bde_id: id });
    if (!kyc) {
      return res.status(404).json({ status: 'error', message: 'No KYC record found for this BDE' });
    }

    if (action === 'verify') {
      kyc.kyc_status = 'verified';
      kyc.verified_by = req.user?.id || null;
      kyc.verified_at = new Date();
      kyc.kyc_remarks = remarks || kyc.kyc_remarks;
      kyc.rejection_reason = null;
      await kyc.save();

      // If BDE was in draft/pending, upgrade to kyc_verified
      if (bde.status === 'draft' || bde.status === 'kyc_pending') {
        bde.status = 'kyc_verified';
        await bde.save();
      }

      await BDENotification.create({
        bde_id: bde._id,
        title: 'KYC Verified!',
        message: 'Your KYC documents have been reviewed and verified by Admin.',
        type: 'kyc',
      });

      await recordBdeActivity({
        bde_id: bde._id,
        actor_type: 'admin',
        actor_id: req.user?.id,
        actor_name: req.user?.name || 'Admin',
        action: 'KYC_VERIFIED',
        notes: remarks || 'KYC successfully approved',
        req,
      });

      await logAudit({
        actor_type: 'cms_user',
        actor_id: req.user?.id,
        action: 'BDE_KYC_VERIFIED',
        entity_type: 'bde_kycs',
        entity_id: kyc._id,
        reason: remarks,
        req,
      });

      return res.status(200).json({
        status: 'success',
        message: `KYC for BDE "${bde.full_name}" verified successfully.`,
        data: {
          bde_id: bde.bde_id,
          status: bde.status,
          kyc_status: kyc.kyc_status,
          verified_at: kyc.verified_at,
        },
      });
    } else {
      // Rejection flow
      if (!rejection_reason) {
        return res.status(400).json({ status: 'error', message: 'Rejection reason is required when rejecting KYC' });
      }

      kyc.kyc_status = 'rejected';
      kyc.rejected_by = req.user?.id || null;
      kyc.rejected_at = new Date();
      kyc.rejection_reason = rejection_reason.trim();
      await kyc.save();

      bde.status = 'draft';
      await bde.save();

      await BDENotification.create({
        bde_id: bde._id,
        title: 'KYC Documents Rejected',
        message: `Your KYC documents were rejected: ${rejection_reason}. Please re-upload valid documents.`,
        type: 'kyc',
      });

      await recordBdeActivity({
        bde_id: bde._id,
        actor_type: 'admin',
        actor_id: req.user?.id,
        actor_name: req.user?.name || 'Admin',
        action: 'KYC_REJECTED',
        notes: rejection_reason,
        req,
      });

      await logAudit({
        actor_type: 'cms_user',
        actor_id: req.user?.id,
        action: 'BDE_KYC_REJECTED',
        entity_type: 'bde_kycs',
        entity_id: kyc._id,
        reason: rejection_reason,
        req,
      });

      return res.status(200).json({
        status: 'success',
        message: `KYC for BDE "${bde.full_name}" has been rejected.`,
        data: {
          bde_id: bde.bde_id,
          status: bde.status,
          kyc_status: kyc.kyc_status,
          rejection_reason: kyc.rejection_reason,
        },
      });
    }
  } catch (error) {
    console.error('[review_kyc Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to review KYC', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. CHANGE BDE STATUS (Activate / Suspend / Deactivate)
// ─────────────────────────────────────────────────────────────────────────────
exports.change_status = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const allowedStatuses = ['draft', 'kyc_pending', 'kyc_verified', 'active', 'suspended', 'inactive'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
      });
    }

    const bde = await BDEProfile.findOne({ _id: id, deleted_at: null });
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    // Check prerequisite: Only verified KYC can become Active
    if (status === 'active') {
      const kyc = await BDEKYC.findOne({ bde_id: id });
      if (!kyc || kyc.kyc_status !== 'verified') {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot activate BDE until KYC has been reviewed and verified.',
        });
      }
    }

    const prevStatus = bde.status;
    bde.status = status;

    // If suspended or deactivated, invalidate active login tokens
    if (['suspended', 'inactive'].includes(status)) {
      bde.token_version = (bde.token_version || 0) + 1;
    }

    bde.updated_by = req.user?.id || null;
    await bde.save();

    await BDENotification.create({
      bde_id: bde._id,
      title: `Account Status: ${status.toUpperCase()}`,
      message: `Your BDE account status has been changed from "${prevStatus}" to "${status}".${reason ? ' Note: ' + reason : ''}`,
      type: 'system',
    });

    await recordBdeActivity({
      bde_id: bde._id,
      actor_type: 'admin',
      actor_id: req.user?.id,
      actor_name: req.user?.name || 'Admin',
      action: 'STATUS_CHANGED',
      details: { prevStatus, newStatus: status, reason },
      notes: `Status changed to ${status}`,
      req,
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'BDE_STATUS_CHANGED',
      entity_type: 'bde_profiles',
      entity_id: bde._id,
      reason,
      before_snapshot: { status: prevStatus },
      after_snapshot: { status },
      req,
    });

    return res.status(200).json({
      status: 'success',
      message: `BDE status changed to "${status}" successfully.`,
      data: {
        id: bde._id,
        bde_id: bde.bde_id,
        status: bde.status,
      },
    });
  } catch (error) {
    console.error('[change_status Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update BDE status', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. RESET BDE LOGIN CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────────
exports.reset_login = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    const bde = await BDEProfile.findOne({ _id: id, deleted_at: null });
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    const tempPassword = new_password || 'Bde@1234';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    bde.password_hash = passwordHash;
    bde.is_first_login = true;
    bde.token_version = (bde.token_version || 0) + 1;
    bde.updated_by = req.user?.id || null;
    await bde.save();

    await BDENotification.create({
      bde_id: bde._id,
      title: 'Login Credentials Reset',
      message: 'Your login password has been reset by the Admin. You will be required to create a new password on next login.',
      type: 'system',
    });

    await recordBdeActivity({
      bde_id: bde._id,
      actor_type: 'admin',
      actor_id: req.user?.id,
      actor_name: req.user?.name || 'Admin',
      action: 'LOGIN_RESET',
      notes: 'BDE login password reset and token invalidated',
      req,
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'BDE_LOGIN_RESET',
      entity_type: 'bde_profiles',
      entity_id: bde._id,
      req,
    });

    return res.status(200).json({
      status: 'success',
      message: `Login access for BDE "${bde.full_name}" has been reset. Temporary password set to: ${tempPassword}`,
      data: {
        bde_id: bde.bde_id,
        email: bde.email,
        temporary_password: tempPassword,
        is_first_login: true,
      },
    });
  } catch (error) {
    console.error('[reset_login Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to reset BDE login', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. ASSIGN TERRITORY & DISTRICTS
// ─────────────────────────────────────────────────────────────────────────────
exports.assign_territory = async (req, res) => {
  try {
    const {
      bde_id,
      country_name = 'India',
      state_id,
      state_name,
      district_ids = [],
      district_names = [],
      assignment_start_date,
      assignment_end_date,
      priority = 'medium',
      notes,
    } = req.body;

    if (!bde_id || !state_id) {
      return res.status(400).json({
        status: 'error',
        message: 'BDE ID and State are required for territory assignment',
      });
    }

    const bde = await BDEProfile.findOne({ _id: bde_id, deleted_at: null });
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    // Resolve state name if not provided
    let resolvedStateName = state_name;
    if (!resolvedStateName) {
      const stateDoc = await GeoLevel1.findById(state_id);
      if (stateDoc) resolvedStateName = stateDoc.name;
    }

    // Resolve district names if not provided
    let resolvedDistrictNames = district_names;
    if ((!resolvedDistrictNames || resolvedDistrictNames.length === 0) && district_ids.length > 0) {
      const districtDocs = await GeoLevel2.find({ _id: { $in: district_ids } });
      resolvedDistrictNames = districtDocs.map(d => d.name);
    }

    // Mark existing active territory assignment as inactive
    await BDETerritoryAssignment.updateMany(
      { bde_id, status: 'active' },
      { $set: { status: 'inactive' } }
    );

    // Create new active assignment
    const assignment = await BDETerritoryAssignment.create({
      bde_id,
      country_name,
      state_id,
      state_name: resolvedStateName || 'Assigned State',
      district_ids,
      district_names: resolvedDistrictNames,
      assignment_start_date: assignment_start_date ? new Date(assignment_start_date) : new Date(),
      assignment_end_date: assignment_end_date ? new Date(assignment_end_date) : null,
      priority,
      status: 'active',
      assigned_by: req.user?.id || null,
      notes: notes || null,
    });

    // Update BDE profile main territory summary
    bde.state_id = state_id;
    bde.state_name = resolvedStateName;
    if (district_ids.length > 0) {
      bde.district_id = district_ids[0];
      bde.district_name = resolvedDistrictNames[0];
    }
    await bde.save();

    await BDENotification.create({
      bde_id: bde._id,
      title: 'Territory Assigned',
      message: `You have been assigned state "${resolvedStateName}" with ${district_ids.length} district(s).`,
      type: 'assignment',
    });

    await recordBdeActivity({
      bde_id: bde._id,
      actor_type: 'admin',
      actor_id: req.user?.id,
      actor_name: req.user?.name || 'Admin',
      action: 'TERRITORY_ASSIGNED',
      details: {
        state_name: resolvedStateName,
        district_count: district_ids.length,
        districts: resolvedDistrictNames,
        priority,
      },
      notes: notes || `Assigned to ${resolvedStateName} (${district_ids.length} districts)`,
      req,
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'BDE_TERRITORY_ASSIGNED',
      entity_type: 'bde_territory_assignments',
      entity_id: assignment._id,
      after_snapshot: { state_name: resolvedStateName, district_count: district_ids.length },
      req,
    });

    return res.status(200).json({
      status: 'success',
      message: `Territory assigned successfully to BDE "${bde.full_name}"`,
      data: assignment,
    });
  } catch (error) {
    console.error('[assign_territory Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to assign territory', error: error.message });
  }
};

// Get Territory assignments for a BDE
exports.get_territory = async (req, res) => {
  try {
    const { bde_id } = req.params;
    const assignments = await BDETerritoryAssignment.find({ bde_id }).sort({ createdAt: -1 });
    const current = assignments.find(a => a.status === 'active') || null;

    return res.status(200).json({
      status: 'success',
      data: {
        current,
        history: assignments,
      },
    });
  } catch (error) {
    console.error('[get_territory Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch territory', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. ASSIGN FRANCHISEE PLANS
// ─────────────────────────────────────────────────────────────────────────────
exports.assign_plans = async (req, res) => {
  try {
    const { bde_id, plan_ids = [] } = req.body;

    if (!bde_id) {
      return res.status(400).json({ status: 'error', message: 'BDE ID is required' });
    }

    const bde = await BDEProfile.findOne({ _id: bde_id, deleted_at: null });
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    let planNames = [];
    if (plan_ids.length > 0) {
      const plans = await ResellerPlan.find({ _id: { $in: plan_ids } });
      planNames = plans.map(p => p.name);
    }

    // Mark previous active as inactive
    await BDEPlanAssignment.updateMany(
      { bde_id, status: 'active' },
      { $set: { status: 'inactive' } }
    );

    const assignment = await BDEPlanAssignment.create({
      bde_id,
      plan_ids,
      plan_names: planNames,
      status: 'active',
      assigned_by: req.user?.id || null,
    });

    await BDENotification.create({
      bde_id: bde._id,
      title: 'Franchisee Plans Assigned',
      message: `You have been assigned ${planNames.length} Franchisee Plan(s): ${planNames.join(', ')}.`,
      type: 'assignment',
    });

    await recordBdeActivity({
      bde_id: bde._id,
      actor_type: 'admin',
      actor_id: req.user?.id,
      actor_name: req.user?.name || 'Admin',
      action: 'PLANS_ASSIGNED',
      details: { plan_count: plan_ids.length, plans: planNames },
      req,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Franchisee plans assigned successfully',
      data: assignment,
    });
  } catch (error) {
    console.error('[assign_plans Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to assign plans', error: error.message });
  }
};

// Get assigned plans for a BDE
exports.get_plans = async (req, res) => {
  try {
    const { bde_id } = req.params;
    const current = await BDEPlanAssignment.findOne({ bde_id, status: 'active' })
      .populate('plan_ids')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      data: current,
    });
  } catch (error) {
    console.error('[get_plans Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch assigned plans', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. ASSIGN GOALS & TARGETS
// ─────────────────────────────────────────────────────────────────────────────
exports.assign_goals = async (req, res) => {
  try {
    const {
      bde_id,
      period_type = 'monthly',
      month,
      quarter,
      year = new Date().getFullYear(),
      monthly_franchisee_signup_goal = 0,
      quarterly_franchisee_signup_goal = 0,
      operational_store_goal = 0,
      start_date,
      end_date,
      notes,
    } = req.body;

    if (!bde_id) {
      return res.status(400).json({ status: 'error', message: 'BDE ID is required' });
    }

    const bde = await BDEProfile.findOne({ _id: bde_id, deleted_at: null });
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    const currentMonth = month || (new Date().getMonth() + 1);
    const currentQuarter = quarter || (Math.floor(new Date().getMonth() / 3) + 1);

    const goal = await BDEGoal.create({
      bde_id,
      period_type,
      month: currentMonth,
      quarter: currentQuarter,
      year: Number(year),
      monthly_franchisee_signup_goal: Number(monthly_franchisee_signup_goal),
      quarterly_franchisee_signup_goal: Number(quarterly_franchisee_signup_goal),
      operational_store_goal: Number(operational_store_goal),
      start_date: start_date ? new Date(start_date) : new Date(),
      end_date: end_date ? new Date(end_date) : null,
      status: 'active',
      assigned_by: req.user?.id || null,
      notes,
    });

    await BDENotification.create({
      bde_id: bde._id,
      title: 'New Goals Assigned',
      message: `Your targets have been updated: Monthly Signups: ${monthly_franchisee_signup_goal}, Quarterly Signups: ${quarterly_franchisee_signup_goal}, Operational Stores: ${operational_store_goal}.`,
      type: 'goal',
    });

    await recordBdeActivity({
      bde_id: bde._id,
      actor_type: 'admin',
      actor_id: req.user?.id,
      actor_name: req.user?.name || 'Admin',
      action: 'GOAL_ASSIGNED',
      details: {
        monthly_franchisee_signup_goal,
        quarterly_franchisee_signup_goal,
        operational_store_goal,
        year,
      },
      req,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Goals assigned successfully',
      data: goal,
    });
  } catch (error) {
    console.error('[assign_goals Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to assign goals', error: error.message });
  }
};

// Get goals for a BDE
exports.get_goals = async (req, res) => {
  try {
    const { bde_id } = req.params;
    const goals = await BDEGoal.find({ bde_id }).sort({ createdAt: -1 });
    const current = goals.find(g => g.status === 'active') || goals[0] || null;

    return res.status(200).json({
      status: 'success',
      data: {
        current,
        history: goals,
      },
    });
  } catch (error) {
    console.error('[get_goals Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch goals', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. LIST & SEARCH BDES (Admin Table with Filters)
// ─────────────────────────────────────────────────────────────────────────────
exports.list_bdes = async (req, res) => {
  try {
    const {
      search,
      state_id,
      district_id,
      plan_id,
      kyc_status,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 10,
    } = req.query;

    const query = { deleted_at: null };

    // Search by name, email, mobile, BDE ID
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { full_name: searchRegex },
        { email: searchRegex },
        { mobile_number: searchRegex },
        { bde_id: searchRegex },
      ];
    }

    // Filter by State
    if (state_id && mongoose.Types.ObjectId.isValid(state_id)) {
      query.state_id = new mongoose.Types.ObjectId(state_id);
    }

    // Filter by District
    if (district_id && mongoose.Types.ObjectId.isValid(district_id)) {
      query.district_id = new mongoose.Types.ObjectId(district_id);
    }

    // Filter by Status
    if (status) {
      query.status = status;
    }

    // Filter by Joining Date range
    if (start_date || end_date) {
      query.joining_date = {};
      if (start_date) query.joining_date.$gte = new Date(start_date);
      if (end_date) query.joining_date.$lte = new Date(end_date);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [bdes, total] = await Promise.all([
      BDEProfile.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BDEProfile.countDocuments(query),
    ]);

    // Attach KYC status, active territory and plan counts
    const bdeIds = bdes.map(b => b._id);
    const [kycDocs, territories, planAssignments] = await Promise.all([
      BDEKYC.find({ bde_id: { $in: bdeIds } }).lean(),
      BDETerritoryAssignment.find({ bde_id: { $in: bdeIds }, status: 'active' }).lean(),
      BDEPlanAssignment.find({ bde_id: { $in: bdeIds }, status: 'active' }).lean(),
    ]);

    const kycMap = {};
    for (const k of kycDocs) {
      kycMap[k.bde_id.toString()] = {
        kyc_status: k.kyc_status,
        aadhaar_masked: maskAadhaar(k.aadhaar_number),
        pan_masked: maskPan(k.pan_number),
      };
    }

    const territoryMap = {};
    for (const t of territories) {
      territoryMap[t.bde_id.toString()] = t;
    }

    const planMap = {};
    for (const p of planAssignments) {
      planMap[p.bde_id.toString()] = p;
    }

    let formatted = bdes.map(b => {
      const bId = b._id.toString();
      const kycInfo = kycMap[bId] || { kyc_status: 'pending', aadhaar_masked: 'XXXXXXXXXXXX', pan_masked: 'XXXXXXXXXX' };
      const territory = territoryMap[bId] || null;
      const plans = planMap[bId] || null;

      return {
        id: b._id,
        _id: b._id,
        bde_id: b.bde_id,
        full_name: b.full_name,
        profile_photo: b.profile_photo,
        email: b.email,
        mobile_number: b.mobile_number,
        state_id: b.state_id,
        state_name: territory ? territory.state_name : b.state_name,
        district_name: b.district_name,
        assigned_districts: territory ? territory.district_names : [],
        assigned_districts_count: territory ? territory.district_names.length : 0,
        assigned_plans: plans ? plans.plan_names : [],
        assigned_plans_count: plans ? plans.plan_names.length : 0,
        status: b.status,
        kyc_status: kycInfo.kyc_status,
        aadhaar_masked: kycInfo.aadhaar_masked,
        pan_masked: kycInfo.pan_masked,
        joining_date: b.joining_date,
        last_login_at: b.last_login_at,
        created_at: b.created_at,
      };
    });

    // Apply KYC status filter if requested
    if (kyc_status) {
      formatted = formatted.filter(b => b.kyc_status === kyc_status);
    }

    return res.status(200).json({
      status: 'success',
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[list_bdes Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch BDEs', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. GET BDE DETAIL
// ─────────────────────────────────────────────────────────────────────────────
exports.get_bde_detail = async (req, res) => {
  try {
    const { id } = req.params;

    const bde = await BDEProfile.findOne({ _id: id, deleted_at: null }).lean();
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE not found' });
    }

    const [kyc, territory, plans, goal, recentActivities] = await Promise.all([
      BDEKYC.findOne({ bde_id: id }).lean(),
      BDETerritoryAssignment.findOne({ bde_id: id, status: 'active' }).lean(),
      BDEPlanAssignment.findOne({ bde_id: id, status: 'active' }).populate('plan_ids').lean(),
      BDEGoal.findOne({ bde_id: id, status: 'active' }).lean(),
      BDEActivityLog.find({ bde_id: id }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        ...bde,
        id: bde._id,
        kyc: kyc ? {
          ...kyc,
          aadhaar_masked: maskAadhaar(kyc.aadhaar_number),
          pan_masked: maskPan(kyc.pan_number),
        } : null,
        territory,
        plans,
        goal,
        recent_activities: recentActivities,
      },
    });
  } catch (error) {
    console.error('[get_bde_detail Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch BDE detail', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. GET BDE ACTIVITY HISTORY
// ─────────────────────────────────────────────────────────────────────────────
exports.get_activity_history = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, page = 1, limit = 20 } = req.query;

    const query = {};
    if (id && id !== 'all') {
      query.bde_id = id;
    }
    if (action) {
      query.action = action.toUpperCase();
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      BDEActivityLog.find(query)
        .populate('bde_id', 'bde_id full_name email mobile_number')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BDEActivityLog.countDocuments(query),
    ]);

    return res.status(200).json({
      status: 'success',
      data: activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[get_activity_history Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch activity history', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. GET ADMIN BDE DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────
exports.get_dashboard_stats = async (req, res) => {
  try {
    const [
      totalBdes,
      activeBdes,
      kycPendingBdes,
      kycVerifiedBdes,
      suspendedBdes,
      inactiveBdes,
      territoriesCount,
      recentBdes,
    ] = await Promise.all([
      BDEProfile.countDocuments({ deleted_at: null }),
      BDEProfile.countDocuments({ status: 'active', deleted_at: null }),
      BDEProfile.countDocuments({ status: { $in: ['draft', 'kyc_pending'] }, deleted_at: null }),
      BDEProfile.countDocuments({ status: 'kyc_verified', deleted_at: null }),
      BDEProfile.countDocuments({ status: 'suspended', deleted_at: null }),
      BDEProfile.countDocuments({ status: 'inactive', deleted_at: null }),
      BDETerritoryAssignment.countDocuments({ status: 'active' }),
      BDEProfile.find({ deleted_at: null }).sort({ created_at: -1 }).limit(5).lean(),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        total_bdes: totalBdes,
        active_bdes: activeBdes,
        kyc_pending_bdes: kycPendingBdes,
        kyc_verified_bdes: kycVerifiedBdes,
        suspended_bdes: suspendedBdes,
        inactive_bdes: inactiveBdes,
        active_territories_count: territoriesCount,
        recent_bdes: recentBdes,
      },
    });
  } catch (error) {
    console.error('[get_dashboard_stats Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard stats', error: error.message });
  }
};
