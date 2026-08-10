const mongoose = require("mongoose");

const happyUsersSchema = new mongoose.Schema(
  {
    sectionTitle: {
      type: String,
      default: "Our Happy Users",
    },
    subTitle: {
      type: String,
      default: "Trusted by solar businesses across India",
    },
    enableSection: {
      type: Boolean,
      default: true,
    },

    stats: [
      {
        id: String,
        order: {
          type: Number,
          default: 0,
        },
        label: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
        icon: {
          type: String,
          default: "Users",
        },
        color: {
          type: String,
          default: "text-blue-500 bg-blue-50",
        },
        status: {
          type: String,
          default: "Active",
        },
      },
    ],

    testimonials: [
      {
        id: String,
        order: {
          type: Number,
          default: 0,
        },
        name: {
          type: String,
          required: true,
        },
        company: {
          type: String,
          default: "",
        },
        position: {
          type: String,
          default: "",
        },
        testimonial: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          default: "Active",
        },
      },
    ],

    trustedCompanies: {
      type: [String],
      default: ["Tata Power Solar", "Adani Green", "Waaree", "Vikram Solar", "Solex Energy", "Renew Power"],
    },

    lastUpdated: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("HappyUsersConfig", happyUsersSchema);
