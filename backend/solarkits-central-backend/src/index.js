require('dotenv').config();
require('./keys/config/databases'); // Initialize database connections

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 5000;
const ipv4 = process.env.IPV4 || 'http://localhost';

// CORS Configuration
const FRONTEND_URLS = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

app.use(cors({
  origin: FRONTEND_URLS.length ? FRONTEND_URLS : true,
  credentials: true,
}));

// Global Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Phase R1: NoSQL injection guard — strips keys containing '$' or '.' from
// req.body, req.params and req.query before reaching any controller.
app.use(require('./modules/admin-panel/middlewares/mongo.sanitize'));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/public/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 1. CMS Auth routes
app.use('/auth-api', require('./modules/cms-auth/routes/auth.route'));

// 2. Admin Panel routes
const adminRouter = express.Router();
adminRouter.use('/', require('./modules/admin-panel/routes/root.route'));
adminRouter.use('/customers', require('./modules/admin-panel/routes/customers.route'));
adminRouter.use('/panels', require('./modules/admin-panel/routes/panels.route'));
adminRouter.use('/departments', require('./modules/admin-panel/routes/departments.route'));
adminRouter.use('/geolocation', require('./modules/admin-panel/routes/geolocation.route'));
adminRouter.use('/warehouses', require('./modules/admin-panel/routes/warehouses.route'));
adminRouter.use('/roles', require('./modules/admin-panel/routes/roles.route'));
adminRouter.use('/modules', require('./modules/admin-panel/routes/modules.route'));
adminRouter.use('/tasks', require('./modules/admin-panel/routes/task.route'));
adminRouter.use('/cms/users', require('./modules/admin-panel/routes/cms.users.route'));
adminRouter.use('/epcs', require('./modules/admin-panel/routes/epcs.route'));
adminRouter.use('/project-types', require('./modules/admin-panel/routes/project.types.route'));
adminRouter.use('/product-templates', require('./modules/admin-panel/routes/product.templates.route'));
adminRouter.use('/units', require('./modules/admin-panel/routes/units.route'));
adminRouter.use('/brand-manufacturer', require('./modules/admin-panel/routes/brand.manufacturer.route'));
adminRouter.use('/products', require('./modules/admin-panel/routes/products.route'));
adminRouter.use('/solar-kits', require('./modules/admin-panel/routes/solar_kits.route'));
adminRouter.use('/solarshop', require('./modules/admin-panel/routes/solarshop.route'));
adminRouter.use('/saas-products', require('./modules/admin-panel/routes/saas_products.route'));
adminRouter.use('/combo-kits', require('./modules/admin-panel/routes/combo_kits.route'));
adminRouter.use('/combo-kit-variants', require('./modules/admin-panel/routes/combo_kit_variants.route'));
adminRouter.use('/product-sku-prices', require('./modules/admin-panel/routes/product_sku_prices.route'));
adminRouter.use('/price-requests', require('./modules/admin-panel/routes/price_requests.route'));
adminRouter.use('/amc-plans', require('./modules/AMC-panel/routes/amc.routes'));
adminRouter.use('/epc-plans', require('./modules/AMC-panel/routes/epc.routes'));
adminRouter.use('/amc-auth', require('./modules/AMC-panel/routes/auth.login.routes'));
adminRouter.use('/industry-types', require('./modules/admin-panel/routes/industry.types.route'));
adminRouter.use('/reseller-mgmt/types', require('./modules/admin-panel/routes/reseller.types.route'));
adminRouter.use('/reseller-mgmt/territories', require('./modules/admin-panel/routes/reseller.territory.route'));
adminRouter.use('/reseller-mgmt/product-auth', require('./modules/admin-panel/routes/reseller.prodauth.route'));
adminRouter.use('/reseller-mgmt/epc-buyers', require('./modules/admin-panel/routes/reseller.epc.route'));
adminRouter.use('/reseller-mgmt/orders', require('./modules/admin-panel/routes/reseller.orders.route'));
adminRouter.use('/reseller-mgmt/wallet', require('./modules/admin-panel/routes/reseller.wallet.route'));
adminRouter.use('/reseller-mgmt/plans', require('./modules/admin-panel/routes/reseller.plans.route'));
adminRouter.use('/resellers/plans', require('./modules/admin-panel/routes/reseller.plans.route'));
adminRouter.use('/reseller-mgmt', require('./modules/admin-panel/routes/reseller.admin.route'));
adminRouter.use('/reseller-mgmt/procurement', require('./modules/admin-panel/routes/reseller.procurement.route'));
adminRouter.use('/reseller-mgmt/pricing-rules', require('./modules/admin-panel/routes/reseller.pricing.route'));
adminRouter.use('/reseller-mgmt/analytics', require('./modules/admin-panel/routes/reseller.analytics.route'));
// Phase R1: Platform-wide settings (exclusivity policy, settlement config, activation requirements)
adminRouter.use('/reseller-mgmt/settings', require('./modules/admin-panel/routes/reseller.settings.route'));
// Industry Content Management System
adminRouter.use('/industry-content', require('./modules/admin-panel/routes/industry.content.route'));
adminRouter.use('/industry-themes', require('./modules/admin-panel/routes/industry.theme.route'));
app.use('/admin-api', adminRouter);
app.use('/api', adminRouter);
app.use('/api/amc-plans', require('./modules/AMC-panel/routes/amc.routes'));
app.use('/api/epc-plans', require('./modules/AMC-panel/routes/epc.routes'));
app.use('/api/amc-auth', require('./modules/AMC-panel/routes/auth.login.routes'));

