/**
 * bde.portal.handler.js
 *
 * Comprehensive Controller for SolarKits BDE Portal APIs.
 * Covers:
 * 1. BDE Auth & Profile
 * 2. Scoped Territory, Goals & Notifications
 * 3. State & District Territory Dashboard
 * 4. Dedicated EPC Leads Management (10-stage lifecycle)
 * 5. GST-Based EPC Onboarding & Duplicate Prevention
 * 6. District-Matched Franchisee Assignment & In-App Notification
 * 7. Franchisee Goal vs Achievement Tracking (6 Performance Tiers)
 * 8. Franchisee Order History & Territory PO Explorer
 * 9. Highest / Average / Lowest Selling Kit Sales Analytics
 * 10. Territory Franchisee Performance Ranking Leaderboard
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
  ResellerTerritory,
  StoreSetup,
  StoreSetupChecklist,
  StoreSetupDelay,
  StoreSetupVerification,
  EpcAccount,
  EpcResellerRelationship,
  EPCLead,
  FranchiseeKitTarget,
  FranchiseeTargetProgress,
  FpoOrder,
  EpcOrder,
  WarehouseComboKit,
  FranchiseeAlert,
} = require('../../admin-panel/models/india_solarshop_db');
const { EpcCompany } = require('../../admin-panel/models/india_core_db');
const { generate_token } = require('../utils/jsonwebtoken');
const {
  createLead,
  startFranchiseeSignup,
  getBdeDashboardMetrics,
} = require('../../admin-panel/services/bde.lead.service');
const { performGstVerification } = require('../../admin-panel/services/gst.verification.service');
const { resolveEffectiveTarget } = require('../../admin-panel/services/franchisee.goal.service');

// Helper to mask sensitive KYC fields
function maskAadhaar(val) {
  if (!val || val.length < 4) return 'XXXXXXXXXXXX';
  return 'XXXXXXXX' + val.slice(-4);
}

function maskPan(val) {
  if (!val || val.length < 4) return 'XXXXXXXXXX';
  return val.slice(0, 2) + 'XXXXXX' + val.slice(-2);
}

const GST_STATE_CODE_MAP = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

/**
 * Helper: Get BDE's active territory (state_id, state_name, district_names, district_ids)
 */
async function _getBdeTerritoryScope(bdeId) {
  const territory = await BDETerritoryAssignment.findOne({ bde_id: bdeId, status: 'active' }).lean();
  return territory || null;
}

/**
 * Helper: Generate next EPC Lead ID (EPC-LD-YYYY-XXXX)
 */
async function _generateNextEpcLeadId() {
  const year = new Date().getFullYear();
  const prefix = `EPC-LD-${year}-`;
  const lastLead = await EPCLead.findOne({
    lead_id: { $regex: `^${prefix}` },
  })
    .sort({ lead_id: -1 })
    .lean();

  let nextNum = 1;
  if (lastLead && lastLead.lead_id) {
    const parts = lastLead.lead_id.split('-');
    if (parts.length === 4) {
      const parsed = parseInt(parts[3], 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
  }
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTHENTICATION & PROFILE
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

    const isPasswordValid = await bcrypt.compare(password, bde.password_hash || '');
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid password. Please check your credentials.',
      });
    }

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

    const kyc = await BDEKYC.findOne({ bde_id: bde._id });
    if (!kyc || kyc.kyc_status !== 'verified') {
      const kycState = kyc ? kyc.kyc_status : 'missing';
      return res.status(403).json({
        status: 'error',
        message: `BDE login requires verified KYC. Your current KYC status is: "${kycState.toUpperCase()}". Please wait for Admin verification.`,
      });
    }

    if (bde.status !== 'active' && bde.status !== 'kyc_verified') {
      return res.status(403).json({
        status: 'error',
        message: `Your account is currently in "${bde.status}" status. It must be activated by Admin before you can log in.`,
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
    bde.last_login_at = new Date();
    bde.last_login_ip = clientIp;
    await bde.save();

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

    res.cookie('bde_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: (remember_me ? 30 : 7) * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      data: {
        id: bde._id,
        bde_id: bde.bde_id,
        full_name: bde.full_name,
        email: bde.email,
        mobile_number: bde.mobile_number,
        status: bde.status,
        is_first_login: bde.is_first_login,
      },
    });
  } catch (error) {
    console.error('[login_bde Error]', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error during login', error: error.message });
  }
};

exports.logout_bde = async (req, res) => {
  try {
    res.clearCookie('bde_access_token');
    return res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    console.error('[logout_bde Error]', error);
    return res.status(500).json({ status: 'error', message: 'Logout failed', error: error.message });
  }
};

exports.change_password = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters long' });
    }

    const bde = await BDEProfile.findById(req.user.id).select('+password_hash');
    if (!bde) return res.status(404).json({ status: 'error', message: 'BDE profile not found' });

    if (!bde.is_first_login && current_password) {
      const isMatch = await bcrypt.compare(current_password, bde.password_hash || '');
      if (!isMatch) return res.status(400).json({ status: 'error', message: 'Current password does not match' });
    }

    bde.password_hash = await bcrypt.hash(new_password, 10);
    bde.is_first_login = false;
    bde.token_version = (bde.token_version || 0) + 1;
    await bde.save();

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

    return res.status(200).json({ status: 'success', message: 'Password changed successfully', token });
  } catch (error) {
    console.error('[change_password Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to change password', error: error.message });
  }
};

exports.forgot_password = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ status: 'error', message: 'Email or Mobile number is required' });

    const clean = String(identifier).trim();
    const bde = await BDEProfile.findOne({
      $or: [{ email: clean.toLowerCase() }, { mobile_number: clean }],
      deleted_at: null,
    });
    if (!bde) return res.status(404).json({ status: 'error', message: 'No registered BDE found with this identifier' });

    return res.status(200).json({
      status: 'success',
      message: 'Password reset request submitted. Please contact your Solarkits Administrator to reset your password.',
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to process forgot password request', error: error.message });
  }
};

exports.get_bde_me = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const [bde, kyc, territory, plans] = await Promise.all([
      BDEProfile.findById(bdeId).lean(),
      BDEKYC.findOne({ bde_id: bdeId }).lean(),
      BDETerritoryAssignment.findOne({ bde_id: bdeId, status: 'active' }).lean(),
      BDEPlanAssignment.findOne({ bde_id: bdeId, status: 'active' }).populate('plan_ids').lean(),
    ]);

    if (!bde) return res.status(404).json({ status: 'error', message: 'BDE profile not found' });

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
          district_names: territory.district_names || [],
          priority: territory.priority,
          start_date: territory.assignment_start_date,
        } : null,
        plans: plans ? plans.plan_names : [],
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch profile', error: error.message });
  }
};

exports.update_bde_me = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { address, profile_photo } = req.body;
    const bde = await BDEProfile.findById(bdeId);
    if (!bde) return res.status(404).json({ status: 'error', message: 'BDE profile not found' });

    if (address !== undefined) bde.address = address ? address.trim() : null;
    if (profile_photo !== undefined) bde.profile_photo = profile_photo;
    await bde.save();

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { address: bde.address, profile_photo: bde.profile_photo },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SCOPED ASSIGNMENTS & NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
exports.get_my_territory = async (req, res) => {
  try {
    const territory = await BDETerritoryAssignment.findOne({ bde_id: req.user.id, status: 'active' }).lean();
    return res.status(200).json({ status: 'success', data: territory });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch territory', error: err.message });
  }
};

