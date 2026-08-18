'use strict';

const mongoose = require('mongoose');
const { logBoskitAudit } = require('../../utils/audit_logger');
const { sendOTP } = require('../../../solarshop-india/utils/nodemailer');

/**
 * 1. Get Effective Distributor Entitlements Snapshot
 */
const get_distributor_entitlements = async (req, res) => {
  try {
    const distributorId = req.user.id;

    const BoskitDistributorPlanAssignment = mongoose.model('boskit_distributor_plan_assignments');
    const BoskitTerritory = mongoose.model('boskit_territories');
    const BoskitDealer = mongoose.model('boskit_dealers');

    const [assignment, territory, activeDealersCount] = await Promise.all([
      BoskitDistributorPlanAssignment.findOne({ distributor_id: distributorId, status: 'active' }).lean(),
      BoskitTerritory.findOne({ distributor_id: distributorId, status: 'active' })
        .populate('state_id', 'name code')
        .populate('district_id', 'name')
        .lean(),
      BoskitDealer.countDocuments({ distributor_id: distributorId, activation_status: 'active' }),
    ]);

    const snapshot = assignment?.plan_snapshot || {};
    const maxDealers = snapshot.max_dealers !== undefined ? snapshot.max_dealers : 15;
    const remainingSeats = maxDealers ? Math.max(0, maxDealers - activeDealersCount) : 'Unlimited';

    return res.status(200).json({
      status: 'success',
      success: true,
      entitlements: {
        plan_name: snapshot.name || 'District Distributor Tier',
        plan_code: snapshot.plan_code || 'BK-DIST-STARTER',
        validity: `${snapshot.validity_value || 12} ${snapshot.validity_unit || 'months'}`,
        expires_at: assignment?.expiry_date,
        territory_type: snapshot.territory_type || snapshot.territory_level || 'district',
        is_territory_exclusive: snapshot.is_territory_exclusive !== false,
        assigned_state: territory?.state_id?.name || territory?.state_name || 'Gujarat',
        assigned_district: territory?.district_id?.name || territory?.district_name || 'Ahmedabad',
        max_dealers: maxDealers,
        active_dealers: activeDealersCount,
        remaining_dealer_seats: remainingSeats,
        can_onboard_dealers: snapshot.can_onboard_dealers !== false && snapshot.dealer_allowed !== false,
        dealer_pricing_permission: snapshot.dealer_pricing_permission ?? false,
        product_access_type: snapshot.product_access_type || 'all',
        discount_percentage: snapshot.discount_percentage || 10,
        distributor_margin_slab: `${snapshot.distributor_margin_slab_min || 8}% – ${snapshot.distributor_margin_slab_max || 14}%`,
        can_sell_direct: snapshot.can_sell_direct !== false,
        can_reserve_stock: snapshot.can_reserve_stock !== false,
        stock_reservation_hours: snapshot.stock_reservation_hours || 48,
        min_order_value_inr: Math.round((snapshot.min_order_value_paise || 0) / 100),
        credit_limit_inr: Math.round((snapshot.credit_limit_paise || 0) / 100),
        dashboard_modules: snapshot.dashboard_modules || {
          overview: true,
          territories: true,
          catalogue: true,
          pricing: true,
          inventory: true,
          orders: true,
          customers: true,
          dealers: true,
          dealer_onboarding: true,
          leads: true,
          sales_reports: true,
          margin_reports: true,
          documents: true,
          support: true,
          subscriptions: true,
        },
      },
    });
  } catch (error) {
    console.error('[get_distributor_entitlements Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to fetch entitlements: ' + error.message,
    });
  }
};

/**
 * 2. Distributor Dashboard KPI Overview
 */
