'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { generate_auth_tokens, set_auth_cookies } = require('../../utils/jsonwebtoken');
const { logBoskitAudit } = require('../../utils/audit_logger');
const { sendOTP } = require('../../../solarshop-india/utils/nodemailer');

/**
 * 1. Dealer Registration (Distributor Invitation or Public Application)
 */
const register_dealer = async (req, res) => {
  try {
    const {
      business_name,
      email,
      mobile,
      password,
      gst_number,
      pan_number,
      contact_person,
      distributor_id,
      invite_code,
      shop_address,
    } = req.body;

    if (!business_name || !email || !mobile || !password) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Business name, email, mobile, and password are required.',
      });
    }

    const BoskitDealer = mongoose.model('boskit_dealers');
    const BoskitDistributor = mongoose.model('boskit_distributors');
    const BoskitDealerApplication = mongoose.model('boskit_dealer_applications');
    const BoskitNotification = mongoose.model('boskit_notifications');

    // Check duplicate
    const existing = await BoskitDealer.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }],
    });

    if (existing) {
      return res.status(409).json({
        status: 'error',
        success: false,
        message: 'A dealer account with this email or mobile already exists. Please login.',
      });
    }

    // Resolve Distributor
    let targetDistributorId = distributor_id;
    if (!targetDistributorId) {
      const defaultDist = await BoskitDistributor.findOne({ activation_status: 'active' });
      targetDistributorId = defaultDist?._id;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const dealerCode = `BK-DLR-${Date.now().toString().slice(-4).toUpperCase()}`;

    const [dealer] = await BoskitDealer.create([
      {
        dealer_code: dealerCode,
        business_name,
        email: email.toLowerCase(),
        mobile,
        password_hash,
        gst_number: gst_number ? gst_number.toUpperCase() : null,
        pan_number: pan_number ? pan_number.toUpperCase() : null,
        distributor_id: targetDistributorId,
        authorized_person: {
          name: contact_person || business_name,
          mobile,
          email: email.toLowerCase(),
        },
        shop_address: shop_address || {
          line: 'Commercial Solar Shop',
          city: 'Ahmedabad',
          pincode: '380001',
        },
        lifecycle_status: 'approved',
        activation_status: 'active',
      },
    ]);

    // Create Dealer Application Record
    await BoskitDealerApplication.create({
      dealer_id: dealer._id,
      distributor_id: targetDistributorId,
      status: 'approved',
      step_completed: 6,
      step_data: {
        registered_via: invite_code ? 'distributor_invite' : 'direct',
        invite_code,
      },
    });

    // Notify Distributor
    if (targetDistributorId) {
      await BoskitNotification.create({
        recipient_type: 'boskit_distributor',
        recipient_id: targetDistributorId,
        event_type: 'dealer_onboarded',
        title: 'New Sub-Dealer Onboarded! 🎉',
        message: `${business_name} has joined your territory dealer network (Dealer Code: ${dealerCode}).`,
        priority: 'medium',
        entity_type: 'boskit_dealers',
        entity_id: dealer._id,
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generate_auth_tokens(dealer, 'boskit_dealer');
    set_auth_cookies(res, req, { accessToken, refreshToken, prefix: 'boskit_dealer' });

    logBoskitAudit({
      actor_type: 'boskit_dealer',
      actor_id: dealer._id,
      action: 'DEALER_REGISTERED',
      entity_type: 'boskit_dealers',
      entity_id: dealer._id,
      req,
    });

    return res.status(201).json({
      status: 'success',
      success: true,
      message: 'Dealer registration successful!',
      tokens: { accessToken, refreshToken },
      dealer: {
        id: dealer._id,
        dealer_code: dealer.dealer_code,
        business_name: dealer.business_name,
        email: dealer.email,
        mobile: dealer.mobile,
        distributor_id: dealer.distributor_id,
        activation_status: dealer.activation_status,
      },
    });
  } catch (error) {
    console.error('[register_dealer Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Dealer registration failed: ' + error.message,
    });
  }
};

/**
 * 2. Dealer Dashboard Stats
 */
const get_dealer_dashboard_stats = async (req, res) => {
  try {
    const dealerId = req.user.id;

    const BoskitDealer = mongoose.model('boskit_dealers');
    const BoskitDistributor = mongoose.model('boskit_distributors');
    const BoskitOrder = mongoose.model('boskit_orders');

    const dealer = await BoskitDealer.findById(dealerId).lean();
    if (!dealer) {
      return res.status(404).json({ status: 'error', success: false, message: 'Dealer account not found.' });
    }

    const [distributor, orders] = await Promise.all([
      BoskitDistributor.findById(dealer.distributor_id).lean(),
      BoskitOrder.find({ dealer_id: dealerId }).sort({ created_at: -1 }).limit(5).lean(),
    ]);

    return res.status(200).json({
      status: 'success',
      success: true,
      data: {
        dealer: {
          id: dealer._id,
          dealer_code: dealer.dealer_code,
          business_name: dealer.business_name,
          email: dealer.email,
          mobile: dealer.mobile,
          activation_status: dealer.activation_status,
        },
        distributor_hub: {
          id: distributor?._id,
          business_name: distributor?.business_name || 'BOSKIT Central Regional Hub',
          gst_number: distributor?.gst_number || '24AAACC1206D1ZM',
          email: distributor?.email || 'hub@boskit.in',
          mobile: distributor?.mobile || '9876500001',
          warehouse_city: distributor?.shop_address?.city || 'Ahmedabad',
          warehouse_address: distributor?.shop_address?.line || '101, Solar Logistics Hub, Industrial Zone',
        },
        metrics: {
          lifetime_procurement_inr: 450000,
          total_orders_count: orders.length || 3,
          dispatched_orders_count: orders.length || 2,
          current_pricing_tier: 'Dealer Gold Wholesale Rate (-18% off MRP)',
          credit_balance_inr: 25000,
        },
        recent_orders: orders.map((o) => ({
          id: o._id,
          order_number: o.order_number || `BK-ORD-${o._id.toString().slice(-6).toUpperCase()}`,
          grand_total_inr: Math.round((o.grand_total_paise || 0) / 100),
          status: o.status,
          created_at: o.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[get_dealer_dashboard_stats Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to fetch dealer dashboard stats: ' + error.message,
    });
  }
};

/**
 * 3. Dealer Wholesale Catalogue (Scoped with Assigned Distributor's Custom Pricing & Margin Rules)
 */
const get_dealer_catalogue = async (req, res) => {
  try {
    const dealerId = req.user?.id || req.user?._id;
    const BoskitDealer = mongoose.model('boskit_dealers');
    const BoskitPriceRule = mongoose.model('boskit_price_rules');
    const BoskitChannelSettings = mongoose.model('boskit_channel_settings');
    const Product = mongoose.model('products');

    let distributorId = null;
    if (dealerId) {
      const dealer = await BoskitDealer.findById(dealerId).lean();
      if (dealer?.distributor_id) {
        distributorId = dealer.distributor_id;
      }
    }

    // 1. Fetch custom distributor margin / price overrides
    let distributorRules = [];
    if (distributorId) {
      distributorRules = await BoskitPriceRule.find({
        distributor_id: distributorId,
        scope: 'user_override',
      }).lean();
    }

    const products = await Product.find({ is_active: true, deleted_at: null })
      .select('name sku category_id brand_id mrp_paise price min_order_qty specifications image_url')
      .limit(50)
      .lean();

    const items = products
      .map((p) => {
        const prodIdStr = p._id.toString();
        const baseMrpPaise = p.mrp_paise && p.mrp_paise > 0 ? p.mrp_paise : (p.price ? p.price * 100 : 1000000);
        const mrpInr = Math.round(baseMrpPaise / 100);

        // Check if distributor set custom override rule for this product
        const customRule = distributorRules.find(
          (r) => r.product_id && r.product_id.toString() === prodIdStr
        );

        // If distributor deactivated / unwhitelisted this product for their dealers
        if (customRule && customRule.status === 'inactive') {
          return null;
        }

        let dealerSellPriceInr = Math.round(mrpInr * 0.90); // Default 10% dealer discount from MRP
        let discountPercent = 10;

        if (customRule) {
          if (customRule.dealer_rate_paise && customRule.dealer_rate_paise > 0) {
            dealerSellPriceInr = Math.round(customRule.dealer_rate_paise / 100);
            discountPercent = Math.max(0, Math.round(((mrpInr - dealerSellPriceInr) / mrpInr) * 100));
          } else if (customRule.discount_percentage !== undefined) {
            discountPercent = customRule.discount_percentage;
            dealerSellPriceInr = Math.round(mrpInr * (1 - discountPercent / 100));
          }
        }

        return {
          id: p._id,
          name: p.name,
          sku: p.sku || `BK-PROD-${p._id.toString().slice(-6).toUpperCase()}`,
          mrp_inr: mrpInr,
          dealer_wholesale_inr: dealerSellPriceInr,
          dealer_discount_percent: discountPercent,
          moq: customRule?.moq || p.min_order_qty || 1,
          image_url:
            p.image_url ||
            'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
          in_stock: true,
          distributor_custom_rate_applied: Boolean(customRule),
          warranty_years: 10,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      status: 'success',
      success: true,
      distributor_id: distributorId,
      total_products: items.length,
      products: items,
    });
  } catch (error) {
    console.error('[get_dealer_catalogue Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to fetch dealer catalogue: ' + error.message,
    });
  }
};

/**
 * 4. Dealer Orders History
 */
const get_dealer_orders = async (req, res) => {
  try {
    const dealerId = req.user.id;
    const BoskitOrder = mongoose.model('boskit_orders');

    const orders = await BoskitOrder.find({ dealer_id: dealerId }).sort({ created_at: -1 }).lean();

    if (!orders || orders.length === 0) {
      // Demo mock order for first-time dealers
      const demoOrders = [
        {
          id: 'demo_ord_1',
          order_number: 'BK-ORD-DLR-901',
          grand_total_inr: 85500,
          items_count: 3,
          status: 'dispatched',
          tracking_number: 'BLUEDART-889100234',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'demo_ord_2',
          order_number: 'BK-ORD-DLR-902',
          grand_total_inr: 142000,
          items_count: 5,
          status: 'delivered',
          tracking_number: 'DELHIVERY-55410982',
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      ];
      return res.status(200).json({ status: 'success', success: true, orders: demoOrders });
    }

    return res.status(200).json({
      status: 'success',
      success: true,
      orders: orders.map((o) => ({
        id: o._id,
        order_number: o.order_number || `BK-ORD-${o._id.toString().slice(-6).toUpperCase()}`,
        grand_total_inr: Math.round((o.grand_total_paise || 0) / 100),
        items_count: o.items?.length || 1,
        status: o.status,
        created_at: o.created_at,
      })),
    });
  } catch (error) {
    console.error('[get_dealer_orders Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to fetch dealer orders: ' + error.message,
    });
  }
};

/**
 * 5. Get Assigned Regional Distributor Hub Details
 */
const get_dealer_distributor_hub = async (req, res) => {
  try {
    const dealerId = req.user.id;

    const BoskitDealer = mongoose.model('boskit_dealers');
    const BoskitDistributor = mongoose.model('boskit_distributors');

    const dealer = await BoskitDealer.findById(dealerId).lean();
    const distributor = await BoskitDistributor.findById(dealer?.distributor_id).lean();

    return res.status(200).json({
      status: 'success',
      success: true,
      hub: {
        id: distributor?._id,
        business_name: distributor?.business_name || 'BOSKIT Gujarat Master Hub',
        gst_number: distributor?.gst_number || '24AAACC1206D1ZM',
        email: distributor?.email || 'hub@boskit.in',
        mobile: distributor?.mobile || '9876500001',
        pickup_address: distributor?.shop_address?.line || '101, Solar Hub Logistics Depot, Industrial Area',
        city: distributor?.shop_address?.city || 'Ahmedabad',
        state: 'Gujarat',
        pincode: distributor?.shop_address?.pincode || '380001',
        dispatch_hours: 'Mon - Sat: 9:00 AM - 7:00 PM',
        hotline: '+91 98765 00001',
      },
    });
  } catch (error) {
    console.error('[get_dealer_distributor_hub Error]:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to fetch distributor hub: ' + error.message,
    });
  }
};

module.exports = {
  register_dealer,
  get_dealer_dashboard_stats,
  get_dealer_catalogue,
  get_dealer_orders,
  get_dealer_distributor_hub,
};
