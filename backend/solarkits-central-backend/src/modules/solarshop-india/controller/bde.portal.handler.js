/**
 * bde.portal.handler.js
 *
 * Controller for BDE Portal self-service APIs.
 * Handles BDE Login, Logout, Password Management, Profile, Dashboard, Notifications, and Scoped Data.
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
  BDELead,
  BDELeadActivity,
  BDEFollowUp,
  BDEReassignmentHistory,
  TerritoryExceptionRequest,
  Reseller,
  ResellerPlan,
  StoreSetup,
  StoreSetupChecklist,
} = require('../../admin-panel/models/india_solarshop_db');
const { generate_token } = require('../utils/jsonwebtoken');
const {
  createLead,
  startFranchiseeSignup,
  getBdeDashboardMetrics,
} = require('../../admin-panel/services/bde.lead.service');

// Helper to mask sensitive KYC fields
function maskAadhaar(val) {
  if (!val || val.length < 4) return 'XXXXXXXXXXXX';
  return 'XXXXXXXX' + val.slice(-4);
}

function maskPan(val) {
  if (!val || val.length < 4) return 'XXXXXXXXXX';
  return val.slice(0, 2) + 'XXXXXX' + val.slice(-2);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BDE LOGIN
// ─────────────────────────────────────────────────────────────────────────────
exports.login_bde = async (req, res) => {
  try {
    const { identifier, email, mobile_number, password, remember_me } = req.body;

    const loginId = identifier || email || mobile_number;
    if (!loginId || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email / mobile number and password are required',
      });
    }

    const cleanLoginId = String(loginId).trim();

    // Find BDE by email, mobile, or BDE ID (including password_hash)
    const bde = await BDEProfile.findOne({
      $or: [
        { email: cleanLoginId.toLowerCase() },
        { mobile_number: cleanLoginId },
        { bde_id: cleanLoginId.toUpperCase() },
      ],
      deleted_at: null,
    }).select('+password_hash');

    if (!bde) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials. No BDE account found with this identifier.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, bde.password_hash || '');
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid password. Please check your credentials.',
      });
    }

    // Check account status
    if (bde.status === 'suspended') {
      return res.status(403).json({
        status: 'error',
        message: 'Your BDE account has been suspended by Admin. Please contact support.',
      });
    }

    if (bde.status === 'inactive') {
      return res.status(403).json({
        status: 'error',
        message: 'Your BDE account is currently inactive.',
      });
    }

    // Check KYC status
    const kyc = await BDEKYC.findOne({ bde_id: bde._id });
    if (!kyc || kyc.kyc_status !== 'verified') {
      const kycState = kyc ? kyc.kyc_status : 'missing';
      return res.status(403).json({
        status: 'error',
        message: `BDE login requires verified KYC. Your current KYC status is: "${kycState.toUpperCase()}". Please wait for Admin verification.`,
      });
    }

    if (bde.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: `Your account is currently in "${bde.status}" status. It must be activated by Admin before you can log in.`,
      });
    }

    // Update login timestamps and IP
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
    bde.last_login_at = new Date();
    bde.last_login_ip = clientIp;
    await bde.save();

    // Generate JWT Token (valid 7 days or 30 days if remember_me)
    const expiresIn = remember_me ? '30d' : '7d';
    const token = generate_token(
      {
        id: bde._id.toString(),
        bde_id: bde.bde_id,
        email: bde.email,
        full_name: bde.full_name,
        role: 'bde',
        token_version: bde.token_version || 0,
      },
      { expiresIn }
    );

    // Set secure cookie
    res.cookie('bde_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: (remember_me ? 30 : 7) * 24 * 60 * 60 * 1000,
    });

    // Record login activity
    await BDEActivityLog.create({
      bde_id: bde._id,
      actor_type: 'bde',
      actor_id: bde._id,
      actor_name: bde.full_name,
      action: 'LOGIN_SUCCESS',
      notes: `Logged in successfully from IP ${clientIp}`,
      ip_address: clientIp,
      user_agent: req.headers['user-agent'],
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      bde: {
        id: bde._id,
        bde_id: bde.bde_id,
        full_name: bde.full_name,
        email: bde.email,
        mobile_number: bde.mobile_number,
        profile_photo: bde.profile_photo,
        status: bde.status,
        kyc_status: kyc.kyc_status,
        is_first_login: bde.is_first_login,
        state_name: bde.state_name,
        district_name: bde.district_name,
        joining_date: bde.joining_date,
      },
    });
  } catch (error) {
    console.error('[login_bde Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. BDE LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
exports.logout_bde = async (req, res) => {
  try {
    res.clearCookie('bde_access_token');
    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[logout_bde Error]', error);
    return res.status(500).json({ status: 'error', message: 'Logout failed', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. CHANGE PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
exports.change_password = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long',
      });
    }

    const bde = await BDEProfile.findById(req.user.id).select('+password_hash');
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    // If not first login, verify current password
    if (!bde.is_first_login && current_password) {
      const isMatch = await bcrypt.compare(current_password, bde.password_hash || '');
      if (!isMatch) {
        return res.status(400).json({ status: 'error', message: 'Current password does not match' });
      }
    }

    const newHash = await bcrypt.hash(new_password, 10);
    bde.password_hash = newHash;
    bde.is_first_login = false;
    bde.token_version = (bde.token_version || 0) + 1;
    await bde.save();

    // Re-issue new token
    const token = generate_token({
      id: bde._id.toString(),
      bde_id: bde.bde_id,
      email: bde.email,
      full_name: bde.full_name,
      role: 'bde',
      token_version: bde.token_version,
    });

    res.cookie('bde_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await BDEActivityLog.create({
      bde_id: bde._id,
      actor_type: 'bde',
      actor_id: bde._id,
      actor_name: bde.full_name,
      action: 'PASSWORD_CHANGED',
      notes: 'Password updated successfully',
      ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
      user_agent: req.headers['user-agent'],
    });

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
      token,
      is_first_login: false,
    });
  } catch (error) {
    console.error('[change_password Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to change password', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. FORGOT PASSWORD REQUEST
// ─────────────────────────────────────────────────────────────────────────────
exports.forgot_password = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ status: 'error', message: 'Email or Mobile number is required' });
    }

    const clean = String(identifier).trim();
    const bde = await BDEProfile.findOne({
      $or: [{ email: clean.toLowerCase() }, { mobile_number: clean }],
      deleted_at: null,
    });

    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'No registered BDE found with this identifier' });
    }

    // In local / test environment, return clear instructions
    return res.status(200).json({
      status: 'success',
      message: 'Password reset request submitted. Please contact your Solarkits Administrator to reset your temporary password.',
    });
  } catch (error) {
    console.error('[forgot_password Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to process forgot password request', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET LOGGED-IN BDE PROFILE (ME)
// ─────────────────────────────────────────────────────────────────────────────
exports.get_bde_me = async (req, res) => {
  try {
    const bdeId = req.user.id;

    const [bde, kyc, territory, plans] = await Promise.all([
      BDEProfile.findById(bdeId).lean(),
      BDEKYC.findOne({ bde_id: bdeId }).lean(),
      BDETerritoryAssignment.findOne({ bde_id: bdeId, status: 'active' }).lean(),
      BDEPlanAssignment.findOne({ bde_id: bdeId, status: 'active' }).populate('plan_ids').lean(),
    ]);

    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        id: bde._id,
        bde_id: bde.bde_id,
        full_name: bde.full_name,
        profile_photo: bde.profile_photo,
        email: bde.email,
        mobile_number: bde.mobile_number,
        address: bde.address,
        country_name: bde.country_name,
        state_id: bde.state_id,
        state_name: territory ? territory.state_name : bde.state_name,
        district_id: bde.district_id,
        district_name: bde.district_name,
        joining_date: bde.joining_date,
        status: bde.status,
        is_first_login: bde.is_first_login,
        kyc: kyc ? {
          kyc_status: kyc.kyc_status,
          aadhaar_masked: maskAadhaar(kyc.aadhaar_number),
          pan_masked: maskPan(kyc.pan_number),
          verified_at: kyc.verified_at,
        } : null,
        territory: territory ? {
          state_name: territory.state_name,
          district_names: territory.district_names,
          priority: territory.priority,
          start_date: territory.assignment_start_date,
        } : null,
        plans: plans ? plans.plan_names : [],
      },
    });
  } catch (error) {
    console.error('[get_bde_me Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. UPDATE LOGGED-IN BDE PROFILE
// ─────────────────────────────────────────────────────────────────────────────
exports.update_bde_me = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { address, profile_photo } = req.body;

    const bde = await BDEProfile.findById(bdeId);
    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE profile not found' });
    }

    if (address !== undefined) bde.address = address ? address.trim() : null;
    if (profile_photo !== undefined) bde.profile_photo = profile_photo;
    await bde.save();

    await BDEActivityLog.create({
      bde_id: bde._id,
      actor_type: 'bde',
      actor_id: bde._id,
      actor_name: bde.full_name,
      action: 'PROFILE_UPDATED',
      notes: 'BDE updated self profile address / photo',
      ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
      user_agent: req.headers['user-agent'],
    });

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        address: bde.address,
        profile_photo: bde.profile_photo,
      },
    });
  } catch (error) {
    console.error('[update_bde_me Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET BDE DASHBOARD DATA
// ─────────────────────────────────────────────────────────────────────────────
exports.get_bde_dashboard = async (req, res) => {
  try {
    const bdeId = req.user.id;

    const [
      bde,
      kyc,
      territory,
      plans,
      goal,
      notifications,
      recentAssignments,
    ] = await Promise.all([
      BDEProfile.findById(bdeId).lean(),
      BDEKYC.findOne({ bde_id: bdeId }).lean(),
      BDETerritoryAssignment.findOne({ bde_id: bdeId, status: 'active' }).lean(),
      BDEPlanAssignment.findOne({ bde_id: bdeId, status: 'active' }).populate('plan_ids').lean(),
      BDEGoal.findOne({ bde_id: bdeId, status: 'active' }).sort({ createdAt: -1 }).lean(),
      BDENotification.find({ bde_id: bdeId }).sort({ createdAt: -1 }).limit(5).lean(),
      BDETerritoryAssignment.find({ bde_id: bdeId }).sort({ createdAt: -1 }).limit(3).lean(),
    ]);

    if (!bde) {
      return res.status(404).json({ status: 'error', message: 'BDE not found' });
    }

    const assignedDistricts = territory ? territory.district_names : [];
    const assignedPlans = plans ? plans.plan_names : [];

    const monthlyGoal = goal?.monthly_franchisee_signup_goal || 0;
    const monthlyAchieved = goal?.monthly_signup_achieved || 0;
    const quarterlyGoal = goal?.quarterly_franchisee_signup_goal || 0;
    const quarterlyAchieved = goal?.quarterly_signup_achieved || 0;
    const storeGoal = goal?.operational_store_goal || 0;
    const storeAchieved = goal?.operational_store_achieved || 0;

    const monthlyProgressPercent = monthlyGoal > 0 ? Math.min(100, Math.round((monthlyAchieved / monthlyGoal) * 100)) : 0;
    const quarterlyProgressPercent = quarterlyGoal > 0 ? Math.min(100, Math.round((quarterlyAchieved / quarterlyGoal) * 100)) : 0;

    const bdeMetrics = await getBdeDashboardMetrics(bdeId);

    return res.status(200).json({
      status: 'success',
      data: {
        bde: {
          id: bde._id,
          bde_id: bde.bde_id,
          full_name: bde.full_name,
          profile_photo: bde.profile_photo,
          email: bde.email,
          mobile_number: bde.mobile_number,
          status: bde.status,
          kyc_status: kyc ? kyc.kyc_status : 'pending',
          joining_date: bde.joining_date,
        },
        territory: {
          state_name: territory ? territory.state_name : 'No State Assigned',
          districts: assignedDistricts,
          district_count: assignedDistricts.length,
          priority: territory?.priority || 'medium',
          start_date: territory?.assignment_start_date || null,
        },
        plans: {
          assigned_plans: assignedPlans,
          count: assignedPlans.length,
          plan_details: plans?.plan_ids || [],
        },
        goals: {
          period_type: goal?.period_type || 'monthly',
          month: goal?.month || (new Date().getMonth() + 1),
          quarter: goal?.quarter || (Math.floor(new Date().getMonth() / 3) + 1),
          year: goal?.year || new Date().getFullYear(),
          monthly_signup_goal: monthlyGoal,
          monthly_signup_achieved: monthlyAchieved,
          monthly_progress_percent: monthlyProgressPercent,
          quarterly_signup_goal: quarterlyGoal,
          quarterly_signup_achieved: quarterlyAchieved,
          quarterly_progress_percent: quarterlyProgressPercent,
          operational_store_goal: storeGoal,
          operational_store_achieved: storeAchieved,
        },
        metrics: bdeMetrics,
        notifications,
        recent_assignments: recentAssignments,
      },
    });
  } catch (error) {
    console.error('[get_bde_dashboard Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
exports.get_notifications = async (req, res) => {
  try {
    const notifications = await BDENotification.find({ bde_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await BDENotification.countDocuments({ bde_id: req.user.id, is_read: false });

    return res.status(200).json({
      status: 'success',
      data: notifications,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error('[get_notifications Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch notifications', error: error.message });
  }
};

exports.mark_notification_read = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await BDENotification.updateMany({ bde_id: req.user.id, is_read: false }, { $set: { is_read: true, read_at: new Date() } });
    } else {
      await BDENotification.updateOne({ _id: id, bde_id: req.user.id }, { $set: { is_read: true, read_at: new Date() } });
    }

    return res.status(200).json({ status: 'success', message: 'Notification(s) marked as read' });
  } catch (error) {
    console.error('[mark_notification_read Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update notification', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. STRICTLY SCOPED TERRITORY, PLANS, GOALS
// ─────────────────────────────────────────────────────────────────────────────
exports.get_my_territory = async (req, res) => {
  try {
    const territory = await BDETerritoryAssignment.findOne({ bde_id: req.user.id, status: 'active' }).lean();
    return res.status(200).json({
      status: 'success',
      data: territory,
    });
  } catch (error) {
    console.error('[get_my_territory Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch territory', error: error.message });
  }
};

exports.get_my_plans = async (req, res) => {
  try {
    const plans = await BDEPlanAssignment.findOne({ bde_id: req.user.id, status: 'active' })
      .populate('plan_ids')
      .lean();
    return res.status(200).json({
      status: 'success',
      data: plans,
    });
  } catch (error) {
    console.error('[get_my_plans Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch plans', error: error.message });
  }
};

exports.get_my_goals = async (req, res) => {
  try {
    const goals = await BDEGoal.find({ bde_id: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      status: 'success',
      data: {
        current: goals.find(g => g.status === 'active') || goals[0] || null,
        history: goals,
      },
    });
  } catch (error) {
    console.error('[get_my_goals Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch goals', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. ATTRIBUTED STORE SETUPS (View-Only for BDE)
// ─────────────────────────────────────────────────────────────────────────────
exports.get_my_store_setups = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const setups = await StoreSetup.find({
      $or: [{ current_bde_id: bdeId }, { original_bde_id: bdeId }],
    })
      .sort({ created_at: -1 })
      .populate('assigned_employee_id', 'name email phone')
      .lean();

    return res.status(200).json({
      status: 'success',
      data: setups,
    });
  } catch (error) {
    console.error('[get_my_store_setups Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch store setups', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. STEP 2: BDE LEADS & PIPELINE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
exports.create_bde_lead = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const lead = await createLead(req.body, bdeId);
    return res.status(201).json({
      status: 'success',
      data: lead,
      message: `Lead ${lead.lead_id} successfully created.`,
    });
  } catch (err) {
    console.error('[create_bde_lead Error]', err);
    return res.status(err.statusCode || 500).json({ status: 'error', message: err.message || 'Failed to create lead' });
  }
};

exports.list_bde_leads = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { search, stage, page = 1, limit = 10 } = req.query;
    const query = { current_bde_id: bdeId, deleted_at: null };
    if (stage) query.lead_status = stage;
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { lead_id: { $regex: s, $options: 'i' } },
        { prospect_name: { $regex: s, $options: 'i' } },
        { company_name: { $regex: s, $options: 'i' } },
        { mobile_number: { $regex: s, $options: 'i' } },
        { gst_number: { $regex: s, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [leads, total] = await Promise.all([
      BDELead.find(query)
        .populate('interested_plan_id', 'name code')
        .populate('franchisee_id', 'reseller_code activation_status agreement_status fee_payment_status is_operational')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      BDELead.countDocuments(query),
    ]);
    return res.status(200).json({
      status: 'success',
      data: leads,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    });
  } catch (err) {
    console.error('[list_bde_leads Error]', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to list leads' });
  }
};

exports.get_bde_lead_detail = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { id } = req.params;
    const lead = await BDELead.findOne({ _id: id, current_bde_id: bdeId, deleted_at: null })
      .populate('interested_plan_id')
      .populate('franchisee_id')
      .lean();
    if (!lead) return res.status(404).json({ status: 'error', message: 'Lead not found or not assigned to you' });
    const [activities, followUps] = await Promise.all([
      BDELeadActivity.find({ lead_id: id }).sort({ created_at: -1 }).lean(),
      BDEFollowUp.find({ lead_id: id }).sort({ follow_up_date: -1 }).lean(),
    ]);
    return res.status(200).json({
      status: 'success',
      data: { lead, activities, follow_ups: followUps },
    });
  } catch (err) {
    console.error('[get_bde_lead_detail Error]', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to get lead details' });
  }
};

exports.update_bde_lead = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { id } = req.params;
    const lead = await BDELead.findOne({ _id: id, current_bde_id: bdeId });
    if (!lead) return res.status(404).json({ status: 'error', message: 'Lead not found' });
    const { prospect_name, company_name, email, mobile_number, gst_number, state_name, district_name, address_line, pincode, interested_plan_id, interested_plan_name, bde_remarks } = req.body;
    if (prospect_name !== undefined) lead.prospect_name = prospect_name;
    if (company_name !== undefined) lead.company_name = company_name;
    if (email !== undefined) lead.email = email;
    if (mobile_number !== undefined) lead.mobile_number = mobile_number;
    if (gst_number !== undefined) lead.gst_number = gst_number ? gst_number.trim().toUpperCase() : null;
    if (state_name !== undefined) lead.state_name = state_name;
    if (district_name !== undefined) lead.district_name = district_name;
    if (address_line !== undefined) lead.address_line = address_line;
    if (pincode !== undefined) lead.pincode = pincode;
    if (interested_plan_id !== undefined) lead.interested_plan_id = interested_plan_id;
    if (interested_plan_name !== undefined) lead.interested_plan_name = interested_plan_name;
    if (bde_remarks !== undefined) lead.bde_remarks = bde_remarks;
    await lead.save();
    return res.status(200).json({ status: 'success', data: lead, message: 'Lead details updated successfully.' });
  } catch (err) {
    console.error('[update_bde_lead Error]', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to update lead' });
  }
};

exports.add_lead_activity = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { id } = req.params;
    const { activity_type, title, notes, location, next_follow_up_date } = req.body;
    const lead = await BDELead.findOne({ _id: id, current_bde_id: bdeId });
    if (!lead) return res.status(404).json({ status: 'error', message: 'Lead not found' });
    const bde = await BDEProfile.findById(bdeId).lean();
    const act = await BDELeadActivity.create({
      lead_id: lead._id,
      bde_id: bdeId,
      bde_name: bde ? bde.full_name : 'BDE',
      activity_type: activity_type || 'note',
      title: title || 'Call / Meeting Note',
      notes: notes || '',
      location: location || null,
      next_follow_up_date: next_follow_up_date ? new Date(next_follow_up_date) : null,
    });
    if (next_follow_up_date) {
      lead.next_follow_up_date = new Date(next_follow_up_date);
      await lead.save();
      await BDEFollowUp.create({
        lead_id: lead._id,
        bde_id: bdeId,
        follow_up_date: new Date(next_follow_up_date),
        purpose: title || 'Scheduled Follow-up Call',
        status: 'scheduled',
      });
    }
    return res.status(201).json({ status: 'success', data: act, message: 'Activity note saved.' });
  } catch (err) {
    console.error('[add_lead_activity Error]', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to save activity' });
  }
};

exports.schedule_follow_up = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { id } = req.params;
    const { follow_up_date, follow_up_time, purpose } = req.body;
    const lead = await BDELead.findOne({ _id: id, current_bde_id: bdeId });
    if (!lead) return res.status(404).json({ status: 'error', message: 'Lead not found' });
    const followUp = await BDEFollowUp.create({
      lead_id: lead._id,
      bde_id: bdeId,
      follow_up_date: new Date(follow_up_date),
      follow_up_time: follow_up_time || '11:00 AM',
      purpose: purpose || 'Prospect Follow-up',
      status: 'scheduled',
    });
    lead.next_follow_up_date = new Date(follow_up_date);
    if (lead.lead_status === 'new_lead') {
      lead.lead_status = 'follow_up_scheduled';
    }
    await lead.save();
    return res.status(201).json({ status: 'success', data: followUp, message: 'Follow-up scheduled.' });
  } catch (err) {
    console.error('[schedule_follow_up Error]', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to schedule follow-up' });
  }
};

exports.update_lead_stage = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { id } = req.params;
    const { new_stage, reason, notes } = req.body;
    const disallowed = ['approved', 'agreement_signed', 'fee_paid'];
    if (disallowed.includes(new_stage)) {
      return res.status(403).json({
        status: 'error',
        message: `BDE cannot manually advance lead to stage "${new_stage}". This milestone requires formal verification from Onboarding.`,
      });
    }
    if (['lost', 'rejected'].includes(new_stage) && (!reason || !reason.trim())) {
      return res.status(400).json({
        status: 'error',
        message: `A specific reason is mandatory when marking a lead as ${new_stage.toUpperCase()}.`,
      });
    }
    const lead = await BDELead.findOne({ _id: id, current_bde_id: bdeId });
    if (!lead) return res.status(404).json({ status: 'error', message: 'Lead not found' });
    const prev = lead.lead_status;
    lead.lead_status = new_stage;
    if (new_stage === 'lost') lead.lost_reason = reason;
    if (new_stage === 'rejected') lead.rejection_reason = reason;
    await lead.save();
    await BDELeadActivity.create({
      lead_id: lead._id,
      bde_id: bdeId,
      activity_type: 'stage_change',
      title: `Lead Stage Changed to ${new_stage.replace(/_/g, ' ').toUpperCase()}`,
      notes: notes || reason || `Status updated from ${prev} to ${new_stage}`,
      previous_stage: prev,
      new_stage: new_stage,
    });
    return res.status(200).json({ status: 'success', data: lead, message: `Lead stage updated to ${new_stage}.` });
  } catch (err) {
    console.error('[update_lead_stage Error]', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to update lead stage' });
  }
};

exports.start_franchisee_signup = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { id } = req.params;
    const result = await startFranchiseeSignup(id, bdeId);
    return res.status(200).json({
      status: 'success',
      data: result,
      message: result.message,
    });
  } catch (err) {
    console.error('[start_franchisee_signup Error]', err);
    return res.status(err.statusCode || 500).json({ status: 'error', message: err.message || 'Failed to start signup' });
  }
};

exports.get_bde_pipeline = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const leads = await BDELead.find({ current_bde_id: bdeId, deleted_at: null })
      .populate('interested_plan_id', 'name code')
      .populate('franchisee_id', 'reseller_code activation_status agreement_status fee_payment_status is_operational')
      .sort({ updated_at: -1 })
      .lean();

    const stages = [
      'new_lead',
      'contacted',
      'follow_up_scheduled',
      'interested',
      'signup_started',
      'gst_verification_pending',
      'admin_review_pending',
      'approved',
      'agreement_pending',
      'agreement_signed',
      'fee_payment_pending',
      'fee_paid',
      'rejected',
      'lost',
    ];

    const grouped = {};
    stages.forEach((st) => {
      grouped[st] = leads.filter((l) => l.lead_status === st);
    });

    return res.status(200).json({
      status: 'success',
      data: {
        total_leads: leads.length,
        grouped,
        all_leads: leads,
      },
    });
  } catch (err) {
    console.error('[get_bde_pipeline Error]', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch pipeline', error: err.message });
  }
};

exports.get_my_franchisees = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const franchisees = await Reseller.find({
      $or: [{ bde_id: bdeId }, { original_bde_id: bdeId }],
    })
      .populate('lead_id', 'lead_id lead_source created_at')
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      data: franchisees,
    });
  } catch (err) {
    console.error('[get_my_franchisees Error]', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch franchisees', error: err.message });
  }
};
