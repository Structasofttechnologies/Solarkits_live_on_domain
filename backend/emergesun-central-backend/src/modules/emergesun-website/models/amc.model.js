const mongoose = require('mongoose');

const amcSchema = new mongoose.Schema(
  {
    // Hero Section
    heroTitle: { type: String, default: "Solar AMC Management System" },
    heroDescription: { type: String, default: "Comprehensive Annual Maintenance Contract management solution for solar installations. Streamline service operations, track maintenance schedules, manage complaints, and ensure customer satisfaction with our advanced AMC platform." },
    primaryBtnText: { type: String, default: "Get Started" },
    primaryBtnLink: { type: String, default: "/login" },
    secondaryBtnText: { type: String, default: "Request Demo" },
    rightBannerTitle: { type: String, default: "AMC Management" },
    imageUrl: { type: String, default: "" },

    // Metrics
    metricsList: {
      type: [{ value: String, label: String, theme: String }],
      default: [
        { value: "5000+", label: "Active AMCs", theme: "orange" },
        { value: "98%",   label: "Satisfaction",  theme: "green"  },
        { value: "24/7",  label: "Support",        theme: "blue"   }
      ]
    },

    // Features Section
    featuresTitle:    { type: String, default: "Comprehensive AMC Features" },
    featuresSubtitle: { type: String, default: "Everything you need to manage maintenance contracts efficiently" },
    featuresList: {
      type: [{ title: String, description: String, icon: String, enabled: { type: Boolean, default: true } }],
      default: [
        { title: "Contract Management",   description: "Create, renew, and manage AMC contracts with automated reminders",                  icon: "FileText"    },
        { title: "Preventive Maintenance",description: "Schedule and track routine maintenance visits and inspections",                       icon: "Calendar"    },
        { title: "Complaint Management",  description: "Register and track customer complaints with SLA monitoring",                         icon: "AlertCircle" },
        { title: "Technician Management", description: "Assign tasks, track attendance, and manage service teams",                           icon: "Users"       },
        { title: "Spare Parts Management",description: "Track inventory of spare parts used in maintenance",                                 icon: "Boxes"       },
        { title: "Invoicing & Billing",   description: "Generate invoices and track payments for AMC contracts",                             icon: "Receipt"     },
        { title: "Service History",       description: "Complete history of all maintenance activities and visits",                          icon: "History"     },
        { title: "Automated Alerts",      description: "Get alerts for contract renewals and scheduled maintenance",                         icon: "Bell"        },
        { title: "Performance Reports",   description: "Detailed reports on service performance and SLA compliance",                         icon: "BarChart3"   }
      ]
    },

    // How It Works / Process
    processTitle:    { type: String, default: "How AMC Management Works" },
    processSubtitle: { type: String, default: "Simple steps to manage your solar maintenance contracts" },
    processList: {
      type: [{ step: String, title: String, description: String, icon: String, enabled: { type: Boolean, default: true } }],
      default: [
        { step: "1", title: "Create Contract",  description: "Set up AMC contracts with terms, pricing, and coverage details",               icon: "FileText"   },
        { step: "2", title: "Schedule Visits",  description: "Plan preventive maintenance visits and inspections",                            icon: "Calendar"   },
        { step: "3", title: "Track Services",   description: "Monitor service execution and record maintenance activities",                   icon: "TrendingUp" },
        { step: "4", title: "Manage Renewals",  description: "Automate contract renewals and customer communications",                        icon: "Clock"      }
      ]
    },

    // Benefits Section
    benefitsTitle:    { type: String, default: "Key Benefits" },
    benefitsSubtitle: { type: String, default: "Why businesses choose our AMC platform" },
    benefitsList: {
      type: [{ title: String, description: String, enabled: { type: Boolean, default: true } }],
      default: [
        { title: "Maximize Efficiency",  description: "Automate scheduling and billing to save administrative hours."                           },
        { title: "Improve Uptime",       description: "Routine preventative testing minimizes unexpected panel/inverter breakdowns."             },
        { title: "Customer Satisfaction",description: "Rapid SLA resolution pipelines satisfy dealers and household clients."                   },
        { title: "Business Growth",      description: "Scale maintenance contract volume without enlarging operational personnel."               }
      ]
    },

    // Screenshots Section
    screenshotsTitle:    { type: String, default: "Interface Showcase" },
    screenshotsSubtitle: { type: String, default: "Take a look at our AMC management interface" },
    screenshotsList: {
      type: [{ title: String, description: String, enabled: { type: Boolean, default: true } }],
      default: [
        { title: "AMC Dashboard",         description: "Complete overview of all maintenance contracts with real-time status and key metrics"   },
        { title: "Contract Management",   description: "Manage AMC contracts, renewals, pricing, and customer agreements seamlessly"            },
        { title: "Service Scheduling",    description: "Schedule preventive maintenance visits and track service history"                       },
        { title: "Complaint Management",  description: "Track and manage customer complaints with SLA monitoring and resolution tracking"       },
        { title: "Team Management",       description: "Assign tasks to technicians, track attendance, and manage service teams"               },
        { title: "Performance Analytics", description: "Comprehensive analytics on service performance, revenue, and customer satisfaction"     }
      ]
    },

     enableSection: { type: Boolean, default: true },
    enableFeaturesSection: { type: Boolean, default: true },
    enableProcessSection: { type: Boolean, default: true },
    enableBenefitsSection: { type: Boolean, default: true },
    enableScreenshotsSection: { type: Boolean, default: true },
    lastUpdated:   { type: String,  default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AmcConfig', amcSchema);
