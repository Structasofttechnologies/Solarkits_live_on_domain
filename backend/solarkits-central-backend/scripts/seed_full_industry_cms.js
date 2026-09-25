require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('../src/keys/config/databases');
const mongoose = require('mongoose');

const {
  IndustryType,
  IndustryContent,
  IndustryContentIndustryMap,
  IndustryContentMedia,
  IndustryTheme,
} = require('../src/modules/admin-panel/models/core_db');

// ─── 1. Industry Types Definitions ────────────────────────────────────────────
const INDUSTRIES_DATA = [
  {
    name: "Solar PV",
    code: "SOLAR_PV",
    slug: "solar-pv",
    icon: "☀️",
    description: "Grid-tied, off-grid and hybrid monocrystalline & TOPCon solar photovoltaic systems for rooftop, C&I, and utility installations.",
    sort_order: 1,
    theme: {
      primary_color: "#185ADB",
      secondary_color: "#0A2647",
      accent_color: "#F8C21A",
      bg_color: "#F8FAFC",
      text_color: "#0F172A",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    }
  },
  {
    name: "Solar Agriculture",
    code: "SOLAR_AGRICULTURE",
    slug: "solar-agriculture",
    icon: "🌾",
    description: "PM-KUSUM compliant solar water pump controllers, submersible solar pumps, and agrivoltaic solar systems for modern farming.",
    sort_order: 2,
    theme: {
      primary_color: "#166534",
      secondary_color: "#14532D",
      accent_color: "#EAB308",
      bg_color: "#F0FDF4",
      text_color: "#14532D",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    }
  },
  {
    name: "Solar EV",
    code: "SOLAR_EV",
    slug: "solar-ev",
    icon: "⚡",
    description: "Solar powered electric vehicle charging stations, solar carports, DC fast chargers, and smart grid bi-directional V2G systems.",
    sort_order: 3,
    theme: {
      primary_color: "#0284C7",
      secondary_color: "#0369A1",
      accent_color: "#10B981",
      bg_color: "#F0F9FF",
      text_color: "#0C4A6E",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    }
  },
  {
    name: "Energy Storage",
    code: "ENERGY_STORAGE",
    slug: "energy-storage",
    icon: "🔋",
    description: "Industrial containerized BESS, lithium iron phosphate (LiFePO4) battery racks, and high-voltage energy storage systems.",
    sort_order: 4,
    theme: {
      primary_color: "#7C3AED",
      secondary_color: "#5B21B6",
      accent_color: "#38BDF8",
      bg_color: "#FAF5FF",
      text_color: "#3B0764",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    }
  },
  {
    name: "Solar Lighting",
    code: "SOLAR_LIGHTING",
    slug: "solar-lighting",
    icon: "💡",
    description: "All-in-one and split solar street lights, floodlights, highway luminaires, and smart twilight IoT lighting systems.",
    sort_order: 5,
    theme: {
      primary_color: "#D97706",
      secondary_color: "#B45309",
      accent_color: "#FDE047",
      bg_color: "#FFFBEB",
      text_color: "#78350F",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    }
  },
  {
    name: "Solar Thermal",
    code: "SOLAR_THERMAL",
    slug: "solar-thermal",
    icon: "🔥",
    description: "Evacuated tube and flat plate collector solar water heaters, industrial process steam, and institutional thermal solutions.",
    sort_order: 6,
    theme: {
      primary_color: "#DC2626",
      secondary_color: "#991B1B",
      accent_color: "#F97316",
      bg_color: "#FEF2F2",
      text_color: "#7F1D1D",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    }
  },
  {
    name: "Rural Solar",
    code: "RURAL_SOLAR",
    slug: "rural-solar",
    icon: "🏡",
    description: "Off-grid solar home lighting kits, DC microgrids, rural school and healthcare center decentralized solar power plants.",
    sort_order: 7,
    theme: {
      primary_color: "#059669",
      secondary_color: "#065F46",
      accent_color: "#F59E0B",
      bg_color: "#ECFDF5",
      text_color: "#064E3B",
      section_bg: "#FFFFFF",
      button_style: "SOLID",
    }
  }
];

