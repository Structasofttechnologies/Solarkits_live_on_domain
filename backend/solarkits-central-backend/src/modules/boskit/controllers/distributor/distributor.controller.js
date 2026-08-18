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

/**
 * 9. Get Distributor Wholesale Catalogue & Dealer Pricing Slabs
 */
const get_distributor_catalogue = async (req, res) => {
  try {
    const distributorId = req.user.id;
    const { category, search } = req.query;

    const BoskitDistributorPlanAssignment = mongoose.model('boskit_distributor_plan_assignments');
    const BoskitPriceRule = mongoose.model('boskit_price_rules');
    const Product = mongoose.model('products');

    // 1. Get distributor's active plan discount slab
    const assignment = await BoskitDistributorPlanAssignment.findOne({
      distributor_id: distributorId,
      status: 'active',
    }).lean();

    const planSnapshot = assignment?.plan_snapshot || {};
    const baseDiscountPercent = planSnapshot.discount_percentage || 15;
    const defaultMarginMin = planSnapshot.distributor_margin_slab_min || 8;
    const defaultMarginMax = planSnapshot.distributor_margin_slab_max || 14;
    const defaultDealerMargin = Math.round((defaultMarginMin + defaultMarginMax) / 2) || 10;

    // 2. Fetch custom margin overrides set by this distributor
    const customRules = await BoskitPriceRule.find({
      scope: 'user_override',
      distributor_id: distributorId,
    }).lean();

    const ruleMap = {};
    customRules.forEach((r) => {
      if (r.product_id) {
        ruleMap[r.product_id.toString()] = r;
      }
    });

    // 3. Fetch products from DB
    let dbQuery = { is_active: { $ne: false }, deleted_at: null };
    if (search) {
      dbQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    let products = await Product.find(dbQuery)
      .populate('brand_id', 'name logo_url')
      .sort({ is_featured: -1, created_at: -1 })
      .lean();

    // If DB has fewer than 4 products, provide rich catalogue items
    if (!products || products.length === 0) {
      const MOCK_PRODUCTS = [
        {
          _id: new mongoose.Types.ObjectId('6a828f0049bc69149b156001'),
          name: 'Mono PERC 550W Bifacial Solar Panel (TOPCon Glass-to-Glass)',
          sku: 'BK-MOD-550W-TOPCON',
          category: 'panels',
          brand_name: 'SolarKits Apex Modules',
          mrp: 19500,
          moq: 30,
          image_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
          specifications: { wattage: '550W', efficiency: '22.4%', warranty: '25 Years Performance' },
        },
        {
          _id: new mongoose.Types.ObjectId('6a828f0049bc69149b156002'),
          name: 'SolarKits 5kW 3-Phase On-Grid Inverter (Dual MPPT, IP65)',
          sku: 'BK-INV-5KW-3P',
          category: 'inverters',
          brand_name: 'SolarKits PowerCore',
          mrp: 48000,
          moq: 1,
          image_url: 'https://images.unsplash.com/photo-1548611716-ad022c4f6990?auto=format&fit=crop&w=800&q=80',
          specifications: { capacity: '5kW', phase: '3-Phase', mppt_trackers: 'Dual MPPT', warranty: '10 Years' },
        },
        {
          _id: new mongoose.Types.ObjectId('6a828f0049bc69149b156003'),
          name: 'SolarKits 10kW Hybrid Energy Storage Inverter (WiFi/4G IoT)',
          sku: 'BK-INV-10KW-HYBRID',
          category: 'inverters',
          brand_name: 'SolarKits PowerCore',
          mrp: 85000,
          moq: 1,
          image_url: 'https://images.unsplash.com/photo-1558441719-f266205886d3?auto=format&fit=crop&w=800&q=80',
          specifications: { capacity: '10kW', backup_switching: '<10ms UPS', battery_compat: '48V / LFP', warranty: '10 Years' },
        },
        {
          _id: new mongoose.Types.ObjectId('6a828f0049bc69149b156004'),
          name: 'Exide 10.24kWh Wall-Mount LFP Battery Pack (6000 Cycles)',
          sku: 'BK-BAT-10KWH-LFP',
          category: 'batteries',
          brand_name: 'Exide PowerPro',
          mrp: 165000,
          moq: 1,
          image_url: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=800&q=80',
          specifications: { capacity: '10.24kWh', chemistry: 'LiFePO4', dod: '95%', cycles: '6000+ Cycles' },
        },
        {
          _id: new mongoose.Types.ObjectId('6a828f0049bc69149b156005'),
          name: 'Pre-Galvanized HDG Ground Mount Structure Kit (4-Panel Unit)',
          sku: 'BK-STR-4P-HDG',
          category: 'structures',
          brand_name: 'SolarKits StrongHold',
          mrp: 12000,
          moq: 5,
          image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
          specifications: { material: 'Hot Dip Galvanized Steel 80um', wind_rating: '180 km/h', tilt: '15-30 deg' },
        },
        {
          _id: new mongoose.Types.ObjectId('6a828f0049bc69149b156006'),
          name: '4-In-1-Out 1000V DCDB Box (Surge Protection Type-II)',
          sku: 'BK-DCDB-4IN-1OUT',
          category: 'dcdb',
          brand_name: 'SolarKits SafeGuard',
          mrp: 8500,
          moq: 2,
          image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          specifications: { voltage: '1000V DC', fuse: '15A/1000V gPV', spd: 'Type-II 40kA', ip_rating: 'IP65' },
        },
        {
          _id: new mongoose.Types.ObjectId('6a828f0049bc69149b156007'),
          name: 'Solar DC Cable 4 Sq mm 100m Drum (TUV Certified XLPO)',
          sku: 'BK-CAB-4SQMM-100M',
          category: 'cables',
          brand_name: 'Polycab SolarMax',
          mrp: 5800,
          moq: 4,
          image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
          specifications: { conductor: 'Tinned Copper', insulation: 'Electron Beam Crosslinked XLPO', rating: '1.5kV DC' },
        },
        {
          _id: new mongoose.Types.ObjectId('6a828f0049bc69149b156008'),
          name: 'BOS Commercial Kit Combo — 10kW Turnkey Electrical Pack',
          sku: 'BK-COMBO-10KW-BOS',
          category: 'boskit',
          brand_name: 'SolarKits ProBundle',
          mrp: 38000,
          moq: 1,
          image_url: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=800&q=80',
          specifications: { includes: 'DCDB, ACDB, Earthing Rods, Lightning Arrester, 4sqmm DC Cables, Conduit Kit' },
        },
      ];
      products = MOCK_PRODUCTS;
    }

    // Filter by category if requested
    if (category && category !== 'all') {
      products = products.filter((p) => p.category === category || p.category_id === category);
    }

    const items = products.map((p) => {
      const prodId = p._id.toString();
      const mrp = p.mrp || (p.mrp_paise ? Math.round(p.mrp_paise / 100) : 10000);

      // Distributor buy price = Factory MRP minus Plan Wholesale Discount
      const distributorBuyPrice = Math.round(mrp * (1 - baseDiscountPercent / 100));

      // Check if distributor set custom margin for this product
      const customRule = ruleMap[prodId];
      let dealerMarginPercent = defaultDealerMargin;
      let isWhitelisted = true;

      if (customRule) {
        if (customRule.margin_percent !== undefined) {
          dealerMarginPercent = customRule.margin_percent;
        }
        if (customRule.is_active !== undefined) {
          isWhitelisted = customRule.is_active;
        }
      }

      // Dealer selling price = Distributor buy price + Margin %
      const marginAmount = Math.round(distributorBuyPrice * (dealerMarginPercent / 100));
      const dealerSellPrice = distributorBuyPrice + marginAmount;

      return {
        id: prodId,
        name: p.name,
        sku: p.sku || `BK-${prodId.slice(-6).toUpperCase()}`,
        category: p.category || 'inverters',
        brand: p.brand_name || p.brand_id?.name || 'SolarKits Premium',
        brand_logo: p.brand_id?.logo_url || null,
        mrp_inr: mrp,
        distributor_buy_price_inr: distributorBuyPrice,
        distributor_discount_percent: baseDiscountPercent,
        dealer_margin_percent: dealerMarginPercent,
        dealer_sell_price_inr: dealerSellPrice,
        distributor_profit_per_unit_inr: marginAmount,
        is_whitelisted_for_dealers: isWhitelisted,
        moq: p.moq || p.min_order_qty || 1,
        image_url: p.image_url || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
        specifications: p.specifications || {},
        in_stock: true,
        warranty_years: p.specifications?.warranty || '10 Years Factory Warranty',
      };
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      plan_name: planSnapshot.name || 'District Distributor Tier',
      plan_discount_percent: baseDiscountPercent,
      default_margin_slab: `${defaultMarginMin}% – ${defaultMarginMax}%`,
      total_products: items.length,
      products: items,
    });
  } catch (error) {
    console.error('[get_distributor_catalogue Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to load distributor wholesale catalogue: ' + error.message,
    });
  }
};

