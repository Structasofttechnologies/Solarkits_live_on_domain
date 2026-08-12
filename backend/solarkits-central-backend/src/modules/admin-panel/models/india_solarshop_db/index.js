const EpcAccount = require('./EpcAccount.schema');
const EpcSignupRequest = require('./EpcSignupRequest.schema');
const EpcResellerRelationship = require('./epc_reseller_relationships.schema');
const EpcTransferRequest = require('./epc_transfer_requests.schema');
const WarehouseComboKit = require('./combo_kits.schema');
const PoSetting = require('./po_settings.schema');
const CompanyMargin = require('./company_margin.schema');
const BulkKitSetting = require('./bulk_kit_settings.schema');
const PurchaseOrder = require('./purchase_order.schema');
const OfferMaster = require('./offer_masters.schema');
const SolarShopSettings = require('./solarshop_settings.schema');
const InventoryReservation = require('./inventory_reservations.schema');
const ComboBundleMaster = require('./combo_bundle_masters.schema');
const ComboKitVariant = require('./combo_kit_variants.schema');

// --- Phase 1: Reseller Management Masters ---
const ResellerType = require('./reseller_types.schema');

// --- Phase 2: Reseller Accounts, KYC, Plans & Audit ---
const Reseller = require('./resellers.schema');
const ResellerKyc = require('./reseller_kyc.schema');
const ResellerPlan = require('./reseller_plans.schema');
const ResellerPlanSubscription = require('./reseller_plan_subscriptions.schema');
const ResellerAgreement = require('./reseller_agreements.schema');
const GstVerificationLog = require('./gst_verification_logs.schema');
const AuditLog = require('./audit_logs.schema');

// --- Phase 3: Territory Management ---
const ResellerTerritory = require('./reseller_territories.schema');
const TerritoryAssignmentHistory = require('./territory_assignment_history.schema');

// --- Phase 4: Product Authorization Matrix ---
const ResellerProductAuthorization = require('./reseller_product_authorizations.schema');
const DistrictProductRule = require('./district_product_rules.schema');

// --- Phase R6: Reseller Procurement & Stock Ledger ---
const ResellerProcurementOrder = require('./reseller_procurement_orders.schema');
const ResellerInventoryLedger = require('./reseller_inventory_ledgers.schema');

// --- Phase R7: Listings & MAP Pricing Rules ---
const ResellerListing = require('./reseller_listings.schema');
const ResellerPricingRule = require('./reseller_pricing_rules.schema');

// --- Phase R8: EPC Purchase Flow & Checkout Logs ---
const EpcOrder = require('./epc_orders.schema');
const EpcCheckoutLog = require('./epc_checkout_logs.schema');

// --- Phase 7: Commission Engine & Wallet Ledger ---
const ResellerWallet = require('./reseller_wallets.schema');
const ResellerWalletLedger = require('./reseller_wallet_ledgers.schema');
const ResellerPayoutRequest = require('./reseller_payout_requests.schema');

module.exports = {
  EpcAccount,
  EpcSignupRequest,
  EpcResellerRelationship,
  EpcTransferRequest,
  WarehouseComboKit,
  PoSetting,
  CompanyMargin,
  BulkKitSetting,
  PurchaseOrder,
  OfferMaster,
  SolarShopSettings, // Phase R1: Use SolarShopSettings (corrected casing) everywhere
  InventoryReservation,
  ComboBundleMaster,
  ComboKitVariant,
  // --- Phase 1: Reseller Management Masters ---
  ResellerType,
  // --- Phase 2: Reseller Accounts, KYC, Plans & Audit ---
  Reseller,
  ResellerKyc,
  ResellerPlan,
  ResellerPlanSubscription,
  ResellerAgreement,
  GstVerificationLog,
  AuditLog,
  // --- Phase 3: Territory Management ---
  ResellerTerritory,
  TerritoryAssignmentHistory,
  // --- Phase 4: Product Authorization Matrix ---
  ResellerProductAuthorization,
  DistrictProductRule,
  // --- Phase R6: Reseller Procurement & Stock Ledger ---
  ResellerProcurementOrder,
  ResellerInventoryLedger,
  // --- Phase R7: Listings & MAP Pricing Rules ---
  ResellerListing,
  ResellerPricingRule,
  // --- Phase R8: EPC Purchase Flow & Checkout Logs ---
  EpcOrder,
  EpcCheckoutLog,
  // --- Phase 7: Wallet & Ledger ---
  ResellerWallet,
  ResellerWalletLedger,
  ResellerPayoutRequest,
};





