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
    name: "Commercial & Industrial (C&I)",
    code: "CI",
    slug: "commercial-industrial",
    icon: "🏭",
    description: "High-capacity rooftop solar, bifacial modules, HT string inverters, and zero export devices for factories and warehouses.",
    sort_order: 1,
    for_resellers: true,
    for_epc: true,
    is_active: true,
    theme: {
      primary_color: "#185ADB",
      secondary_color: "#0575B8",
      accent_color: "#F8C21A",
      bg_color: "#F8FAFC",
      text_color: "#0F172A",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    },
    contents: [
      {
        title: "Industrial & Factory Solar Power Systems",
        internal_name: "HERO_CI_FACTORY_4K",
        content_type: "VIDEO",
        target_audience: "BOTH",
        placement: "HERO",
        heading: "Industrial & Factory Solar Power Systems",
        short_description: "High-yield commercial bifacial panels engineered for factory rooftops with zero-export grid synchronization.",
        cta_label: "View Commercial Kits →",
        cta_url: "/catalog",
        reseller_cta_label: "View Commercial Kits →",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "View BOS Hardware Specs →",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 100,
        display_order: 1,
        status: "PUBLISHED",
        is_featured: true,
        focal_position: "center",
        allow_download: true,
        allow_share: true,
        autoplay: true,
        view_count: 1420,
        media: [
          {
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            poster_url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=1800&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&auto=format&fit=crop&q=80",
            media_type: "VIDEO",
            device_type: "ALL",
            is_primary: true,
            duration_sec: 145,
            alt_text: "Factory Rooftop Solar Array 4K Showcase",
          }
        ]
      },
      {
        title: "Commercial Bifacial Mono-PERC Poster",
        internal_name: "POSTER_CI_BIFACIAL",
        content_type: "POSTER",
        target_audience: "BOTH",
        placement: "GALLERY",
        heading: "580W+ Dual-Glass Bifacial Spec Poster",
        short_description: "IEC 61215 certified dual-glass N-Type TOPCon modules with 30-year linear power warranty for C&I installations.",
        cta_label: "Download Poster PDF",
        cta_url: "/catalog",
        reseller_cta_label: "Download Poster",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "Procure Pallets",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 90,
        display_order: 2,
        status: "PUBLISHED",
        is_featured: true,
        focal_position: "top",
        allow_download: true,
        allow_share: true,
        view_count: 890,
        media: [
          {
            url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=1200&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
            poster_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=1200&auto=format&fit=crop&q=80",
            media_type: "POSTER",
            device_type: "ALL",
            is_primary: true,
            alt_text: "Bifacial Module Poster Spec",
          }
        ]
      },
      {
        title: "100kW+ Three-Phase Commercial String Inverter",
        internal_name: "PHOTO_CI_INVERTER_ARRAY",
        content_type: "PHOTO",
        target_audience: "BOTH",
        placement: "GALLERY",
        heading: "100kW - 250kW HT Inverter Wall Installation",
        short_description: "Multi-MPPT grid-tied string inverters with built-in AFCI 2.0 arc fault protection and smart I-V curve diagnostics.",
        cta_label: "View Inverter Specs",
        cta_url: "/catalog",
        reseller_cta_label: "View Inverters",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "View Wholesale Rates",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 85,
        display_order: 3,
        status: "PUBLISHED",
        is_featured: false,
        focal_position: "center",
        allow_download: true,
        allow_share: true,
        view_count: 620,
        media: [
          {
            url: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1600&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&auto=format&fit=crop&q=80",
            media_type: "PHOTO",
            device_type: "ALL",
            is_primary: true,
            alt_text: "Industrial String Inverters Array",
          }
        ]
      },
      {
        title: "Industrial Walkway & Anodized Railing Album",
        internal_name: "GALLERY_CI_WALKWAY",
        content_type: "GALLERY",
        target_audience: "DISTRIBUTOR",
        placement: "GALLERY",
        heading: "Heavy-Duty FRP Walkways & Clamping Hardware",
        short_description: "Non-penetrating metal sheet roof clamps, anodized AL6005-T5 rails, and OSHA-compliant fiberglass walkways.",
        cta_label: "View Hardware Kit",
        cta_url: "/distributor/portal/procure",
        distributor_cta_label: "Procure BOS Kits",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 80,
        display_order: 4,
        status: "PUBLISHED",
        is_featured: false,
        focal_position: "center",
        allow_download: true,
        allow_share: true,
        view_count: 510,
        media: [
          {
            url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1600&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80",
            media_type: "PHOTO",
            device_type: "ALL",
            is_primary: true,
            alt_text: "FRP Walkway and Mounting Rails",
          },
          {
            url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1600&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
            media_type: "PHOTO",
            device_type: "ALL",
            is_primary: false,
            alt_text: "Mounting Clamps Detail",
          }
        ]
      },
      {
        title: "Zero-Export Power Control Demonstration",
        internal_name: "VIDEO_CI_ZERO_EXPORT",
        content_type: "VIDEO",
        target_audience: "BOTH",
        placement: "GALLERY",
        heading: "Rapid Zero Export Grid Limiter Integration",
        short_description: "Watch how smart energy meters throttle inverter output within 200 milliseconds to prevent reverse feeding into the grid.",
        cta_label: "Watch Technical Demo",
        cta_url: "/catalog",
        reseller_cta_label: "Watch Demo",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "View Limiter Device",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 75,
        display_order: 5,
        status: "PUBLISHED",
        is_featured: false,
        focal_position: "center",
        allow_download: true,
        allow_share: true,
        view_count: 730,
        media: [
          {
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            poster_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1600&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80",
            media_type: "VIDEO",
            device_type: "ALL",
            is_primary: true,
            duration_sec: 90,
            alt_text: "Zero Export Demo Video",
          }
        ]
      }
    ]
  },
  {
    name: "Residential Solar",
    code: "RESI",
    slug: "residential-solar",
    icon: "🏡",
    description: "Rooftop solar systems, on-grid inverters, battery storage, and smart home energy kits for homeowners.",
    sort_order: 2,
    for_resellers: true,
    for_epc: true,
    is_active: true,
    theme: {
      primary_color: "#1A3B8B",
      secondary_color: "#F8C21A",
      accent_color: "#38BDF8",
      bg_color: "#F8FAFC",
      text_color: "#0F172A",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    },
    contents: [
      {
        title: "Residential Solar Rooftop Kits (3kW - 10kW)",
        internal_name: "HERO_RESI_MAIN_2026",
        content_type: "VIDEO",
        target_audience: "BOTH",
        placement: "HERO",
        heading: "Next-Gen Residential Solar Rooftop Packages",
        short_description: "Pre-engineered on-grid & hybrid solar kits with bifacial monocrystalline panels and 25-year performance warranty.",
        cta_label: "Explore Rooftop Kits →",
        cta_url: "/catalog",
        reseller_cta_label: "Explore Rooftop Kits →",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "View Distribution Packages →",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 100,
        display_order: 1,
        status: "PUBLISHED",
        is_featured: true,
        focal_position: "center",
        allow_download: true,
        allow_share: true,
        autoplay: true,
        view_count: 2150,
        media: [
          {
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            poster_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1800&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
            media_type: "VIDEO",
            device_type: "ALL",
            is_primary: true,
            duration_sec: 120,
            alt_text: "Residential Solar Rooftop Video",
          }
        ]
      },
      {
        title: "Smart Hybrid Inverters with Lithium Storage Poster",
        internal_name: "POSTER_RESI_HYBRID",
        content_type: "POSTER",
        target_audience: "BOTH",
        placement: "GALLERY",
        heading: "Zero Grid Outages with Home Lithium ESS",
        short_description: "Compact wall-mount home batteries integrated with MPPT hybrid solar inverters with 10ms seamless UPS transfer.",
        cta_label: "Download Specs",
        cta_url: "/catalog",
        reseller_cta_label: "Download Poster",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "Procure Batteries",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 88,
        display_order: 2,
        status: "PUBLISHED",
        is_featured: true,
        focal_position: "top",
        allow_download: true,
        allow_share: true,
        view_count: 1120,
        media: [
          {
            url: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1600&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&auto=format&fit=crop&q=80",
            poster_url: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1600&auto=format&fit=crop&q=80",
            media_type: "POSTER",
            device_type: "ALL",
            is_primary: true,
            alt_text: "Hybrid Solar Inverter Battery Kit Poster",
          }
        ]
      },
      {
        title: "5kW Residential Premium Villa Installation Photo",
        internal_name: "PHOTO_RESI_VILLA",
        content_type: "PHOTO",
        target_audience: "BOTH",
        placement: "GALLERY",
        heading: "All-Black Aesthetics Villa Solar Array",
        short_description: "Sleek all-black residential panels with hidden micro-inverters for high-end architectural villa roofs.",
        cta_label: "View Gallery",
        cta_url: "/catalog",
        reseller_cta_label: "View Villa Kits",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "View Micro Inverters",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 80,
        display_order: 3,
        status: "PUBLISHED",
        is_featured: false,
        focal_position: "center",
        allow_download: true,
        allow_share: true,
        view_count: 940,
        media: [
          {
            url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=1600&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
            media_type: "PHOTO",
            device_type: "ALL",
            is_primary: true,
            alt_text: "Villa Rooftop Installation",
          }
        ]
      }
    ]
  },
  {
    name: "Agriculture & Solar Pumps",
    code: "AGRI",
    slug: "agriculture-solar-pumps",
    icon: "🌾",
    description: "PM-KUSUM compliant solar water pump controllers, submersible AC/DC pumps, and off-grid agricultural solar systems.",
    sort_order: 3,
    for_resellers: true,
    for_epc: true,
    is_active: true,
    theme: {
      primary_color: "#166534",
      secondary_color: "#EAB308",
      accent_color: "#4ADE80",
      bg_color: "#F0FDF4",
      text_color: "#14532D",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    },
    contents: [
      {
        title: "PM-KUSUM Solar Water Pump Controllers (3HP - 10HP)",
        internal_name: "HERO_AGRI_PUMPS_4K",
        content_type: "VIDEO",
        target_audience: "BOTH",
        placement: "HERO",
        heading: "High-Efficiency Solar Water Pumping Solutions",
        short_description: "MNRE approved MPPT pump VFD drives with built-in remote telemetry, dry-run protection, and AC/DC dual power input.",
        cta_label: "View Agri Pump Kits →",
        cta_url: "/catalog",
        reseller_cta_label: "View Agri Pump Kits →",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "Procure Pump VFDs →",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 100,
        display_order: 1,
        status: "PUBLISHED",
        is_featured: true,
        focal_position: "center",
        allow_download: true,
        allow_share: true,
        autoplay: true,
        view_count: 1780,
        media: [
          {
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            poster_url: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=1800&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=800&auto=format&fit=crop&q=80",
            media_type: "VIDEO",
            device_type: "ALL",
            is_primary: true,
            duration_sec: 110,
            alt_text: "Solar Water Pumping in Farm Video",
          }
        ]
      },
      {
        title: "5HP Solar Submersible Pump Spec Poster",
        internal_name: "POSTER_AGRI_PUMP_SPEC",
        content_type: "POSTER",
        target_audience: "BOTH",
        placement: "GALLERY",
        heading: "5HP Brushless DC Submersible Pump Poster",
        short_description: "Stainless steel grade 304 construction with 180-meter head capability and 15,000 liters per hour water discharge.",
        cta_label: "Download Poster",
        cta_url: "/catalog",
        reseller_cta_label: "Download Poster",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "Procure Pumps",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 85,
        display_order: 2,
        status: "PUBLISHED",
        is_featured: true,
        focal_position: "top",
        allow_download: true,
        allow_share: true,
        view_count: 810,
        media: [
          {
            url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
            poster_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80",
            media_type: "POSTER",
            device_type: "ALL",
            is_primary: true,
            alt_text: "5HP Pump Poster",
          }
        ]
      }
    ]
  },
  {
    name: "Utility Scale & Ground Mount",
    code: "UTIL",
    slug: "utility-scale-ground-mount",
    icon: "⚡",
    description: "MW-scale solar parks, single-axis trackers, central inverters, string combiners, and high-voltage substation switchgear.",
    sort_order: 4,
    for_resellers: true,
    for_epc: true,
    is_active: true,
    theme: {
      primary_color: "#0F172A",
      secondary_color: "#F59E0B",
      accent_color: "#06B6D4",
      bg_color: "#F8FAFC",
      text_color: "#0F172A",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    },
    contents: [
      {
        title: "Utility Scale 1MW+ Ground Mount Solar Parks",
        internal_name: "HERO_UTIL_PARK_4K",
        content_type: "VIDEO",
        target_audience: "BOTH",
        placement: "HERO",
        heading: "MegaWatt Scale Solar Infrastructure & Trackers",
        short_description: "Turnkey MW-scale engineering with single-axis astronomical trackers, 1500V DC architecture, and SCADA monitoring.",
        cta_label: "Explore Utility Solutions →",
        cta_url: "/catalog",
        reseller_cta_label: "Explore Utility Solutions →",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "Procure Tracker Hardware →",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 100,
        display_order: 1,
        status: "PUBLISHED",
        is_featured: true,
        focal_position: "center",
        allow_download: true,
        allow_share: true,
        autoplay: true,
        view_count: 2400,
        media: [
          {
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
            poster_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1800&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80",
            media_type: "VIDEO",
            device_type: "ALL",
            is_primary: true,
            duration_sec: 180,
            alt_text: "Utility Scale Solar Farm Drone Video",
          }
        ]
      },
      {
        title: "Single Axis Astronomical Tracker Poster",
        internal_name: "POSTER_UTIL_TRACKER",
        content_type: "POSTER",
        target_audience: "BOTH",
        placement: "GALLERY",
        heading: "Smart AI Single-Axis Solar Tracker Spec Poster",
        short_description: "Up to 24% additional energy generation with intelligent backtracking algorithms and 160 km/h wind stow protection.",
        cta_label: "Download Poster",
        cta_url: "/catalog",
        reseller_cta_label: "Download Poster",
        reseller_cta_url: "/catalog",
        distributor_cta_label: "Procure Tracker Actuators",
        distributor_cta_url: "/distributor/portal/procure",
        priority: 90,
        display_order: 2,
        status: "PUBLISHED",
        is_featured: true,
        focal_position: "top",
        allow_download: true,
        allow_share: true,
        view_count: 1350,
        media: [
          {
            url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1600&auto=format&fit=crop&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop&q=80",
            poster_url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1600&auto=format&fit=crop&q=80",
            media_type: "POSTER",
            device_type: "ALL",
            is_primary: true,
            alt_text: "Solar Tracker Poster",
          }
        ]
      }
    ]
  }
];