// 3. Developer Panel routes
const developerRouter = express.Router();
developerRouter.use('/', require('./modules/developer-panel/routes/root.route'));
developerRouter.use('/panels', require('./modules/developer-panel/routes/user_panels.route'));
developerRouter.use('/dashboard', require('./modules/developer-panel/routes/dashboard.route'));
developerRouter.use('/modules', require('./modules/developer-panel/routes/modules.route'));
app.use('/developer-api', developerRouter);

// 4. Operation Management Panel routes
const opRouter = express.Router();
opRouter.use('/', require('./modules/operation-management/routes/root.route'));
app.use('/operation-management-api', opRouter);

// 5. Warehouse Panel routes
const warehouseRouter = express.Router();
warehouseRouter.use('/', require('./modules/warehouse-panel/routes/root.route'));
warehouseRouter.use('/auth', require('./modules/warehouse-panel/routes/auth.route'));
warehouseRouter.use('/warehouse', require('./modules/warehouse-panel/routes/warehouse.route'));
app.use('/warehouse-api', warehouseRouter);

// 6. Account Panel routes
const accountRouter = express.Router();
accountRouter.use('/', require('./modules/account-panel/routes/root.route'));
app.use('/account-api', accountRouter);

// 7. Solarshop India routes
app.use('/api/india/v1', require('./modules/solarshop-india/routes/v1.routes'));

// 8. Supplier Panel routes
const supplierRouter = express.Router();
supplierRouter.use('/auth', require('./modules/supplier-panel/routes/auth.route'));
supplierRouter.use('/supplier', require('./modules/supplier-panel/routes/supplier.route'));
supplierRouter.use('/plans', require('./modules/supplier-panel/routes/plans.route'));
supplierRouter.use('/admin', require('./modules/supplier-panel/routes/admin.route'));
app.use('/supplier-api', supplierRouter);

// 9. website routes 
const website_router = require('./modules/solarkits-website/routes/header.route');
const about_router = require('./modules/solarkits-website/routes/about.route');
const about_details_router = require('./modules/solarkits-website/routes/about_details.route');
const contact_router = require('./modules/solarkits-website/routes/contact.route');
const footer_router = require('./modules/solarkits-website/routes/footer.route');
const erp_modules_router = require('./modules/solarkits-website/routes/erp_modules.route');
const hero_section_router = require('./modules/solarkits-website/routes/hero_section.route');
const erp_benefits_router = require('./modules/solarkits-website/routes/erp_benefits.route');
const happy_users_router = require('./modules/solarkits-website/routes/happy_users.route');
const key_features_router = require('./modules/solarkits-website/routes/key_features.route');
const erp_screenshots_router = require('./modules/solarkits-website/routes/erp_screenshots.route');
const services_router = require('./modules/solarkits-website/routes/services.route');
const pricing_plans_router = require('./modules/solarkits-website/pricing-plans/pricingPlan.routes');
const call_to_action_router = require('./modules/solarkits-website/routes/CallToActionRoutes');
const solar_shop_router = require('./modules/solarkits-website/routes/solar_shop.route');
const marketplace_router = require('./modules/solarkits-website/routes/marketplace.route');
const dealer_app_router = require('./modules/solarkits-website/routes/dealer_app.route');
const megawatt_router = require('./modules/solarkits-website/routes/megawatt.route');
const amc_router = require('./modules/solarkits-website/routes/amc.route');
const website_auth_router = require('./modules/solarkits-website/routes/auth.route');

app.use("/api/website/v1", website_router);
app.use("/api/website/v1/auth", website_auth_router);
app.use("/api/website/v1/erp-modules", erp_modules_router);
app.use("/api/website/v1/about-us", about_router);
app.use("/api/website/v1/about-details", about_details_router);
app.use("/api/website/v1/contact", contact_router);
app.use("/api/website/v1/footer", footer_router);
app.use("/api/website/v1/hero-section", hero_section_router);
app.use("/api/website/v1/erp-benefits", erp_benefits_router);
app.use("/api/website/v1/happy-users", happy_users_router);
app.use("/api/website/v1/key-features", key_features_router);
app.use("/api/website/v1/erp-screenshots", erp_screenshots_router);
app.use("/api/website/v1/services", services_router);
app.use("/api/website/v1/pricing-plans", pricing_plans_router);
app.use("/api/website/v1/call-to-action", call_to_action_router);
app.use("/api/website/v1/solar-shop", solar_shop_router);
app.use("/api/website/v1/marketplace", marketplace_router);
app.use("/api/website/v1/dealer-app", dealer_app_router);
app.use("/api/website/v1/megawatt", megawatt_router);
app.use("/api/website/v1/amc", amc_router);


// Initialize Schedulers / Cron routines & Auto-seed demo accounts
require('./modules/solarshop-india/utils/scheduler');
require('./modules/warehouse-panel/utils/scheduler');
require('./utils/autoSeedAccounts');

// Start Express unified server
app.listen(port, () => {
  console.log(`🚀 Centralized backend server running on ${ipv4}:${port}`);
});
