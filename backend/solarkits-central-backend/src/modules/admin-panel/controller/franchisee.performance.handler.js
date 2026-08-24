/**
 * franchisee.performance.handler.js
 *
 * Admin analytics endpoints for Franchisee Performance Tracker.
 * Permission code: FPO_ANALYTICS
 * Prefix: /admin-api/franchisee/performance
 */

const mongoose = require('mongoose');
const {
  FranchiseeTargetProgress,
  FranchiseeAlert,
  FpoOrder,
  Reseller,
} = require('../models/india_solarshop_db');
const { getPerformanceAnalytics } = require('../services/franchisee.goal.service');
const { evaluateAlerts, evaluatePoAlerts } = require('../services/franchisee.alert.service');

// ── PERFORMANCE TRACKER (Admin) ───────────────────────────────────────────────
const get_performance_tracker = async (req, res) => {
  try {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear(), state_id, district_id, plan_id, performance_status } = req.query;

    const rows = await getPerformanceAnalytics({
      month: Number(month), year: Number(year), state_id, district_id, plan_id, performance_status,
    });

    // Summary cards
    const total       = rows.length;
    const achieved    = rows.filter((r) => ['ACHIEVED', 'EXCEEDED'].includes(r.performance_status)).length;
    const on_track    = rows.filter((r) => r.performance_status === 'ON_TRACK').length;
    const behind      = rows.filter((r) => ['BEHIND', 'LOW_PERFORMANCE'].includes(r.performance_status)).length;
    const no_orders   = rows.filter((r) => r.performance_status === 'NOT_STARTED').length;
    const no_target   = rows.filter((r) => r.performance_status === 'NO_TARGET').length;
    const total_target = rows.reduce((s, r) => s + (r.target_quantity || 0), 0);
    const total_eligible = rows.reduce((s, r) => s + (r.eligible_quantity || 0), 0);
    const avg_achievement = total > 0
      ? Math.round((rows.reduce((s, r) => s + (r.achievement_pct || 0), 0) / total) * 100) / 100
      : 0;

    return res.json({
      status: 'success',
      data: {
        summary: { total, achieved, on_track, behind, no_orders, no_target, total_target, total_eligible, avg_achievement },
        franchisees: rows,
        period: { month: Number(month), year: Number(year) },
      },
    });
  } catch (error) {
    console.error('[performance] get_performance_tracker error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── LOCATION ANALYTICS ────────────────────────────────────────────────────────
const get_location_analytics = async (req, res) => {
  try {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query;

    const rows = await FranchiseeTargetProgress.find({
      target_month: Number(month),
      target_year:  Number(year),
    })
      .populate({
        path: 'franchisee_id',
        select: 'business_name address activation_status reseller_lifecycle_status',
      })
      .lean();

    // Group by state
    const stateMap = {};
    for (const r of rows) {
      const f = r.franchisee_id;
      if (!f?.address?.state_id) continue;
      const sid = String(f.address.state_id);
      if (!stateMap[sid]) stateMap[sid] = { state_id: sid, count: 0, total_target: 0, total_eligible: 0, franchisees: [] };
      stateMap[sid].count++;
      stateMap[sid].total_target   += r.target_quantity || 0;
      stateMap[sid].total_eligible += r.eligible_quantity || 0;
      stateMap[sid].franchisees.push({
        id:              f._id,
        name:            f.business_name,
        eligible_kits:   r.eligible_quantity,
        achievement_pct: r.achievement_pct,
        performance_status: r.performance_status,
      });
    }

    const states = Object.values(stateMap).map((s) => ({
      ...s,
      avg_achievement: s.count > 0
        ? Math.round((s.franchisees.reduce((sum, f) => sum + (f.achievement_pct || 0), 0) / s.count) * 100) / 100
        : 0,
      low_performing: s.franchisees.filter((f) => ['BEHIND', 'LOW_PERFORMANCE', 'NOT_STARTED'].includes(f.performance_status)).length,
      top_performers: s.franchisees.sort((a, b) => b.eligible_kits - a.eligible_kits).slice(0, 3),
    }));

    return res.json({
      status: 'success',
      data:   { states, period: { month: Number(month), year: Number(year) } },
    });
  } catch (error) {
    console.error('[performance] get_location_analytics error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── SINGLE FRANCHISEE PERFORMANCE ────────────────────────────────────────────
const get_franchisee_performance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ status: 'error', message: 'Invalid franchisee ID' });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    // Last 6 months of progress
    const periods = [];
    for (let i = 0; i < 6; i++) {
      const m = ((month - 1 - i + 12) % 12) + 1;
      const y = month - 1 - i < 0 ? year - 1 : year;
      periods.push({ target_month: m, target_year: y });
    }

    const [history, alerts, recentPos] = await Promise.all([
      FranchiseeTargetProgress.find({ franchisee_id: id, $or: periods }).sort({ target_year: -1, target_month: -1 }).lean(),
      FranchiseeAlert.find({ franchisee_id: id, status: 'PENDING' }).sort({ created_at: -1 }).limit(10).lean(),
      FpoOrder.find({ franchisee_id: id, deleted_at: null }).sort({ created_at: -1 }).limit(5).select('po_number status grand_total_paise created_at total_commission_paise').lean(),
    ]);

    const current = history.find((h) => h.target_month === month && h.target_year === year);
    const prev    = history.find((h) => h.target_month === (month === 1 ? 12 : month - 1));

    const mom_change = (current?.eligible_quantity && prev?.eligible_quantity && prev.eligible_quantity > 0)
      ? Math.round(((current.eligible_quantity - prev.eligible_quantity) / prev.eligible_quantity) * 10000) / 100
      : null;

    return res.json({
      status: 'success',
      data: {
        franchisee_id:   id,
        current_month:   current || null,
        previous_month:  prev    || null,
        mom_change_pct:  mom_change,
        history,
        pending_alerts:  alerts,
        recent_pos:      recentPos,
      },
    });
  } catch (error) {
    console.error('[performance] get_franchisee_performance error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── ALERTS ────────────────────────────────────────────────────────────────────
const get_alerts = async (req, res) => {
  try {
    const { status, alert_type, franchisee_id, month, year, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (alert_type) query.alert_type = alert_type;
    if (franchisee_id) query.franchisee_id = franchisee_id;
    if (month) query.period_month = Number(month);
    if (year)  query.period_year  = Number(year);

    const skip = (Number(page) - 1) * Number(limit);
    const [alerts, total] = await Promise.all([
      FranchiseeAlert.find(query)
        .populate('franchisee_id', 'business_name mobile')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      FranchiseeAlert.countDocuments(query),
    ]);

    return res.json({
      status: 'success',
      data: alerts,
      meta: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    console.error('[performance] get_alerts error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── RESOLVE ALERT ─────────────────────────────────────────────────────────────
const resolve_alert = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ status: 'error', message: 'id is required' });

    const alert = await FranchiseeAlert.findByIdAndUpdate(id, {
      $set: { status: 'RESOLVED', resolved_at: new Date(), resolved_by: req.user?.id },
    }, { new: true });

    if (!alert) return res.status(404).json({ status: 'error', message: 'Alert not found' });
    return res.json({ status: 'success', data: alert });
  } catch (error) {
    console.error('[performance] resolve_alert error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── RUN ALERT EVALUATION ──────────────────────────────────────────────────────
const run_alert_evaluation = async (req, res) => {
  try {
    const { franchisee_id, month, year } = req.body;
    if (!franchisee_id || !month || !year) {
      return res.status(400).json({ status: 'error', message: 'franchisee_id, month, year required' });
    }

    const results = await evaluateAlerts({ franchisee_id, month: Number(month), year: Number(year) });
    const poAlerts = await evaluatePoAlerts();

    return res.json({
      status: 'success',
      data: { performance_alerts: results, po_alerts: poAlerts, total_created: results.length + poAlerts.length },
    });
  } catch (error) {
    console.error('[performance] run_alert_evaluation error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── EXPORT CSV ────────────────────────────────────────────────────────────────
const export_performance_csv = async (req, res) => {
  try {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear(), state_id, plan_id } = req.query;

    const rows = await getPerformanceAnalytics({ month: Number(month), year: Number(year), state_id, plan_id });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="franchisee_performance_${year}_${month}.csv"`);

    const headers = ['Business Name', 'Mobile', 'Plan', 'State', 'Target', 'Eligible Kits', 'Balance', 'Achievement %', 'Status'];
    const lines = [headers.join(',')];

    for (const r of rows) {
      const f = r.franchisee_id || {};
      lines.push([
        `"${f.business_name || ''}"`,
        f.mobile || '',
        `"${f.plan_subscription_id?.plan_id?.name || ''}"`,
        f.address?.state_id || '',
        r.target_quantity || 0,
        r.eligible_quantity || 0,
        r.balance_quantity || 0,
        r.achievement_pct || 0,
        r.performance_status || '',
      ].join(','));
    }

    return res.send(lines.join('\n'));
  } catch (error) {
    console.error('[performance] export_performance_csv error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  get_performance_tracker,
  get_location_analytics,
  get_franchisee_performance,
  get_alerts,
  resolve_alert,
  run_alert_evaluation,
  export_performance_csv,
};