exports.get_my_plans = async (req, res) => {
  try {
    const plans = await BDEPlanAssignment.findOne({ bde_id: req.user.id, status: 'active' }).populate('plan_ids').lean();
    return res.status(200).json({ status: 'success', data: plans });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch plans', error: err.message });
  }
};

exports.get_my_goals = async (req, res) => {
  try {
    const goals = await BDEGoal.find({ bde_id: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ status: 'success', data: goals });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch goals', error: err.message });
  }
};

exports.get_notifications = async (req, res) => {
  try {
    const notifications = await BDENotification.find({ bde_id: req.user.id }).sort({ createdAt: -1 }).limit(30).lean();
    const unreadCount = await BDENotification.countDocuments({ bde_id: req.user.id, is_read: false });
    return res.status(200).json({ status: 'success', data: notifications, unread_count: unreadCount });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch notifications', error: error.message });
  }
};

exports.mark_notification_read = async (req, res) => {
  try {
    const { id } = req.params;
    await BDENotification.findOneAndUpdate({ _id: id, bde_id: req.user.id }, { is_read: true, read_at: new Date() });
    return res.status(200).json({ status: 'success', message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update notification', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. STATE & DISTRICT TERRITORY DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
exports.get_bde_dashboard = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const [bde, kyc, territory, plans, goal, notifications] = await Promise.all([
      BDEProfile.findById(bdeId).lean(),
      BDEKYC.findOne({ bde_id: bdeId }).lean(),
      BDETerritoryAssignment.findOne({ bde_id: bdeId, status: 'active' }).lean(),
      BDEPlanAssignment.findOne({ bde_id: bdeId, status: 'active' }).populate('plan_ids').lean(),
      BDEGoal.findOne({ bde_id: bdeId, status: 'active' }).sort({ createdAt: -1 }).lean(),
      BDENotification.find({ bde_id: bdeId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    if (!bde) return res.status(404).json({ status: 'error', message: 'BDE not found' });

    const assignedDistricts = territory?.district_names || [];
    const stateName = territory?.state_name || bde.state_name || 'Assigned Territory';
    const stateId = territory?.state_id || bde.state_id;

    // ── Territory Aggregation ──
    const resellerQuery = {
      deleted_at: null,
      $or: [
        { bde_id: bdeId },
        { 'address.state_name': new RegExp(`^${stateName}$`, 'i') },
      ],
    };
    if (assignedDistricts.length > 0) {
      resellerQuery.$or.push({ 'address.district_name': { $in: assignedDistricts } });
    }

    const territoryFranchisees = await Reseller.find(resellerQuery).lean();
    const totalFranchisees = territoryFranchisees.length;
    const operationalFranchisees = territoryFranchisees.filter((f) => f.is_operational).length;
    const franchiseesUnderSetup = Math.max(0, totalFranchisees - operationalFranchisees);

    const franchiseeIds = territoryFranchisees.map((f) => f._id);

    // EPC Leads in territory / by BDE
    const epcLeadsCount = await EPCLead.countDocuments({
      deleted_at: null,
      $or: [{ current_bde_id: bdeId }, { state_name: new RegExp(`^${stateName}$`, 'i') }],
    });

    const epcsOnboardedCount = await EPCLead.countDocuments({
      deleted_at: null,
      lead_status: { $in: ['Onboarded', 'Assigned to Franchisee'] },
      $or: [{ current_bde_id: bdeId }, { state_name: new RegExp(`^${stateName}$`, 'i') }],
    });

    const epcsAssignedCount = await EPCLead.countDocuments({
      deleted_at: null,
      lead_status: 'Assigned to Franchisee',
      $or: [{ current_bde_id: bdeId }, { state_name: new RegExp(`^${stateName}$`, 'i') }],
    });

    // PO & Kit orders in territory
    const fpoOrders = await FpoOrder.find({
      reseller_id: { $in: franchiseeIds },
      status: { $nin: ['CANCELLED', 'EXPIRED'] },
    }).lean();

    const totalOrdersCount = fpoOrders.length;
    let totalKitsOrdered = 0;
    fpoOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        totalKitsOrdered += Number(item.quantity || 0);
      });
    });

    // ── District Breakdown Table ──
    const districtBreakdown = await Promise.all(
      (assignedDistricts.length > 0 ? assignedDistricts : ['Central District']).map(async (dName) => {
        const dFranchisees = territoryFranchisees.filter(
          (f) => f.address?.district_name && f.address.district_name.toLowerCase().trim() === dName.toLowerCase().trim()
        );
        const dFranchiseeIds = dFranchisees.map((f) => f._id);

        const [dLeads, dOnboarded, dOrders] = await Promise.all([
          EPCLead.countDocuments({
            deleted_at: null,
            district_name: new RegExp(`^${dName}$`, 'i'),
          }),
          EPCLead.countDocuments({
            deleted_at: null,
            district_name: new RegExp(`^${dName}$`, 'i'),
            lead_status: { $in: ['Onboarded', 'Assigned to Franchisee'] },
          }),
          FpoOrder.find({
            reseller_id: { $in: dFranchiseeIds },
            status: { $nin: ['CANCELLED', 'EXPIRED'] },
          }).lean(),
        ]);

        let dKits = 0;
        dOrders.forEach((o) => {
          (o.items || []).forEach((it) => {
            dKits += Number(it.quantity || 0);
          });
        });

        // Target for this district
        const dTarget = dFranchisees.length > 0 ? dFranchisees.length * 10 : 20;
        const dAchievement = dTarget > 0 ? Math.round((dKits / dTarget) * 100) : 0;

        return {
          district: dName,
          franchisees_count: dFranchisees.length,
          operational_count: dFranchisees.filter((f) => f.is_operational).length,
          epc_leads_count: dLeads,
          epcs_onboarded_count: dOnboarded,
          kits_ordered_count: dKits,
          monthly_goal: dTarget,
          goal_achievement_pct: dAchievement,
        };
      })
    );

    // Goal Metrics
    const monthlyGoal = goal?.monthly_franchisee_signup_goal || 0;
    const monthlyAchieved = goal?.monthly_signup_achieved || 0;
    const monthlyPct = monthlyGoal > 0 ? Math.min(100, Math.round((monthlyAchieved / monthlyGoal) * 100)) : 0;

    const monthlyEpcGoal = goal?.monthly_epc_lead_goal || 25;
    const monthlyEpcOnboardGoal = goal?.monthly_epc_onboard_goal || 10;
    const monthlyKitGoal = goal?.monthly_network_kit_goal || 250;

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
          state_name: stateName,
          districts: assignedDistricts,
          district_names: assignedDistricts,
          district_count: assignedDistricts.length,
          priority: territory?.priority || 'medium',
          start_date: territory?.assignment_start_date || null,
        },
        state_summary: {
          total_assigned_districts: assignedDistricts.length,
          total_franchisees: totalFranchisees,
          operational_franchisees: operationalFranchisees,
          franchisees_under_setup: franchiseesUnderSetup,
          epc_leads: epcLeadsCount,
          epcs_onboarded: epcsOnboardedCount,
          epcs_assigned: epcsAssignedCount,
          total_orders: totalOrdersCount,
          total_kits_ordered: totalKitsOrdered,
        },
        district_breakdown: districtBreakdown,
        goals: {
          monthly_franchisee_signup_goal: monthlyGoal,
          monthly_signup_achieved: monthlyAchieved,
          monthly_signup_progress_pct: monthlyPct,
          monthly_epc_lead_goal: monthlyEpcGoal,
          monthly_epc_leads_achieved: epcLeadsCount,
          monthly_epc_onboard_goal: monthlyEpcOnboardGoal,
          monthly_epc_onboarded_achieved: epcsOnboardedCount,
          monthly_network_kit_goal: monthlyKitGoal,
          monthly_network_kits_achieved: totalKitsOrdered,
          network_kit_achievement_pct: monthlyKitGoal > 0 ? Math.round((totalKitsOrdered / monthlyKitGoal) * 100) : 0,
        },
        notifications,
      },
    });
  } catch (error) {
    console.error('[get_bde_dashboard Error]', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard data', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. EPC LEADS MANAGEMENT (10-Stage Lifecycle)
// ─────────────────────────────────────────────────────────────────────────────
exports.create_epc_lead = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const {
      company_name,
      contact_person,
      mobile_number,
      email,
      gst_number,
      state_name,
      district_name,
      pincode,
      address_line,
      lead_source,
      interested_products,
      follow_up_date,
      remarks,
    } = req.body;

    if (!company_name || !contact_person || !mobile_number || !email || !state_name || !district_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Company name, contact person, mobile, email, state, and district are required.',
      });
    }

    const cleanMobile = mobile_number.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanGst = gst_number ? gst_number.trim().toUpperCase() : null;

    // Check duplicate in EPC leads
    const dupQuery = {
      deleted_at: null,
      $or: [{ mobile_number: cleanMobile }, { email: cleanEmail }],
    };
    if (cleanGst) dupQuery.$or.push({ gst_number: cleanGst });

    const existingLead = await EPCLead.findOne(dupQuery).lean();
    if (existingLead) {
      return res.status(409).json({
        status: 'error',
        message: `An EPC lead already exists with these credentials (${existingLead.lead_id} - ${existingLead.company_name}).`,
      });
    }

    // Check duplicate in EPC accounts
    if (cleanGst) {
      const existingAccount = await EpcAccount.findOne({ gstin: cleanGst, deleted_at: null }).lean();
      if (existingAccount) {
        return res.status(409).json({
          status: 'error',
          message: `An onboarded EPC account with GSTIN ${cleanGst} already exists in the system.`,
        });
      }
    }

    const leadId = await _generateNextEpcLeadId();

    const newLead = await EPCLead.create({
      lead_id: leadId,
      company_name: company_name.trim(),
      contact_person: contact_person.trim(),
      mobile_number: cleanMobile,
      email: cleanEmail,
      gst_number: cleanGst,
      gst_verified: false,
      state_name: state_name.trim(),
      district_name: district_name.trim(),
      pincode: pincode ? pincode.trim() : null,
      address_line: address_line ? address_line.trim() : null,
      lead_source: lead_source || 'direct_visit',
      interested_products: Array.isArray(interested_products) ? interested_products : [],
      created_by_bde_id: bdeId,
      current_bde_id: bdeId,
      lead_status: 'New',
      follow_up_date: follow_up_date ? new Date(follow_up_date) : null,
      remarks: remarks ? remarks.trim() : null,
      history: [
        {
          activity_type: 'note',
          notes: `EPC Lead created by BDE ${req.user.full_name} (${req.user.bde_id})`,
          actor_id: bdeId,
          actor_name: req.user.full_name,
          new_status: 'New',
        },
      ],
    });

    await BDEActivityLog.create({
      bde_id: bdeId,
      actor_type: 'bde',
      actor_id: bdeId,
      actor_name: req.user.full_name,
      action: 'EPC_LEAD_CREATED',
      notes: `Generated EPC Lead: ${leadId} (${company_name}) in ${district_name}, ${state_name}`,
    });

    return res.status(201).json({
      status: 'success',
      message: `EPC Lead ${leadId} successfully created.`,
      data: newLead,
    });
  } catch (err) {
    console.error('[create_epc_lead Error]', err);
    return res.status(500).json({ status: 'error', message: 'Failed to create EPC lead', error: err.message });
  }
};

