const EpcAccount = require('./EpcAccount.schema');
const EpcSignupRequest = require('./EpcSignupRequest.schema');
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
const GstVerificationLog = require('./gst_verification_logs.schema');
const AuditLog = require('./audit_logs.schema');

// --- Phase 3: Territory Management ---
const ResellerTerritory = require('./reseller_territories.schema');

// --- Phase 4: Product Authorization Matrix ---
const ResellerProductAuthorization = require('./reseller_product_authorizations.schema');

// --- Phase 7: Commission Engine & Wallet Ledger ---
const ResellerWallet = require('./reseller_wallets.schema');
const ResellerWalletLedger = require('./reseller_wallet_ledgers.schema');
const ResellerPayoutRequest = require('./reseller_payout_requests.schema');

module.exports = {
  EpcAccount,
  EpcSignupRequest,
  WarehouseComboKit,
  PoSetting,
  CompanyMargin,
  BulkKitSetting,
  PurchaseOrder,
  OfferMaster,
  SolarShopSettings,
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
  GstVerificationLog,
  AuditLog,
  // --- Phase 3: Territory Management ---
  ResellerTerritory,
  // --- Phase 4: Product Authorization Matrix ---
  ResellerProductAuthorization,
  // --- Phase 7: Wallet & Ledger ---
  ResellerWallet,
  ResellerWalletLedger,
  ResellerPayoutRequest,
};





