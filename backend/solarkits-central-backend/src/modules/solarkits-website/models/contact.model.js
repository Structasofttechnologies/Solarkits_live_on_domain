const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: "Get In Touch",
    },
    heroSubtitle: {
      type: String,
      default: "We're here to help you with all your solar energy needs. Contact us for free consultations and quotes.",
    },
    sectionTitle: {
      type: String,
      default: "Contact Information",
    },
    sectionDesc: {
      type: String,
      default: "Fill out the form or reach out to us through any of the channels below. Our team is ready to assist you with your solar journey.",
    },
    officeAddress: {
      type: String,
      default: "123 Solar Street, Green City, GC 12345, United States",
    },
    phone1: {
      type: String,
      default: "+1 (555) 123-4567",
    },
    phone2: {
      type: String,
      default: "+1 (555) 765-4321",
    },
    email1: {
      type: String,
      default: "info@solarcompany.com",
    },
    email2: {
      type: String,
      default: "support@solarcompany.com",
    },
    businessHours: {
      type: String,
      default: "Monday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 2:00 PM\nSunday: Closed",
    },
    facebookUrl: {
      type: String,
      default: "https://facebook.com",
    },
    twitterUrl: {
      type: String,
      default: "https://twitter.com",
    },
    linkedinUrl: {
      type: String,
      default: "https://linkedin.com",
    },
    instagramUrl: {
      type: String,
      default: "https://instagram.com",
    },
    formTitle: {
      type: String,
      default: "Send us a Message",
    },
    submitBtnText: {
      type: String,
      default: "Submit Message",
    },
    mapTitle: {
      type: String,
      default: "Map View",
    },
    mapSubtitle: {
      type: String,
      default: "Interactive map integrations will load in this canvas",
    },
    mapStatus: {
      type: Boolean,
      default: true,
    },
    faqTitle: {
      type: String,
      default: "Frequently Asked Questions",
    },
    faqStatus: {
      type: Boolean,
      default: true,
    },
    faqs: {
      type: Array,
      default: [
        { q: "How long does a solar installation take?", a: "Residential installations typically take 2-4 days, while commercial projects vary depending on scale and planning compliance." },
        { q: "What is the lifespan of solar panels?", a: "High-quality solar panels have an active lifespan of 25-30 years, often with linear power warranties up to 25 years." },
        { q: "Do you offer solar warranties?", a: "Yes! We offer a full workmanship warranty alongside standard manufacture product warranties for materials, inverters, and battery banks." },
        { q: "How can I calculate my ROI?", a: "Our consultants will analyze your billing, property size, and sun exposure profile to calculate a accurate ROI payoff schedule." }
      ],
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Contact", ContactSchema);