exports.list_epc_leads = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { search = '', status = '', district = '', state = '', franchisee = '', page = 1, limit = 50 } = req.query;

    const territory = await _getBdeTerritoryScope(bdeId);
    const stateName = territory?.state_name;
    const districtNames = territory?.district_names || [];

    const query = { deleted_at: null };

    // Scoping
    if (stateName) {
      query.$or = [{ current_bde_id: bdeId }, { state_name: new RegExp(`^${stateName}$`, 'i') }];
    } else {
      query.current_bde_id = bdeId;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$and = [
        {
          $or: [
            { company_name: { $regex: s, $options: 'i' } },
            { contact_person: { $regex: s, $options: 'i' } },
            { mobile_number: { $regex: s, $options: 'i' } },
            { email: { $regex: s, $options: 'i' } },
            { gst_number: { $regex: s, $options: 'i' } },
            { lead_id: { $regex: s, $options: 'i' } },
          ],
        },
      ];
    }

    if (status && status !== 'all') {
      query.lead_status = status;
    }
    if (district && district !== 'all') {
      query.district_name = new RegExp(`^${district}$`, 'i');
    }
    if (state && state !== 'all') {
      query.state_name = new RegExp(`^${state}$`, 'i');
    }
    if (franchisee && franchisee !== 'all') {
      query.assigned_franchisee_id = franchisee;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [leads, total] = await Promise.all([
      EPCLead.find(query)
        .populate('assigned_franchisee_id', 'business_name reseller_code mobile')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      EPCLead.countDocuments(query),
    ]);

    // Counts per status stage
    const stages = [
      'New',
      'Contacted',
      'Interested',
      'Follow-up',
      'Onboarding Started',
      'GST Verification Pending',
      'Onboarded',
      'Assigned to Franchisee',
      'Not Interested',
      'Closed',
    ];

    const stageCounts = {};
    for (const st of stages) {
      stageCounts[st] = await EPCLead.countDocuments({ ...query, lead_status: st });
    }

    return res.status(200).json({
      status: 'success',
      data: leads,
      stage_counts: stageCounts,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
      territory: {
        state_name: stateName,
        district_names: districtNames,
      },
    });
  } catch (err) {
    console.error('[list_epc_leads Error]', err);
    return res.status(500).json({ status: 'error', message: 'Failed to list EPC leads', error: err.message });
  }
};

exports.get_epc_lead_detail = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await EPCLead.findOne({ _id: id, deleted_at: null })
      .populate('assigned_franchisee_id')
      .populate('created_by_bde_id', 'full_name bde_id email')
      .populate('onboarded_epc_account_id')
      .lean();

    if (!lead) return res.status(404).json({ status: 'error', message: 'EPC lead not found' });
    return res.status(200).json({ status: 'success', data: lead });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch lead detail', error: err.message });
  }
};

exports.update_epc_lead = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    delete updateData.lead_id; // immutable
    delete updateData.created_by_bde_id;

    const lead = await EPCLead.findOneAndUpdate({ _id: id, deleted_at: null }, { $set: updateData }, { new: true });
    if (!lead) return res.status(404).json({ status: 'error', message: 'EPC lead not found' });

    return res.status(200).json({ status: 'success', message: 'Lead updated successfully', data: lead });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to update EPC lead', error: err.message });
  }
};

