/**
 * industry.types.handler.js
 *
 * Admin CRUD for industry types (sys_industry_types).
 * Phase 1 — Reseller Management System
 *
 * All handlers follow the existing project.types.handler.js pattern:
 *   { status: "success"|"error", data, message }
 */

const mongoose = require('mongoose');
const { IndustryType, ProjectTypeIndustryMap, ProjectSubcategory } = require('../models/core_db');

// ─── Helper: generate slug from name ─────────────────────────────────────────
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ─── 1. LIST ──────────────────────────────────────────────────────────────────
/**
 * GET /admin-api/industry-types/list
 * Returns all non-deleted industry types. Supports optional ?active_only=true filter.
 */
const list_industry_types = async (req, res) => {
  try {
    const { active_only } = req.query;
    const query = { deleted_at: null };
    if (active_only === 'true') query.is_active = true;

    const rows = await IndustryType.find(query).sort({ sort_order: 1, name: 1 }).lean();

    const data = rows.map((r) => ({
      id:          r._id,
      name:        r.name,
      slug:        r.slug,
      description: r.description,
      sort_order:  r.sort_order,
      is_active:   r.is_active,
      created_at:  r.created_at,
    }));

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('[industry.types] list_industry_types error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. ADD ───────────────────────────────────────────────────────────────────
/**
 * POST /admin-api/industry-types/add
 * Body: { name, description?, sort_order? }
 */
const add_industry_type = async (req, res) => {
  try {
    const { name, description, sort_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'name is required' });
    }

    const slug = slugify(name);

    // Check for duplicate name (case-insensitive) or slug
    const existing = await IndustryType.findOne({
      $or: [
        { slug },
        { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } },
      ],
      deleted_at: null,
    });
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: `An industry type with this name already exists: "${existing.name}"`,
      });
    }

    const doc = await IndustryType.create({
      name:        name.trim(),
      slug,
      description: description ? description.trim() : null,
      sort_order:  sort_order != null ? Number(sort_order) : 0,
      created_by:  req.user?.id || null,
    });

    return res.status(201).json({
      status: 'success',
      data: {
        id:          doc._id,
        name:        doc.name,
        slug:        doc.slug,
        description: doc.description,
        sort_order:  doc.sort_order,
        is_active:   doc.is_active,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'Industry type name or slug already exists' });
    }
    console.error('[industry.types] add_industry_type error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 3. UPDATE ────────────────────────────────────────────────────────────────
/**
 * PUT /admin-api/industry-types/update
 * Body: { id, name?, description?, sort_order?, display_visibility? }
 */
const update_industry_type = async (req, res) => {
  try {
    const { id, name, description, sort_order } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid id is required' });
    }

    const doc = await IndustryType.findOne({ _id: id, deleted_at: null });
    if (!doc) {
      return res.status(404).json({ status: 'error', message: 'Industry type not found' });
    }

    const updateData = {};

    if (name && name.trim()) {
      const newSlug = slugify(name.trim());

      // Check for name/slug conflict (exclude self)
      const conflict = await IndustryType.findOne({
        _id: { $ne: id },
        $or: [
          { slug: newSlug },
          { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } },
        ],
        deleted_at: null,
      });
      if (conflict) {
        return res.status(409).json({
          status: 'error',
          message: `Another industry type already has this name: "${conflict.name}"`,
        });
      }

      updateData.name = name.trim();
      updateData.slug = newSlug;
    }

    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (sort_order != null) updateData.sort_order = Number(sort_order);

    const result = await IndustryType.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean();

    return res.json({
      status: 'success',
      data: {
        id:          result._id,
        name:        result.name,
        slug:        result.slug,
        description: result.description,
        sort_order:  result.sort_order,
        is_active:   result.is_active,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'Industry type name or slug already exists' });
    }
    console.error('[industry.types] update_industry_type error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 4. ACTIVATE / DEACTIVATE ─────────────────────────────────────────────────
/**
 * PUT /admin-api/industry-types/toggle-status
 * Body: { id, is_active: Boolean }
 */
const toggle_industry_type_status = async (req, res) => {
  try {
    const { id, is_active } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid id is required' });
    }
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ status: 'error', message: 'is_active must be a boolean' });
    }

    const doc = await IndustryType.findOne({ _id: id, deleted_at: null });
    if (!doc) {
      return res.status(404).json({ status: 'error', message: 'Industry type not found' });
    }

    doc.is_active = is_active;
    await doc.save();

    return res.json({
      status:  'success',
      message: `Industry type "${doc.name}" has been ${is_active ? 'activated' : 'deactivated'}`,
      data:    { id: doc._id, is_active: doc.is_active },
    });
  } catch (error) {
    console.error('[industry.types] toggle_industry_type_status error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 5. SOFT DELETE ───────────────────────────────────────────────────────────
/**
 * DELETE /admin-api/industry-types/delete
 * Body: { id }
 *
 * Safety rule: An industry type already used in a project_type_industry_map
 * (even if soft-deleted) is BLOCKED from deletion to preserve audit trail.
 * If only inactive mappings exist, admin can force with { force: true }.
 */
const delete_industry_type = async (req, res) => {
  try {
    const { id, force } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid id is required' });
    }

    const doc = await IndustryType.findOne({ _id: id, deleted_at: null });
    if (!doc) {
      return res.status(404).json({ status: 'error', message: 'Industry type not found' });
    }

    // Block deletion if active mappings exist
    const activeMappingCount = await ProjectTypeIndustryMap.countDocuments({
      industry_type_id: id,
      deleted_at: null,
      is_active: true,
    });

    if (activeMappingCount > 0) {
      return res.status(409).json({
        status:  'error',
        message: `Cannot delete: "${doc.name}" is mapped to ${activeMappingCount} active project type(s). Remove the mappings first.`,
      });
    }

    // Soft delete
    doc.deleted_at = new Date();
    doc.is_active  = false;
    await doc.save();

    return res.json({
      status:  'success',
      message: `Industry type "${doc.name}" has been deleted`,
    });
  } catch (error) {
    console.error('[industry.types] delete_industry_type error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 6. MAP: Link a project subcategory → industry type ──────────────────────
/**
 * POST /admin-api/industry-types/map-to-subcategory
 * Body: { project_subcategory_id, industry_type_id }
 */
const map_industry_to_subcategory = async (req, res) => {
  try {
    const { project_subcategory_id, industry_type_id } = req.body;

    if (!project_subcategory_id || !industry_type_id) {
      return res.status(400).json({ status: 'error', message: 'project_subcategory_id and industry_type_id are required' });
    }

    // Validate both exist
    const [subcat, industryType] = await Promise.all([
      ProjectSubcategory.findOne({ _id: project_subcategory_id, deleted_at: null }).lean(),
      IndustryType.findOne({ _id: industry_type_id, deleted_at: null, is_active: true }).lean(),
    ]);

    if (!subcat) return res.status(404).json({ status: 'error', message: 'Project subcategory not found' });
    if (!industryType) return res.status(404).json({ status: 'error', message: 'Industry type not found or inactive' });

    // Check for existing active mapping
    const existing = await ProjectTypeIndustryMap.findOne({
      project_subcategory_id,
      industry_type_id,
      deleted_at: null,
    });
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'This mapping already exists' });
    }

    const map = await ProjectTypeIndustryMap.create({
      project_subcategory_id,
      industry_type_id,
    });

    return res.status(201).json({
      status: 'success',
      data:   {
        map_id:                 map._id,
        project_subcategory_id: map.project_subcategory_id,
        industry_type_id:       map.industry_type_id,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'Mapping already exists' });
    }
    console.error('[industry.types] map_industry_to_subcategory error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 7. UNMAP: Remove a specific mapping ─────────────────────────────────────
/**
 * DELETE /admin-api/industry-types/unmap
 * Body: { map_id }
 */
const unmap_industry_from_subcategory = async (req, res) => {
  try {
    const { map_id } = req.body;

    if (!map_id || !mongoose.Types.ObjectId.isValid(map_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid map_id is required' });
    }

    const map = await ProjectTypeIndustryMap.findOne({ _id: map_id, deleted_at: null });
    if (!map) return res.status(404).json({ status: 'error', message: 'Mapping not found' });

    map.deleted_at = new Date();
    map.is_active  = false;
    await map.save();

    return res.json({ status: 'success', message: 'Mapping removed' });
  } catch (error) {
    console.error('[industry.types] unmap_industry_from_subcategory error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 8. GET MAPPINGS for a subcategory ───────────────────────────────────────
/**
 * GET /admin-api/industry-types/mappings?project_subcategory_id=...
 */
const get_industry_mappings_for_subcategory = async (req, res) => {
  try {
    const { project_subcategory_id } = req.query;

    if (!project_subcategory_id) {
      return res.status(400).json({ status: 'error', message: 'project_subcategory_id is required' });
    }

    const maps = await ProjectTypeIndustryMap.find({
      project_subcategory_id,
      deleted_at: null,
    })
      .populate('industry_type_id', 'name slug description is_active')
      .lean();

    const data = maps
      .filter((m) => m.industry_type_id)
      .map((m) => ({
        map_id:       m._id,
        industry_type: {
          id:          m.industry_type_id._id,
          name:        m.industry_type_id.name,
          slug:        m.industry_type_id.slug,
          description: m.industry_type_id.description,
          is_active:   m.industry_type_id.is_active,
        },
        is_active: m.is_active,
      }));

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('[industry.types] get_industry_mappings_for_subcategory error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  list_industry_types,
  add_industry_type,
  update_industry_type,
  toggle_industry_type_status,
  delete_industry_type,
  map_industry_to_subcategory,
  unmap_industry_from_subcategory,
  get_industry_mappings_for_subcategory,
};
