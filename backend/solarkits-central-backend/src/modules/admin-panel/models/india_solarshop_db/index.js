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
};