exports.schedule_epc_follow_up = async (req, res) => {
  try {
    const { id } = req.params;
    const { follow_up_date, notes } = req.body;

    if (!follow_up_date) {
      return res.status(400).json({ status: 'error', message: 'follow_up_date is required' });
    }

    const lead = await EPCLead.findOne({ _id: id, deleted_at: null });
    if (!lead) return res.status(404).json({ status: 'error', message: 'EPC lead not found' });

    const prevStatus = lead.lead_status;
    lead.follow_up_date = new Date(follow_up_date);
    if (lead.lead_status === 'New' || lead.lead_status === 'Contacted') {
      lead.lead_status = 'Follow-up';
    }

    lead.history.push({
      activity_type: 'follow_up',
      notes: notes || `Follow-up scheduled for ${new Date(follow_up_date).toLocaleDateString()}`,
      actor_id: req.user.id,
      actor_name: req.user.full_name,
      previous_status: prevStatus,
      new_status: lead.lead_status,
    });

    await lead.save();

    return res.status(200).json({
      status: 'success',
      message: 'Follow-up scheduled successfully',
      data: lead,
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to schedule follow-up', error: err.message });
  }
};

exports.update_epc_lead_status = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStages = [
      'New',
      'Contacted',
      'Interested',
      'Follow-up',
      'Onboarding Started',
      'GST Verification Pending',
      'Onboarded',
      'Assigned to Franchisee',
      'Not Interested',
      'Closed',
    ];

    if (!status || !validStages.includes(status)) {
      return res.status(400).json({ status: 'error', message: `Invalid status. Must be one of: ${validStages.join(', ')}` });
    }

    const lead = await EPCLead.findOne({ _id: id, deleted_at: null });
    if (!lead) return res.status(404).json({ status: 'error', message: 'EPC lead not found' });

    const prevStatus = lead.lead_status;
    lead.lead_status = status;

    lead.history.push({
      activity_type: 'status_change',
      notes: notes || `Status transitioned from "${prevStatus}" to "${status}"`,
      actor_id: req.user.id,
      actor_name: req.user.full_name,
      previous_status: prevStatus,
      new_status: status,
    });

    await lead.save();

    return res.status(200).json({
      status: 'success',
      message: `Lead status updated to ${status}`,
      data: lead,
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to update lead status', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. GST VERIFICATION & EPC ONBOARDING JOURNEY
// ─────────────────────────────────────────────────────────────────────────────
exports.verify_epc_gstin = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { gstin, lead_id } = req.body;

    if (!gstin) return res.status(400).json({ status: 'error', message: 'gstin is required' });

    const cleanGst = gstin.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(cleanGst)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid GSTIN format. Must be a 15-character alphanumeric GST number (e.g. 27ABCDE1234F1Z5).',
      });
    }

    // 1. Strict Duplicate Check across existing EpcAccounts
    const existingAccount = await EpcAccount.findOne({
      gstin: cleanGst,
      deleted_at: null,
    })
      .populate('onboarded_by_reseller_id', 'business_name reseller_code')
      .lean();

    if (existingAccount) {
      return res.status(409).json({
        status: 'error',
        message: `An EPC with GST number ${cleanGst} is already registered under "${existingAccount.name}" (Account: ${existingAccount.email}).`,
        existing_account: {
          id: existingAccount._id,
          name: existingAccount.name,
          email: existingAccount.email,
          franchisee: existingAccount.onboarded_by_reseller_id?.business_name || null,
        },
      });
    }

    // 2. Identify State from first 2 digits
    const stateCode = cleanGst.substring(0, 2);
    const resolvedStateName = GST_STATE_CODE_MAP[stateCode] || 'Unknown State';

    // 3. Call GST Verification Engine (Quick eKYC)
    const verification = await performGstVerification({
      gstin: cleanGst,
      entity_type: 'epc_buyer',
      verified_by: req.user.bde_id || String(bdeId),
      options: { provider: process.env.QUICKEKYC_PROVIDER || process.env.GST_VERIFY_PROVIDER || 'quickekyc' },
    });

    if (!verification.is_valid) {
      return res.status(400).json({
        status: 'error',
        message: `GST verification failed: ${verification.error_message}`,
        data: verification,
      });
    }

    const companyName = verification.company_name || verification.trade_name || verification.legal_name || '';
    const stateName = verification.state_name || resolvedStateName || 'Gujarat';
    const districtName = verification.district_name || verification.district || 'Ahmedabad';
    const address = verification.address || '';
    const pincode = verification.pincode || '';

    // If lead_id provided, update lead
    if (lead_id) {
      const lead = await EPCLead.findById(lead_id);
      if (lead) {
        lead.gst_number = cleanGst;
        lead.gst_verified = true;
        lead.gst_legal_name = verification.legal_name || null;
        lead.gst_trade_name = verification.trade_name || null;
        lead.lead_status = 'GST Verification Pending';
        lead.history.push({
          activity_type: 'gst_verification',
          notes: `GST ${cleanGst} verified successfully via Quick eKYC. Legal Name: ${companyName}`,
          actor_id: bdeId,
          actor_name: req.user.full_name,
        });
        await lead.save();
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `GST ${cleanGst} successfully verified via Quick eKYC.`,
      data: {
        gstin: cleanGst,
        is_valid: true,
        provider: verification.provider || 'quickekyc',
        legal_name: verification.legal_name,
        trade_name: verification.trade_name,
        company_name: companyName,
        state_code: stateCode,
        state_name: stateName,
        district_name: districtName,
        address: address,
        pincode: pincode,
        registration_status: verification.business_status || verification.gstin_status || 'Active',
      },
    });
  } catch (err) {
    console.error('[verify_epc_gstin Error]', err);
    return res.status(500).json({ status: 'error', message: 'GST verification encountered an error', error: err.message });
  }
};

