require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('../src/keys/config/databases');
const mongoose = require('mongoose');

const {
  IndustryType,
  IndustryContent,
  IndustryContentIndustryMap,
  IndustryContentMedia,
  IndustryTheme,
  UserIndustryMap,
} = require('../src/modules/admin-panel/models/core_db');

const {
  Reseller,
  EpcAccount,
} = require('../src/modules/admin-panel/models/india_solarshop_db');

const SEED_INDUSTRIES = [
  {
    name: "Residential Solar",
    code: "RESI",
    slug: "residential-solar",
    icon: "🏡",
    description: "Rooftop solar systems, on-grid inverters, battery storage, and smart home energy kits for homeowners.",
    sort_order: 1,
    for_resellers: true,
    for_epc: true,
    is_active: true,
    theme: {
      primary_color: "#1a3b8b",
      secondary_color: "#f8c21a",
      accent_color: "#38bdf8",
      bg_color: "#f8fafc",
      text_color: "#0f172a",
      section_bg: "#ffffff",
      button_style: "SOLID",
    },
    contents: [
      {
        title: "Residential Solar Rooftop Kits (3kW - 10kW)",
        internal_name: "HERO_RESI_MAIN_2026",
        content_type: "HERO_BANNER",
        target_audience: "BOTH",
        placement: "DASHBOARD_TOP",
        heading: "Next-Gen Residential Solar Rooftop Packages",
        short_description: "Pre-engineered on-grid & hybrid solar kits with bifacial monocrystalline panels and 25-year performance warranty.",
        cta_label: "Explore Rooftop Kits",
        cta_url: "/catalog",
        priority: 10,
        display_order: 1,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1600&auto=format&fit=crop&q=80",
            media_type: "IMAGE",
            device_type: "DESKTOP",
            is_primary: true,
            alt_text: "Residential Solar Rooftop",
          },
          {
            url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
            media_type: "IMAGE",
            device_type: "MOBILE",
            is_primary: false,
            alt_text: "Mobile Rooftop View",
          }
        ]
      },
      {
        title: "Smart Hybrid Inverters with Lithium Storage",
        internal_name: "SLIDER_RESI_HYBRID",
        content_type: "IMAGE_SLIDER",
        target_audience: "RESELLER",
        placement: "DASHBOARD_MIDDLE",
        heading: "Zero Grid Outages with Smart Lithium ESS",
        short_description: "Compact wall-mount home batteries integrated with MPPT hybrid solar inverters. High surge tolerance for air conditioners.",
        cta_label: "View Inverters",
        cta_url: "/catalog",
        priority: 8,
        display_order: 2,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1600&auto=format&fit=crop&q=80",
            media_type: "IMAGE",
            device_type: "ALL",
            is_primary: true,
            alt_text: "Hybrid Solar Inverter Battery Kit",
          }
        ]
      },
      {
        title: "How to Size and Quote Residential Solar Rooftops",
        internal_name: "VIDEO_RESI_SIZING",
        content_type: "EXPLAINER_VIDEO",
        target_audience: "BOTH",
        placement: "DASHBOARD_MIDDLE",
        heading: "Mastering Residential Solar Sizing & ROI",
        short_description: "Step-by-step masterclass explaining shadow analysis, string sizing calculations, and net metering payback schedules for homeowners.",
        cta_label: "Watch Masterclass",
        cta_url: "https://www.youtube.com/watch?v=1KfZ7k-b738",
        priority: 7,
        display_order: 3,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
            media_type: "THUMBNAIL",
            device_type: "ALL",
            is_primary: true,
            duration_sec: 645,
            alt_text: "Residential Solar Training Video",
          },
          {
            url: "https://www.youtube.com/watch?v=1KfZ7k-b738",
            media_type: "VIDEO",
            device_type: "ALL",
            is_external: true,
            is_primary: false,
            alt_text: "Solar Sizing Video Stream",
          }
        ]
      },
      {
        title: "High-Margin Monsoon Subsidy Kit Bundles",
        internal_name: "CARD_RESI_PROMO",
        content_type: "PROMOTIONAL_CARD",
        target_audience: "RESELLER",
        placement: "DASHBOARD_BOTTOM",
        heading: "Special Monsoon Subsidy Bundles",
        short_description: "Pre-approved ALMM listed mono PERC panels bundled with high-efficiency string inverters ready for MNRE subsidy claims.",
        cta_label: "Claim Special Pricing",
        cta_url: "/catalog",
        priority: 6,
        display_order: 4,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=1000&auto=format&fit=crop&q=80",
            media_type: "IMAGE",
            device_type: "ALL",
            is_primary: true,
            alt_text: "Subsidy Solar Promo",
          }
        ]
      }
    ]
  },
  {
    name: "Commercial & Industrial (C&I)",
    code: "COMM",
    slug: "commercial-and-industrial",
    icon: "🏭",
    description: "Heavy-duty commercial rooftop and industrial carports, string & central inverters, HT net metering kits for factories and warehouses.",
    sort_order: 2,
    for_resellers: true,
    for_epc: true,
    is_active: true,
    theme: {
      primary_color: "#0f766e",
      secondary_color: "#f59e0b",
      accent_color: "#14b8a6",
      bg_color: "#f8fafc",
      text_color: "#0f172a",
      section_bg: "#ffffff",
      button_style: "SOLID",
    },
    contents: [
      {
        title: "Commercial Factory Rooftop Kits (50kW - 500kW)",
        internal_name: "HERO_COMM_FACTORY_2026",
        content_type: "HERO_BANNER",
        target_audience: "BOTH",
        placement: "DASHBOARD_TOP",
        heading: "Industrial & Factory Solar Power Systems",
        short_description: "Engineered for maximum peak shaving and heavy tariff reduction. Includes aluminum non-penetrating clamps and high-capacity string inverters.",
        cta_label: "View Commercial Kits",
        cta_url: "/catalog",
        priority: 10,
        display_order: 1,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=1600&auto=format&fit=crop&q=80",
            media_type: "IMAGE",
            device_type: "DESKTOP",
            is_primary: true,
            alt_text: "Industrial Solar Rooftop",
          }
        ]
      },
      {
        title: "Walkthrough: 100kW Factory Roof Installation",
        internal_name: "VIDEO_COMM_100KW",
        content_type: "EXPLAINER_VIDEO",
        target_audience: "BOTH",
        placement: "DASHBOARD_MIDDLE",
        heading: "Engineering a 100kW Industrial Rooftop System",
        short_description: "Step-by-step installation guide: strut channel mounting on tin roofs, AC/DC cable tray management, and LT panel sync.",
        cta_label: "Watch Installation Guide",
        cta_url: "https://www.youtube.com/watch?v=x9p4CqVzT9I",
        priority: 8,
        display_order: 2,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&auto=format&fit=crop&q=80",
            media_type: "THUMBNAIL",
            device_type: "ALL",
            is_primary: true,
            duration_sec: 890,
            alt_text: "Industrial Video Thumbnail",
          },
          {
            url: "https://www.youtube.com/watch?v=x9p4CqVzT9I",
            media_type: "VIDEO",
            device_type: "ALL",
            is_external: true,
            is_primary: false,
            alt_text: "Industrial Video Stream",
          }
        ]
      },
      {
        title: "Solar Carport & Canopies for Corporate Campuses",
        internal_name: "SLIDER_COMM_CARPORT",
        content_type: "IMAGE_SLIDER",
        target_audience: "BOTH",
        placement: "DASHBOARD_MIDDLE",
        heading: "EV-Ready Solar Carport Structures",
        short_description: "Dual-purpose waterproof solar carports providing vehicle shading and on-site EV fast-charging capability.",
        cta_label: "Explore Carports",
        cta_url: "/catalog",
        priority: 7,
        display_order: 3,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1600&auto=format&fit=crop&q=80",
            media_type: "IMAGE",
            device_type: "ALL",
            is_primary: true,
            alt_text: "Solar Carport Kit",
          }
        ]
      }
    ]
  },
  {
    name: "Agriculture & Solar Water Pumps",
    code: "AGRI",
    slug: "agriculture-and-solar-water-pumps",
    icon: "🌾",
    description: "PM-KUSUM compliant solar water pump controllers, submersible & monoblock pumps, solar flour mills, and cold storage power systems.",
    sort_order: 3,
    for_resellers: true,
    for_epc: true,
    is_active: true,
    theme: {
      primary_color: "#15803d",
      secondary_color: "#eab308",
      accent_color: "#4ade80",
      bg_color: "#f8fafc",
      text_color: "#0f172a",
      section_bg: "#ffffff",
      button_style: "SOLID",
    },
    contents: [
      {
        title: "PM-KUSUM Solar Water Pump Packages (3HP - 10HP)",
        internal_name: "HERO_AGRI_PUMPS_2026",
        content_type: "HERO_BANNER",
        target_audience: "BOTH",
        placement: "DASHBOARD_TOP",
        heading: "High-Discharge Solar Water Pumping Solutions",
        short_description: "VFD pump controllers with MPPT tracking, remote monitoring (RMS), and dual-axis manual tracking mounting structures.",
        cta_label: "View Agri Kits",
        cta_url: "/catalog",
        priority: 10,
        display_order: 1,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&auto=format&fit=crop&q=80",
            media_type: "IMAGE",
            device_type: "DESKTOP",
            is_primary: true,
            alt_text: "Solar Farm & Water Pump",
          }
        ]
      },
      {
        title: "Solar Pump Controller Setup & RMS Configuration",
        internal_name: "VIDEO_AGRI_PUMP_SETUP",
        content_type: "EXPLAINER_VIDEO",
        target_audience: "BOTH",
        placement: "DASHBOARD_MIDDLE",
        heading: "Solar Pump Drive Programming & Borewell Sizing",
        short_description: "Comprehensive tutorial on head vs flow rate calculations, VFD frequency tuning, and dry-run sensor wiring.",
        cta_label: "Watch Agri Tutorial",
        cta_url: "https://www.youtube.com/watch?v=1KfZ7k-b738",
        priority: 8,
        display_order: 2,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
            media_type: "THUMBNAIL",
            device_type: "ALL",
            is_primary: true,
            duration_sec: 720,
            alt_text: "Solar Pump Tutorial",
          },
          {
            url: "https://www.youtube.com/watch?v=1KfZ7k-b738",
            media_type: "VIDEO",
            device_type: "ALL",
            is_external: true,
            is_primary: false,
            alt_text: "Solar Pump Video Stream",
          }
        ]
      }
    ]
  },
  {
    name: "Utility Scale & Ground Mount",
    code: "UTIL",
    slug: "utility-scale-and-ground-mount",
    icon: "⚡",
    description: "Multi-megawatt open access projects, ramming pile structures, central inverter stations, string combiner boxes, and HT transmission kits.",
    sort_order: 4,
    for_resellers: true,
    for_epc: true,
    is_active: true,
    theme: {
      primary_color: "#b45309",
      secondary_color: "#3b82f6",
      accent_color: "#f59e0b",
      bg_color: "#f8fafc",
      text_color: "#0f172a",
      section_bg: "#ffffff",
      button_style: "SOLID",
    },
    contents: [
      {
        title: "Megawatt Ground-Mount Turnkey B2B Bundles",
        internal_name: "HERO_UTIL_MW_2026",
        content_type: "HERO_BANNER",
        target_audience: "BOTH",
        placement: "DASHBOARD_TOP",
        heading: "Utility-Scale Solar Power Plants & Ground-Mounts",
        short_description: "Bulk wholesale procurement for 1MW+ utility solar parks. High-voltage 1500V DC system architecture and galvanized piling structures.",
        cta_label: "Request Project Quotation",
        cta_url: "/catalog",
        priority: 10,
        display_order: 1,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=1600&auto=format&fit=crop&q=80",
            media_type: "IMAGE",
            device_type: "DESKTOP",
            is_primary: true,
            alt_text: "Utility Scale Solar Farm",
          }
        ]
      },
      {
        title: "1500V String Inverter Architecture & Substation Design",
        internal_name: "VIDEO_UTIL_SUBSTATION",
        content_type: "EXPLAINER_VIDEO",
        target_audience: "BOTH",
        placement: "DASHBOARD_MIDDLE",
        heading: "Utility Ground-Mount Engineering & SCADA Integration",
        short_description: "Deep dive into 1500V DC cable sizing, tracker motor controls, lightning protection grids, and 33kV step-up transformer synchronization.",
        cta_label: "Watch Technical Breakdown",
        cta_url: "https://www.youtube.com/watch?v=nwtZ_h7mZg0",
        priority: 8,
        display_order: 2,
        status: "PUBLISHED",
        media: [
          {
            url: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&auto=format&fit=crop&q=80",
            media_type: "THUMBNAIL",
            device_type: "ALL",
            is_primary: true,
            duration_sec: 980,
            alt_text: "Utility Scale Video",
          },
          {
            url: "https://www.youtube.com/watch?v=nwtZ_h7mZg0",
            media_type: "VIDEO",
            device_type: "ALL",
            is_external: true,
            is_primary: false,
            alt_text: "Utility Scale Video Stream",
          }
        ]
      }
    ]
  }
];