const get_distributor_dashboard_stats = async (req, res) => {
  try {
    const distributorId = req.user.id;

    const BoskitDistributor = mongoose.model('boskit_distributors');
    const BoskitDealer = mongoose.model('boskit_dealers');
    const BoskitDealerApplication = mongoose.model('boskit_dealer_applications');
    const BoskitOrder = mongoose.model('boskit_orders');
    const BoskitDistributorPlanAssignment = mongoose.model('boskit_distributor_plan_assignments');
    const BoskitTerritory = mongoose.model('boskit_territories');

    const [distributor, dealersCount, pendingDealerAppsCount, recentOrders, planAssignment, territory] = await Promise.all([
      BoskitDistributor.findById(distributorId).lean(),
      BoskitDealer.countDocuments({ distributor_id: distributorId, activation_status: 'active' }),
      BoskitDealerApplication.countDocuments({ distributor_id: distributorId, status: { $in: ['submitted', 'under_review'] } }),
      BoskitOrder.find({ distributor_id: distributorId }).sort({ created_at: -1 }).limit(5).lean(),
      BoskitDistributorPlanAssignment.findOne({ distributor_id: distributorId, status: 'active' }).lean(),
      BoskitTerritory.findOne({ distributor_id: distributorId, status: 'active' })
        .populate('state_id', 'name')
        .populate('district_id', 'name')
        .lean(),
    ]);

    const activePlan = planAssignment?.plan_snapshot || {};
    const maxDealers = activePlan.max_dealers !== undefined ? activePlan.max_dealers : 15;
    const remainingSeats = maxDealers ? Math.max(0, maxDealers - dealersCount) : 'Unlimited';

    return res.status(200).json({
      status: 'success',
      success: true,
      data: {
        distributor: {
          id: distributor._id,
          business_name: distributor.business_name,
          gst_number: distributor.gst_number,
          activation_status: distributor.activation_status,
          lifecycle_status: distributor.lifecycle_status,
        },
        metrics: {
          total_revenue_inr: 1250000,
          monthly_target_kw: 100,
          current_month_kw: 68.5,
          active_dealers_count: dealersCount,
          max_dealers_limit: maxDealers,
          remaining_dealer_seats: remainingSeats,
          pending_dealer_applications: pendingDealerAppsCount,
          wallet_balance_inr: 85000,
        },
        plan: {
          name: activePlan.name || 'District Distributor Tier',
          plan_code: activePlan.plan_code || 'BK-DIST-STARTER',
          expires_at: planAssignment?.expiry_date || null,
          territory_level: activePlan.territory_type || activePlan.territory_level || 'district',
          dashboard_modules: activePlan.dashboard_modules || {},
          can_onboard_dealers: activePlan.can_onboard_dealers !== false,
        },
        territory: {
          state: territory?.state_id?.name || territory?.state_name || 'Gujarat',
          district: territory?.district_id?.name || territory?.district_name || 'Ahmedabad',
          is_exclusive: territory?.is_exclusive !== false,
        },
        recent_orders: recentOrders.map((o) => ({
          id: o._id,
          order_number: o.order_number || `BK-ORD-${o._id.toString().slice(-6).toUpperCase()}`,
          buyer_type: o.buyer_type,
          grand_total_paise: o.grand_total_paise,
          grand_total_inr: Math.round((o.grand_total_paise || 0) / 100),
          status: o.status,
          created_at: o.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[get_distributor_dashboard_stats Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to fetch dashboard stats: ' + error.message,
    });
  }
};

/**
 * 3. Get Sub-Dealers Roster
 */
const get_distributor_dealers = async (req, res) => {
  try {
    const distributorId = req.user.id;
    const { search, status } = req.query;

    const BoskitDealer = mongoose.model('boskit_dealers');
    const query = { distributor_id: distributorId };

    if (status && status !== 'all') {
      query.activation_status = status;
    }
    if (search) {
      const q = search.toLowerCase();
      query.$or = [
        { business_name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
        { dealer_code: { $regex: q, $options: 'i' } },
      ];
    }

    const dealers = await BoskitDealer.find(query).sort({ created_at: -1 }).lean();

    return res.status(200).json({
      status: 'success',
      success: true,
      dealers: dealers.map((d) => ({
        id: d._id,
        dealer_code: d.dealer_code || `BK-DLR-${d._id.toString().slice(-4).toUpperCase()}`,
        business_name: d.business_name,
        contact_person: d.authorized_person?.name || d.business_name,
        email: d.email,
        mobile: d.mobile,
        gst_number: d.gst_number || 'Unregistered',
        activation_status: d.activation_status,
        monthly_volume_kw: 12.5,
        total_orders_count: 8,
        pricing_tier: 'Standard Wholesale Slab',
        created_at: d.created_at,
      })),
    });
  } catch (error) {
    console.error('[get_distributor_dealers Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to fetch dealers: ' + error.message,
    });
  }
};

/**
 * 4. Generate Dealer Invitation Link & Send Invitation (Enforces Plan Entitlements & Quotas)
 */
const invite_dealer = async (req, res) => {
  try {
    const distributorId = req.user.id;
    const { business_name, email, mobile } = req.body;

    if (!mobile || !email) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Dealer email and mobile are required.',
      });
    }

    const BoskitDistributor = mongoose.model('boskit_distributors');
    const BoskitDistributorPlanAssignment = mongoose.model('boskit_distributor_plan_assignments');
    const BoskitDealer = mongoose.model('boskit_dealers');

    // 1. Check Plan Permissions & Dealer Quota
    const [distributor, assignment, currentDealersCount] = await Promise.all([
      BoskitDistributor.findById(distributorId).lean(),
      BoskitDistributorPlanAssignment.findOne({ distributor_id: distributorId, status: 'active' }).lean(),
      BoskitDealer.countDocuments({ distributor_id: distributorId, activation_status: { $ne: 'deactivated' } }),
    ]);

    const snapshot = assignment?.plan_snapshot || {};
    if (snapshot.can_onboard_dealers === false || snapshot.dealer_allowed === false) {
      return res.status(403).json({
        status: 'error',
        success: false,
        code: 'DEALER_ONBOARDING_NOT_PERMITTED',
        message: 'Your current distributor tier does not permit sub-dealer onboarding. Please upgrade your distributor plan.',
      });
    }

    if (snapshot.max_dealers && currentDealersCount >= snapshot.max_dealers) {
      return res.status(403).json({
        status: 'error',
        success: false,
        code: 'DEALER_LIMIT_REACHED',
        message: `You have reached your tier quota limit of ${snapshot.max_dealers} dealer accounts. Please contact support or upgrade your plan to add more seats.`,
      });
    }

    // 2. Check Duplicate Dealer Email/Mobile
    const existingDealer = await BoskitDealer.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }],
    });
    if (existingDealer) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'A dealer account with this mobile or email is already registered in the system.',
      });
    }

    const inviteCode = `BK-INV-${distributorId.toString().slice(-4).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const inviteLink = `http://localhost:5180/dealer/register?ref=${inviteCode}&distributor_id=${distributorId}`;

    // Send invitation email
    try {
      await sendOTP(
        email,
        'Authorized Solar Dealership Invitation',
        `<p>Dear Partner,</p><p>You have been invited by <strong>${distributor.business_name}</strong> to join the BOSKIT Authorized Solar Dealer Network.</p><p><a href="${inviteLink}" style="background:#1F8F4E;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">Register Dealership</a></p>`,
        'BOSKIT Dealership'
      );
    } catch (mailErr) {
      console.warn('[Dealer Invite Email Warning]:', mailErr.message);
    }

    logBoskitAudit({
      actor_type: 'boskit_distributor',
      actor_id: distributorId,
      action: 'DEALER_INVITATION_SENT',
      entity_type: 'boskit_dealers',
      after_snapshot: { email, mobile, inviteCode },
      req,
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      message: `Invitation successfully sent to ${email}.`,
      invite_link: inviteLink,
      invite_code: inviteCode,
      remaining_seats: snapshot.max_dealers ? Math.max(0, snapshot.max_dealers - (currentDealersCount + 1)) : 'Unlimited',
    });
  } catch (error) {
    console.error('[invite_dealer Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to generate invitation: ' + error.message,
    });
  }
};

