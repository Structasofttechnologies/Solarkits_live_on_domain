/**
 * =========================================================================
 * SEED 25 REAL-WORLD PRODUCTS AND SKUS
 * =========================================================================
 * Linked to:
 * - pc_product_templates (Templates)
 * - pc_product_subtypes (Subtypes)
 * - brands (Brands)
 * - sys_filter_type_maps (Project Scopes)
 * - pc_brand_subtype_map (Brand-Subtype Mappings)
 * - pc_product_skus (SKU Master)
 * =========================================================================
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
require('../keys/config/databases');

const {
  Product,
  ProductSku,
  ProductTemplate,
  ProductSubtype,
  Brand,
  BrandSubtypeMap,
  ProjectSubcategory,
  ProjectType,
  ProjectSubcategoryType,
  Unit
} = require('../modules/admin-panel/models/core_db');

const SKUS_DATA = [
  // 1. Solar PV - Panels
  {
    name: "Tata Power 540W Mono PERC Half-Cut Module",
    sku_code: "TPS-MOD-540W-MONO",
    template: "Solar Panel",
    subtype: "Mono PERC",
    brand: "Tata Power Solar",
    subcat_name: "Individual Home",
    type_name: "On-Grid",
    description: "High efficiency 540W Mono PERC Half-Cut Cell solar panel with 24V output.",
    features: ["144 Half-Cut Cells", "PID Resistant", "25 Years Linear Warranty", "IP68 Junction Box"],
    base_price: 1350000, // ₹13,500
    stock: 250
  },
  {
    name: "Waaree 550W Bifacial TOPCon Glass-to-Glass",
    sku_code: "WAR-MOD-550W-BIF",
    template: "Solar Panel",
    subtype: "Bifacial",
    brand: "Waaree Energies",
    subcat_name: "Housing Society / RWA",
    type_name: "On-Grid",
    description: "Dual Glass Bifacial TOPCon technology with up to 25% rear side generation gain.",
    features: ["Dual Glass 2.0mm", "Up to 22.5% Module Efficiency", "Lower Temperature Coefficient", "30 Years Warranty"],
    base_price: 1430000, // ₹14,300
    stock: 300
  },
  {
    name: "Adani 580W High-Efficiency TOPCon Module",
    sku_code: "AD-MOD-580W-TOP",
    template: "Solar Panel",
    subtype: "TOPCon",
    brand: "Adani Solar",
    subcat_name: "Commercial Building",
    type_name: "On-Grid",
    description: "Next-gen N-Type TOPCon module for commercial rooftop and ground-mounted utility.",
    features: ["16 Busbar Design", "Zero LID Performance", "Excellent Low Light Performance", "Heavy Wind & Snow Load"],
    base_price: 1520000, // ₹15,200
    stock: 500
  },

  // 2. Solar PV - Inverters
  {
    name: "Havells 3kW Single Phase Dual-MPPT String Inverter",
    sku_code: "HAV-INV-3KW-1P",
    template: "Inverter",
    subtype: "String",
    brand: "Havells Solar",
    subcat_name: "Individual Home",
    type_name: "On-Grid",
    description: "Grid-tied 3kW single-phase solar inverter with built-in Wi-Fi monitoring.",
    features: ["Dual MPPT Trackers", "Natural Cooling IP65", "Smart Mobile App Monitoring", "Anti-Islanding Protection"],
    base_price: 2600000, // ₹26,000
    stock: 80
  },
  {
    name: "Havells 5kW Single Phase Dual-MPPT String Inverter",
    sku_code: "HAV-INV-5KW-1P",
    template: "Inverter",
    subtype: "String",
    brand: "Havells Solar",
    subcat_name: "Individual Home",
    type_name: "On-Grid",
    description: "High efficiency 5kW residential on-grid inverter with 98.2% peak efficiency.",
    features: ["Max DC Input 600V", "Integrated DC Switch", "Ultra Quiet Operation", "5 Years Warranty"],
    base_price: 3800000, // ₹38,000
    stock: 65
  },
  {
    name: "Tata Power 10kW Three Phase Commercial On-Grid Inverter",
    sku_code: "TPS-INV-10KW-3P",
    template: "Inverter",
    subtype: "String",
    brand: "Tata Power Solar",
    subcat_name: "Housing Society / RWA",
    type_name: "On-Grid",
    description: "Three-phase 10kW grid-tied inverter ideal for large villas, RWAs, and commercial rooftops.",
    features: ["Dual High Current MPPT", "Type II SPD on AC/DC", "Compact Lightweight Design", "RS485 & Wi-Fi"],
    base_price: 6800000, // ₹68,000
    stock: 40
  },
  {
    name: "Havells 5kW Hybrid Smart Solar Inverter with BESS Port",
    sku_code: "HAV-HYB-5KW-1P",
    template: "Inverter",
    subtype: "Hybrid",
    brand: "Havells Solar",
    subcat_name: "Individual Home",
    type_name: "Hybrid",
    description: "Smart solar hybrid inverter with battery storage management and grid export control.",
    features: ["Seamless UPS Switchover <10ms", "48V Battery Compatible", "Time-of-Use Peak Shaving", "Generator Support"],
    base_price: 5500000, // ₹55,000
    stock: 35
  },

  // 3. Solar Agriculture
  {
    name: "Kirloskar 3 HP Submersible AC Solar Water Pump",
    sku_code: "KIR-PMP-3HP-AC",
    template: "Solar Water Pump",
    subtype: "AC Submersible",
    brand: "Kirloskar Solar",
    subcat_name: "Solar Water Pump",
    type_name: "DC / AC Pump System",
    description: "High head 3 HP submersible solar water pump designed for deep tubewells and borewells.",
    features: ["Stainless Steel Impeller", "Wide Voltage MPPT Support", "Sand Resistant Design", "MNRE Approved"],
    base_price: 4200000, // ₹42,000
    stock: 50
  },
  {
    name: "Kirloskar 5 HP Surface DC Solar Water Pump",
    sku_code: "KIR-PMP-5HP-DC",
    template: "Solar Water Pump",
    subtype: "DC Surface",
    brand: "Kirloskar Solar",
    subcat_name: "PM-KUSUM Component B",
    type_name: "Standalone Solar Pump",
    description: "5 HP brushless DC surface pump for open wells, canals, and river irrigation under PM-KUSUM.",
    features: ["High Water Discharge Rate", "Direct Solar DC Powered", "Low Maintenance", "Heavy Cast Iron Casing"],
    base_price: 6800000, // ₹68,000
    stock: 30
  },
  {
    name: "Kirloskar 7.5 HP Solar Pump Controller & VFD Drive",
    sku_code: "KIR-VFD-7.5HP",
    template: "Inverter",
    subtype: "VFD Controller",
    brand: "Kirloskar Solar",
    subcat_name: "PM-KUSUM Component C",
    type_name: "Solarised Grid Pump",
    description: "Smart VFD inverter drive for solarizing existing agricultural grid pumps with grid-solar auto-switching.",
    features: ["Dual Power Input (Solar + Grid)", "Sensorless Dry Run Protection", "Water Level Control", "Remote GPRS Monitoring"],
    base_price: 3500000, // ₹35,000
    stock: 45
  },

  // 4. Solar EV
  {
    name: "Servotech 7.4kW AC Type-2 Single Gun Wallbox Charger",
    sku_code: "SRV-EVC-7.4KW-AC",
    template: "EV Charger",
    subtype: "AC Wallbox",
    brand: "Servotech Power Systems",
    subcat_name: "Residential EV Charging",
    type_name: "Solar On-Grid / Hybrid",
    description: "Smart home EV wallbox charger with Type-2 connector and solar priority charging mode.",
    features: ["Type-2 Gun (5m Cable)", "RFID & Mobile App Access", "IP55 Weatherproof", "Solar Excess Charging"],
    base_price: 3200000, // ₹32,000
    stock: 100
  },
  {
    name: "Servotech 22kW AC Commercial Dual Gun EV Charger",
    sku_code: "SRV-EVC-22KW-AC",
    template: "EV Charger",
    subtype: "AC Commercial",
    brand: "Servotech Power Systems",
    subcat_name: "Commercial EV Charging",
    type_name: "AC Charging",
    description: "Three-phase dual-gun commercial EV charging station with OCPP 1.6J protocol for public billing.",
    features: ["Dual Guns (2x 11kW or 1x 22kW)", "OCPP 1.6J Cloud Billing", "7-inch LCD Touchscreen", "Dynamic Load Balancing"],
    base_price: 7500000, // ₹75,000
    stock: 25
  },
  {
    name: "Tata Motors 30kW DC Fast Charger CCS2 Dual Gun",
    sku_code: "TPS-EVC-30KW-DC",
    template: "EV Charger",
    subtype: "DC Fast",
    brand: "Tata Motors",
    subcat_name: "Public Charging Station",
    type_name: "DC Fast Charging",
    description: "Commercial DC fast charger with CCS-2 dual gun supporting all Indian passenger EVs.",
    features: ["30kW Output (Up to 100A)", "Dual Gun CCS-2", "95% Efficiency", "Payment Gateway Integration"],
    base_price: 35000000, // ₹3,50,000
    stock: 15
  },
  {
    name: "Tata Motors 60kW DC Ultra-Fast Highway Charging Unit",
    sku_code: "TPS-EVC-60KW-DC",
    template: "EV Charger",
    subtype: "DC Ultra-Fast",
    brand: "Tata Motors",
    subcat_name: "Highway Charging Hub",
    type_name: "DC Ultra-Fast Charging",
    description: "Heavy-duty 60kW dual-gun DC ultra fast charger designed for highway hubs and commercial fleets.",
    features: ["60kW Simultaneous Output", "Active Liquid Cooling", "Emergency Stop Button", "OCPP 2.0.1 Ready"],
    base_price: 65000000, // ₹6,50,000
    stock: 10
  },

  // 5. Energy Storage (BESS)
  {
    name: "Exide 5.12kWh 51.2V 100Ah LFP Wall-Mount Battery",
    sku_code: "EXI-BAT-5.12KWH-LFP",
    template: "Battery",
    subtype: "LFP",
    brand: "Exide Solar",
    subcat_name: "Residential Storage",
    type_name: "Solar Hybrid / Backup",
    description: "Wall-mounted Lithium Iron Phosphate (LiFePO4) solar storage pack with intelligent BMS.",
    features: ["6000 Cycles @ 80% DOD", "Smart CAN/RS485 BMS", "Parallel Expansion up to 15 Units", "Compact Wall Mount"],
    base_price: 8500000, // ₹85,000
    stock: 75
  },
  {
    name: "Exide 10.24kWh 51.2V 200Ah Modular Rack Storage Pack",
    sku_code: "EXI-BAT-10.24KWH-LFP",
    template: "Battery",
    subtype: "LFP",
    brand: "Exide Solar",
    subcat_name: "Residential Storage",
    type_name: "Solar Hybrid / Backup",
    description: "Modular 10.24 kWh LiFePO4 rack battery system for complete residential and commercial backup.",
    features: ["High Continuous Discharge", "19-inch Server Rack Mount", "Cell Level Over-Voltage Cutoff", "10 Years Life"],
    base_price: 16500000, // ₹1,65,000
    stock: 40
  },
  {
    name: "Luminous 150Ah 12V Solar Tall Tubular Battery",
    sku_code: "LUM-BAT-150AH-TT",
    template: "Battery",
    subtype: "Lead Acid",
    brand: "Luminous Power Technologies",
    subcat_name: "Individual Home",
    type_name: "Off-Grid",
    description: "Heavy-duty C10 rated deep-cycle tall tubular solar battery with low maintenance antimony alloy.",
    features: ["150Ah @ C10 Rating", "Long Life Spines", "Fast Recharging Capability", "36 Months Warranty"],
    base_price: 1550000, // ₹15,500
    stock: 120
  },

  // 6. Solar Lighting
  {
    name: "Havells 20W All-In-One Integrated Solar Street Light",
    sku_code: "HAV-SSL-20W-AIO",
    template: "Solar Street Light",
    subtype: "All-In-One",
    brand: "Havells Solar",
    subcat_name: "Solar Street Light",
    type_name: "Standalone",
    description: "Compact all-in-one solar street light with integrated solar panel, LiFePO4 battery, and radar sensor.",
    features: ["20W High Lumen LED", "Motion Detection Dimming", "Dust & Water IP65", "Lithium Battery Built-In"],
    base_price: 550000, // ₹5,500
    stock: 150
  },
  {
    name: "Havells 40W Semi-Integrated Solar Highway Street Light",
    sku_code: "HAV-SSL-40W-SEMI",
    template: "Solar Street Light",
    subtype: "Semi-Integrated",
    brand: "Havells Solar",
    subcat_name: "Highway / Area Lighting",
    type_name: "Standalone / Centralised",
    description: "Semi-integrated 40W street light with independent tiltable solar PV panel for highways and parks.",
    features: ["40W (5600 Lumens)", "Optimum Angle Tilt PV", "2 Days Rainy Day Backup", "Aluminum Die-Cast Housing"],
    base_price: 950000, // ₹9,500
    stock: 80
  },

  // 7. Solar Thermal
  {
    name: "Emmvee 200 LPD Pressurised ETC Solar Water Heater",
    sku_code: "EMM-SWH-200L-ETC",
    template: "Solar Water Heater",
    subtype: "Evacuated Tube",
    brand: "Emmvee Solar",
    subcat_name: "Residential Water Heating",
    type_name: "Evacuated Tube / Flat Plate",
    description: "Pressurized evacuated glass tube solar water heater with PUF insulated storage tank.",
    features: ["200 LPD Capacity", "Triple Layer Borosilicate Tubes", "Suitable for Hard Water", "Food-Grade Stainless Inner Tank"],
    base_price: 2600000, // ₹26,000
    stock: 45
  },
  {
    name: "V-Guard 300 LPD FPC Glass-Lined Solar Water Heater",
    sku_code: "VG-SWH-300L-FPC",
    template: "Solar Water Heater",
    subtype: "Flat Plate",
    brand: "V-Guard Solar",
    subcat_name: "Residential Water Heating",
    type_name: "Evacuated Tube / Flat Plate",
    description: "Flat plate collector solar water heating system with high-pressure glass-lined enamel tank.",
    features: ["300 LPD Hot Water", "Copper-Ultrasonic Welded Absorber", "High Pressure Booster Pump Compatible", "Toughened Solar Glass"],
    base_price: 3800000, // ₹38,000
    stock: 30
  },

  // 8. Balance of System (BOS)
  {
    name: "Polycab 4 sq mm Single Core DC Solar Cable (100m Roll)",
    sku_code: "POL-CBL-4MM-DC",
    template: "Cable",
    subtype: "DC Cable",
    brand: "Polycab Solar",
    subcat_name: "Individual Home",
    type_name: "On-Grid",
    description: "TUV 2PfG 1169 certified cross-linked electron beam cured flexible solar DC cable.",
    features: ["4 sq mm Pure Copper", "Halogen-Free Flame Retardant", "UV & Ozone Resistant", "Rated 1500V DC"],
    base_price: 420000, // ₹4,200
    stock: 200
  },
  {
    name: "Polycab 6 sq mm Single Core DC Solar Cable (100m Roll)",
    sku_code: "POL-CBL-6MM-DC",
    template: "Cable",
    subtype: "DC Cable",
    brand: "Polycab Solar",
    subcat_name: "Factory / Manufacturing Unit",
    type_name: "On-Grid",
    description: "Heavy duty 6 sq mm solar DC cable for high current long string runs in C&I plants.",
    features: ["6 sq mm Tinned Copper", "Minimal Voltage Drop", "120°C Temperature Rating", "Double Insulated"],
    base_price: 610000, // ₹6,100
    stock: 180
  },
  {
    name: "Solarkits 1-In 1-Out IP65 DC Distribution Box (DCDB)",
    sku_code: "SK-DCDB-1IN-1OUT",
    template: "DCDB",
    subtype: "1 String",
    brand: "Tata Power Solar",
    subcat_name: "Individual Home",
    type_name: "On-Grid",
    description: "Pre-wired 1 String DC protection box with Type 2 SPD and 1000V DC gPV fuses.",
    features: ["1000V DC Type 2 SPD", "15A 1000V DC Fuses with Holder", "IP65 Polycarbonate Enclosure", "Pre-crimped Solar Wires"],
    base_price: 180000, // ₹1,800
    stock: 220
  },
  {
    name: "Solarkits 1-Phase 32A AC Distribution Box (ACDB)",
    sku_code: "SK-ACDB-1P-32A",
    template: "ACDB",
    subtype: "Single Phase",
    brand: "Tata Power Solar",
    subcat_name: "Individual Home",
    type_name: "On-Grid",
    description: "Residential 1-Phase AC distribution box with 32A C-curve MCB and AC surge protection.",
    features: ["32A 2-Pole C-Curve MCB", "Class II 275V AC SPD", "IP65 Waterproof Enclosure", "Complete Neutral & Earth Terminals"],
    base_price: 210000, // ₹2,100
    stock: 210
  }
];

async function ensureTemplateAndSubtype(templateName, subtypeName, unitId) {
  let tmpl = await ProductTemplate.findOne({ name: templateName, deleted_at: null });
  if (!tmpl) {
    tmpl = await ProductTemplate.create({
      name: templateName,
      is_system: false,
      qty_unit_id: unitId
    });
    console.log(`  [+] Created Missing Template: "${templateName}"`);
  }

  let sub = await ProductSubtype.findOne({ name: subtypeName, template_id: tmpl._id, deleted_at: null });
  if (!sub) {
    sub = await ProductSubtype.create({
      name: subtypeName,
      template_id: tmpl._id,
      is_system: false
    });
    console.log(`    [+] Created Missing Subtype: "${subtypeName}" for "${templateName}"`);
  }

  return { template: tmpl, subtype: sub };
}

async function seedSKUs() {
  console.log('====================================================');
  console.log('🚀 INSERTING 25 APPROVED REAL-WORLD PRODUCTS & SKUS');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Load pieces unit for default qty
  const nosUnit = await Unit.findOne({ symbol: "nos" });
  const unitId = nosUnit ? nosUnit._id : null;

  let createdProducts = 0;
  let createdSkus = 0;
  let skippedProducts = 0;
  let mappedBrands = 0;

  for (let i = 0; i < SKUS_DATA.length; i++) {
    const item = SKUS_DATA[i];

    // 1. Ensure Template & Subtype
    const { template, subtype } = await ensureTemplateAndSubtype(item.template, item.subtype, unitId);

    // 2. Find Brand
    const brand = await Brand.findOne({
      brand_name: { $regex: new RegExp(`^${item.brand.trim()}$`, 'i') },
      deleted_at: null
    });

    if (!brand) {
      console.warn(`⚠️ Brand "${item.brand}" not found for SKU: ${item.sku_code}`);
      continue;
    }

    // 3. Map Brand to Subtype in pc_brand_subtype_map
    const existingBrandMap = await BrandSubtypeMap.findOne({
      brand_id: brand._id,
      subtype_id: subtype._id,
      deleted_at: null
    });

    if (!existingBrandMap) {
      await BrandSubtypeMap.create({
        brand_id: brand._id,
        subtype_id: subtype._id
      });
      mappedBrands++;
    }

    // 4. Find Scope (sys_filter_type_maps)
    const subcat = await ProjectSubcategory.findOne({
      name: { $regex: new RegExp(`^${item.subcat_name.trim()}$`, 'i') },
      deleted_at: null
    });

    const sysType = await ProjectType.findOne({
      name: { $regex: new RegExp(`^${item.type_name.trim()}$`, 'i') },
      deleted_at: null
    });

    let scopeIds = [];
    if (subcat && sysType) {
      const typeMap = await ProjectSubcategoryType.findOne({
        subcategory: subcat._id,
        type: sysType._id,
        deleted_at: null
      });
      if (typeMap) {
        scopeIds.push(typeMap._id);
      }
    }

    // 5. Check if Product exists
    let product = await Product.findOne({
      $or: [{ sku_code: item.sku_code }, { name: item.name }],
      deleted_at: null
    });

    if (!product) {
      product = await Product.create({
        name: item.name,
        sku_code: item.sku_code,
        description: item.description,
        features: item.features,
        template_id: template._id,
        subtype_id: subtype._id,
        brand_id: brand._id,
        scope_ids: scopeIds,
        base_price_paise: item.base_price,
        stock_quantity: item.stock,
        is_active: true,
        status: 'active'
      });
      createdProducts++;
      console.log(`[+] Created Product: "${product.name}" [SKU: ${item.sku_code}]`);
    } else {
      skippedProducts++;
    }

    // 6. Check if Product SKU exists
    let sku = await ProductSku.findOne({
      sku_code: item.sku_code,
      deleted_at: null
    });

    if (!sku) {
      sku = await ProductSku.create({
        product_id: product._id,
        sku_code: item.sku_code,
        attributes: []
      });
      createdSkus++;
      console.log(`    [+] Created SKU Master: "${sku.sku_code}" for Product ID: ${product._id}`);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 REAL-WORLD PRODUCTS & SKUS INSERTION COMPLETE!');
  console.log(`📊 Products Created        : ${createdProducts}`);
  console.log(`📊 Products Already Existed: ${skippedProducts}`);
  console.log(`📊 Product SKUs Created    : ${createdSkus}`);
  console.log(`📊 Brand-Subtype Mappings  : ${mappedBrands}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedSKUs().catch(err => {
  console.error('❌ SKU Seeding Error:', err);
  process.exit(1);
});