// ─── 2. Industry Content Items (Browse by Industry) ───────────────────────────
const INDUSTRY_CONTENTS = [
  // ── Solar PV ─────────────────────────────────────────────────────────────
  {
    industry_slugs: ["solar-pv"],
    content_category: "INDUSTRY",
    title: "High-Yield Commercial & Utility Solar PV Systems",
    internal_name: "HERO_SOLAR_PV_4K",
    content_type: "HERO_BANNER",
    target_audience: "BOTH",
    placement: "HERO",
    heading: "Next-Gen Commercial & Utility Scale Solar PV Power Systems",
    short_description: "Bifacial TOPCon high-wattage modules engineered for maximum kWh per square meter with 30-year linear performance warranty.",
    cta_label: "Explore Solar PV Kits →",
    cta_url: "/catalog?category=solar-pv",
    reseller_cta_label: "View PV Kits & Pricing →",
    reseller_cta_url: "/catalog?category=solar-pv",
    distributor_cta_label: "Procure Pallets & Modules →",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 100,
    display_order: 1,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "center",
    autoplay: true,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        poster_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1800&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 145,
        alt_text: "Commercial Solar PV Array 4K Showcase",
      }
    ]
  },
  {
    industry_slugs: ["solar-pv"],
    content_category: "INDUSTRY",
    title: "580W+ Dual-Glass Bifacial TOPCon Solar Spec Poster",
    internal_name: "POSTER_SOLAR_PV_TOPCON",
    content_type: "POSTER",
    target_audience: "BOTH",
    placement: "POSTER_HIGHLIGHT",
    heading: "580W+ N-Type Bifacial TOPCon Module Architecture",
    short_description: "Up to 22.8% module efficiency, lower temperature coefficient (-0.30%/°C), and dual-glass POE encapsulation for extreme climates.",
    cta_label: "Download PV Spec Poster",
    cta_url: "/catalog?category=solar-pv",
    reseller_cta_label: "Download Poster",
    reseller_cta_url: "/catalog?category=solar-pv",
    distributor_cta_label: "Request Spec Sheet PDF",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 90,
    display_order: 2,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "top",
    media: [
      {
        url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
        media_type: "POSTER",
        alt_text: "TOPCon Solar PV Spec Poster",
      }
    ]
  },
  {
    industry_slugs: ["solar-pv"],
    content_category: "INDUSTRY",
    title: "100kW - 250kW HT Commercial String Inverter Installation",
    internal_name: "PHOTO_SOLAR_PV_INVERTER",
    content_type: "PHOTO",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Multi-MPPT High-Voltage Solar PV String Inverter Wall",
    short_description: "Smart I-V curve diagnostics, built-in DC disconnect switches, and AFCI 2.0 arc fault interruption under 2.5 seconds.",
    cta_label: "View Inverter Hardware",
    cta_url: "/catalog?category=solar-pv",
    reseller_cta_label: "View Inverter Specs",
    reseller_cta_url: "/catalog?category=solar-pv",
    distributor_cta_label: "Procure Inverters",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 85,
    display_order: 3,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&auto=format&fit=crop&q=80",
        media_type: "PHOTO",
        alt_text: "High-voltage Commercial Solar PV Inverter Wall",
      }
    ]
  },
  {
    industry_slugs: ["solar-pv"],
    content_category: "INDUSTRY",
    title: "Industrial Solar PV Rooftop & Ground Mount Showcase Slider",
    internal_name: "SLIDER_SOLAR_PV_INSTALLS",
    content_type: "IMAGE_SLIDER",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Turnkey Solar PV Rooftop & Ground Mount Gallery",
    short_description: "Browse real-world C&I metal sheet roofs, RCC elevated ballasted structures, and utility single-axis tracker projects.",
    cta_label: "Explore Installation Projects →",
    cta_url: "/catalog?category=solar-pv",
    reseller_cta_label: "Explore PV Portfolio",
    reseller_cta_url: "/catalog?category=solar-pv",
    distributor_cta_label: "View Hardware Catalogs",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 80,
    display_order: 4,
    status: "PUBLISHED",
    is_featured: true,
    media: [
      {
        url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 0,
        is_primary: true,
        alt_text: "Factory Rooftop Solar PV Array",
      },
      {
        url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 1,
        is_primary: false,
        alt_text: "Single Axis Tracker Ground Solar PV",
      },
      {
        url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 2,
        is_primary: false,
        alt_text: "Solar PV Farm Golden Hour Array",
      },
      {
        url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 3,
        is_primary: false,
        alt_text: "Commercial Rooftop Solar Grid Connection",
      }
    ]
  },
  {
    industry_slugs: ["solar-pv"],
    content_category: "INDUSTRY",
    title: "Zero-Export Smart Limiter & Rapid Inverter Shutdown Video",
    internal_name: "VIDEO_SOLAR_PV_ZERO_EXPORT",
    content_type: "VIDEO",
    target_audience: "BOTH",
    placement: "VIDEO_HIGHLIGHT",
    heading: "Rapid Zero-Export Synchronization & Protection Demonstration",
    short_description: "See how dynamic CT feedback throttles inverter active power within 150ms during reverse-power grid situations.",
    cta_label: "Watch Technical Demo",
    cta_url: "/catalog?category=solar-pv",
    reseller_cta_label: "Watch PV Tech Demo",
    reseller_cta_url: "/catalog?category=solar-pv",
    distributor_cta_label: "View Limiter Specs",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 75,
    display_order: 5,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        poster_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 90,
        alt_text: "Zero Export Demo Video",
      }
    ]
  },

  // ── Solar Agriculture ─────────────────────────────────────────────────────
  {
    industry_slugs: ["solar-agriculture"],
    content_category: "INDUSTRY",
    title: "Solar Water Pumping & Smart Farm Irrigation Systems",
    internal_name: "HERO_AGRI_PUMP_4K",
    content_type: "HERO_BANNER",
    target_audience: "BOTH",
    placement: "HERO",
    heading: "PM-KUSUM Compliant Solar Water Pumping & Agrivoltaics",
    short_description: "High-torque BLDC & AC submersible solar water pumps with MPPT VFD controller and dual AC/DC input for 24/7 reliability.",
    cta_label: "Explore Solar Pump Kits →",
    cta_url: "/catalog?category=solar-agriculture",
    reseller_cta_label: "View Agri Pump Kits →",
    reseller_cta_url: "/catalog?category=solar-agriculture",
    distributor_cta_label: "Procure VFD Drives & Pumps →",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 100,
    display_order: 1,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "center",
    autoplay: true,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        poster_url: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=1800&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 110,
        alt_text: "Solar Agriculture Water Pump in Action Video",
      }
    ]
  },
  {
    industry_slugs: ["solar-agriculture"],
    content_category: "INDUSTRY",
    title: "5HP Brushless DC Submersible Pump Technical Spec Poster",
    internal_name: "POSTER_AGRI_BLDC_PUMP",
    content_type: "POSTER",
    target_audience: "BOTH",
    placement: "POSTER_HIGHLIGHT",
    heading: "5HP - 10HP Stainless Steel Grade 304 Submersible Pump Poster",
    short_description: "Delivering up to 180-meter head with dry-run protection, lightning surge arresters, and IoT telemetry for mobile monitoring.",
    cta_label: "Download Agri Pump Poster",
    cta_url: "/catalog?category=solar-agriculture",
    reseller_cta_label: "Download Poster",
    reseller_cta_url: "/catalog?category=solar-agriculture",
    distributor_cta_label: "Procure Pumps Wholesale",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 90,
    display_order: 2,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "top",
    media: [
      {
        url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
        media_type: "POSTER",
        alt_text: "5HP Solar Pump Spec Poster",
      }
    ]
  },
  {
    industry_slugs: ["solar-agriculture"],
    content_category: "INDUSTRY",
    title: "Smart MPPT Solar Pump VFD Controller Unit Photo",
    internal_name: "PHOTO_AGRI_VFD_CONTROLLER",
    content_type: "PHOTO",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "IP65 Weatherproof MPPT Pump Controller with GSM Telemetry",
    short_description: "Seamless automatic motor start at sunrise, constant pressure regulation, and integrated water level float switch sensors.",
    cta_label: "View VFD Controller Specs",
    cta_url: "/catalog?category=solar-agriculture",
    reseller_cta_label: "View VFD Kits",
    reseller_cta_url: "/catalog?category=solar-agriculture",
    distributor_cta_label: "Procure VFDs",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 85,
    display_order: 3,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80",
        media_type: "PHOTO",
        alt_text: "Solar Pump Controller Hardware Unit",
      }
    ]
  },
  {
    industry_slugs: ["solar-agriculture"],
    content_category: "INDUSTRY",
    title: "Farmland Drip Irrigation & Solar Pumping Installation Slider",
    internal_name: "SLIDER_AGRI_INSTALLS",
    content_type: "IMAGE_SLIDER",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Field-Proven Solar Pumping & Micro-Irrigation Photo Album",
    short_description: "High-resolution pictures of solar pump structures, farm ponds, underground pipe integration, and agrivoltaic crops.",
    cta_label: "View Agri Project Gallery",
    cta_url: "/catalog?category=solar-agriculture",
    reseller_cta_label: "View Farm Gallery",
    reseller_cta_url: "/catalog?category=solar-agriculture",
    distributor_cta_label: "Procure Agri Kits",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 80,
    display_order: 4,
    status: "PUBLISHED",
    is_featured: true,
    media: [
      {
        url: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 0,
        is_primary: true,
        alt_text: "Farmland Solar Pump Structure",
      },
      {
        url: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 1,
        is_primary: false,
        alt_text: "Agricultural Drip Irrigation Array",
      },
      {
        url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 2,
        is_primary: false,
        alt_text: "Crop Field Solar PV Array",
      }
    ]
  },
  {
    industry_slugs: ["solar-agriculture"],
    content_category: "INDUSTRY",
    title: "How Solar Pump Controllers Maintain High Water Flow Video",
    internal_name: "VIDEO_AGRI_EXPLAINER",
    content_type: "EXPLAINER_VIDEO",
    target_audience: "BOTH",
    placement: "VIDEO_HIGHLIGHT",
    heading: "Watch: Smart Solar Pumping Controller Dynamics & Yield",
    short_description: "An in-depth look at how dynamic MPPT tracking maintains water discharge even under cloudy or low-sun morning conditions.",
    cta_label: "Watch Agri Explainer Video",
    cta_url: "/catalog?category=solar-agriculture",
    reseller_cta_label: "Watch Video",
    reseller_cta_url: "/catalog?category=solar-agriculture",
    distributor_cta_label: "View Hardware Specs",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 75,
    display_order: 5,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        poster_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 120,
        alt_text: "Solar Pump Controller Explainer Video",
      }
    ]
  },

  // ── Solar EV ──────────────────────────────────────────────────────────────
  {
    industry_slugs: ["solar-ev"],
    content_category: "INDUSTRY",
    title: "Solar-Powered EV Fast Charging Station Canopies",
    internal_name: "HERO_SOLAR_EV_4K",
    content_type: "HERO_BANNER",
    target_audience: "BOTH",
    placement: "HERO",
    heading: "Turnkey Solar-Powered EV Fast Charging Corridors & Canopies",
    short_description: "Integrating high-efficiency bifacial solar canopies with 60kW - 180kW DC fast chargers and local battery storage buffer.",
    cta_label: "Explore Solar EV Kits →",
    cta_url: "/catalog?category=solar-ev",
    reseller_cta_label: "View EV Charging Kits →",
    reseller_cta_url: "/catalog?category=solar-ev",
    distributor_cta_label: "Procure EV Chargers →",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 100,
    display_order: 1,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "center",
    autoplay: true,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
        poster_url: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1800&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 130,
        alt_text: "Solar EV Fast Charging Canopy Video",
      }
    ]
  },
  {
    industry_slugs: ["solar-ev"],
    content_category: "INDUSTRY",
    title: "Dual Gun CCS-2 60kW/120kW DC Fast Charger Technical Poster",
    internal_name: "POSTER_SOLAR_EV_CHARGER",
    content_type: "POSTER",
    target_audience: "BOTH",
    placement: "POSTER_HIGHLIGHT",
    heading: "OCPP 1.6J / 2.0.1 Compliant Dual-Gun Solar EV Fast Charger Spec",
    short_description: "Simultaneous dual-vehicle charging with intelligent dynamic power sharing, RFID authentication, and seamless CMS integration.",
    cta_label: "Download EV Charger Poster",
    cta_url: "/catalog?category=solar-ev",
    reseller_cta_label: "Download Poster",
    reseller_cta_url: "/catalog?category=solar-ev",
    distributor_cta_label: "Request Charger Specs",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 90,
    display_order: 2,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "top",
    media: [
      {
        url: "https://images.unsplash.com/photo-1558441719-f94dd58ce271?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1558441719-f94dd58ce271?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1558441719-f94dd58ce271?w=800&auto=format&fit=crop&q=80",
        media_type: "POSTER",
        alt_text: "Dual Gun EV Charger Spec Poster",
      }
    ]
  },
  {
    industry_slugs: ["solar-ev"],
    content_category: "INDUSTRY",
    title: "Commercial Solar Carport & Fleet Depot Charging Photo",
    internal_name: "PHOTO_SOLAR_EV_CARPORT",
    content_type: "PHOTO",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Structural Steel Solar Carport with Integrated Inverters",
    short_description: "Pre-fabricated waterproof solar parking canopies that protect vehicles from sun while generating green electricity for fleet charging.",
    cta_label: "View Carport Kit",
    cta_url: "/catalog?category=solar-ev",
    reseller_cta_label: "View Solar Carports",
    reseller_cta_url: "/catalog?category=solar-ev",
    distributor_cta_label: "Procure Canopies",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 85,
    display_order: 3,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80",
        media_type: "PHOTO",
        alt_text: "Commercial Solar Carport Photo",
      }
    ]
  },
  {
    industry_slugs: ["solar-ev"],
    content_category: "INDUSTRY",
    title: "Highway & Urban Solar EV Charging Hubs Slider",
    internal_name: "SLIDER_SOLAR_EV_STATIONS",
    content_type: "IMAGE_SLIDER",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Solar EV Charging Hubs & Highway Fast Charging Stations",
    short_description: "A showcase of installed EV charging hubs combining solar roofs, battery storage buffer, and multi-vehicle fast charging dispensers.",
    cta_label: "Browse EV Stations Gallery",
    cta_url: "/catalog?category=solar-ev",
    reseller_cta_label: "Browse Gallery",
    reseller_cta_url: "/catalog?category=solar-ev",
    distributor_cta_label: "Procure Charging Hardware",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 80,
    display_order: 4,
    status: "PUBLISHED",
    is_featured: true,
    media: [
      {
        url: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 0,
        is_primary: true,
        alt_text: "Highway EV Fast Charger",
      },
      {
        url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 1,
        is_primary: false,
        alt_text: "EV Vehicle Plugged In Solar Station",
      },
      {
        url: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 2,
        is_primary: false,
        alt_text: "Solar EV Canopy Depot",
      }
    ]
  },

  // ── Energy Storage ────────────────────────────────────────────────────────
  {
    industry_slugs: ["energy-storage"],
    content_category: "INDUSTRY",
    title: "Containerized Battery Energy Storage Systems (BESS)",
    internal_name: "HERO_ENERGY_STORAGE_4K",
    content_type: "HERO_BANNER",
    target_audience: "BOTH",
    placement: "HERO",
    heading: "Megawatt-Scale BESS & Industrial Lithium Energy Storage",
    short_description: "Tier-1 LiFePO4 cells, liquid cooling, HVAC thermal management, aerosol fire suppression, and EMS microgrid controllers.",
    cta_label: "Explore Energy Storage Systems →",
    cta_url: "/catalog?category=energy-storage",
    reseller_cta_label: "View Battery Kits →",
    reseller_cta_url: "/catalog?category=energy-storage",
    distributor_cta_label: "Procure BESS Containers →",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 100,
    display_order: 1,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "center",
    autoplay: true,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        poster_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1800&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 180,
        alt_text: "Containerized BESS Energy Storage Video",
      }
    ]
  },
  {
    industry_slugs: ["energy-storage"],
    content_category: "INDUSTRY",
    title: "High-Voltage LiFePO4 Rack Battery (50kWh - 500kWh) Poster",
    internal_name: "POSTER_ENERGY_STORAGE_RACK",
    content_type: "POSTER",
    target_audience: "BOTH",
    placement: "POSTER_HIGHLIGHT",
    heading: "Commercial High-Voltage LiFePO4 Modular Rack System Poster",
    short_description: "6000+ cycle life at 90% DoD, 1C continuous charge/discharge rating, and cloud-connected 3-tier BMS battery management.",
    cta_label: "Download Battery Spec Poster",
    cta_url: "/catalog?category=energy-storage",
    reseller_cta_label: "Download Poster",
    reseller_cta_url: "/catalog?category=energy-storage",
    distributor_cta_label: "Procure Battery Racks",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 90,
    display_order: 2,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "top",
    media: [
      {
        url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
        media_type: "POSTER",
        alt_text: "High-Voltage BESS Rack Poster",
      }
    ]
  },
  {
    industry_slugs: ["energy-storage"],
    content_category: "INDUSTRY",
    title: "Turnkey Hybrid Solar Inverter + Battery Bank Integration Photo",
    internal_name: "PHOTO_ENERGY_STORAGE_HYBRID",
    content_type: "PHOTO",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "C&I 50kW Hybrid Solar Inverter with 100kWh Battery Bank",
    short_description: "Seamless grid-backup with under 10ms UPS switchover time and peak shaving to reduce maximum demand industrial tariff penalties.",
    cta_label: "View Hybrid ESS Specs",
    cta_url: "/catalog?category=energy-storage",
    reseller_cta_label: "View ESS Specs",
    reseller_cta_url: "/catalog?category=energy-storage",
    distributor_cta_label: "Procure Hybrid Systems",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 85,
    display_order: 3,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        media_type: "PHOTO",
        alt_text: "Hybrid Solar Battery Installation Photo",
      }
    ]
  },
  {
    industry_slugs: ["energy-storage"],
    content_category: "INDUSTRY",
    title: "Containerized BESS Infrastructure & Lithium Battery Slider",
    internal_name: "SLIDER_ENERGY_STORAGE_BESS",
    content_type: "IMAGE_SLIDER",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "BESS Container Enclosure, Battery Racks & Power Conversion",
    short_description: "Inspect containerized layout, PCS bi-directional inverters, liquid cooling manifolds, and transformer integration.",
    cta_label: "View BESS Gallery",
    cta_url: "/catalog?category=energy-storage",
    reseller_cta_label: "View BESS Gallery",
    reseller_cta_url: "/catalog?category=energy-storage",
    distributor_cta_label: "Procure BESS Kits",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 80,
    display_order: 4,
    status: "PUBLISHED",
    is_featured: true,
    media: [
      {
        url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 0,
        is_primary: true,
        alt_text: "Industrial Battery Room",
      },
      {
        url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 1,
        is_primary: false,
        alt_text: "LiFePO4 Module Array",
      },
      {
        url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 2,
        is_primary: false,
        alt_text: "Grid Substation BESS",
      }
    ]
  },

  // ── Solar Lighting ────────────────────────────────────────────────────────
  {
    industry_slugs: ["solar-lighting"],
    content_category: "INDUSTRY",
    title: "Smart All-in-One Solar Street Lighting & Highway Luminaires",
    internal_name: "HERO_SOLAR_LIGHTING_4K",
    content_type: "HERO_BANNER",
    target_audience: "BOTH",
    placement: "HERO",
    heading: "Smart All-in-One & Split Solar Street Lights for Highways",
    short_description: "Up to 210 lm/Watt luminous efficacy, MPPT microwave radar sensor dimming, and long-life LiFePO4 battery pack for 3-5 rainy day backup.",
    cta_label: "Explore Solar Lighting Kits →",
    cta_url: "/catalog?category=solar-lighting",
    reseller_cta_label: "View Street Light Kits →",
    reseller_cta_url: "/catalog?category=solar-lighting",
    distributor_cta_label: "Procure Street Lights in Bulk →",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 100,
    display_order: 1,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "center",
    autoplay: true,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        poster_url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1800&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 150,
        alt_text: "Solar Street Light Highway Illumination Video",
      }
    ]
  },
  {
    industry_slugs: ["solar-lighting"],
    content_category: "INDUSTRY",
    title: "60W - 120W All-in-Two Solar Street Light Specification Poster",
    internal_name: "POSTER_SOLAR_LIGHTING_SPEC",
    content_type: "POSTER",
    target_audience: "BOTH",
    placement: "POSTER_HIGHLIGHT",
    heading: "High-Lumen All-in-Two Solar Street Light Engineering Spec",
    short_description: "Die-cast aluminum housing, monocrystalline solar panel, Philips/Bridgelux 5050 LEDs, and dusk-to-dawn intelligent controller.",
    cta_label: "Download Lighting Poster",
    cta_url: "/catalog?category=solar-lighting",
    reseller_cta_label: "Download Poster",
    reseller_cta_url: "/catalog?category=solar-lighting",
    distributor_cta_label: "Procure Street Lights",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 90,
    display_order: 2,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "top",
    media: [
      {
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
        media_type: "POSTER",
        alt_text: "Solar Street Light Engineering Spec Poster",
      }
    ]
  },
  {
    industry_slugs: ["solar-lighting"],
    content_category: "INDUSTRY",
    title: "Smart City IoT Solar Street Light Pole Installation Photo",
    internal_name: "PHOTO_SOLAR_LIGHTING_POLE",
    content_type: "PHOTO",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Hot-Dip Galvanized Octagonal Pole with Integrated Solar Luminaire",
    short_description: "Corrosion-resistant pole structure with concealed battery box, vandal-proof fasteners, and wind-tunnel certified bracket arm.",
    cta_label: "View Pole Specs",
    cta_url: "/catalog?category=solar-lighting",
    reseller_cta_label: "View Pole Specs",
    reseller_cta_url: "/catalog?category=solar-lighting",
    distributor_cta_label: "Procure Poles & Luminaires",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 85,
    display_order: 3,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80",
        media_type: "PHOTO",
        alt_text: "Smart Solar Street Light Pole Installation",
      }
    ]
  },
  {
    industry_slugs: ["solar-lighting"],
    content_category: "INDUSTRY",
    title: "Highway, Campus & Village Solar Street Lighting Slider",
    internal_name: "SLIDER_SOLAR_LIGHTING_PROJECTS",
    content_type: "IMAGE_SLIDER",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Solar Street Light Project Portfolio Across India",
    short_description: "Visual album showing highway stretches, institutional university campuses, and rural village crossroads illuminated with solar lighting.",
    cta_label: "View Lighting Gallery",
    cta_url: "/catalog?category=solar-lighting",
    reseller_cta_label: "View Lighting Gallery",
    reseller_cta_url: "/catalog?category=solar-lighting",
    distributor_cta_label: "Procure in Quantity",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 80,
    display_order: 4,
    status: "PUBLISHED",
    is_featured: true,
    media: [
      {
        url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 0,
        is_primary: true,
        alt_text: "Highway Solar Street Lighting",
      },
      {
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 1,
        is_primary: false,
        alt_text: "Campus Pathway Solar Light",
      },
      {
        url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 2,
        is_primary: false,
        alt_text: "Urban Solar Lighting Corridor",
      }
    ]
  },

  // ── Solar Thermal ─────────────────────────────────────────────────────────
  {
    industry_slugs: ["solar-thermal"],
    content_category: "INDUSTRY",
    title: "Commercial & Industrial Solar Water Heating Systems",
    internal_name: "HERO_SOLAR_THERMAL_4K",
    content_type: "HERO_BANNER",
    target_audience: "BOTH",
    placement: "HERO",
    heading: "Pressurized Solar Thermal Hot Water & Industrial Steam",
    short_description: "High-recovery evacuated tube collectors (ETC) and flat plate collectors (FPC) with food-grade SS316L insulated hot water storage tanks.",
    cta_label: "Explore Solar Thermal Kits →",
    cta_url: "/catalog?category=solar-thermal",
    reseller_cta_label: "View Thermal Kits →",
    reseller_cta_url: "/catalog?category=solar-thermal",
    distributor_cta_label: "Procure Thermal Systems →",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 100,
    display_order: 1,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "center",
    autoplay: true,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        poster_url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=1800&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 140,
        alt_text: "Industrial Solar Water Heating Video",
      }
    ]
  },
  {
    industry_slugs: ["solar-thermal"],
    content_category: "INDUSTRY",
    title: "Pressurized ETC Solar Water Heater Technical Spec Poster",
    internal_name: "POSTER_SOLAR_THERMAL_SPEC",
    content_type: "POSTER",
    target_audience: "BOTH",
    placement: "POSTER_HIGHLIGHT",
    heading: "1000L - 10,000L Commercial Solar Water Heater Engineering Poster",
    short_description: "Triple-layer Borosilicate glass tubes with copper heat pipes, electrical backup heating elements, and automated recirculation manifolds.",
    cta_label: "Download Thermal Spec Poster",
    cta_url: "/catalog?category=solar-thermal",
    reseller_cta_label: "Download Poster",
    reseller_cta_url: "/catalog?category=solar-thermal",
    distributor_cta_label: "Request Engineering Drawing",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 90,
    display_order: 2,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "top",
    media: [
      {
        url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
        media_type: "POSTER",
        alt_text: "Commercial Solar Thermal Spec Poster",
      }
    ]
  },
  {
    industry_slugs: ["solar-thermal"],
    content_category: "INDUSTRY",
    title: "Hospital & Hotel Rooftop Solar Thermal Collector Array Photo",
    internal_name: "PHOTO_SOLAR_THERMAL_HOSPITAL",
    content_type: "PHOTO",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "5000 Liters/Day Centralized Solar Water Heating Plant",
    short_description: "Engineered for hospitals and hospitality sectors to slash boiler diesel and electricity bills by over 75% annually.",
    cta_label: "View Hospital Case Study",
    cta_url: "/catalog?category=solar-thermal",
    reseller_cta_label: "View Thermal Kits",
    reseller_cta_url: "/catalog?category=solar-thermal",
    distributor_cta_label: "Procure Thermal Kits",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 85,
    display_order: 3,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80",
        media_type: "PHOTO",
        alt_text: "Hospital Rooftop Solar Thermal Array",
      }
    ]
  },
  {
    industry_slugs: ["solar-thermal"],
    content_category: "INDUSTRY",
    title: "Industrial Process Heat & Solar Steam Generation Slider",
    internal_name: "SLIDER_SOLAR_THERMAL_PLANTS",
    content_type: "IMAGE_SLIDER",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Solar Thermal Heating Solutions for Textile, Dairy & Food Processing",
    short_description: "Explore solar water heaters, steam boilers, heat exchangers, and insulated circulating piping installations.",
    cta_label: "View Thermal Gallery",
    cta_url: "/catalog?category=solar-thermal",
    reseller_cta_label: "View Thermal Gallery",
    reseller_cta_url: "/catalog?category=solar-thermal",
    distributor_cta_label: "Procure Equipment",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 80,
    display_order: 4,
    status: "PUBLISHED",
    is_featured: true,
    media: [
      {
        url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 0,
        is_primary: true,
        alt_text: "Solar Thermal Manifold Array",
      },
      {
        url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 1,
        is_primary: false,
        alt_text: "Rooftop Hot Water Storage Tanks",
      }
    ]
  },

  // ── Rural Solar ───────────────────────────────────────────────────────────
  {
    industry_slugs: ["rural-solar"],
    content_category: "INDUSTRY",
    title: "Decentralized Rural Solar Microgrids & Mini-Grid Systems",
    internal_name: "HERO_RURAL_SOLAR_4K",
    content_type: "HERO_BANNER",
    target_audience: "BOTH",
    placement: "HERO",
    heading: "Decentralized Solar Microgrids & Rural Electrification",
    short_description: "Providing 24/7 reliable off-grid electricity for remote hamlets, primary health centres, and rural micro-enterprises.",
    cta_label: "Explore Rural Solar Kits →",
    cta_url: "/catalog?category=rural-solar",
    reseller_cta_label: "View Rural Solar Kits →",
    reseller_cta_url: "/catalog?category=rural-solar",
    distributor_cta_label: "Procure Microgrid Hardware →",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 100,
    display_order: 1,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "center",
    autoplay: true,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
        poster_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1800&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 160,
        alt_text: "Rural Solar Mini-Grid Village Electrification Video",
      }
    ]
  },
  {
    industry_slugs: ["rural-solar"],
    content_category: "INDUSTRY",
    title: "Off-Grid Solar Home Power Pack & DC Fan / Light Kit Poster",
    internal_name: "POSTER_RURAL_SOLAR_HOME",
    content_type: "POSTER",
    target_audience: "BOTH",
    placement: "POSTER_HIGHLIGHT",
    heading: "100W - 500W Rural Solar Home Lighting & DC Power Kit Poster",
    short_description: "Compact plug-and-play solar generator with lithium battery, high-lumen DC LED bulbs, USB fast mobile charging, and brushless DC ceiling fan.",
    cta_label: "Download Home Kit Poster",
    cta_url: "/catalog?category=rural-solar",
    reseller_cta_label: "Download Poster",
    reseller_cta_url: "/catalog?category=rural-solar",
    distributor_cta_label: "Procure Home Packs in Bulk",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 90,
    display_order: 2,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "top",
    media: [
      {
        url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
        media_type: "POSTER",
        alt_text: "Rural Solar Home Lighting Kit Poster",
      }
    ]
  },
  {
    industry_slugs: ["rural-solar"],
    content_category: "INDUSTRY",
    title: "Rural Health Centre Vaccine Refrigerator Solar Power Unit Photo",
    internal_name: "PHOTO_RURAL_SOLAR_CLINIC",
    content_type: "PHOTO",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "WHO-PQS Compliant Solar Direct Drive Vaccine Cold Chain",
    short_description: "Battery-free ice-lined refrigeration ensuring critical life-saving vaccines remain between +2°C and +8°C under tropical temperatures.",
    cta_label: "View Healthcare Solar Specs",
    cta_url: "/catalog?category=rural-solar",
    reseller_cta_label: "View Clinic Solar",
    reseller_cta_url: "/catalog?category=rural-solar",
    distributor_cta_label: "Procure Direct Drive Units",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 85,
    display_order: 3,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80",
        media_type: "PHOTO",
        alt_text: "Rural Health Clinic Solar Installation",
      }
    ]
  },
  {
    industry_slugs: ["rural-solar"],
    content_category: "INDUSTRY",
    title: "Remote Village Microgrids, Schools & Anganwadi Solar Slider",
    internal_name: "SLIDER_RURAL_SOLAR_VILLAGES",
    content_type: "IMAGE_SLIDER",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Rural Solar Impact Portfolio: Powering Off-Grid India",
    short_description: "Community mini-grids, smart solar classrooms, solar water filtration plants, and women-led solar cottage enterprise installations.",
    cta_label: "View Rural Impact Gallery",
    cta_url: "/catalog?category=rural-solar",
    reseller_cta_label: "View Impact Gallery",
    reseller_cta_url: "/catalog?category=rural-solar",
    distributor_cta_label: "Procure Rural Kits",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 80,
    display_order: 4,
    status: "PUBLISHED",
    is_featured: true,
    media: [
      {
        url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 0,
        is_primary: true,
        alt_text: "Village Solar Microgrid Setup",
      },
      {
        url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 1,
        is_primary: false,
        alt_text: "Rural School Solar Rooftop",
      },
      {
        url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 2,
        is_primary: false,
        alt_text: "Rural Water Pumping Solar Setup",
      }
    ]
  }
];

