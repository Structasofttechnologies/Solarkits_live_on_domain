/**
 * bde.lead.service.js
 *
 * Core business domain logic for:
 * 1. BDE Lead creation, duplicate validation, and territory checks
 * 2. Starting Franchisee Signup and permanent BDE attribution
 * 3. Onboarding milestone synchronization into Lead Pipeline
 * 4. Lead and Franchisee reassignment with permanent audit trail
 * 5. BDE Dashboard metrics and conversion funnel calculation
 */

const mongoose = require('mongoose');
const {
  BDELead,
  BDELeadActivity,
  BDEFollowUp,
  BDEReassignmentHistory,
  TerritoryExceptionRequest,
  BDEProfile,
  BDETerritoryAssignment,
  BDEPlanAssignment,
  BDEGoal,
  BDENotification,
  Reseller,
  FranchiseLead,
  ResellerPlan,
} = require('../models/india_solarshop_db');

/**
 * 1. Validate Duplicate Lead across Leads, Resellers, and Inbound Applications
 */
async function validateLeadDuplicates({ mobile_number, email, gst_number, excludeLeadId = null }) {
  const cleanMobile = mobile_number ? mobile_number.trim() : null;
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const cleanGst = gst_number && gst_number.trim() ? gst_number.trim().toUpperCase() : null;

  // A. Check in BDE Leads
  const leadQuery = {
    deleted_at: null,
    $or: [],
  };
  if (cleanMobile) leadQuery.$or.push({ mobile_number: cleanMobile });
  if (cleanEmail) leadQuery.$or.push({ email: cleanEmail });
  if (cleanGst) leadQuery.$or.push({ gst_number: cleanGst });

  if (leadQuery.$or.length > 0) {
    if (excludeLeadId) {
      leadQuery._id = { $ne: excludeLeadId };
    }
    const existingLead = await BDELead.findOne(leadQuery).lean();
    if (existingLead) {
      let duplicateField = 'Mobile number';
      if (existingLead.email === cleanEmail) duplicateField = 'Email address';
      if (cleanGst && existingLead.gst_number === cleanGst) duplicateField = 'GST number';

      return {
        isDuplicate: true,
        field: duplicateField,
        message: `${duplicateField} is already registered with lead ${existingLead.lead_id} (${existingLead.prospect_name} - ${existingLead.company_name}).`,
        existingEntity: existingLead,
      };
    }
  }

  // B. Check in Franchisee Partners (Resellers)
  const resellerQuery = {
    $or: [],
  };
  if (cleanMobile) resellerQuery.$or.push({ mobile: cleanMobile });
  if (cleanEmail) resellerQuery.$or.push({ email: cleanEmail });
  if (cleanGst) resellerQuery.$or.push({ gst_number: cleanGst });

  if (resellerQuery.$or.length > 0) {
    const existingReseller = await Reseller.findOne(resellerQuery).lean();
    if (existingReseller) {
      return {
        isDuplicate: true,
        field: 'Franchisee Record',
        message: `A registered Franchisee partner (${existingReseller.business_name || existingReseller.contact_person}) already exists with these credentials.`,
        existingEntity: existingReseller,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * 2. Validate Territory & Plan Assignment for BDE
 */
async function validateBdeTerritory(bdeId, { state_name, district_name, plan_id }) {
  const [territoryAssigns, planAssign] = await Promise.all([
    BDETerritoryAssignment.find({ bde_id: bdeId, status: 'active' }).lean(),
    BDEPlanAssignment.findOne({ bde_id: bdeId, status: 'active' }).lean(),
  ]);

  // If no territory restrictions are set for BDE, allow globally
  let territoryValid = true;
  let planValid = true;

  if (territoryAssigns && territoryAssigns.length > 0) {
    territoryValid = territoryAssigns.some((t) => {
      const stateMatch = t.state_name && state_name && t.state_name.toLowerCase().trim() === state_name.toLowerCase().trim();
      if (!stateMatch) return false;

      // If specific districts assigned, check district
      if (t.district_names && t.district_names.length > 0 && district_name) {
        return t.district_names.some(
          (d) => d && d.toLowerCase().trim() === district_name.toLowerCase().trim()
        );
      }
      return true; // Entire state permitted
    });
  }

  if (planAssign && planAssign.plan_ids && planAssign.plan_ids.length > 0 && plan_id) {
    planValid = planAssign.plan_ids.some(
      (p) => p.toString() === plan_id.toString()
    );
  }

  return {
    isAssigned: territoryValid && planValid,
    territoryValid,
    planValid,
  };
}

/**
 * 3. Generate Next Lead ID (LD-YYYY-XXXX)
 */
async function generateNextLeadId() {
  const year = new Date().getFullYear();
  const prefix = `LD-${year}-`;

  const lastLead = await BDELead.findOne({
    lead_id: { $regex: `^${prefix}` },
  })
    .sort({ lead_id: -1 })
    .lean();

  let nextNum = 1;
  if (lastLead && lastLead.lead_id) {
    const parts = lastLead.lead_id.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

/**
 * 4. Create Lead
 */
async function createLead(data, bdeId) {
  // Validate Duplicates
  const dupCheck = await validateLeadDuplicates({
    mobile_number: data.mobile_number,
    email: data.email,
    gst_number: data.gst_number,
  });

  if (dupCheck.isDuplicate) {
    const err = new Error(dupCheck.message);
    err.statusCode = 409;
    throw err;
  }

  const bde = await BDEProfile.findById(bdeId).lean();
  if (!bde) {
    const err = new Error('BDE Profile not found');
    err.statusCode = 404;
    throw err;
  }

  // Validate Territory
  const territoryCheck = await validateBdeTerritory(bdeId, {
    state_name: data.state_name,
    district_name: data.district_name,
    plan_id: data.interested_plan_id,
  });

  const isOutsideTerritory = !territoryCheck.isAssigned;
  const leadId = await generateNextLeadId();

  let exceptionRequest = null;
  if (isOutsideTerritory) {
    exceptionRequest = await TerritoryExceptionRequest.create({
      bde_id: bdeId,
      bde_name: bde.full_name,
      prospect_name: data.prospect_name,
      company_name: data.company_name,
      requested_state: data.state_name,
      requested_district: data.district_name,
      requested_plan_id: data.interested_plan_id || null,
      requested_plan_name: data.interested_plan_name || null,
      reason: data.outside_territory_reason || 'Prospect located outside designated territory assignment.',
      status: 'pending',
    });
  }

  const lead = await BDELead.create({
    lead_id: leadId,
    prospect_name: data.prospect_name,
    company_name: data.company_name,
    mobile_number: data.mobile_number,
    email: data.email,
    gst_number: data.gst_number ? data.gst_number.trim().toUpperCase() : null,
    country_name: data.country_name || 'India',
    state_id: data.state_id || null,
    state_name: data.state_name,
    district_id: data.district_id || null,
    district_name: data.district_name,
    pincode: data.pincode || null,
    address_line: data.address_line || null,
    interested_plan_id: data.interested_plan_id || null,
    interested_plan_name: data.interested_plan_name || 'Standard Franchisee Plan',
    estimated_investment: data.estimated_investment || 0,
    expected_monthly_kits: data.expected_monthly_kits || 5,
    lead_source: data.lead_source || 'direct_visit',
    created_by_bde_id: bdeId,
    original_bde_id: bdeId,
    current_bde_id: bdeId,
    is_outside_territory: isOutsideTerritory,
    territory_exception_id: exceptionRequest ? exceptionRequest._id : null,
    lead_status: 'new_lead',
    next_follow_up_date: data.next_follow_up_date || null,
    bde_remarks: data.bde_remarks || null,
  });

  if (exceptionRequest) {
    exceptionRequest.lead_id = lead._id;
    await exceptionRequest.save();
  }

  // Create Activity Log
  await BDELeadActivity.create({
    lead_id: lead._id,
    bde_id: bdeId,
    bde_name: bde.full_name,
    activity_type: 'note',
    title: 'Lead Created',
    notes: `New lead generated by ${bde.full_name} (${isOutsideTerritory ? 'Outside Territory Exception Filed' : 'Territory Verified'}). Initial Remarks: ${data.bde_remarks || 'None'}`,
    new_stage: 'new_lead',
  });

  // Schedule follow-up if date provided
  if (data.next_follow_up_date) {
    await BDEFollowUp.create({
      lead_id: lead._id,
      bde_id: bdeId,
      follow_up_date: new Date(data.next_follow_up_date),
      purpose: data.follow_up_purpose || 'Initial Prospect Discovery & Proposal Call',
      status: 'scheduled',
    });
  }

  // Create BDE Notification
  await BDENotification.create({
    bde_id: bdeId,
    type: 'goal',
    title: `Lead Registered: ${lead.lead_id}`,
    message: `Franchisee prospect "${lead.company_name}" successfully registered in your pipeline.`,
    data: { lead_id: lead.lead_id },
  });

  return lead;
}

/**
 * 5. Start Franchisee Signup (Connect to Existing Onboarding & Permanent Attribution)
 */
async function startFranchiseeSignup(leadId, bdeId) {
  const lead = await BDELead.findById(leadId);
  if (!lead) {
    const err = new Error('Lead not found');
    err.statusCode = 404;
    throw err;
  }

  const bde = await BDEProfile.findById(bdeId || lead.current_bde_id).lean();

  // If already linked to reseller, return existing
  if (lead.franchisee_id) {
    const existingReseller = await Reseller.findById(lead.franchisee_id).lean();
    if (existingReseller) {
      return {
        lead,
        reseller: existingReseller,
        message: 'Franchisee signup already initiated for this lead.',
      };
    }
  }

  // Generate unique reseller code
  const year = new Date().getFullYear();
  const count = await Reseller.countDocuments();
  const resellerCode = `RES-${year}-${String(count + 1).padStart(4, '0')}`;

  // Find or provision Reseller Type
  const { ResellerType } = require('../models/india_solarshop_db');
  let resellerType = await ResellerType.findOne({ status: 'active' });
  if (!resellerType) {
    resellerType = await ResellerType.findOne();
  }
  if (!resellerType) {
    resellerType = await ResellerType.create({
      name: 'Franchisee Partner',
      slug: 'franchisee-partner',
      commercial_mode: 'dealer',
      status: 'active',
    });
  }

  const bcrypt = require('bcrypt');
  const tempPassword = `Solar@${lead.mobile_number.slice(-4)}`;
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // Provision Reseller record with permanent BDE attribution
  const reseller = await Reseller.create({
    business_name: lead.company_name,
    contact_person: lead.prospect_name,
    mobile: lead.mobile_number,
    email: lead.email,
    password_hash: passwordHash,
    gst_number: lead.gst_number || null,
    reseller_type_id: resellerType._id,
    commercial_mode: resellerType.commercial_mode || 'dealer',
    address: {
      line: lead.address_line || 'Store Address Pending',
      state_name: lead.state_name,
      district_name: lead.district_name,
      pincode: lead.pincode || '',
    },
    reseller_code: resellerCode,
    bde_id: lead.current_bde_id,
    original_bde_id: lead.original_bde_id,
    lead_id: lead._id,
    activation_status: 'pending',
    agreement_status: 'pending',
    fee_payment_status: 'pending_payment',
    is_operational: false,
    lead_source: 'bde_generated',
  });

  // Update Lead Status
  lead.lead_status = 'signup_started';
  lead.franchisee_id = reseller._id;
  lead.signup_started_at = new Date();
  await lead.save();

  // Log Activity
  await BDELeadActivity.create({
    lead_id: lead._id,
    bde_id: lead.current_bde_id,
    bde_name: bde ? bde.full_name : 'BDE',
    activity_type: 'signup_initiated',
    title: 'Franchisee Onboarding Initiated',
    notes: `Transferred prospect to official onboarding pipeline (Partner ID: ${reseller.reseller_code}).`,
    previous_stage: 'interested',
    new_stage: 'signup_started',
  });

  // Notification
  await BDENotification.create({
    bde_id: lead.current_bde_id,
    type: 'goal',
    title: `Signup Initiated: ${reseller.reseller_code}`,
    message: `Franchisee onboarding started for "${lead.company_name}". Tracking verification milestones.`,
    data: { reseller_id: reseller._id, lead_id: lead.lead_id },
  });

  return {
    lead,
    reseller,
    message: 'Franchisee signup initiated successfully with permanent BDE attribution.',
  };
}

/**
 * 6. Sync Lead Pipeline from Onboarding Milestones (GST, Approval, Agreement, Fee Payment)
 */
async function syncLeadPipelineFromOnboarding(resellerId, milestone, metadata = {}) {
  const reseller = await Reseller.findById(resellerId).lean();
  if (!reseller) return null;

  // Find linked BDE lead
  let lead = null;
  if (reseller.lead_id) {
    lead = await BDELead.findById(reseller.lead_id);
  }
  if (!lead && reseller.mobile) {
    lead = await BDELead.findOne({ mobile_number: reseller.mobile, deleted_at: null });
  }

  if (!lead) return null;

  let newStage = lead.lead_status;
  let logTitle = '';
  let logNotes = '';

  switch (milestone) {
    case 'gst_verified':
      if (['new_lead', 'contacted', 'follow_up_scheduled', 'interested', 'signup_started'].includes(lead.lead_status)) {
        newStage = 'admin_review_pending';
        logTitle = 'GST Verified';
        logNotes = `GSTIN ${reseller.gst_number} validated successfully. Sent for Admin approval.`;
      }
      break;

    case 'admin_approved':
      newStage = 'approved';
      logTitle = 'Admin Approved Franchisee';
      logNotes = `Franchisee partner approved by Admin. Ready for Franchise Agreement.`;
      break;

    case 'agreement_signed':
      newStage = 'agreement_signed';
      logTitle = 'Franchise Agreement Signed';
      logNotes = `Legal franchise agreement executed and verified. Pending onboarding fee payment.`;
      break;

    case 'fee_payment_verified':
      newStage = 'fee_paid';
      logTitle = 'Franchise Fee Payment Verified';
      logNotes = `Onboarding fee payment verified by Admin. Store setup initialized.`;
      lead.converted_at = new Date();
      break;

    case 'rejected':
      newStage = 'rejected';
      lead.rejection_reason = metadata.reason || 'Application rejected during review.';
      logTitle = 'Franchisee Application Rejected';
      logNotes = `Application rejected: ${lead.rejection_reason}`;
      break;

    default:
      break;
  }

  if (newStage !== lead.lead_status) {
    const prev = lead.lead_status;
    lead.lead_status = newStage;
    await lead.save();

    await BDELeadActivity.create({
      lead_id: lead._id,
      bde_id: lead.current_bde_id,
      activity_type: 'stage_change',
      title: logTitle,
      notes: logNotes,
      previous_stage: prev,
      new_stage: newStage,
    });

    await BDENotification.create({
      bde_id: lead.current_bde_id,
      type: 'goal',
      title: `Partner Milestone: ${logTitle}`,
      message: `Lead ${lead.lead_id} (${lead.company_name}) reached stage "${newStage.replace(/_/g, ' ').toUpperCase()}".`,
      data: { lead_id: lead.lead_id, stage: newStage },
    });
  }

  return lead;
}

/**
 * 7. Reassign Lead with Permanent Attribution Audit
 */
async function reassignLead(leadId, newBdeId, adminUser, reason) {
  if (!reason || !reason.trim()) {
    const err = new Error('Reassignment reason is mandatory');
    err.statusCode = 400;
    throw err;
  }

  const [lead, prevBde, newBde] = await Promise.all([
    BDELead.findById(leadId),
    BDEProfile.findById(leadId ? (await BDELead.findById(leadId))?.current_bde_id : null).lean(),
    BDEProfile.findById(newBdeId).lean(),
  ]);

  if (!lead) {
    const err = new Error('Lead not found');
    err.statusCode = 404;
    throw err;
  }
  if (!newBde) {
    const err = new Error('Target BDE not found');
    err.statusCode = 404;
    throw err;
  }

  // Create Reassignment Audit History
  await BDEReassignmentHistory.create({
    entity_type: 'lead',
    lead_id: lead._id,
    previous_bde_id: lead.current_bde_id,
    previous_bde_name: prevBde ? prevBde.full_name : 'Unknown BDE',
    new_bde_id: newBde._id,
    new_bde_name: newBde.full_name,
    reassigned_by: adminUser._id || adminUser.id,
    reassigned_by_name: adminUser.name || adminUser.email || 'Admin',
    reassignment_reason: reason.trim(),
  });

  lead.current_bde_id = newBde._id;
  lead.reassignment_reason = reason.trim();
  await lead.save();

  // Also update linked reseller current BDE if present
  if (lead.franchisee_id) {
    await Reseller.findByIdAndUpdate(lead.franchisee_id, {
      bde_id: newBde._id,
    });
  }

  // Log Activity
  await BDELeadActivity.create({
    lead_id: lead._id,
    bde_id: newBde._id,
    bde_name: newBde.full_name,
    activity_type: 'reassigned',
    title: 'Lead Reassigned',
    notes: `Lead reassigned from ${prevBde ? prevBde.full_name : 'Previous'} to ${newBde.full_name} by Admin. Reason: ${reason}`,
  });

  // Notify both BDEs
  if (prevBde) {
    await BDENotification.create({
      bde_id: prevBde._id,
      type: 'goal',
      title: 'Lead Reassigned',
      message: `Lead ${lead.lead_id} (${lead.company_name}) has been reassigned to ${newBde.full_name}.`,
    });
  }

  await BDENotification.create({
    bde_id: newBde._id,
    type: 'goal',
    title: 'New Lead Reassigned to You',
    message: `Lead ${lead.lead_id} (${lead.company_name}) has been assigned to your pipeline.`,
  });

  return lead;
}

/**
 * 8. Reassign Franchisee with Permanent Attribution Audit
 */
async function reassignFranchisee(resellerId, newBdeId, adminUser, reason) {
  if (!reason || !reason.trim()) {
    const err = new Error('Reassignment reason is mandatory');
    err.statusCode = 400;
    throw err;
  }

  const reseller = await Reseller.findById(resellerId);
  if (!reseller) {
    const err = new Error('Franchisee not found');
    err.statusCode = 404;
    throw err;
  }

  const [prevBde, newBde] = await Promise.all([
    reseller.bde_id ? BDEProfile.findById(reseller.bde_id).lean() : null,
    BDEProfile.findById(newBdeId).lean(),
  ]);

  if (!newBde) {
    const err = new Error('Target BDE not found');
    err.statusCode = 404;
    throw err;
  }

  await BDEReassignmentHistory.create({
    entity_type: 'franchisee',
    franchisee_id: reseller._id,
    previous_bde_id: reseller.bde_id || null,
    previous_bde_name: prevBde ? prevBde.full_name : 'Unassigned',
    new_bde_id: newBde._id,
    new_bde_name: newBde.full_name,
    reassigned_by: adminUser._id || adminUser.id,
    reassigned_by_name: adminUser.name || adminUser.email || 'Admin',
    reassignment_reason: reason.trim(),
  });

  // Preserve original_bde_id if not set
  if (!reseller.original_bde_id && reseller.bde_id) {
    reseller.original_bde_id = reseller.bde_id;
  }

  reseller.bde_id = newBde._id;
  await reseller.save();

  // If linked lead exists, sync current BDE
  if (reseller.lead_id) {
    await BDELead.findByIdAndUpdate(reseller.lead_id, {
      current_bde_id: newBde._id,
      reassignment_reason: reason.trim(),
    });
  }

  return reseller;
}

/**
 * 9. Get BDE Dashboard Conversion Metrics
 */
async function getBdeDashboardMetrics(bdeId) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [
    totalLeads,
    newLeads,
    followUpsDueToday,
    overdueFollowUps,
    signupsStarted,
    adminApproved,
    agreementsSigned,
    feesPaid,
    recentFranchisees,
    goals,
    allLeads,
  ] = await Promise.all([
    BDELead.countDocuments({ current_bde_id: bdeId, deleted_at: null }),
    BDELead.countDocuments({ current_bde_id: bdeId, lead_status: 'new_lead', deleted_at: null }),
    BDEFollowUp.countDocuments({
      bde_id: bdeId,
      follow_up_date: { $gte: startOfDay, $lte: endOfDay },
      status: 'scheduled',
    }),
    BDEFollowUp.countDocuments({
      bde_id: bdeId,
      follow_up_date: { $lt: startOfDay },
      status: 'scheduled',
    }),
    BDELead.countDocuments({
      current_bde_id: bdeId,
      lead_status: { $in: ['signup_started', 'gst_verification_pending', 'admin_review_pending', 'approved', 'agreement_pending', 'agreement_signed', 'fee_payment_pending', 'fee_paid'] },
      deleted_at: null,
    }),
    BDELead.countDocuments({
      current_bde_id: bdeId,
      lead_status: { $in: ['approved', 'agreement_pending', 'agreement_signed', 'fee_payment_pending', 'fee_paid'] },
      deleted_at: null,
    }),
    BDELead.countDocuments({
      current_bde_id: bdeId,
      lead_status: { $in: ['agreement_signed', 'fee_payment_pending', 'fee_paid'] },
      deleted_at: null,
    }),
    BDELead.countDocuments({
      current_bde_id: bdeId,
      lead_status: 'fee_paid',
      deleted_at: null,
    }),
    Reseller.find({ bde_id: bdeId })
      .sort({ created_at: -1 })
      .limit(5)
      .lean(),
    BDEGoal.find({ bde_id: bdeId, status: 'active' }).lean(),
    BDELead.find({ current_bde_id: bdeId, deleted_at: null }).lean(),
  ]);

  // Conversion Funnel Stage Counts
  const funnel = {
    total_leads: totalLeads,
    contacted: allLeads.filter((l) => ['contacted', 'follow_up_scheduled', 'interested', 'signup_started', 'approved', 'fee_paid'].includes(l.lead_status)).length,
    interested: allLeads.filter((l) => ['interested', 'signup_started', 'approved', 'fee_paid'].includes(l.lead_status)).length,
    signup_started: signupsStarted,
    approved: adminApproved,
    agreement_signed: agreementsSigned,
    fee_paid: feesPaid,
  };

  // Target Achievement
  const monthlyGoal = goals.find((g) => g.goal_type === 'monthly') || { target_franchisees: 5, achieved_franchisees: feesPaid };
  const quarterlyGoal = goals.find((g) => g.goal_type === 'quarterly') || { target_franchisees: 15, achieved_franchisees: feesPaid };

  const targetSignups = monthlyGoal.target_franchisees || 5;
  const achievementPct = targetSignups > 0 ? Math.min(100, Math.round((feesPaid / targetSignups) * 100)) : 0;

  return {
    total_leads: totalLeads,
    new_leads: newLeads,
    follow_ups_due_today: followUpsDueToday,
    overdue_follow_ups: overdueFollowUps,
    franchisee_signups: signupsStarted,
    admin_approved_franchisees: adminApproved,
    agreements_signed: agreementsSigned,
    fees_paid: feesPaid,
    monthly_target: targetSignups,
    quarterly_target: quarterlyGoal.target_franchisees || 15,
    signup_achievement_percentage: achievementPct,
    recent_franchisees: recentFranchisees,
    conversion_funnel: funnel,
    pending_actions: {
      follow_ups_due: followUpsDueToday,
      overdue_follow_ups: overdueFollowUps,
      gst_pending: allLeads.filter((l) => l.lead_status === 'gst_verification_pending').length,
      agreement_pending: allLeads.filter((l) => l.lead_status === 'agreement_pending').length,
      fee_payment_pending: allLeads.filter((l) => l.lead_status === 'fee_payment_pending').length,
    },
  };
}

module.exports = {
  validateLeadDuplicates,
  validateBdeTerritory,
  generateNextLeadId,
  createLead,
  startFranchiseeSignup,
  syncLeadPipelineFromOnboarding,
  reassignLead,
  reassignFranchisee,
  getBdeDashboardMetrics,
};
