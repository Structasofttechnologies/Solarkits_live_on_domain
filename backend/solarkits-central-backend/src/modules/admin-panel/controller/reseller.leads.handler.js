/**
 * reseller.leads.handler.js
 *
 * Handler for Franchisee & Territory Application Leads.
 * Handles public inbound submissions, admin CRM pipeline, status updates, and reporting.
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const mongoose = require('mongoose');
const { FranchiseLead } = require('../models/india_solarshop_db');
const { logAudit } = require('../utils/audit.service');

// ─── 1. PUBLIC SUBMIT LEAD ──────────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/leads/submit
 * Body: { fullName, businessName, mobileNumber, whatsappNumber?, email, gstin?, state, district, pincode?, businessProfile?, expectedOrderQty?, selectedSolution?, notes?, consent? }
 */
const submit_lead = async (req, res) => {
  try {
    const {
      fullName,
      full_name,
      businessName,
      business_name,
      mobileNumber,
      mobile_number,
      whatsappNumber,
      whatsapp_number,
      email,
      gstin,
      state,
      district,
      pincode,
      businessProfile,
      business_profile,
      expectedOrderQty,
      expected_order_volume,
      selectedSolution,
      selected_solution,
      plan_id,
      notes,
      consent,
      consent_agreed,
      source,
    } = req.body;

    const name = (fullName || full_name || '').trim();
    const mobile = (mobileNumber || mobile_number || '').trim();

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Full name is required' });
    }
    if (!mobile) {
      return res.status(400).json({ status: 'error', message: 'Mobile number is required' });
    }

    const company = (businessName || business_name || `${name} Solar Enterprise`).trim();
    const mail = (email || '').trim().toLowerCase() || `${mobile}@inbound.solarkits.in`;
    const targetState = (state || 'Maharashtra').trim();
    const targetDistrict = (district || 'General').trim();

    const newLead = await FranchiseLead.create({
      full_name: name,
      business_name: company,
      mobile_number: mobile,
      whatsapp_number: (whatsappNumber || whatsapp_number || mobile).trim(),
      email: mail,
      gstin: (gstin || '').trim().toUpperCase() || null,
      state: targetState,
      district: targetDistrict,
      pincode: (pincode || '').trim() || null,
      business_profile: businessProfile || business_profile || 'Solar EPC Contractor',
      expected_order_volume: expectedOrderQty || expected_order_volume || '1 - 3 Kits / Month (Starter)',
      selected_solution: selectedSolution || selected_solution || 'Header Fast Application',
      plan_id: plan_id && mongoose.Types.ObjectId.isValid(plan_id) ? plan_id : null,
      notes: (notes || '').trim() || null,
      consent_agreed: consent !== undefined ? Boolean(consent) : (consent_agreed !== undefined ? Boolean(consent_agreed) : true),
      status: 'NEW',
      source: source || 'storefront_modal',
      ip_address: req.ip || req.headers['x-forwarded-for'] || null,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Your franchise application has been received successfully! Our regional partner team will contact you shortly.',
      data: {
        lead_id: newLead._id,
        reference_id: `FRN-${newLead._id.toString().slice(-6).toUpperCase()}`,
        status: newLead.status,
        created_at: newLead.created_at,
      },
    });
  } catch (error) {
    console.error('[reseller.leads] submit_lead error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Failed to submit application' });
  }
};

// ─── 2. ADMIN LIST LEADS ────────────────────────────────────────────────────
/**
 * GET /admin-api/resellers/leads/list
 * Query: status, state, search, business_profile, page, limit
 */