async function runSeed() {
  console.log("🚀 Waiting for MongoDB connection...");
  
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once('open', resolve);
    });
  }

  console.log("✅ MongoDB Connected! Starting Industry Content & Theme Seeding...");

  try {
    const [resellers, epcs] = await Promise.all([
      Reseller.find({ is_deleted: { $ne: true } }).select('_id business_name email').lean().catch(() => []),
      EpcAccount.find({ is_deleted: { $ne: true } }).select('_id name email').lean().catch(() => []),
    ]);

    for (const indData of SEED_INDUSTRIES) {
      console.log(`\n📌 Processing Industry: ${indData.name} (${indData.code})...`);

      const industry = await IndustryType.findOneAndUpdate(
        { slug: indData.slug },
        {
          $set: {
            name: indData.name,
            code: indData.code,
            icon: indData.icon,
            description: indData.description,
            sort_order: indData.sort_order,
            for_resellers: indData.for_resellers,
            for_epc: indData.for_epc,
            is_active: true,
            deleted_at: null,
          }
        },
        { upsert: true, new: true }
      );

      const industryId = industry._id;

      await IndustryTheme.findOneAndUpdate(
        { industry_type_id: industryId },
        {
          $set: {
            ...indData.theme,
            industry_type_id: industryId,
            deleted_at: null,
          }
        },
        { upsert: true, new: true }
      );

      for (const r of resellers) {
        await UserIndustryMap.findOneAndUpdate(
          { user_type: 'RESELLER', user_id: r._id, industry_type_id: industryId },
          {
            $set: {
              approval_status: 'APPROVED',
              assigned_date: new Date(),
              deleted_at: null,
            }
          },
          { upsert: true }
        );
      }

      for (const e of epcs) {
        await UserIndustryMap.findOneAndUpdate(
          { user_type: 'EPC', user_id: e._id, industry_type_id: industryId },
          {
            $set: {
              approval_status: 'APPROVED',
              assigned_date: new Date(),
              deleted_at: null,
            }
          },
          { upsert: true }
        );
      }

      for (const contentData of indData.contents) {
        const { media, ...itemDetails } = contentData;

        const contentDoc = await IndustryContent.findOneAndUpdate(
          { internal_name: itemDetails.internal_name },
          {
            $set: {
              ...itemDetails,
              is_active: true,
              published_at: new Date(),
              deleted_at: null,
            }
          },
          { upsert: true, new: true }
        );

        const contentId = contentDoc._id;

        await IndustryContentIndustryMap.findOneAndUpdate(
          { content_id: contentId, industry_type_id: industryId },
          { $set: { deleted_at: null } },
          { upsert: true }
        );

        await IndustryContentMedia.deleteMany({ content_id: contentId });

        for (const m of media) {
          await IndustryContentMedia.create({
            content_id: contentId,
            url: m.url,
            media_type: m.media_type,
            device_type: m.device_type,
            is_primary: !!m.is_primary,
            is_external: !!m.is_external,
            duration_sec: m.duration_sec || null,
            alt_text: m.alt_text,
            processing_status: 'READY',
            deleted_at: null,
          });
        }

        console.log(`   📝 Seeded [${itemDetails.content_type}] "${itemDetails.title}" with ${media.length} media item(s).`);
      }
    }

    console.log("\n🎉 ALL INDUSTRY CONTENTS, MEDIA ASSETS, THEMES, AND USER ACCESS SEEDED SUCCESSFULLY!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeed();
