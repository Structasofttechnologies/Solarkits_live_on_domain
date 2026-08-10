const mongoose = require("mongoose");

const servicesSchema = new mongoose.Schema(
  {
    menuTitle: {
      type: String,
      default: "Our Solar Software",
    },
    menuType: {
      type: String,
      default: "Dropdown",
    },
    enableSection: {
      type: Boolean,
      default: true,
    },
    services: [
      {
        id: String,
        name: String,
        slug: String,
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

module.exports = mongoose.model("ServicesConfig", servicesSchema);