const list_leads = async (req, res) => {
  try {
    const { status, state, search, business_profile, page = 1, limit = 50 } = req.query;

    const query = { deleted_at: null };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (state && state !== 'ALL') {
      query.state = { $regex: new RegExp(`^${state.trim()}$`, 'i') };
    }

    if (business_profile && business_profile !== 'ALL') {
      query.business_profile = business_profile;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { full_name: searchRegex },
        { business_name: searchRegex },
        { mobile_number: searchRegex },
        { whatsapp_number: searchRegex },
        { email: searchRegex },
        { gstin: searchRegex },
        { district: searchRegex },
        { state: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [rows, totalCount, statsAgg] = await Promise.all([
      FranchiseLead.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      FranchiseLead.countDocuments(query),
      FranchiseLead.aggregate([
        { $match: { deleted_at: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      total: 0,
      new: 0,
      contacted: 0,
      in_review: 0,
      converted: 0,
      rejected: 0,
    };

    statsAgg.forEach((s) => {
      const count = s.count || 0;
      stats.total += count;
      if (s._id === 'NEW') stats.new = count;
      else if (s._id === 'CONTACTED') stats.contacted = count;
      else if (s._id === 'IN_REVIEW') stats.in_review = count;
      else if (s._id === 'APPROVED_CONVERTED') stats.converted = count;
      else if (s._id === 'REJECTED') stats.rejected = count;
    });

    const data = rows.map((r) => ({
      id: r._id,
      fullName: r.full_name,
      businessName: r.business_name,
      mobileNumber: r.mobile_number,
      whatsappNumber: r.whatsapp_number,
      email: r.email,
      gstin: r.gstin,
      state: r.state,
      district: r.district,
      pincode: r.pincode,
      businessProfile: r.business_profile,
      expectedOrderQty: r.expected_order_volume,
      selectedSolution: r.selected_solution,
      plan_id: r.plan_id,
      notes: r.notes,
      consent: r.consent_agreed,
      status: r.status,
      adminRemarks: r.admin_remarks,
      reviewed_by: r.reviewed_by,
      reviewed_at: r.reviewed_at,
      converted_reseller_id: r.converted_reseller_id,
      submittedAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return res.json({
      status: 'success',
      data: {
        leads: data,
        stats,
        pagination: {
          total_records: totalCount,
          current_page: Number(page),
          limit: Number(limit),
          total_pages: Math.ceil(totalCount / Number(limit)) || 1,
        },
      },
    });
  } catch (error) {
    console.error('[reseller.leads] list_leads error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 3. UPDATE LEAD STATUS & REMARKS ────────────────────────────────────────
/**
 * PUT /admin-api/resellers/leads/:id/status
 * Body: { status?, admin_remarks?, adminRemarks? }
 */
const update_lead_status = async (req, res) => {
  try {
    const id = req.params.id || req.body?.id || req.query?.id;
    const { status, admin_remarks, adminRemarks } = req.body;

    if (!id) {
      return res.status(400).json({ status: 'error', message: 'Valid lead ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({
        status: 'success',
        message: 'Lead updated locally',
        data: { id, status, admin_remarks: admin_remarks || adminRemarks, reviewed_at: new Date() },
      });
    }

    const lead = await FranchiseLead.findOne({ _id: id, deleted_at: null });
    if (!lead) {
      return res.status(404).json({ status: 'error', message: 'Franchise lead not found' });
    }

    if (status) {
      if (!['NEW', 'CONTACTED', 'IN_REVIEW', 'APPROVED_CONVERTED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Invalid status value' });
      }
      lead.status = status;
    }

    const remarks = admin_remarks !== undefined ? admin_remarks : adminRemarks;
    if (remarks !== undefined) {
      lead.admin_remarks = remarks ? remarks.trim() : null;
    }

    lead.reviewed_by = req.user?.id || null;
    lead.reviewed_at = new Date();

    await lead.save();

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'RESELLER_LEAD_STATUS_UPDATE',
      entity_type: 'franchise_leads',
      entity_id: lead._id,
      after_snapshot: lead.toObject(),
      req,
    });

    return res.json({
      status: 'success',
      message: 'Lead status and remarks updated successfully',
      data: {
        id: lead._id,
        status: lead.status,
        admin_remarks: lead.admin_remarks,
        reviewed_at: lead.reviewed_at,
      },
    });
  } catch (error) {
    console.error('[reseller.leads] update_lead_status error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 4. ADMIN ADD MANUAL LEAD ───────────────────────────────────────────────
/**
 * POST /admin-api/resellers/leads/add
 */
const add_manual_lead = async (req, res) => {
  return submit_lead(req, res);
};

// ─── 5. DELETE LEAD ─────────────────────────────────────────────────────────
/**
 * DELETE /admin-api/resellers/leads/:id
 */
const delete_lead = async (req, res) => {
  try {
    const id = req.params.id || req.body?.id || req.query?.id;
    if (!id) {
      return res.status(400).json({ status: 'error', message: 'Lead ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ status: 'success', message: 'Lead deleted from local cache' });
    }

    const lead = await FranchiseLead.findByIdAndUpdate(
      id,
      { $set: { deleted_at: new Date() } },
      { new: true }
    );

    return res.json({ status: 'success', message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('[reseller.leads] delete_lead error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  submit_lead,
  list_leads,
  update_lead_status,
  add_manual_lead,
  delete_lead,
};
