const express = require("express");
const router = express.Router();
const { 
  get_combo_kits_by_district,
  get_inventory_status,
  get_checkout_settings,
  get_active_offers,
  reserve_stock,
  confirm_order,
  get_cart,
  update_cart,
  create_request_order,
  get_gst_status,
  gst_generate_otp,
  gst_verify_otp,
  get_orders,
  update_order_address,
  create_razorpay_order,
  verify_razorpay_payment,
  get_bos_kits,
  save_bos_kits,
  create_or_update_bos_kit,
  delete_bos_kit,
  toggle_bos_kit_stock,
  get_bos_custom_catalog,
  save_bos_custom_catalog,
  get_nearby_stores,
  get_shop_hierarchy,
} = require("../../controller/v1.handlers/shop.handler");
const { handleRazorpayWebhook } = require("../../controller/v1.handlers/razorpay.webhook.handler");
const { verify_auth } = require("../../middlewares/auth");

const { get_epc_catalogue } = require("../../controller/epc.catalogue.handler");

router.get("/hierarchy", get_shop_hierarchy);
router.get("/industry-types", get_shop_hierarchy);
router.get("/stores", get_nearby_stores);
router.get("/combo-kits", get_combo_kits_by_district);
router.get("/epc-catalogue", verify_auth, get_epc_catalogue);
router.get("/epc-catalogue/status", verify_auth, require("../../controller/epc.catalogue.handler").get_epc_catalogue_status);
router.get("/bos-kits", get_bos_kits);
router.post("/bos-kits", save_bos_kits);
router.post("/bos-kits/save-single", create_or_update_bos_kit);
router.delete("/bos-kits/:id", delete_bos_kit);
router.post("/bos-kits/delete", delete_bos_kit);
router.patch("/bos-kits/:id/stock", toggle_bos_kit_stock);
router.post("/bos-kits/toggle-stock", toggle_bos_kit_stock);
router.get("/bos-custom-catalog", get_bos_custom_catalog);
router.post("/bos-custom-catalog", save_bos_custom_catalog);
router.get("/inventory-status", get_inventory_status);
router.get("/checkout-settings", get_checkout_settings);
router.get("/active-offers", get_active_offers);
router.post("/reserve-stock", verify_auth, reserve_stock);
router.post("/confirm-order", verify_auth, confirm_order);
router.post("/request-order", verify_auth, create_request_order);
router.get("/gst/status", verify_auth, get_gst_status);
router.post("/gst/generate-otp", verify_auth, gst_generate_otp);
router.post("/gst/verify-otp", verify_auth, gst_verify_otp);
router.get("/cart", verify_auth, get_cart);
router.post("/cart", verify_auth, update_cart);
router.get("/orders", verify_auth, get_orders);
router.put("/orders/:id/address", verify_auth, update_order_address);
router.post("/razorpay/create-order", verify_auth, create_razorpay_order);
router.post("/razorpay/verify-payment", verify_auth, verify_razorpay_payment);
// Razorpay webhook MUST use express.raw() — NOT express.json()
router.post("/razorpay/webhook", express.raw({ type: '*/*' }), handleRazorpayWebhook);

// ── EPC Industry Content Dashboard Routes ─────────────────────────────────────
// These routes serve industry-aware content to authenticated EPC buyers.
// All requests validated: JWT + approved UserIndustryMap.
const epcIndustryHandler = require("../../controller/epc.industry.dashboard.handler");
router.get("/industry/my-industries",    verify_auth, epcIndustryHandler.get_my_industries);
router.get("/industry/dashboard-content",verify_auth, epcIndustryHandler.get_dashboard_content);
router.get("/industry/theme",            verify_auth, epcIndustryHandler.get_industry_theme);

module.exports = router;

