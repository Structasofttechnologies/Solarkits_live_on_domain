const mongoose = require("mongoose");

const AboutDetailsSchema = new mongoose.Schema(
  {
    missionTitle: {
      type: String,
      default: "Our Mission",
    },
    missionDescription: {
      type: String,
      default: "To make solar energy accessible and affordable for everyone, driving the transition to renewable energy and creating a sustainable future for generations to come.",
    },
    visionTitle: {
      type: String,
      default: "Our Vision",
    },
    visionDescription: {
      type: String,
      default: "A world powered entirely by renewable energy, where every home and business contributes to a cleaner, greener planet through solar power adoption.",
    },
    storyTitle: {
      type: String,
      default: "Our Story",
    },
    storyParagraph1: {
      type: String,
      default: "Founded in 2015, our journey began with a simple vision: to make solar energy accessible to all. What started as a small team of passionate engineers has grown into a leading solar solutions provider serving thousands of satisfied customers across the country.",
    },
    storyParagraph2: {
      type: String,
      default: "We believe in the power of renewable energy to transform communities and protect our planet. Every solar panel we install brings us one step closer to a sustainable future.",
    },
    valuesTitle: {
      type: String,
      default: "Our Values",
    },
    values: {
      type: Array,
      default: [
        { icon: "Leaf", title: "Sustainability", description: "Committed to environmental stewardship" },
        { icon: "Sparkles", title: "Innovation", description: "Pushing boundaries in solar technology" },
        { icon: "Users", title: "Customer First", description: "Your satisfaction is our priority" },
        { icon: "ShieldCheck", title: "Quality", description: "Highest standards in every installation" },
      ],
    },
    stats: {
      type: Array,
      default: [
        { value: "10K+", label: "Installations" },
        { value: "15+", label: "Years Experience" },
        { value: "50MW+", label: "Solar Capacity" },
        { value: "98%", label: "Customer Satisfaction" },
      ],
    },
    ctaTitle: {
      type: String,
      default: "Ready to Go Solar?",
    },
    ctaDescription: {
      type: String,
      default: "Join thousands of satisfied customers who have made the switch to clean, renewable energy.",
    },
    ctaButtonText: {
      type: String,
      default: "Get Free Consultation",
    },
    ctaButtonLink: {
      type: String,
      default: "/contact",
    },
    ctaStatus: {
      type: Boolean,
      default: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("AboutDetails", AboutDetailsSchema);