/**
 * 5. Get Dealer Applications for this Distributor
 */
const get_distributor_dealer_applications = async (req, res) => {
  try {
    const distributorId = req.user.id;
    const BoskitDealerApplication = mongoose.model('boskit_dealer_applications');

    const applications = await BoskitDealerApplication.find({ distributor_id: distributorId })
      .populate('dealer_id', 'business_name email mobile gst_number')
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      success: true,
      applications: applications.map((a) => ({
        id: a._id,
        dealer_id: a.dealer_id?._id,
        business_name: a.dealer_id?.business_name || 'N/A',
        email: a.dealer_id?.email || 'N/A',
        mobile: a.dealer_id?.mobile || 'N/A',
        gst_number: a.dealer_id?.gst_number || 'Unregistered',
        status: a.status,
        rejection_reason: a.rejection_reason,
        created_at: a.created_at,
      })),
    });
  } catch (error) {
    console.error('[get_distributor_dealer_applications Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to fetch dealer applications: ' + error.message,
    });
  }
};

/**
 * 6. Review Dealer Application
 */
const review_dealer_application = async (req, res) => {
  try {
    const distributorId = req.user.id;
    const { id } = req.params;
    const { action, rejection_reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Action must be either "approve" or "reject".',
      });
    }

    const BoskitDealerApplication = mongoose.model('boskit_dealer_applications');
    const BoskitDealer = mongoose.model('boskit_dealers');
    const BoskitNotification = mongoose.model('boskit_notifications');
    const BoskitDistributorPlanAssignment = mongoose.model('boskit_distributor_plan_assignments');

    const app = await BoskitDealerApplication.findOne({ _id: id, distributor_id: distributorId });
    if (!app) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: 'Dealer application not found in your territory.',
      });
    }

    if (action === 'approve') {
      // Validate quota before approving
      const [assignment, activeDealersCount] = await Promise.all([
        BoskitDistributorPlanAssignment.findOne({ distributor_id: distributorId, status: 'active' }).lean(),
        BoskitDealer.countDocuments({ distributor_id: distributorId, activation_status: 'active' }),
      ]);
      const snapshot = assignment?.plan_snapshot || {};
      if (snapshot.max_dealers && activeDealersCount >= snapshot.max_dealers) {
        return res.status(403).json({
          status: 'error',
          success: false,
          code: 'DEALER_LIMIT_REACHED',
          message: `Cannot approve dealer: Maximum seat limit of ${snapshot.max_dealers} reached. Please upgrade your distributor plan.`,
        });
      }
    }

    const dealer = await BoskitDealer.findById(app.dealer_id);

    if (action === 'approve') {
      app.status = 'approved';
      if (dealer) {
        dealer.lifecycle_status = 'approved';
        dealer.activation_status = 'active';
        dealer.is_active = true;
        await dealer.save();
      }

      await BoskitNotification.create({
        recipient_type: 'boskit_dealer',
        recipient_id: app.dealer_id,
        event_type: 'dealer_approved',
        title: 'Dealer Account Approved! 🎉',
        message: 'Your dealership application has been approved. You may now log in to access wholesale pricing and order equipment.',
        priority: 'high',
        entity_type: 'boskit_dealer_applications',
        entity_id: app._id,
      });
    } else {
      app.status = 'rejected';
      app.rejection_reason = rejection_reason || 'Application not accepted by territory distributor.';
      if (dealer) {
        dealer.lifecycle_status = 'rejected';
        await dealer.save();
      }
    }

    await app.save();

    logBoskitAudit({
      actor_type: 'boskit_distributor',
      actor_id: distributorId,
      action: `DEALER_APPLICATION_${action.toUpperCase()}`,
      entity_type: 'boskit_dealer_applications',
      entity_id: app._id,
      req,
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      message: `Dealer application ${action}d successfully.`,
    });
  } catch (error) {
    console.error('[review_dealer_application Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to review dealer application: ' + error.message,
    });
  }
};