// ─── 3. Government Tender Content Items (Browse by Govt Tender) ───────────────
const GOVT_TENDER_CONTENTS = [
  {
    industry_slugs: ["solar-agriculture", "rural-solar"],
    content_category: "GOVT_TENDER",
    title: "PM-KUSUM Component B & C Solar Water Pump Tender Showcase",
    internal_name: "TENDER_PM_KUSUM_PUMPS",
    content_type: "HERO_BANNER",
    target_audience: "BOTH",
    placement: "HERO",
    heading: "PM-KUSUM Scheme Component B & C Turnkey Tender Solutions",
    short_description: "MNRE approved 3HP, 5HP & 7.5HP standalone and grid-connected agricultural solar pumps with remote telemetry (RMS) for State Nodal Agencies (SNAs).",
    cta_label: "View PM-KUSUM Tender Kits →",
    cta_url: "/catalog?category=solar-agriculture&tender=pm-kusum",
    reseller_cta_label: "View KUSUM Kits & BOM →",
    reseller_cta_url: "/catalog?category=solar-agriculture&tender=pm-kusum",
    distributor_cta_label: "Download SNA Tender BOM Specs →",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 100,
    display_order: 1,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "center",
    autoplay: true,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        poster_url: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=1800&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 110,
        alt_text: "PM KUSUM Solar Pump Tender Video",
      }
    ]
  },
  {
    industry_slugs: ["solar-pv"],
    content_category: "GOVT_TENDER",
    title: "PM Surya Ghar: Muft Bijli Yojana National Rooftop Solar Tender",
    internal_name: "TENDER_PM_SURYA_GHAR",
    content_type: "HERO_BANNER",
    target_audience: "BOTH",
    placement: "HERO",
    heading: "PM Surya Ghar: 1 Crore Household Rooftop Solar Mission Packages",
    short_description: "Complete pre-engineered 1kW, 2kW & 3kW grid-tied rooftop solar kits with DCR compliant modules and National Portal subsidy compliance.",
    cta_label: "Explore Surya Ghar Packages →",
    cta_url: "/catalog?category=solar-pv&tender=pm-surya-ghar",
    reseller_cta_label: "Explore Surya Ghar Packages →",
    reseller_cta_url: "/catalog?category=solar-pv&tender=pm-surya-ghar",
    distributor_cta_label: "Procure DCR Cell Modules →",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 98,
    display_order: 2,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "center",
    autoplay: true,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        poster_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=1800&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 145,
        alt_text: "PM Surya Ghar Rooftop Solar Video",
      }
    ]
  },
  {
    industry_slugs: ["solar-pv", "energy-storage"],
    content_category: "GOVT_TENDER",
    title: "SECI 1200MW ISTS Connected Solar PV & BESS Grid-Scale Tender Spec",
    internal_name: "TENDER_SECI_ISTS_BESS",
    content_type: "POSTER",
    target_audience: "BOTH",
    placement: "POSTER_HIGHLIGHT",
    heading: "SECI & NTPC Grid-Scale Solar PV + 2-Hour BESS Storage Spec",
    short_description: "Comprehensive tender technical compliance poster covering 1500V DC central inverters, tracker SCADA, and CEA Grid Code compliance.",
    cta_label: "Download SECI Tender Spec",
    cta_url: "/catalog?category=solar-pv",
    reseller_cta_label: "Download Poster",
    reseller_cta_url: "/catalog?category=solar-pv",
    distributor_cta_label: "Procure Utility BESS Components",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 92,
    display_order: 3,
    status: "PUBLISHED",
    is_featured: true,
    focal_position: "top",
    media: [
      {
        url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80",
        media_type: "POSTER",
        alt_text: "SECI ISTS Solar PV & BESS Tender Poster",
      }
    ]
  },
  {
    industry_slugs: ["solar-lighting", "rural-solar"],
    content_category: "GOVT_TENDER",
    title: "Smart Cities Mission & EESL All-in-One Solar Street Light Tender Slider",
    internal_name: "TENDER_SMART_CITIES_LIGHTING",
    content_type: "IMAGE_SLIDER",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Smart Municipal & Highway All-in-One Solar Street Lighting Tender",
    short_description: "Supplying 20W - 60W MNRE compliant all-in-one solar street luminaires for municipal corporations, Gram Panchayats and PWD roads.",
    cta_label: "View Municipal Lighting Specs →",
    cta_url: "/catalog?category=solar-lighting",
    reseller_cta_label: "View Lighting Kits",
    reseller_cta_url: "/catalog?category=solar-lighting",
    distributor_cta_label: "Procure EESL Compliant Lights",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 88,
    display_order: 4,
    status: "PUBLISHED",
    is_featured: true,
    media: [
      {
        url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 0,
        is_primary: true,
        alt_text: "Smart City Street Light Tender Installation",
      },
      {
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 1,
        is_primary: false,
        alt_text: "Municipal Solar Light Array",
      },
      {
        url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 2,
        is_primary: false,
        alt_text: "Highway Solar Street Lighting Project",
      }
    ]
  },
  {
    industry_slugs: ["solar-ev", "energy-storage"],
    content_category: "GOVT_TENDER",
    title: "National Highway Authority (NHAI) Solar EV Fast Charging Corridor",
    internal_name: "TENDER_NHAI_EV_CORRIDOR",
    content_type: "VIDEO",
    target_audience: "BOTH",
    placement: "VIDEO_HIGHLIGHT",
    heading: "FAME-II & NHAI Expressway Solar EV Fast Charging Station Tenders",
    short_description: "Watch how solar highway rest-stop canopies generate 100% green energy to power multi-bay CCS-2 electric bus and car fast charging stations.",
    cta_label: "Watch EV Corridor Tender Demo",
    cta_url: "/catalog?category=solar-ev",
    reseller_cta_label: "Watch Video",
    reseller_cta_url: "/catalog?category=solar-ev",
    distributor_cta_label: "Procure Expressway Charging Hubs",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 84,
    display_order: 5,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
        poster_url: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 130,
        alt_text: "NHAI Highway Solar EV Corridor Tender Video",
      }
    ]
  },
  {
    industry_slugs: ["solar-thermal"],
    content_category: "GOVT_TENDER",
    title: "Government Medical College & District Hospital Solar Water Heating",
    internal_name: "TENDER_GOVT_HOSPITAL_THERMAL",
    content_type: "PHOTO",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "AIIMS & Government Medical College Solar Hot Water Mandates",
    short_description: "BIS certified 5000L - 20,000L pressurized solar water heating plants with PUF insulation, SS304 inner tank, and digital BMS integration.",
    cta_label: "View Govt Hospital Specs",
    cta_url: "/catalog?category=solar-thermal",
    reseller_cta_label: "View Hospital Thermal Specs",
    reseller_cta_url: "/catalog?category=solar-thermal",
    distributor_cta_label: "Procure Hospital Grade Systems",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 82,
    display_order: 6,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&auto=format&fit=crop&q=80",
        media_type: "PHOTO",
        alt_text: "Govt Medical College Solar Hot Water System",
      }
    ]
  },
  {
    industry_slugs: ["rural-solar", "energy-storage"],
    content_category: "GOVT_TENDER",
    title: "DDUGJY & Saubhagya Remote Village Solar Mini-Grid Tender Video",
    internal_name: "TENDER_SAUBHAGYA_MINIGRID",
    content_type: "VIDEO_SLIDER",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "Ministry of Power Saubhagya Remote Off-Grid Solar Mini-Grids",
    short_description: "Turnkey 10kW - 50kW solar-plus-storage mini-grids powering unelectrified border and tribal villages with smart prepaid energy meters.",
    cta_label: "Watch Mini-Grid Video",
    cta_url: "/catalog?category=rural-solar",
    reseller_cta_label: "Watch Mini-Grid Video",
    reseller_cta_url: "/catalog?category=rural-solar",
    distributor_cta_label: "Procure Mini-Grid Hardware",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 80,
    display_order: 7,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        poster_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 180,
        sort_order: 0,
        is_primary: true,
        alt_text: "Village Mini Grid Video 1",
      },
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
        poster_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
        media_type: "VIDEO",
        duration_sec: 160,
        sort_order: 1,
        is_primary: false,
        alt_text: "Village Mini Grid Video 2",
      }
    ]
  },
  {
    industry_slugs: ["solar-pv"],
    content_category: "GOVT_TENDER",
    title: "ALMM & BIS Approved Dual-Glass Bifacial PV Modules for PSU Tenders",
    internal_name: "TENDER_ALMM_MODULES",
    content_type: "POSTER",
    target_audience: "BOTH",
    placement: "POSTER_HIGHLIGHT",
    heading: "MNRE ALMM List-I & BIS Certified 550W+ Bifacial PV Modules",
    short_description: "Mandatory compliance for all Government & PSU tenders in India, featuring positive power tolerance (+3%) and IEC 61215/61730 certifications.",
    cta_label: "Download ALMM Spec Sheet",
    cta_url: "/catalog?category=solar-pv",
    reseller_cta_label: "Download ALMM Poster",
    reseller_cta_url: "/catalog?category=solar-pv",
    distributor_cta_label: "Procure ALMM Pallets",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 78,
    display_order: 8,
    status: "PUBLISHED",
    is_featured: false,
    focal_position: "center",
    media: [
      {
        url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=1600&auto=format&fit=crop&q=80",
        poster_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
        media_type: "POSTER",
        alt_text: "ALMM Approved Solar Module Spec Poster",
      }
    ]
  },
  {
    industry_slugs: ["solar-agriculture", "solar-pv"],
    content_category: "GOVT_TENDER",
    title: "PM-KUSUM Feeder-Level Solarization (FLS) 500kW - 2MW Plant Slider",
    internal_name: "TENDER_KUSUM_FEEDER_LEVEL",
    content_type: "IMAGE_SLIDER",
    target_audience: "BOTH",
    placement: "GALLERY",
    heading: "PM-KUSUM Component C Feeder-Level Solarization (FLS) Gallery",
    short_description: "Grid-substation connected 11kV agricultural feeder solar plants that supply daytime uninterrupted green power to rural farmer irrigation feeders.",
    cta_label: "View FLS Tender Portfolio →",
    cta_url: "/catalog?category=solar-agriculture",
    reseller_cta_label: "View Feeder Solar Gallery",
    reseller_cta_url: "/catalog?category=solar-agriculture",
    distributor_cta_label: "Procure Substation HT Inverters",
    distributor_cta_url: "/distributor/portal/procure",
    priority: 76,
    display_order: 9,
    status: "PUBLISHED",
    is_featured: false,
    media: [
      {
        url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 0,
        is_primary: true,
        alt_text: "11kV Feeder Solar Plant",
      },
      {
        url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 1,
        is_primary: false,
        alt_text: "Substation Connected Ground Mount Array",
      },
      {
        url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=1600&auto=format&fit=crop&q=80",
        thumbnail_url: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&auto=format&fit=crop&q=80",
        media_type: "IMAGE",
        sort_order: 2,
        is_primary: false,
        alt_text: "Solar PV Agri Feeder Power Generation",
      }
    ]
  }
];