exports.onboard_epc_with_gst = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const {
      lead_id,
      gstin,
      company_name,
      contact_person,
      mobile,
      email,
      password,
      state_name,
      district_name,
      address,
      pincode,
    } = req.body;

    if (!company_name || !email || !contact_person || !mobile) {
      return res.status(400).json({ status: 'error', message: 'Company name, contact person, mobile, and email are required' });
    }

    const cleanGst = gstin ? gstin.trim().toUpperCase() : null;
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();
    const cleanName = company_name.trim();

    // Duplicate Check
    if (cleanGst) {
      const existing = await EpcAccount.findOne({ gstin: cleanGst, deleted_at: null }).lean();
      if (existing) {
        return res.status(409).json({ status: 'error', message: `An EPC account with GSTIN ${cleanGst} already exists.` });
      }
    }

    const territory = await _getBdeTerritoryScope(bdeId);
    const resolvedState = state_name || territory?.state_name || 'Maharashtra';
    const resolvedDistrict = district_name || (territory?.district_names && territory.district_names[0]) || 'Pune';

    // 1. Create or Find EpcCompany in Core DB
    let epcCompany = await EpcCompany.findOne({ email: cleanEmail, deleted_at: null });
    if (!epcCompany) {
      epcCompany = await EpcCompany.create({
        name: cleanName,
        email: cleanEmail,
        source: 'bde_onboarding',
        working_states: territory?.state_id ? [territory.state_id] : [],
      });
    }

    // 2. Hash Password for EPC Account
    const initialPassword = password && password.trim() ? password.trim() : 'SolarEPC@2026';
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    // 3. Create EpcAccount
    const epcAccount = await EpcAccount.create({
      name: cleanName,
      contact_person: contact_person.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      whatsapp: cleanMobile,
      company_id: epcCompany._id,
      company_name: cleanName,
      gstin: cleanGst,
      password_hash: passwordHash,
      states: territory?.state_id ? [territory.state_id] : [],
      state_name: resolvedState,
      district_name: resolvedDistrict,
      address: address ? address.trim() : null,
      pincode: pincode ? pincode.trim() : null,
      status: 'active',
      is_email_verified: true,
      onboarding_source: 'bde',
      onboarded_by_bde_id: bdeId,
    });

    // 4. Update EPCLead if linked
    if (lead_id) {
      await EPCLead.findByIdAndUpdate(lead_id, {
        gst_number: cleanGst,
        gst_verified: true,
        lead_status: 'Onboarded',
        onboarded_at: new Date(),
        onboarded_epc_account_id: epcAccount._id,
        onboarded_epc_company_id: epcCompany._id,
      });
    }

    // Log Activity
    await BDEActivityLog.create({
      bde_id: bdeId,
      actor_type: 'bde',
      actor_id: bdeId,
      actor_name: req.user.full_name,
      action: 'EPC_ONBOARDED',
      notes: `Completed GST-based EPC Onboarding for "${cleanName}" (${cleanGst || 'No GST'}) in ${resolvedDistrict}, ${resolvedState}`,
    });

    return res.status(201).json({
      status: 'success',
      message: `EPC "${cleanName}" successfully onboarded. Proceed to assign a franchise partner.`,
      data: {
        epc_account_id: epcAccount._id,
        company_id: epcCompany._id,
        name: epcAccount.name,
        email: epcAccount.email,
        gstin: epcAccount.gstin,
        state_name: resolvedState,
        district_name: resolvedDistrict,
      },
    });
  } catch (err) {
    console.error('[onboard_epc_with_gst Error]', err);
    return res.status(500).json({ status: 'error', message: 'Failed to onboard EPC', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. DISTRICT-MATCHED FRANCHISEE ASSIGNMENT & NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
exports.get_eligible_franchisees_for_epc = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { district_name, state_name, search = '' } = req.query;

    const territory = await _getBdeTerritoryScope(bdeId);
    const resolvedState = state_name || territory?.state_name;

    const matchQuery = { deleted_at: null };
    if (resolvedState) {
      matchQuery.$or = [{ 'address.state_name': new RegExp(`^${resolvedState}$`, 'i') }, { bde_id: bdeId }];
    }

    if (search && search.trim()) {
      const s = search.trim();
      matchQuery.$and = [
        {
          $or: [
            { business_name: { $regex: s, $options: 'i' } },
            { reseller_code: { $regex: s, $options: 'i' } },
            { contact_person: { $regex: s, $options: 'i' } },
          ],
        },
      ];
    }

    const franchisees = await Reseller.find(matchQuery)
      .select('business_name email mobile reseller_code contact_person is_operational activation_status agreement_status address gst_number')
      .lean();

    const fIds = franchisees.map((f) => f._id);
    const activeAssignments = await EpcResellerRelationship.find({
      reseller_id: { $in: fIds },
      status: 'active',
    }).lean();

    const countMap = {};
    activeAssignments.forEach((a) => {
      const key = a.reseller_id.toString();
      countMap[key] = (countMap[key] || 0) + 1;
    });

    const data = franchisees.map((f) => {
      const isDistrictMatch =
        district_name && f.address?.district_name
          ? f.address.district_name.toLowerCase().trim() === district_name.toLowerCase().trim()
          : false;

      return {
        id: f._id,
        reseller_code: f.reseller_code,
        business_name: f.business_name,
        contact_person: f.contact_person,
        email: f.email,
        mobile: f.mobile,
        gst_number: f.gst_number,
        is_operational: f.is_operational,
        activation_status: f.activation_status,
        district: f.address?.district_name || 'Regional',
        state: f.address?.state_name || resolvedState,
        is_district_match: isDistrictMatch,
        assigned_epc_count: countMap[f._id.toString()] || 0,
      };
    });

    // Sort: District matches first, then operational, then by least load
    data.sort((a, b) => {
      if (a.is_district_match && !b.is_district_match) return -1;
      if (!a.is_district_match && b.is_district_match) return 1;
      if (a.is_operational && !b.is_operational) return -1;
      if (!a.is_operational && b.is_operational) return 1;
      return a.assigned_epc_count - b.assigned_epc_count;
    });

    return res.status(200).json({ status: 'success', data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch eligible franchisees', error: err.message });
  }
};

exports.assign_epc_to_franchisee = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { epc_account_id, reseller_id, lead_id, remarks } = req.body;

    if (!epc_account_id || !reseller_id) {
      return res.status(400).json({ status: 'error', message: 'epc_account_id and reseller_id are required' });
    }

    const [epcAccount, reseller] = await Promise.all([
      EpcAccount.findById(epc_account_id),
      Reseller.findById(reseller_id),
    ]);

    if (!epcAccount) return res.status(404).json({ status: 'error', message: 'EPC account not found' });
    if (!reseller) return res.status(404).json({ status: 'error', message: 'Franchisee partner not found' });

    // Revoke any existing active relationship
    const existing = await EpcResellerRelationship.findOne({ epc_id: epc_account_id, status: 'active' });
    if (existing) {
      existing.status = 'revoked';
      existing.effective_to = new Date();
      existing.transfer_reason = `Reassigned by BDE ${req.user.bde_id}`;
      await existing.save();
    }

    // Create new active relationship
    const newRel = await EpcResellerRelationship.create({
      epc_id: epc_account_id,
      reseller_id: reseller._id,
      effective_from: new Date(),
      status: 'active',
      assigned_by_bde_id: bdeId,
      assigned_by_bde_name: req.user.full_name,
    });

    // Update EPC Account
    epcAccount.primary_reseller_id = reseller._id;
    epcAccount.onboarded_by_reseller_id = reseller._id;
    epcAccount.reseller_assigned_date = new Date();
    await epcAccount.save();

    // Update EPC Lead if present
    if (lead_id) {
      await EPCLead.findByIdAndUpdate(lead_id, {
        assigned_franchisee_id: reseller._id,
        assigned_franchisee_name: reseller.business_name,
        franchisee_assigned_at: new Date(),
        lead_status: 'Assigned to Franchisee',
      });
    }

    // Trigger In-App Alert / Notification for Franchisee
    const idempotencyKey = `ALERT-NEW_EPC_ASSIGNED-${reseller._id}-${epcAccount._id}-${Date.now()}`;
    await FranchiseeAlert.create({
      alert_type: 'GOAL_ACHIEVED', // or system notification
      franchisee_id: reseller._id,
      status: 'SENT',
      notified_via: ['inapp'],
      idempotency_key: idempotencyKey,
    }).catch(() => {}); // non-blocking

    // Log BDE activity
    await BDEActivityLog.create({
      bde_id: bdeId,
      actor_type: 'bde',
      actor_id: bdeId,
      actor_name: req.user.full_name,
      action: 'EPC_PARTNER_ASSIGNED',
      notes: `Assigned EPC "${epcAccount.name}" (GST: ${epcAccount.gstin || 'N/A'}) to Franchisee "${reseller.business_name}" (${reseller.reseller_code})`,
    });

    return res.status(200).json({
      status: 'success',
      message: `EPC "${epcAccount.name}" successfully assigned to Franchisee "${reseller.business_name}"!`,
      data: {
        relationship_id: newRel._id,
        epc_account_id: epcAccount._id,
        epc_name: epcAccount.name,
        reseller_id: reseller._id,
        reseller_name: reseller.business_name,
        reseller_code: reseller.reseller_code,
        assigned_at: newRel.effective_from,
      },
    });
  } catch (err) {
    console.error('[assign_epc_to_franchisee Error]', err);
    return res.status(500).json({ status: 'error', message: 'Failed to assign EPC to franchisee', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. FRANCHISEE GOAL VS ACHIEVEMENT & PERFORMANCE TRACKING
// ─────────────────────────────────────────────────────────────────────────────
exports.get_my_franchisees = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const territory = await _getBdeTerritoryScope(bdeId);
    const stateName = territory?.state_name;

    const query = {
      deleted_at: null,
      $or: [{ bde_id: bdeId }, { original_bde_id: bdeId }],
    };
    if (stateName) {
      query.$or.push({ 'address.state_name': new RegExp(`^${stateName}$`, 'i') });
    }

    const franchisees = await Reseller.find(query).sort({ created_at: -1 }).lean();
    return res.status(200).json({ status: 'success', data: franchisees });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch franchisees', error: err.message });
  }
};

exports.get_franchisee_performance = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear(), search = '', tier = '' } = req.query;

    const territory = await _getBdeTerritoryScope(bdeId);
    const stateName = territory?.state_name;

    const query = { deleted_at: null };
    if (stateName) {
      query.$or = [{ bde_id: bdeId }, { 'address.state_name': new RegExp(`^${stateName}$`, 'i') }];
    } else {
      query.bde_id = bdeId;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$and = [
        {
          $or: [
            { business_name: { $regex: s, $options: 'i' } },
            { reseller_code: { $regex: s, $options: 'i' } },
            { contact_person: { $regex: s, $options: 'i' } },
          ],
        },
      ];
    }

    const franchisees = await Reseller.find(query).lean();

    const currMonth = Number(month);
    const currYear = Number(year);
    const prevMonth = currMonth === 1 ? 12 : currMonth - 1;
    const prevYear = currMonth === 1 ? currYear - 1 : currYear;

    const results = await Promise.all(
      franchisees.map(async (f) => {
        // 1. Kit Target & Goals resolved via priority cascade (FRANCHISEE -> DISTRICT -> STATE -> PLAN -> GLOBAL)
        const targetRecord = await resolveEffectiveTarget({
          franchisee_id: f._id,
          month: currMonth,
          year: currYear,
        });

        const monthlyGoal = targetRecord?.target_quantity || (f.is_operational ? 10 : 5);

        // 2. Orders this month
        const startCurr = new Date(currYear, currMonth - 1, 1);
        const endCurr = new Date(currYear, currMonth, 0, 23, 59, 59);

        const currOrders = await FpoOrder.find({
          reseller_id: f._id,
          createdAt: { $gte: startCurr, $lte: endCurr },
          status: { $nin: ['CANCELLED', 'EXPIRED'] },
        }).lean();

        let actualKitsOrdered = 0;
        let totalOrderValue = 0;
        currOrders.forEach((o) => {
          totalOrderValue += (o.total_paise || 0) / 100;
          (o.items || []).forEach((it) => {
            actualKitsOrdered += Number(it.quantity || 0);
          });
        });

        // 3. Orders previous month
        const startPrev = new Date(prevYear, prevMonth - 1, 1);
        const endPrev = new Date(prevYear, prevMonth, 0, 23, 59, 59);

        const prevOrders = await FpoOrder.find({
          reseller_id: f._id,
          createdAt: { $gte: startPrev, $lte: endPrev },
          status: { $nin: ['CANCELLED', 'EXPIRED'] },
        }).lean();

        let prevKitsOrdered = 0;
        prevOrders.forEach((o) => {
          (o.items || []).forEach((it) => {
            prevKitsOrdered += Number(it.quantity || 0);
          });
        });

        // 4. Calculations
        const remainingGoal = Math.max(0, monthlyGoal - actualKitsOrdered);
        const achievementPct = monthlyGoal > 0 ? Math.round((actualKitsOrdered / monthlyGoal) * 100) : 0;
        const trend =
          prevKitsOrdered > 0
            ? Math.round(((actualKitsOrdered - prevKitsOrdered) / prevKitsOrdered) * 100)
            : actualKitsOrdered > 0
            ? 100
            : 0;

        // 5. Performance Status Tiering
        let performanceStatus = 'No Activity';
        let statusColor = 'slate';

        if (achievementPct > 100) {
          performanceStatus = 'Above Target';
          statusColor = 'purple';
        } else if (achievementPct === 100) {
          performanceStatus = 'Target Achieved';
          statusColor = 'emerald';
        } else if (achievementPct >= 75) {
          performanceStatus = 'On Track';
          statusColor = 'teal';
        } else if (achievementPct >= 40) {
          performanceStatus = 'Below Target';
          statusColor = 'amber';
        } else if (actualKitsOrdered > 0) {
          performanceStatus = 'Under Performer';
          statusColor = 'orange';
        } else {
          performanceStatus = 'No Activity';
          statusColor = 'rose';
        }

        return {
          franchisee_id: f._id,
          reseller_code: f.reseller_code,
          business_name: f.business_name,
          contact_person: f.contact_person,
          mobile: f.mobile,
          district: f.address?.district_name || 'Regional District',
          state: f.address?.state_name || stateName,
          is_operational: f.is_operational,
          monthly_kit_goal: monthlyGoal,
          actual_kits_ordered: actualKitsOrdered,
          remaining_goal: remainingGoal,
          achievement_pct: achievementPct,
          previous_month_kits: prevKitsOrdered,
          current_month_trend_pct: trend,
          total_order_value_inr: totalOrderValue,
          orders_count: currOrders.length,
          performance_status: performanceStatus,
          status_color: statusColor,
        };
      })
    );

    // Optional Filter by Tier
    const filtered = tier && tier !== 'all' ? results.filter((r) => r.performance_status === tier) : results;

    // Sort: highest achievement first
    filtered.sort((a, b) => b.achievement_pct - a.achievement_pct || b.actual_kits_ordered - a.actual_kits_ordered);

    return res.status(200).json({
      status: 'success',
      data: filtered,
      summary: {
        total_franchisees: results.length,
        above_target: results.filter((r) => r.performance_status === 'Above Target').length,
        target_achieved: results.filter((r) => r.performance_status === 'Target Achieved').length,
        on_track: results.filter((r) => r.performance_status === 'On Track').length,
        below_target: results.filter((r) => r.performance_status === 'Below Target').length,
        under_performer: results.filter((r) => r.performance_status === 'Under Performer').length,
        no_activity: results.filter((r) => r.performance_status === 'No Activity').length,
      },
    });
  } catch (err) {
    console.error('[get_franchisee_performance Error]', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch performance data', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. FRANCHISEE ORDER HISTORY & TERRITORY PO EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
exports.get_franchisee_order_history = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, project_type, search, month, year } = req.query;

    const franchisee = await Reseller.findById(id).lean();
    if (!franchisee) return res.status(404).json({ status: 'error', message: 'Franchisee not found' });

    const matchQuery = { reseller_id: franchisee._id };
    if (status && status !== 'all') matchQuery.status = status.toUpperCase();

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      matchQuery.createdAt = { $gte: start, $lte: end };
    }

    const fpoOrders = await FpoOrder.find(matchQuery).sort({ createdAt: -1 }).lean();

    const formattedOrders = [];
    fpoOrders.forEach((o) => {
      (o.items || []).forEach((item, idx) => {
        formattedOrders.push({
          order_id: o._id,
          po_number: o.po_number || `PO-${o._id.toString().slice(-6).toUpperCase()}`,
          order_date: o.createdAt,
          item_name: item.item_name || 'Solar Kit Bundle',
          kit_type: item.item_name || 'Standard Combo Kit',
          project_type: item.project_type_name || 'Residential On-Grid',
          capacity: item.capacity_kw || (item.item_name?.match(/(\d+(\.\d+)?)\s*kW/i) ? item.item_name.match(/(\d+(\.\d+)?)\s*kW/i)[0] : '2.2 kW'),
          quantity: item.quantity,
          unit_price: (item.unit_price_paise || 0) / 100,
          order_value: (item.total_price_paise || 0) / 100,
          order_status: o.status,
          customer_source: o.customer_source || 'Direct Franchisee Order',
          epc_source: o.epc_id ? 'EPC Buyer Network' : 'Franchisee Stock',
        });
      });
    });

    return res.status(200).json({
      status: 'success',
      data: {
        franchisee: {
          id: franchisee._id,
          business_name: franchisee.business_name,
          reseller_code: franchisee.reseller_code,
          contact_person: franchisee.contact_person,
          district: franchisee.address?.district_name,
          state: franchisee.address?.state_name,
        },
        orders: formattedOrders,
        total_orders: formattedOrders.length,
        total_order_value: formattedOrders.reduce((sum, o) => sum + o.order_value, 0),
        total_kits: formattedOrders.reduce((sum, o) => sum + o.quantity, 0),
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch order history', error: err.message });
  }
};

exports.get_territory_order_history = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { search = '', status = '', district = '', month = '', year = '' } = req.query;

    const territory = await _getBdeTerritoryScope(bdeId);
    const stateName = territory?.state_name;

    const resellerQuery = { deleted_at: null };
    if (stateName) {
      resellerQuery.$or = [{ bde_id: bdeId }, { 'address.state_name': new RegExp(`^${stateName}$`, 'i') }];
    } else {
      resellerQuery.bde_id = bdeId;
    }

    const franchisees = await Reseller.find(resellerQuery).lean();
    const fMap = {};
    franchisees.forEach((f) => {
      fMap[f._id.toString()] = f;
    });
    const fIds = franchisees.map((f) => f._id);

    const matchQuery = { reseller_id: { $in: fIds } };
    if (status && status !== 'all') matchQuery.status = status.toUpperCase();

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      matchQuery.createdAt = { $gte: start, $lte: end };
    }

    const orders = await FpoOrder.find(matchQuery).sort({ createdAt: -1 }).limit(100).lean();

    const flattened = [];
    orders.forEach((o) => {
      const f = fMap[o.reseller_id?.toString()] || {};
      (o.items || []).forEach((item) => {
        flattened.push({
          order_id: o._id,
          po_number: o.po_number || `PO-${o._id.toString().slice(-6).toUpperCase()}`,
          order_date: o.createdAt,
          franchisee_name: f.business_name || 'Partner',
          franchisee_code: f.reseller_code || 'RS-N/A',
          district: f.address?.district_name || 'Regional',
          item_name: item.item_name || 'Standard Combo Kit',
          kit_type: item.item_name || 'Standard Combo Kit',
          project_type: item.project_type_name || 'Residential On-Grid',
          capacity: item.capacity_kw || (item.item_name?.match(/(\d+(\.\d+)?)\s*kW/i) ? item.item_name.match(/(\d+(\.\d+)?)\s*kW/i)[0] : '2.2 kW'),
          quantity: item.quantity,
          unit_price: (item.unit_price_paise || 0) / 100,
          order_value: (item.total_price_paise || 0) / 100,
          order_status: o.status,
          epc_source: o.epc_id ? 'EPC Buyer Network' : 'Direct Stock',
        });
      });
    });

    return res.status(200).json({ status: 'success', data: flattened });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch territory orders', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. KIT SALES PERFORMANCE ANALYTICS (Highest, Average, Lowest Selling)
// ─────────────────────────────────────────────────────────────────────────────
exports.get_kit_sales_analytics = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const { district_name, franchisee_id, month, year } = req.query;

    const territory = await _getBdeTerritoryScope(bdeId);
    const stateName = territory?.state_name;

    const resellerQuery = { deleted_at: null };
    if (franchisee_id && franchisee_id !== 'all') {
      resellerQuery._id = franchisee_id;
    } else if (district_name && district_name !== 'all') {
      resellerQuery['address.district_name'] = new RegExp(`^${district_name}$`, 'i');
    } else if (stateName) {
      resellerQuery.$or = [{ bde_id: bdeId }, { 'address.state_name': new RegExp(`^${stateName}$`, 'i') }];
    }

    const franchisees = await Reseller.find(resellerQuery).lean();
    const fIds = franchisees.map((f) => f._id);

    const orderQuery = {
      reseller_id: { $in: fIds },
      status: { $nin: ['CANCELLED', 'EXPIRED'] },
    };

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      orderQuery.createdAt = { $gte: start, $lte: end };
    }

    const orders = await FpoOrder.find(orderQuery).lean();

    // Aggregate by Kit / Capacity
    const kitMap = {};
    let totalKitsSold = 0;
    let totalTerritoryValue = 0;

    // Seed standard kit defaults if orders are sparse
    const defaultKits = ['1.1 kW Standard Kit', '2.2 kW Standard Kit', '3.3 kW Commercial Kit', '5.5 kW Commercial Kit', '10.0 kW Industrial Kit'];
    defaultKits.forEach((k) => {
      kitMap[k] = { kit_name: k, capacity: k.split(' ')[0] + ' kW', units_sold: 0, order_value: 0 };
    });

    orders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const kName = it.item_name || '2.2 kW Standard Kit';
        if (!kitMap[kName]) {
          kitMap[kName] = {
            kit_name: kName,
            capacity: it.capacity_kw || (kName.match(/(\d+(\.\d+)?)\s*kW/i) ? kName.match(/(\d+(\.\d+)?)\s*kW/i)[0] : '2.2 kW'),
            units_sold: 0,
            order_value: 0,
          };
        }
        const qty = Number(it.quantity || 0);
        const val = (it.total_price_paise || 0) / 100;
        kitMap[kName].units_sold += qty;
        kitMap[kName].order_value += val;
        totalKitsSold += qty;
        totalTerritoryValue += val;
      });
    });

    // Convert to array and calculate % share
    const kitList = Object.values(kitMap).map((k) => {
      const sharePct = totalKitsSold > 0 ? Math.round((k.units_sold / totalKitsSold) * 100) : 0;
      return { ...k, share_pct: sharePct };
    });

    // Sort descending by units sold
    kitList.sort((a, b) => b.units_sold - a.units_sold);

    // Classify into Highest, Average, Lowest Selling
    const totalCount = kitList.length;
    const classifiedList = kitList.map((k, index) => {
      let classification = 'Average Selling';
      let badgeColor = 'amber';

      if (index === 0 || k.share_pct >= 35) {
        classification = 'Highest Selling';
        badgeColor = 'emerald';
      } else if (index === totalCount - 1 || k.units_sold === 0 || k.share_pct < 15) {
        classification = 'Lowest Selling';
        badgeColor = 'rose';
      }

      return {
        ...k,
        classification,
        badge_color: badgeColor,
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        total_kits_sold: totalKitsSold,
        total_sales_value_inr: totalTerritoryValue,
        highest_selling: classifiedList.filter((k) => k.classification === 'Highest Selling'),
        average_selling: classifiedList.filter((k) => k.classification === 'Average Selling'),
        lowest_selling: classifiedList.filter((k) => k.classification === 'Lowest Selling'),
        all_kits: classifiedList,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch kit analytics', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. TERRITORY PERFORMANCE RANKING LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────
exports.get_franchisee_ranking = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const territory = await _getBdeTerritoryScope(bdeId);
    const stateName = territory?.state_name;

    const query = { deleted_at: null };
    if (stateName) {
      query.$or = [{ bde_id: bdeId }, { 'address.state_name': new RegExp(`^${stateName}$`, 'i') }];
    } else {
      query.bde_id = bdeId;
    }

    const franchisees = await Reseller.find(query).lean();
    const fIds = franchisees.map((f) => f._id);

    const fpoOrders = await FpoOrder.find({
      reseller_id: { $in: fIds },
      status: { $nin: ['CANCELLED', 'EXPIRED'] },
    }).lean();

    const ranked = franchisees.map((f) => {
      const fOrders = fpoOrders.filter((o) => o.reseller_id?.toString() === f._id.toString());
      let totalKits = 0;
      let totalVal = 0;
      fOrders.forEach((o) => {
        totalVal += (o.total_paise || 0) / 100;
        (o.items || []).forEach((it) => {
          totalKits += Number(it.quantity || 0);
        });
      });

      const target = f.is_operational ? 10 : 5;
      const achievement = Math.round((totalKits / target) * 100);

      let rankCategory = 'Average Performers';
      let rankBadge = 'teal';

      if (achievement >= 100 || totalKits >= 20) {
        rankCategory = 'Top Franchisees';
        rankBadge = 'emerald';
      } else if (achievement < 40 || totalKits === 0) {
        rankCategory = 'Under Performers';
        rankBadge = 'rose';
      }

      return {
        id: f._id,
        business_name: f.business_name,
        reseller_code: f.reseller_code,
        contact_person: f.contact_person,
        district: f.address?.district_name || 'Regional District',
        is_operational: f.is_operational,
        total_kits_ordered: totalKits,
        total_order_value: totalVal,
        target_achievement_pct: achievement,
        rank_category: rankCategory,
        rank_badge: rankBadge,
      };
    });

    ranked.sort((a, b) => b.total_kits_ordered - a.total_kits_ordered || b.target_achievement_pct - a.target_achievement_pct);

    return res.status(200).json({
      status: 'success',
      data: {
        top_franchisees: ranked.filter((r) => r.rank_category === 'Top Franchisees'),
        average_performers: ranked.filter((r) => r.rank_category === 'Average Performers'),
        under_performers: ranked.filter((r) => r.rank_category === 'Under Performers'),
        all_ranked: ranked,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch rankings', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. LEGACY BDE STORE SETUPS & FRANCHISEE LEADS (Backward Compatible)
// ─────────────────────────────────────────────────────────────────────────────
exports.create_bde_lead = async (req, res) => {
  return createLead(req.user.id, req.body, req, res);
};

exports.list_bde_leads = async (req, res) => {
  try {
    const leads = await BDELead.find({ current_bde_id: req.user.id, deleted_at: null }).sort({ created_at: -1 }).lean();
    return res.status(200).json({ status: 'success', data: leads });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to list leads', error: err.message });
  }
};

exports.get_bde_lead_detail = async (req, res) => {
  try {
    const lead = await BDELead.findOne({ _id: req.params.id, current_bde_id: req.user.id, deleted_at: null }).lean();
    if (!lead) return res.status(404).json({ status: 'error', message: 'Lead not found' });
    return res.status(200).json({ status: 'success', data: lead });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch lead', error: err.message });
  }
};

exports.update_bde_lead = async (req, res) => {
  try {
    const lead = await BDELead.findOneAndUpdate({ _id: req.params.id, current_bde_id: req.user.id }, { $set: req.body }, { new: true });
    return res.status(200).json({ status: 'success', message: 'Lead updated', data: lead });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to update lead', error: err.message });
  }
};

exports.add_lead_activity = async (req, res) => {
  try {
    const { id } = req.params;
    const { activity_type, notes, next_follow_up_date } = req.body;
    const act = await BDELeadActivity.create({
      lead_id: id,
      bde_id: req.user.id,
      activity_type: activity_type || 'note',
      notes,
    });
    if (next_follow_up_date) {
      await BDELead.findByIdAndUpdate(id, { next_follow_up_date: new Date(next_follow_up_date) });
    }
    return res.status(201).json({ status: 'success', message: 'Activity added', data: act });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to add activity', error: err.message });
  }
};

exports.schedule_follow_up = async (req, res) => {
  try {
    const { id } = req.params;
    const { follow_up_date, notes } = req.body;
    await BDELead.findByIdAndUpdate(id, { next_follow_up_date: new Date(follow_up_date), bde_remarks: notes });
    return res.status(200).json({ status: 'success', message: 'Follow-up scheduled' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to schedule follow-up', error: err.message });
  }
};

exports.update_lead_stage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;
    const lead = await BDELead.findByIdAndUpdate(id, { lead_status: stage, bde_remarks: notes }, { new: true });
    return res.status(200).json({ status: 'success', message: `Lead updated to ${stage}`, data: lead });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to update stage', error: err.message });
  }
};

exports.start_franchisee_signup = async (req, res) => {
  return startFranchiseeSignup(req.params.id, req.user.id, req, res);
};

exports.get_bde_pipeline = async (req, res) => {
  try {
    const leads = await BDELead.find({ current_bde_id: req.user.id, deleted_at: null }).lean();
    return res.status(200).json({ status: 'success', data: { total_leads: leads.length, all_leads: leads } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch pipeline', error: err.message });
  }
};

exports.get_my_store_setups = async (req, res) => {
  try {
    const bdeId = req.user.id;
    const bdeEmail = req.user.email;
    const setups = await StoreSetup.find({
      $or: [
        { current_bde_id: bdeId },
        { original_bde_id: bdeId },
        { assigned_employee_id: bdeId },
        { assigned_employee_email: bdeEmail },
      ],
    })
      .sort({ created_at: -1 })
      .populate('franchisee_id', 'business_name owner_name mobile_number email state_name district_name')
      .lean();

    return res.status(200).json({ status: 'success', data: setups });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch store setups', error: err.message });
  }
};

exports.get_bde_store_setup_detail = async (req, res) => {
  try {
    const { id } = req.params;
    const bdeId = req.user.id;
    const bdeEmail = req.user.email;

    const setup = await StoreSetup.findOne({
      _id: id,
      $or: [
        { current_bde_id: bdeId },
        { original_bde_id: bdeId },
        { assigned_employee_id: bdeId },
        { assigned_employee_email: bdeEmail },
      ],
    })
      .populate('franchisee_id')
      .populate('current_bde_id', 'full_name bde_id email mobile_number')
      .lean();

    if (!setup) return res.status(404).json({ status: 'error', message: 'Store Setup not found or unauthorized' });

    const checklist = await StoreSetupChecklist.find({ store_setup_id: setup._id }).sort({ display_order: 1 }).lean();
    const delays = await StoreSetupDelay.find({ store_setup_id: setup._id }).sort({ created_at: -1 }).lean();
    const verifications = await StoreSetupVerification.find({ store_setup_id: setup._id }).sort({ cycle_number: -1 }).lean();

    const { calculateStoreSetupProgress } = require('../../admin-panel/services/store.setup.service');
    const progress = await calculateStoreSetupProgress(setup._id);

    return res.status(200).json({
      status: 'success',
      data: {
        setup: { ...setup, ...progress },
        checklist,
        delays,
        verifications,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch store setup detail', error: err.message });
  }
};

// ── Legacy EPC Stubs (Backward Compatible) ──
exports.get_bde_epc_stats = async (req, res) => {
  return exports.get_bde_dashboard(req, res);
};

exports.get_bde_epc_list = async (req, res) => {
  return exports.list_epc_leads(req, res);
};

exports.onboard_epc = async (req, res) => {
  return exports.onboard_epc_with_gst(req, res);
};

exports.get_bde_franchise_partners = async (req, res) => {
  return exports.get_eligible_franchisees_for_epc(req, res);
};

exports.assign_franchise_partner = async (req, res) => {
  return exports.assign_epc_to_franchisee(req, res);
};