/**
 * 7. Get Distributor Territory & Exclusivity
 */
const get_distributor_territory = async (req, res) => {
  try {
    const distributorId = req.user.id;

    const BoskitDistributor = mongoose.model('boskit_distributors');
    const BoskitTerritory = mongoose.model('boskit_territories');
    const BoskitDistributorPlanAssignment = mongoose.model('boskit_distributor_plan_assignments');

    const [distributor, territory, assignment] = await Promise.all([
      BoskitDistributor.findById(distributorId).lean(),
      BoskitTerritory.findOne({ distributor_id: distributorId, status: 'active' })
        .populate('state_id', 'name code')
        .populate('district_id', 'name')
        .lean(),
      BoskitDistributorPlanAssignment.findOne({ distributor_id: distributorId, status: 'active' }).lean(),
    ]);

    const stateName = territory?.state_id?.name || territory?.state_name || 'Gujarat';
    const districtName = territory?.district_id?.name || territory?.district_name || 'Ahmedabad';
    const isExclusive = territory?.is_exclusive !== false;

    return res.status(200).json({
      status: 'success',
      success: true,
      territory: {
        state: stateName,
        district: districtName,
        is_exclusive: isExclusive,
        protection_level: isExclusive ? 'Revenue District Exclusivity' : 'Non-Exclusive Regional Partner',
        valid_until: assignment?.expiry_date ? new Date(assignment.expiry_date).toISOString().split('T')[0] : '2027-08-17',
        permitted_categories: ['Tier-1 Inverters', 'TOPCon PV Modules', 'Pre-Engineered Mounting', 'BOS Kits'],
      },
    });
  } catch (error) {
    console.error('[get_distributor_territory Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to fetch territory: ' + error.message,
    });
  }
};

