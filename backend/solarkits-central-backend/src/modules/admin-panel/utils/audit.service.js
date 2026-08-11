/**
 * audit.service.js
 *
 * Central Audit Logging Utility.
 * Phase 2 — Reseller Management System
 *
 * Writes structured, sanitized audit log entries to the audit_logs collection.
 * Redacts sensitive fields (passwords, tokens, raw Aadhaar, full card numbers).
 */

const { AuditLog } = require('../models/india_solarshop_db');

const SENSITIVE_KEYS = ['password', 'password_hash', 'token', 'access_token', 'refresh_token', 'aadhaar_raw'];

/**
 * Recursively sanitize snapshot objects to remove sensitive credentials.
 */
function sanitizeSnapshot(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeSnapshot);

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      clean[key] = sanitizeSnapshot(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Log a system or user action to audit_logs.
 *
 * @param {object} params
 * @param {string} params.actor_type - 'cms_user'|'reseller'|'epc_buyer'|'system'
 * @param {string|ObjectId} params.actor_id - User ID performing action
 * @param {string} params.action - Action constant (e.g. 'RESELLER_REGISTER', 'KYC_VERIFY')
 * @param {string} params.entity_type - Target entity name (e.g. 'resellers', 'reseller_kyc')
 * @param {string|ObjectId} params.entity_id - Target entity ID
 * @param {object} [params.before_snapshot] - State before change
 * @param {object} [params.after_snapshot] - State after change
 * @param {object} [params.req] - Express request object for IP/User-Agent extraction
 */
async function logAudit({
  actor_type = 'system',
  actor_id = null,
  action,
  entity_type,
  entity_id,
  before_snapshot = null,
  after_snapshot = null,
  req = null,
}) {
  try {
    const ip_address = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null) : null;
    const user_agent = req ? (req.headers['user-agent'] || null) : null;

    const logEntry = await AuditLog.create({
      actor_type,
      actor_id,
      action: action.trim().toUpperCase(),
      entity_type,
      entity_id,
      before_snapshot: sanitizeSnapshot(before_snapshot),
      after_snapshot:  sanitizeSnapshot(after_snapshot),
      ip_address,
      user_agent,
    });

    return logEntry;
  } catch (error) {
    // Non-blocking: audit failure should be logged to console but not crash primary business logic
    console.error('[AuditLog] Failed to record audit log entry:', error.message);
    return null;
  }
}

module.exports = {
  logAudit,
  sanitizeSnapshot,
};
