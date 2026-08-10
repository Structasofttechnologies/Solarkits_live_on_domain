 const mongoose = require("mongoose");

const HeaderSchema = new mongoose.Schema(
  {
    badge: {
      type: String,
      required: true,
      default: "Welcome to Solar Business ERP System",
    },

    title: {
      type: String,
      required: true,
    },

    subtitle: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    status: {
      type: Boolean,
      default: true,
    },

    erpModulesTitle: {
      type: String,
      default: "ERP Modules",
    },

    erpModulesSubTitle: {
      type: String,
      default: "Everything you need to run your business efficiently",
    },

    erpModulesStatus: {
      type: Boolean,
      default: true,
    },

    erpModules: [
      {
        id: String,
        title: String,
        description: String,
        desc: String,
        logo: String,
        icon: String,
        status: { type: String, default: "Active" },
      },
    ],
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("Header", HeaderSchema);    