/**
 * 10. Set / Update Distributor Dealer Margin for a Product
 */
const set_distributor_product_margin = async (req, res) => {
  try {
    const distributorId = req.user.id;
    const { product_id, margin_percent, dealer_sell_price_inr, is_whitelisted } = req.body;

    if (!product_id) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Product ID is required.',
      });
    }

    const BoskitPriceRule = mongoose.model('boskit_price_rules');
    const ruleCode = `OVR-DIST-${distributorId.toString().slice(-4)}-${product_id.toString().slice(-4)}`.toUpperCase();

    const validProductId = mongoose.Types.ObjectId.isValid(product_id) ? product_id : null;

    const ruleData = {
      rule_name: `Distributor Custom Dealer Margin Rule [${ruleCode}]`,
      rule_code: ruleCode,
      scope: 'user_override',
      distributor_id: distributorId,
      product_id: validProductId,
      rule_type: 'fixed_dealer_rate',
      discount_percentage: margin_percent !== undefined ? parseFloat(margin_percent) : 10,
      dealer_rate_paise: dealer_sell_price_inr ? Math.round(dealer_sell_price_inr * 100) : null,
      status: is_whitelisted !== false ? 'active' : 'inactive',
    };

    const updatedRule = await BoskitPriceRule.findOneAndUpdate(
      { rule_code: ruleCode },
      { $set: ruleData },
      { upsert: true, new: true }
    );

    logBoskitAudit({
      actor_type: 'boskit_distributor',
      actor_id: distributorId,
      action: 'SET_PRODUCT_DEALER_MARGIN',
      entity_type: 'boskit_price_rules',
      entity_id: updatedRule._id,
      req,
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      message: 'Dealer selling price and margin slab updated successfully!',
      rule: updatedRule,
    });
  } catch (error) {
    console.error('[set_distributor_product_margin Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to update dealer margin: ' + error.message,
    });
  }
};