// ─── Execution Function ───────────────────────────────────────────────────────
async function runSeed() {
  try {
    console.log("==========================================================");
    console.log("⚡ Starting Full Industry & Govt Tender Content Seeder...");
    console.log("==========================================================");

    // 1. Ensure all 7 industries exist and have complete data & themes
    const industryMapBySlug = {};

    for (const ind of INDUSTRIES_DATA) {
      let doc = await IndustryType.findOne({ slug: ind.slug, deleted_at: null });
      if (!doc) {
        // Try finding by name
        doc = await IndustryType.findOne({ name: ind.name, deleted_at: null });
      }

      if (!doc) {
        doc = await IndustryType.create({
          name: ind.name,
          code: ind.code,
          slug: ind.slug,
          icon: ind.icon,
          description: ind.description,
          sort_order: ind.sort_order,
          for_resellers: true,
          for_epc: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
        console.log(`➕ Created Industry: ${doc.name} (${doc.slug})`);
      } else {
        // Update code, description, sort_order if missing
        doc.code = ind.code;
        doc.icon = ind.icon;
        doc.description = ind.description;
        doc.sort_order = ind.sort_order;
        doc.is_active = true;
        doc.for_resellers = true;
        doc.for_epc = true;
        await doc.save();
        console.log(`✓ Verified & Updated Industry: ${doc.name} (${doc._id})`);
      }

      industryMapBySlug[ind.slug] = doc;

      // Upsert theme
      if (ind.theme) {
        await IndustryTheme.findOneAndUpdate(
          { industry_type_id: doc._id },
          {
            industry_type_id: doc._id,
            ...ind.theme,
            updated_at: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`  🎨 Configured Theme for: ${doc.name}`);
      }
    }

    // 2. Clear existing demo CMS contents to avoid clutter
    await IndustryContentMedia.deleteMany({});
    await IndustryContentIndustryMap.deleteMany({});
    await IndustryContent.deleteMany({});
    console.log("\n🧹 Cleared previous industry contents and media records.");

    // 3. Insert Industry Contents
    const allContents = [...INDUSTRY_CONTENTS, ...GOVT_TENDER_CONTENTS];
    console.log(`\n📦 Inserting ${allContents.length} CMS content items...`);

    let insertedCount = 0;
    let mediaCount = 0;

    for (const item of allContents) {
      const { industry_slugs, media, ...contentFields } = item;

      const content = await IndustryContent.create({
        ...contentFields,
        status: "PUBLISHED",
        is_active: true,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      insertedCount++;

      // Map to target industries
      if (industry_slugs && industry_slugs.length > 0) {
        for (const slug of industry_slugs) {
          const industryDoc = industryMapBySlug[slug];
          if (industryDoc) {
            await IndustryContentIndustryMap.create({
              content_id: content._id,
              industry_type_id: industryDoc._id,
              created_at: new Date(),
            });
          }
        }
      }

      // Insert media records
      if (media && media.length > 0) {
        for (let i = 0; i < media.length; i++) {
          const m = media[i];
          await IndustryContentMedia.create({
            content_id: content._id,
            url: m.url,
            poster_url: m.poster_url || m.url,
            thumbnail_url: m.thumbnail_url || m.poster_url || m.url,
            media_type: m.media_type || (content.content_type.includes("VIDEO") ? "VIDEO" : "IMAGE"),
            device_type: m.device_type || "ALL",
            is_primary: m.is_primary !== undefined ? m.is_primary : i === 0,
            sort_order: m.sort_order !== undefined ? m.sort_order : i,
            duration_sec: m.duration_sec || null,
            alt_text: m.alt_text || content.title,
            processing_status: "READY",
            created_at: new Date(),
            updated_at: new Date(),
          });
          mediaCount++;
        }
      }

      console.log(`[${content.content_category}] (${content.content_type}) "${content.title}" -> ${industry_slugs.join(", ")} (Media: ${media?.length || 0})`);
    }

    console.log("==========================================================");
    console.log(`🎉 SUCCESS!`);
    console.log(`   - Industries verified: ${Object.keys(industryMapBySlug).length}`);
    console.log(`   - Industry Themes configured: ${Object.keys(industryMapBySlug).length}`);
    console.log(`   - Total Content items published: ${insertedCount}`);
    console.log(`   - Total Media items created: ${mediaCount}`);
    console.log("==========================================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  }
}

runSeed();
