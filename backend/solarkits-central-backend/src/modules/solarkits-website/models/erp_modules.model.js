const mongoose = require("mongoose");

const erpModulesSchema = new mongoose.Schema(
  {
    menuTitle: {
      type: String,
      default: "Comprehensive ERP Modules",
    },
    subTitle: {
      type: String,
      default: "Everything you need to run your business efficiently",
    },
    menuType: {
      type: String,
      default: "Grid",
    },
    enableSection: {
      type: Boolean,
      default: true,
    },

    modules: [
      {
        id: String,
        order: {
          type: Number,
          default: 0,
        },
        title: {
          type: String,
          required: true,
        },
        desc: {
          type: String,
          default: "",
        },
        description: {
          type: String,
          default: "",
        },
        icon: {
          type: String,
          default: "",
        },
        logo: {
          type: String,
          default: "",
        },
        status: {
          type: String,
          default: "Active",
        },
      },
    ],

    lastUpdated: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("ErpModulesConfig", erpModulesSchema);