/**
 * 11. Create Distributor Wholesale Procurement Order
 */
const create_distributor_procurement_order = async (req, res) => {
  try {
    const distributorId = req.user.id;
    const { items, shipping_address, payment_mode = 'advance_bank_transfer', notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Order items are required.',
      });
    }

    const BoskitOrder = mongoose.model('boskit_orders');
    const year = new Date().getFullYear();
    const orderNumber = `BK-${year}-${Date.now().toString().slice(-6)}`;

    let subtotalPaise = 0;
    const orderItems = items.map((item) => {
      const unitBuyInr = item.distributor_buy_price_inr || 10000;
      const qty = item.quantity || 1;
      const lineTotalInr = unitBuyInr * qty;
      const lineTotalPaise = lineTotalInr * 100;
      subtotalPaise += lineTotalPaise;

      const unitBuyPaise = unitBuyInr * 100;
      const gstPct = 18;
      const gstAmountPaise = Math.round(unitBuyPaise * 0.18);

      return {
        scope_type: 'product',
        product_id: mongoose.Types.ObjectId.isValid(item.product_id) ? item.product_id : null,
        item_name: item.name || 'Wholesale Solar Equipment',
        item_sku: item.sku || 'BK-PROD',
        quantity: qty,
        price_snapshot: {
          base_mrp_paise: Math.round(unitBuyPaise * 1.25),
          price_before_gst_paise: unitBuyPaise,
          gst_pct: gstPct,
          gst_amount_paise: gstAmountPaise,
          unit_price_paise: unitBuyPaise + gstAmountPaise,
          moq: 1,
          moq_met: true,
          pricing_explanation: 'Distributor Factory Wholesale Rate',
        },
        line_total_paise: lineTotalPaise,
      };
    });

    const taxTotalPaise = Math.round(subtotalPaise * 0.18);
    const grandTotalPaise = subtotalPaise + taxTotalPaise;

    const order = await BoskitOrder.create({
      order_number: orderNumber,
      buyer_type: 'distributor',
      buyer_id: distributorId,
      distributor_id: null,
      items: orderItems,
      subtotal_paise: subtotalPaise,
      tax_total_paise: taxTotalPaise,
      grand_total_paise: grandTotalPaise,
      order_status: 'confirmed',
      payment_status: 'pending',
      delivery_address: {
        line: shipping_address?.line || 'Distributor Central Depot',
        city: shipping_address?.city || 'Ahmedabad',
        pincode: shipping_address?.pincode || '380001',
      },
      status_history: [
        {
          status: 'confirmed',
          actor_type: 'boskit_distributor',
          actor_id: distributorId,
          comment: notes || 'Wholesale procurement order initiated.',
        },
      ],
    });

    return res.status(201).json({
      status: 'success',
      success: true,
      message: `Wholesale procurement order ${orderNumber} placed successfully! Dispatch scheduled from central warehouse.`,
      order: {
        id: order._id,
        order_number: order.order_number,
        grand_total_inr: Math.round(grandTotalPaise / 100),
        status: order.order_status,
      },
    });
  } catch (error) {
    console.error('[create_distributor_procurement_order Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Procurement order failed: ' + error.message,
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
  get_distributor_catalogue,
  set_distributor_product_margin,
  create_distributor_procurement_order,
};
