const CallToAction = require("../models/CallToAction");

// Create
const createCallToAction = async (req, res) => {
  try {
    const data = await CallToAction.create(req.body);

    res.status(201).json({
      success: true,
      message: "Call To Action created successfully.",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get
const getCallToAction = async (req, res) => {
  try {
    const data = await CallToAction.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update
const updateCallToAction = async (req, res) => {
  try {
    const data = await CallToAction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Updated successfully.",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Status Update
const updateCallToActionStatus = async (req, res) => {
  try {
    const data = await CallToAction.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete
const deleteCallToAction = async (req, res) => {
  try {
    await CallToAction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCallToAction,
  getCallToAction,
  updateCallToAction,
  updateCallToActionStatus,
  deleteCallToAction,
};