async function seed() {
  try {
    console.log('🚀 Starting Industry Media Showcase seed...');

    // 1. Clear existing industry CMS collections
    await IndustryContentMedia.deleteMany({});
    await IndustryContentIndustryMap.deleteMany({});
    await IndustryContent.deleteMany({});
    await IndustryTheme.deleteMany({});
    await IndustryType.deleteMany({});

    console.log('🧹 Cleared old industry content tables.');

    // 2. Loop through industries
    for (const indData of SEED_INDUSTRIES) {
      const { theme, contents, ...typeFields } = indData;

      const industry = await IndustryType.create({
        ...typeFields,
        created_at: new Date(),
        updated_at: new Date(),
      });

      console.log(`✅ Created Industry: ${industry.name} (${industry.code})`);

      // Create theme
      if (theme) {
        await IndustryTheme.create({
          industry_type_id: industry._id,
          ...theme,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // Create contents
      if (contents && contents.length > 0) {
        for (const contentData of contents) {
          const { media, ...cFields } = contentData;

          const content = await IndustryContent.create({
            ...cFields,
            published_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          });

          // Map to this industry
          await IndustryContentIndustryMap.create({
            content_id: content._id,
            industry_type_id: industry._id,
            created_at: new Date(),
          });

          // Insert media records
          if (media && media.length > 0) {
            for (let i = 0; i < media.length; i++) {
              const m = media[i];
              await IndustryContentMedia.create({
                content_id: content._id,
                url: m.url,
                poster_url: m.poster_url || m.url,
                thumbnail_url: m.thumbnail_url || m.url,
                media_type: m.media_type || 'IMAGE',
                device_type: m.device_type || 'ALL',
                is_primary: m.is_primary !== undefined ? m.is_primary : i === 0,
                sort_order: i,
                duration_sec: m.duration_sec || null,
                alt_text: m.alt_text || content.title,
                processing_status: 'READY',
                created_at: new Date(),
                updated_at: new Date(),
              });
            }
          }

          console.log(`   └─ [${content.content_type}] ${content.title} (Media: ${media?.length || 0})`);
        }
      }
    }

    console.log('\n🎉 Industry Media Showcase seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
