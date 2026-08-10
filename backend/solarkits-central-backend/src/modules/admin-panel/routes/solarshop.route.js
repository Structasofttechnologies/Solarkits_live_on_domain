const express = require('express')
const router = express.Router()

router.use('/po-settings', require('./solarshop/po_settings.route'));
router.use('/po-orders', require('./solarshop/po_orders.route'));
router.use('/company-margins', require('./solarshop/company_margins.route'));
router.use('/bulk-kit-settings', require('./solarshop/bulk_kit_settings.route'));
router.use('/india',require('./solarshop/india.route'));
router.use('/warehouse-kit-activations', require('./solarshop/warehouse_kit_activations.route'));
router.use('/order-settings', require('./solarshop/order_settings.route'));
router.use('/offers', require('./solarshop/offers.route'));
router.use('/checkout-cart-settings', require('./solarshop/checkout_cart_settings.route'));

module.exports = router
