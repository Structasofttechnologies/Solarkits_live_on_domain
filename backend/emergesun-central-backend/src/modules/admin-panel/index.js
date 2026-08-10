require("dotenv").config();
require('./config/databases'); // open all 6 Mongoose connections on startup
const express = require("express");
const cors = require("cors");
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; 
const ipv4 = process.env.IPV4 || "http://localhost";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded())
app.use(cors());

app.use('/', express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/',require('./routes/root.route'));
app.use('/customers',require('./routes/customers.route'));
app.use('/panels',require('./routes/panels.route'));
app.use('/departments',require('./routes/departments.route'));
app.use('/geolocation',require('./routes/geolocation.route'));
app.use('/warehouses',require('./routes/warehouses.route'));
app.use('/roles',require('./routes/roles.route'));
app.use('/modules',require('./routes/modules.route'));
app.use('/tasks',require('./routes/task.route'));
app.use('/cms/users',require('./routes/cms.users.route'));
app.use('/epcs',require('./routes/epcs.route'));
app.use('/project-types',require('./routes/project.types.route'));
app.use('/product-templates',require('./routes/product.templates.route'));
app.use('/units', require('./routes/units.route'));
app.use('/brand-manufacturer',require('./routes/brand.manufacturer.route'));
app.use('/products',require('./routes/products.route'));
app.use('/solar-kits',require('./routes/solar_kits.route'));
app.use('/solarshop',require('./routes/solarshop.route'));
app.use('/saas-products', require('./routes/saas_products.route'));
app.use('/combo-kits', require('./routes/combo_kits.route'));
app.use('/combo-kit-variants', require('./routes/combo_kit_variants.route'));
app.use('/product-sku-prices', require('./routes/product_sku_prices.route'));
app.use('/price-requests', require('./routes/price_requests.route'));
app.use('/suppliers', require('./routes/suppliers.route'));

// Force nodemon reload: variant config subdocument ID preservation
app.listen(port, () =>
  console.log(`Server started on ${ipv4}:${port}`)
);