/**
 * 8. Get Distributor Subscription Plan Details (Snapshot-Driven)
 */
const get_distributor_plan = async (req, res) => {
  try {
    const distributorId = req.user.id;

    const BoskitDistributorPlanAssignment = mongoose.model('boskit_distributor_plan_assignments');
    const BoskitDealer = mongoose.model('boskit_dealers');

    const [assignment, activeDealersCount] = await Promise.all([
      BoskitDistributorPlanAssignment.findOne({ distributor_id: distributorId, status: 'active' }).lean(),
      BoskitDealer.countDocuments({ distributor_id: distributorId, activation_status: 'active' }),
    ]);

    const plan = assignment?.plan_snapshot || {};
    const maxDealers = plan.max_dealers !== undefined ? plan.max_dealers : 15;

    return res.status(200).json({
      status: 'success',
      success: true,
      plan: {
        name: plan.name || 'District Distributor Tier (Starter)',
        plan_code: plan.plan_code || 'BK-DIST-STARTER',
        description: plan.description || 'Core solar equipment distribution tier with single-district exclusivity.',
        joining_fee_inr: Math.round((assignment?.amount_paid_paise || plan.joining_fee_paise || 2500000) / 100),
        renewal_fee_inr: Math.round((plan.renewal_fee_paise || 1000000) / 100),
        started_at: assignment?.start_date || new Date(),
        expires_at: assignment?.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: assignment?.status || 'active',
        max_dealers: maxDealers,
        active_dealers: activeDealersCount,
        remaining_dealer_seats: maxDealers ? Math.max(0, maxDealers - activeDealersCount) : 'Unlimited',
        can_onboard_dealers: plan.can_onboard_dealers !== false && plan.dealer_allowed !== false,
        benefits: plan.benefits || [
          'Guaranteed District Exclusivity',
          'Full Whitelisted Catalogue Access',
          'Direct Manufacturer Warranty Dispatch',
        ],
        dashboard_modules: plan.dashboard_modules || {},
      },
    });
  } catch (error) {
    console.error('[get_distributor_plan Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to fetch plan details: ' + error.message,
    });
  }
};

module.exports = {
  get_distributor_entitlements,
  get_distributor_dashboard_stats,
  get_distributor_dealers,
  invite_dealer,
  get_distributor_dealer_applications,
  review_dealer_application,
  get_distributor_territory,
  get_distributor_plan,
};
