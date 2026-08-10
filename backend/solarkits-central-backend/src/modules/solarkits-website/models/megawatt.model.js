const mongoose = require('mongoose');

const megawattSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: "Solar Mega Watt Project Management",
    },
    heroDescription: {
      type: String,
      default: "Enterprise-grade project management solution specifically designed for large-scale solar power plants. Manage multi-megawatt projects from conception to commissioning with complete control and visibility.",
    },
    primaryBtnText: {
      type: String,
      default: "Schedule Consultation",
    },
    primaryBtnLink: {
      type: String,
      default: "/login",
    },
    secondaryBtnText: {
      type: String,
      default: "View Demo",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    rightBannerTitle: {
      type: String,
      default: "Mega Watt Project Management",
    },
    metricsList: {
      type: [
        {
          value: { type: String },
          label: { type: String },
          theme: { type: String }
        }
      ],
      default: [
        { value: "50+", label: "MW Projects", theme: "orange" },
        { value: "1000+", label: "MW Capacity", theme: "green" },
        { value: "25+", label: "Countries", theme: "blue" }
      ]
    },
    phasesTitle: {
      type: String,
      default: "Mega Watt Project Lifecycle",
    },
    phasesSubtitle: {
      type: String,
      default: "End-to-end management for large-scale solar projects",
    },
    phasesList: {
      type: [
        {
          num: { type: String },
          title: { type: String },
          description: { type: String },
          icon: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        { num: "1", title: "Feasibility Study", description: "Site assessment, solar irradiance analysis, land acquisition, and regulatory compliance", icon: "FileText" },
        { num: "2", title: "Design & Engineering", description: "Detailed engineering, system design, equipment specification, and layout planning", icon: "Compass" },
        { num: "3", title: "Procurement", description: "Bulk equipment sourcing, vendor selection, supply chain management, and logistics", icon: "Boxes" },
        { num: "4", title: "Solar Bidding", description: "Competitive bidding management, tariff calculations, PPA analysis, and bid submission tracking", icon: "Gavel" },
        { num: "5", title: "Construction", description: "Site preparation, installation, civil works, and electrical integration", icon: "Wrench" },
        { num: "6", title: "Commissioning", description: "Testing, grid connection, performance validation, and handover", icon: "Plug" }
      ]
    },
    featuresTitle: {
      type: String,
      default: "Enterprise-Grade Features",
    },
    featuresSubtitle: {
      type: String,
      default: "Comprehensive tools for managing large-scale solar projects",
    },
    featuresList: {
      type: [
        {
          title: { type: String },
          description: { type: String },
          icon: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        { title: "Multi-Project Management", description: "Handle multiple mega watt projects simultaneously with centralized control", icon: "FolderGit2" },
        { title: "Gantt Charts", description: "Advanced project scheduling with critical path analysis and dependencies", icon: "CalendarDays" },
        { title: "Budget Tracking", description: "Real-time budget monitoring, cost control, and financial forecasting", icon: "IndianRupee" },
        { title: "Resource Management", description: "Optimize equipment, labor, and material allocation across projects", icon: "Cpu" },
        { title: "GIS Integration", description: "Geographic information system for site mapping and planning", icon: "Map" },
        { title: "Risk Management", description: "Identify, assess, and mitigate project risks proactively", icon: "ShieldAlert" },
        { title: "Quality Control", description: "Track quality metrics, inspections, and compliance standards", icon: "ShieldCheck" },
        { title: "Stakeholder Portal", description: "Dedicated access for investors, contractors, and regulatory bodies", icon: "Users2" },
        { title: "Document Management", description: "Secure repository for blueprints, contracts, and engineering documents", icon: "Files" }
      ]
    },
    screenshotsTitle: {
      type: String,
      default: "Interface Showcase",
    },
    screenshotsSubtitle: {
      type: String,
      default: "Take a look at our beautiful and intuitive project screens",
    },
    screenshotsList: {
      type: [
        {
          title: { type: String },
          description: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        { title: "Project Dashboard", description: "Complete overview of all mega watt projects with real-time progress tracking and key metrics" },
        { title: "Project Planning", description: "Advanced project planning tools with Gantt charts, resource allocation, and timeline management" },
        { title: "Site Management", description: "Multi-site project management with location tracking and site-specific dashboards" },
        { title: "Procurement & Logistics", description: "Bulk material procurement, vendor management, and logistics coordination for mega projects" },
        { title: "Construction Tracking", description: "Real-time construction progress tracking with milestone management and quality control" },
        { title: "Advanced Analytics", description: "Comprehensive project analytics, budget tracking, and performance reports" }
      ]
    },
    enableSection: {
      type: Boolean,
      default: true,
    },
    enablePhasesSection: {
      type: Boolean,
      default: true,
    },
    enableFeaturesSection: {
      type: Boolean,
      default: true,
    },
    enableScreenshotsSection: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: String,
      default: "",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MegawattConfig', megawattSchema);
