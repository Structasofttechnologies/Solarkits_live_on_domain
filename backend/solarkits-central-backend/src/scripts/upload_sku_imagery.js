/**
 * =========================================================================
 * UPLOAD PRODUCT & SKU IMAGERY TO CLOUDINARY & LOCAL PUBLIC DIR
 * =========================================================================
 * Generates and uploads authentic product imagery for all 25 real-world SKUs.
 * Updates both `Product.image` and `ProductSku.image` in MongoDB.
 * =========================================================================
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('../keys/config/databases');

const { Product, ProductSku } = require('../modules/admin-panel/models/core_db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const LOCAL_IMG_DIR = path.resolve(
  __dirname,
  '../../../../internal-admin-portal/solarkits-unified-admin/public/images/products'
);

if (!fs.existsSync(LOCAL_IMG_DIR)) {
  fs.mkdirSync(LOCAL_IMG_DIR, { recursive: true });
}

// Helper to create high-detail SVG graphics for products
function generateProductSvg(title, category, brand, colorPrimary, colorSecondary, iconDetails) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f4f6f9"/>
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colorPrimary}"/>
      <stop offset="100%" stop-color="${colorSecondary}"/>
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#0f172a" flood-opacity="0.14"/>
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="glow"/>
      <feComposite in="SourceGraphic" in2="glow" operator="over"/>
    </filter>
  </defs>

  <!-- Clean Background with Subtle Grid Pattern -->
  <rect width="600" height="600" rx="32" fill="url(#bgGrad)"/>
  <circle cx="300" cy="270" r="220" fill="#ffffff" opacity="0.8"/>
  <circle cx="300" cy="270" r="160" fill="${colorPrimary}" opacity="0.04"/>

  <!-- Category & Brand Header Watermark -->
  <rect x="40" y="32" width="120" height="28" rx="14" fill="#0f172a" opacity="0.05"/>
  <text x="100" y="50" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#475569" letter-spacing="1.5">${brand.toUpperCase()}</text>

  <!-- Dynamic Product Visual Graphic -->
  <g filter="url(#dropShadow)">
    ${iconDetails}
  </g>

  <!-- Technical Label Footer Badge -->
  <g transform="translate(60, 505)">
    <rect width="480" height="62" rx="18" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" filter="url(#dropShadow)"/>
    <circle cx="36" cy="31" r="10" fill="${colorPrimary}"/>
    <circle cx="36" cy="31" r="4" fill="#ffffff"/>
    <text x="60" y="27" font-family="'Inter', sans-serif" font-size="13" font-weight="900" fill="#0f172a">${title}</text>
    <text x="60" y="44" font-family="'Inter', sans-serif" font-size="10" font-weight="700" fill="#64748b" letter-spacing="0.5">${category.toUpperCase()} • CERTIFIED SOLAR HARDWARE</text>
    <rect x="400" y="19" width="60" height="24" rx="8" fill="${colorPrimary}" opacity="0.12"/>
    <text x="430" y="35" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" font-weight="800" fill="${colorPrimary}">GENUINE</text>
  </g>
</svg>`;
}

// Visual definitions for each specific equipment type
const VISUAL_TEMPLATES = {
  // 3. Adani TOPCon Panel
  "AD-MOD-580W-TOP": generateProductSvg(
    "Adani 580W TOPCon Module", "Solar PV Module", "Adani Solar", "#0284c7", "#0369a1",
    `<rect x="190" y="80" width="220" height="370" rx="10" fill="#0f172a" stroke="#cbd5e1" stroke-width="6"/>
     <g stroke="#38bdf8" stroke-width="1" opacity="0.6">
       ${Array.from({length: 12}, (_, i) => `<line x1="194" y1="${105 + i * 28}" x2="406" y2="${105 + i * 28}"/>`).join('')}
       ${Array.from({length: 6}, (_, i) => `<line x1="${215 + i * 32}" y1="84" x2="${215 + i * 32}" y2="446"/>`).join('')}
     </g>
     <rect x="270" y="445" width="60" height="18" rx="4" fill="#1e293b"/>
     <path d="M 285 463 Q 275 485 260 488" stroke="#000000" stroke-width="4" fill="none"/>
     <path d="M 315 463 Q 325 485 340 488" stroke="#ef4444" stroke-width="4" fill="none"/>`
  ),

  // 5. Havells 5kW String Inverter
  "HAV-INV-5KW-1P": generateProductSvg(
    "Havells 5kW String Inverter", "Solar Inverter", "Havells Solar", "#ea580c", "#c2410c",
    `<rect x="180" y="110" width="240" height="310" rx="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
     <path d="M 165 150 L 180 150 L 180 370 L 165 370 Z" fill="#64748b"/>
     <path d="M 420 150 L 435 150 L 435 370 L 420 370 Z" fill="#64748b"/>
     <rect x="230" y="160" width="140" height="90" rx="16" fill="#0f172a"/>
     <rect x="245" y="175" width="110" height="60" rx="8" fill="#0284c7" opacity="0.85"/>
     <text x="300" y="210" text-anchor="middle" font-family="'Inter', sans-serif" font-size="20" font-weight="900" fill="#ffffff">5.00 kW</text>
     <circle cx="280" cy="275" r="5" fill="#22c55e"/>
     <circle cx="300" cy="275" r="5" fill="#eab308"/>
     <circle cx="320" cy="275" r="5" fill="#64748b"/>
     <rect x="215" y="415" width="170" height="24" rx="8" fill="#1e293b"/>
     <circle cx="245" cy="427" r="6" fill="#ef4444"/>
     <circle cx="275" cy="427" r="6" fill="#0284c7"/>
     <circle cx="325" cy="427" r="6" fill="#22c55e"/>`
  ),

  // 6. Tata Power 10kW 3P Inverter
  "TPS-INV-10KW-3P": generateProductSvg(
    "Tata Power 10kW 3-Phase Inverter", "Commercial Inverter", "Tata Power", "#2563eb", "#1d4ed8",
    `<rect x="170" y="95" width="260" height="340" rx="24" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
     <rect x="195" y="125" width="210" height="80" rx="14" fill="#0f172a"/>
     <text x="300" y="165" text-anchor="middle" font-family="'Inter', sans-serif" font-size="22" font-weight="900" fill="#38bdf8">10.0 kW</text>
     <text x="300" y="190" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#94a3b8">3-PHASE ON-GRID SYSTEM</text>
     <circle cx="285" cy="235" r="6" fill="#22c55e"/>
     <circle cx="315" cy="235" r="6" fill="#3b82f6"/>
     <rect x="210" y="270" width="180" height="120" rx="12" fill="#e2e8f0"/>
     <line x1="210" y1="300" x2="390" y2="300" stroke="#94a3b8" stroke-width="2"/>
     <line x1="210" y1="330" x2="390" y2="330" stroke="#94a3b8" stroke-width="2"/>
     <line x1="210" y1="360" x2="390" y2="360" stroke="#94a3b8" stroke-width="2"/>`
  ),

  // 7. Havells 5kW Hybrid Inverter
  "HAV-HYB-5KW-1P": generateProductSvg(
    "Havells 5kW Smart Hybrid Inverter", "Hybrid Solar Inverter", "Havells Solar", "#7c3aed", "#6d28d9",
    `<rect x="175" y="105" width="250" height="325" rx="30" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
     <rect x="220" y="145" width="160" height="110" rx="18" fill="#1e1b4b"/>
     <circle cx="300" cy="200" r="32" fill="none" stroke="#a855f7" stroke-width="6"/>
     <path d="M 300 178 L 300 200 L 314 212" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
     <text x="300" y="275" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="900" fill="#7c3aed">HYBRID + BESS</text>
     <rect x="205" y="305" width="190" height="85" rx="12" fill="#f1f5f9"/>
     <text x="235" y="340" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#475569">PV: 6.5 kW</text>
     <text x="235" y="365" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#475569">BAT: 48V LFP</text>`
  ),

  // 8. Kirloskar 3 HP Submersible Pump
  "KIR-PMP-3HP-AC": generateProductSvg(
    "Kirloskar 3 HP Submersible Pump", "Solar Water Pump", "Kirloskar", "#059669", "#047857",
    `<rect x="260" y="90" width="80" height="350" rx="40" fill="#e2e8f0" stroke="#94a3b8" stroke-width="4"/>
     <rect x="268" y="105" width="64" height="160" rx="8" fill="#cbd5e1"/>
     ${Array.from({length: 6}, (_, i) => `<line x1="268" y1="${130 + i * 22}" x2="332" y2="${130 + i * 22}" stroke="#64748b" stroke-width="2"/>`).join('')}
     <rect x="272" y="280" width="56" height="140" fill="#059669" rx="4"/>
     <text x="300" y="355" text-anchor="middle" font-family="'Inter', sans-serif" font-size="12" font-weight="900" fill="#ffffff" transform="rotate(-90 300 355)">3 HP AC PUMP</text>
     <path d="M 300 90 L 300 65 L 340 65" stroke="#000000" stroke-width="6" fill="none"/>`
  ),

  // 9. Kirloskar 5 HP Surface DC Pump
  "KIR-PMP-5HP-DC": generateProductSvg(
    "Kirloskar 5 HP Surface Pump", "Solar Water Pump", "Kirloskar", "#059669", "#047857",
    `<rect x="210" y="200" width="180" height="150" rx="20" fill="#059669"/>
     <rect x="160" y="235" width="60" height="80" rx="10" fill="#047857"/>
     <circle cx="390" cy="275" r="55" fill="#047857" stroke="#ffffff" stroke-width="4"/>
     <circle cx="390" cy="275" r="25" fill="#059669"/>
     <rect x="375" y="150" width="30" height="75" rx="6" fill="#cbd5e1"/>
     <rect x="240" y="165" width="120" height="40" rx="6" fill="#1e293b"/>
     <text x="300" y="190" text-anchor="middle" font-family="'Inter', sans-serif" font-size="12" font-weight="900" fill="#ffffff">5 HP DC BLDC</text>
     <rect x="200" y="345" width="200" height="20" rx="6" fill="#334155"/>`
  ),

  // 10. Kirloskar 7.5 HP VFD Controller
  "KIR-VFD-7.5HP": generateProductSvg(
    "Kirloskar 7.5 HP VFD Controller", "Pump Controller Drive", "Kirloskar", "#0d9488", "#0f766e",
    `<rect x="195" y="110" width="210" height="315" rx="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
     <rect x="225" y="145" width="150" height="75" rx="10" fill="#0f172a"/>
     <text x="300" y="190" text-anchor="middle" font-family="'Courier New', monospace" font-size="28" font-weight="900" fill="#22c55e">50.0 Hz</text>
     <circle cx="265" cy="265" r="22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
     <circle cx="335" cy="265" r="16" fill="#ef4444"/>
     <circle cx="335" cy="315" r="16" fill="#22c55e"/>
     <text x="300" y="375" text-anchor="middle" font-family="'Inter', sans-serif" font-size="13" font-weight="900" fill="#0f172a">7.5 HP MPPT VFD</text>`
  ),

  // 11. Servotech 7.4kW AC Wallbox Charger
  "SRV-EVC-7.4KW-AC": generateProductSvg(
    "Servotech 7.4kW AC Wallbox", "EV Charging Station", "Servotech", "#0284c7", "#0369a1",
    `<rect x="200" y="100" width="200" height="330" rx="35" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
     <circle cx="300" cy="210" r="55" fill="none" stroke="#38bdf8" stroke-width="8" filter="url(#softGlow)"/>
     <path d="M 300 180 L 290 215 L 310 215 L 295 245" stroke="#ffffff" stroke-width="4" stroke-linejoin="round" fill="none"/>
     <text x="300" y="300" text-anchor="middle" font-family="'Inter', sans-serif" font-size="20" font-weight="900" fill="#ffffff">7.4 kW</text>
     <text x="300" y="325" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" font-weight="700" fill="#38bdf8">TYPE-2 AC CHARGER</text>
     <path d="M 300 425 Q 360 480 390 430 L 400 370" stroke="#334155" stroke-width="12" fill="none" stroke-linecap="round"/>`
  ),

  // 12. Servotech 22kW AC Dual Gun
  "SRV-EVC-22KW-AC": generateProductSvg(
    "Servotech 22kW Dual Gun Charger", "Commercial EV Charger", "Servotech", "#2563eb", "#1d4ed8",
    `<rect x="180" y="85" width="240" height="360" rx="25" fill="#1e293b" stroke="#60a5fa" stroke-width="3"/>
     <rect x="220" y="125" width="160" height="110" rx="12" fill="#0f172a"/>
     <text x="300" y="175" text-anchor="middle" font-family="'Inter', sans-serif" font-size="24" font-weight="900" fill="#60a5fa">22 kW</text>
     <text x="300" y="205" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#94a3b8">DUAL GUN COMMERCIAL</text>
     <circle cx="245" cy="285" r="25" fill="#0f172a" stroke="#22c55e" stroke-width="4"/>
     <circle cx="355" cy="285" r="25" fill="#0f172a" stroke="#22c55e" stroke-width="4"/>
     <rect x="225" y="350" width="150" height="45" rx="10" fill="#334155"/>
     <text x="300" y="377" text-anchor="middle" font-family="'Inter', sans-serif" font-size="12" font-weight="800" fill="#ffffff">RFID / OCPP 1.6J</text>`
  ),

  // 13. Tata Motors 30kW DC Fast Charger
  "TPS-EVC-30KW-DC": generateProductSvg(
    "Tata Motors 30kW DC Fast Charger", "DC Fast Charging Hub", "Tata Motors", "#1d4ed8", "#1e40af",
    `<rect x="190" y="80" width="220" height="375" rx="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
     <rect x="210" y="110" width="180" height="130" rx="14" fill="#0f172a"/>
     <text x="300" y="165" text-anchor="middle" font-family="'Inter', sans-serif" font-size="28" font-weight="900" fill="#38bdf8">30 kW</text>
     <text x="300" y="195" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#22c55e">● READY FOR CHARGE</text>
     <rect x="220" y="260" width="160" height="60" rx="10" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2"/>
     <text x="300" y="295" text-anchor="middle" font-family="'Inter', sans-serif" font-size="13" font-weight="900" fill="#0f172a">CCS-2 DUAL GUN</text>
     <rect x="210" y="340" width="180" height="85" rx="10" fill="#0284c7"/>
     <text x="300" y="388" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="900" fill="#ffffff">TATA POWER EZ</text>`
  ),

  // 14. Tata Motors 60kW DC Ultra-Fast Highway
  "TPS-EVC-60KW-DC": generateProductSvg(
    "Tata Motors 60kW Highway Charger", "Ultra-Fast DC Hub", "Tata Motors", "#b91c1c", "#991b1b",
    `<rect x="180" y="70" width="240" height="395" rx="24" fill="#0f172a" stroke="#ef4444" stroke-width="4"/>
     <rect x="205" y="105" width="190" height="140" rx="16" fill="#1e293b"/>
     <text x="300" y="165" text-anchor="middle" font-family="'Inter', sans-serif" font-size="32" font-weight="900" fill="#f87171">60 kW</text>
     <text x="300" y="200" text-anchor="middle" font-family="'Inter', sans-serif" font-size="12" font-weight="800" fill="#ffffff">ULTRA-FAST DC HUB</text>
     <circle cx="255" cy="295" r="28" fill="#1e293b" stroke="#22c55e" stroke-width="4"/>
     <circle cx="345" cy="295" r="28" fill="#1e293b" stroke="#22c55e" stroke-width="4"/>
     <rect x="215" y="355" width="170" height="75" rx="12" fill="#ef4444"/>
     <text x="300" y="398" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="900" fill="#ffffff">HIGHWAY SUPERFAST</text>`
  ),

  // 15. Exide 5.12kWh LFP Wall-Mount Battery
  "EXI-BAT-5.12KWH-LFP": generateProductSvg(
    "Exide 5.12kWh LFP Battery", "Lithium Battery Storage", "Exide Solar", "#dc2626", "#b91c1c",
    `<rect x="180" y="115" width="240" height="300" rx="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
     <rect x="210" y="145" width="180" height="90" rx="14" fill="#0f172a"/>
     <text x="300" y="190" text-anchor="middle" font-family="'Inter', sans-serif" font-size="24" font-weight="900" fill="#ffffff">5.12 kWh</text>
     <text x="300" y="215" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#22c55e">51.2V 100Ah LiFePO4</text>
     ${Array.from({length: 8}, (_, i) => `<rect x="${225 + i * 19}" y="260" width="13" height="24" rx="3" fill="#22c55e"/>`).join('')}
     <rect x="210" y="315" width="180" height="65" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
     <circle cx="245" cy="348" r="10" fill="#ef4444"/>
     <circle cx="355" cy="348" r="10" fill="#0f172a"/>`
  ),

  // 16. Exide 10.24kWh Modular Rack Pack
  "EXI-BAT-10.24KWH-LFP": generateProductSvg(
    "Exide 10.24kWh Rack Pack", "BESS Server Rack", "Exide Solar", "#dc2626", "#b91c1c",
    `<rect x="160" y="110" width="280" height="310" rx="14" fill="#0f172a" stroke="#e2e8f0" stroke-width="4"/>
     <!-- Module 1 -->
     <rect x="180" y="130" width="240" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
     <text x="290" y="165" font-family="'Inter', sans-serif" font-size="12" font-weight="800" fill="#ffffff">MODULE 1 • 5.12 kWh</text>
     <circle cx="205" cy="160" r="5" fill="#22c55e"/>
     <!-- Module 2 -->
     <rect x="180" y="205" width="240" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
     <text x="290" y="240" font-family="'Inter', sans-serif" font-size="12" font-weight="800" fill="#ffffff">MODULE 2 • 5.12 kWh</text>
     <circle cx="205" cy="235" r="5" fill="#22c55e"/>
     <!-- Master Controller -->
     <rect x="180" y="280" width="240" height="115" rx="8" fill="#334155"/>
     <text x="300" y="325" text-anchor="middle" font-family="'Inter', sans-serif" font-size="18" font-weight="900" fill="#ffffff">10.24 kWh BESS</text>
     <text x="300" y="355" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#38bdf8">INTELLIGENT CAN/RS485 BMS</text>`
  ),

  // 17. Luminous 150Ah Tall Tubular Battery
  "LUM-BAT-150AH-TT": generateProductSvg(
    "Luminous 150Ah Tall Tubular", "Deep Cycle Lead Acid", "Luminous", "#0284c7", "#0369a1",
    `<rect x="190" y="135" width="220" height="285" rx="16" fill="#0284c7" stroke="#0369a1" stroke-width="4"/>
     <rect x="180" y="130" width="240" height="40" rx="8" fill="#1e293b"/>
     <!-- 6 Float Indicators -->
     ${Array.from({length: 6}, (_, i) => `<rect x="${205 + i * 34}" y="105" width="16" height="30" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/><circle cx="${213 + i * 34}" cy="115" r="4" fill="#ef4444"/>`).join('')}
     <text x="300" y="250" text-anchor="middle" font-family="'Inter', sans-serif" font-size="34" font-weight="900" fill="#ffffff">150 Ah</text>
     <text x="300" y="285" text-anchor="middle" font-family="'Inter', sans-serif" font-size="13" font-weight="800" fill="#93c5fd">SOLAR TALL TUBULAR C10</text>
     <rect x="220" y="330" width="160" height="45" rx="8" fill="#0369a1"/>
     <text x="300" y="358" text-anchor="middle" font-family="'Inter', sans-serif" font-size="13" font-weight="900" fill="#ffffff">36M WARRANTY</text>`
  ),

  // 18. Havells 20W All-In-One Solar Street Light
  "HAV-SSL-20W-AIO": generateProductSvg(
    "Havells 20W All-in-One Light", "Solar LED Street Light", "Havells Solar", "#ea580c", "#c2410c",
    `<rect x="200" y="100" width="200" height="320" rx="20" fill="#e2e8f0" stroke="#94a3b8" stroke-width="3"/>
     <!-- Integrated Solar Panel on Top Half -->
     <rect x="215" y="115" width="170" height="130" rx="8" fill="#0f172a"/>
     ${Array.from({length: 4}, (_, i) => `<line x1="215" y1="${145 + i * 28}" x2="385" y2="${145 + i * 28}" stroke="#0284c7" stroke-width="1.5"/>`).join('')}
     <!-- LED Light Panel on Bottom Half -->
     <rect x="220" y="260" width="160" height="100" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
     ${Array.from({length: 12}, (_, i) => `<circle cx="${240 + (i % 4) * 40}" cy="${285 + Math.floor(i / 4) * 25}" r="7" fill="#fbbf24" filter="url(#softGlow)"/>`).join('')}
     <!-- PIR Sensor -->
     <circle cx="300" cy="380" r="14" fill="#cbd5e1"/>
     <circle cx="300" cy="380" r="6" fill="#3b82f6"/>`
  ),

  // 19. Havells 40W Semi-Integrated Solar Street Light
  "HAV-SSL-40W-SEMI": generateProductSvg(
    "Havells 40W Semi-Integrated", "Highway Solar Lighting", "Havells Solar", "#ea580c", "#c2410c",
    `<rect x="170" y="60" width="260" height="110" rx="8" fill="#0f172a" stroke="#cbd5e1" stroke-width="3" transform="rotate(-8 300 115)"/>
     <rect x="290" y="170" width="20" height="110" fill="#64748b"/>
     <rect x="220" y="270" width="160" height="130" rx="16" fill="#334155"/>
     <rect x="235" y="285" width="130" height="90" rx="10" fill="#ffffff"/>
     ${Array.from({length: 16}, (_, i) => `<circle cx="${252 + (i % 4) * 32}" cy="${305 + Math.floor(i / 4) * 20}" r="6" fill="#f59e0b"/>`).join('')}
     <text x="300" y="420" text-anchor="middle" font-family="'Inter', sans-serif" font-size="12" font-weight="900" fill="#0f172a">40W HIGH-LUMEN LED</text>`
  ),

  // 20. Emmvee 200 LPD ETC Solar Water Heater
  "EMM-SWH-200L-ETC": generateProductSvg(
    "Emmvee 200 LPD Solar Heater", "Solar Thermal ETC", "Emmvee Solar", "#0284c7", "#0369a1",
    `<ellipse cx="300" cy="150" rx="140" ry="45" fill="#e2e8f0" stroke="#94a3b8" stroke-width="4"/>
     <text x="300" y="156" text-anchor="middle" font-family="'Inter', sans-serif" font-size="15" font-weight="900" fill="#0f172a">200 LPD PUF TANK</text>
     <!-- Evacuated Glass Tubes -->
     ${Array.from({length: 10}, (_, i) => `<line x1="${185 + i * 25}" y1="185" x2="${235 + i * 25}" y2="390" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>`).join('')}
     <!-- Frame Stand -->
     <line x1="160" y1="180" x2="160" y2="410" stroke="#475569" stroke-width="6"/>
     <line x1="440" y1="180" x2="440" y2="410" stroke="#475569" stroke-width="6"/>
     <line x1="150" y1="410" x2="450" y2="410" stroke="#475569" stroke-width="6"/>`
  ),

  // 21. V-Guard 300 LPD FPC Solar Water Heater
  "VG-SWH-300L-FPC": generateProductSvg(
    "V-Guard 300 LPD FPC Heater", "Flat Plate Collector", "V-Guard Solar", "#e11d48", "#be123c",
    `<rect x="180" y="100" width="240" height="60" rx="30" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
     <text x="300" y="136" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="900" fill="#e11d48">300 LPD GLASS LINED</text>
     <!-- Flat Plate Collector -->
     <rect x="200" y="180" width="200" height="230" rx="10" fill="#0f172a" stroke="#be123c" stroke-width="5"/>
     ${Array.from({length: 8}, (_, i) => `<line x1="${215 + i * 24}" y1="190" x2="${215 + i * 24}" y2="400" stroke="#f43f5e" stroke-width="2"/>`).join('')}
     <text x="300" y="300" text-anchor="middle" font-family="'Inter', sans-serif" font-size="13" font-weight="900" fill="#ffffff" opacity="0.8">COPPER ABSORBER</text>`
  ),

  // 22. Polycab 4 sq mm DC Cable Roll
  "POL-CBL-4MM-DC": generateProductSvg(
    "Polycab 4 sq mm DC Cable", "Solar DC Cable Roll", "Polycab Solar", "#dc2626", "#b91c1c",
    `<circle cx="300" cy="265" r="145" fill="none" stroke="#dc2626" stroke-width="65"/>
     <circle cx="300" cy="265" r="110" fill="none" stroke="#ef4444" stroke-width="4"/>
     <circle cx="300" cy="265" r="75" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
     <text x="300" y="260" text-anchor="middle" font-family="'Inter', sans-serif" font-size="18" font-weight="900" fill="#0f172a">4 sq mm</text>
     <text x="300" y="282" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#dc2626">100m ROLL</text>
     <text x="300" y="445" text-anchor="middle" font-family="'Inter', sans-serif" font-size="12" font-weight="900" fill="#475569">1500V DC • TUV CERTIFIED</text>`
  ),

  // 23. Polycab 6 sq mm DC Cable Roll
  "POL-CBL-6MM-DC": generateProductSvg(
    "Polycab 6 sq mm DC Cable", "Heavy Duty Solar Cable", "Polycab Solar", "#0f172a", "#1e293b",
    `<circle cx="300" cy="265" r="150" fill="none" stroke="#1e293b" stroke-width="70"/>
     <circle cx="300" cy="265" r="115" fill="none" stroke="#475569" stroke-width="4"/>
     <circle cx="300" cy="265" r="75" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
     <text x="300" y="260" text-anchor="middle" font-family="'Inter', sans-serif" font-size="18" font-weight="900" fill="#0f172a">6 sq mm</text>
     <text x="300" y="282" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#3b82f6">100m ROLL</text>
     <text x="300" y="445" text-anchor="middle" font-family="'Inter', sans-serif" font-size="12" font-weight="900" fill="#475569">XLPO INSULATION • UV PROOF</text>`
  ),

  // 24. Solarkits 1-In 1-Out DCDB Box
  "SK-DCDB-1IN-1OUT": generateProductSvg(
    "Solarkits 1-String DCDB", "DC Distribution Box", "Solarkits", "#ea580c", "#c2410c",
    `<rect x="185" y="105" width="230" height="305" rx="16" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4"/>
     <!-- Transparent Lid Window -->
     <rect x="205" y="125" width="190" height="235" rx="10" fill="#e0f2fe" opacity="0.6" stroke="#38bdf8" stroke-width="2"/>
     <!-- DC SPD & Fuse Holder Inside -->
     <rect x="225" y="155" width="65" height="125" rx="6" fill="#ef4444"/>
     <text x="257" y="220" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="900" fill="#ffffff" transform="rotate(-90 257 220)">DC SPD 1000V</text>
     <rect x="310" y="155" width="65" height="125" rx="6" fill="#0f172a"/>
     <text x="342" y="220" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="900" fill="#ffffff" transform="rotate(-90 342 220)">16A gPV FUSE</text>
     <rect x="235" y="380" width="45" height="20" rx="4" fill="#334155"/>
     <rect x="320" y="380" width="45" height="20" rx="4" fill="#334155"/>
     <text x="300" y="335" text-anchor="middle" font-family="'Inter', sans-serif" font-size="12" font-weight="900" fill="#ea580c">IP65 WEATHERPROOF</text>`
  ),

  // 25. Solarkits 1-Phase ACDB Box
  "SK-ACDB-1P-32A": generateProductSvg(
    "Solarkits 1-Phase ACDB", "AC Distribution Box", "Solarkits", "#2563eb", "#1d4ed8",
    `<rect x="185" y="105" width="230" height="305" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
     <rect x="205" y="125" width="190" height="235" rx="10" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/>
     <!-- 2P 32A MCB -->
     <rect x="225" y="160" width="70" height="120" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
     <rect x="235" y="200" width="50" height="35" rx="4" fill="#0f172a"/>
     <text x="260" y="223" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="900" fill="#22c55e">32A</text>
     <!-- Class II AC SPD -->
     <rect x="315" y="160" width="60" height="120" rx="6" fill="#2563eb"/>
     <text x="345" y="225" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" font-weight="900" fill="#ffffff" transform="rotate(-90 345 225)">AC SPD 275V</text>
     <text x="300" y="335" text-anchor="middle" font-family="'Inter', sans-serif" font-size="12" font-weight="900" fill="#2563eb">1-PHASE 230V SYSTEM</text>`
  )
};

async function uploadImagesAndUpdateSKUs() {
  console.log('====================================================');
  console.log('🚀 UPLOADING REAL PRODUCT IMAGERY TO CLOUDINARY & SKUS');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // 1. Existing Generated Photos
  const PHOTO_MAP = {
    "TPS-MOD-540W-MONO": "https://res.cloudinary.com/dggmbagax/image/upload/v1788257426/solarkits/public/uploads/products/tps_mod_540w_mono.jpg",
    "WAR-MOD-550W-BIF": path.resolve(LOCAL_IMG_DIR, 'war_mod_550w_bif.jpg'),
    "HAV-INV-3KW-1P": path.resolve(LOCAL_IMG_DIR, 'hav_inv_3kw_1p.jpg')
  };

  const products = await Product.find({ deleted_at: null });
  console.log(`Found ${products.length} Products in database to update with imagery.\n`);

  let updatedCount = 0;

  for (const product of products) {
    const skuCode = product.sku_code;
    let imageUrl = null;

    try {
      if (PHOTO_MAP[skuCode]) {
        const photoSource = PHOTO_MAP[skuCode];
        if (photoSource.startsWith('http')) {
          imageUrl = photoSource;
        } else if (fs.existsSync(photoSource)) {
          const res = await cloudinary.uploader.upload(photoSource, {
            folder: 'solarkits/public/uploads/products',
            public_id: skuCode.toLowerCase().replace(/[^a-z0-9]/g, '_')
          });
          imageUrl = res.secure_url;
        }
      } else if (VISUAL_TEMPLATES[skuCode]) {
        // SVG Data URI upload to Cloudinary & local save
        const svgContent = VISUAL_TEMPLATES[skuCode];
        const localFileName = `${skuCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`;
        const localFilePath = path.join(LOCAL_IMG_DIR, localFileName);
        fs.writeFileSync(localFilePath, svgContent, 'utf-8');

        const base64Data = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
        const res = await cloudinary.uploader.upload(base64Data, {
          folder: 'solarkits/public/uploads/products',
          public_id: skuCode.toLowerCase().replace(/[^a-z0-9]/g, '_')
        });
        imageUrl = res.secure_url;
      }

      if (imageUrl) {
        // Update Product image
        product.image = imageUrl;
        await product.save();

        // Update ProductSku image
        await ProductSku.updateMany(
          { product_id: product._id },
          { $set: { image: imageUrl } }
        );

        updatedCount++;
        console.log(`✅ [${updatedCount}/25] Updated Imagery for: "${product.name}"`);
        console.log(`   SKU: ${skuCode} -> ${imageUrl}\n`);
      } else {
        console.warn(`⚠️ No visual template found for SKU: ${skuCode}`);
      }
    } catch (err) {
      console.error(`❌ Error uploading image for SKU ${skuCode}:`, err.message);
    }
  }

  console.log('====================================================');
  console.log(`🎉 COMPLETED! Updated ${updatedCount}/${products.length} Products & SKUs with real imagery.`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

uploadImagesAndUpdateSKUs().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
