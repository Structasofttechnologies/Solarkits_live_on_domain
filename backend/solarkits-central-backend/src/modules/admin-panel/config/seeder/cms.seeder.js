const { CmsLevel, CmsDepartment, CmsRole, CmsUser, CmsModule, CmsRoleWiseModule } = require('../../models/user_db');
const cmsModulesData = require('../seed_data/cms_modules.json');

const seedCMS = async () => {
  console.log('🔑 Seeding CMS Levels, Departments, Roles, Users, and Modules...');

  // 1. Seed cms_levels
  const defaultLevels = [
    { name: 'global', scope_priority: 1, geo_table_name: null },
    { name: 'country', scope_priority: 2, geo_table_name: null },
    { name: 'state', scope_priority: 3, geo_table_name: null },
    { name: 'cluster', scope_priority: 4, geo_table_name: null },
    { name: 'district', scope_priority: 5, geo_table_name: null },
    { name: 'urban city', scope_priority: 6, geo_table_name: null },
    { name: 'rural city', scope_priority: 7, geo_table_name: null }
  ];

  for (const lvl of defaultLevels) {
    const exists = await CmsLevel.findOne({ name: lvl.name });
    if (!exists) {
      await CmsLevel.create(lvl);
      console.log(`  ✓ Level '${lvl.name}' seeded.`);
    }
  }

  // Fetch levels
  const globalLevel = await CmsLevel.findOne({ name: 'global' });
  if (!globalLevel) throw new Error('Global level could not be found or seeded.');
  const clusterLevel = await CmsLevel.findOne({ name: 'cluster' });

  // 2. Seed cms_departments (is_system: true)
  let superAdminDept = await CmsDepartment.findOne({ name: 'Super Admin' });
  if (!superAdminDept) {
    superAdminDept = await CmsDepartment.create({
      name: 'Super Admin',
      panel_id: null,
      level: 'global',
      country_id: null,
      is_system: true,
      is_protected: true,
      is_active: true,
      country_ids: []
    });
    console.log(`  ✓ Department 'Super Admin' seeded.`);
  }

  // 3. Seed cms_roles (is_system: true)
  let superAdminRole = await CmsRole.findOne({ name: 'Super Admin' });
  if (!superAdminRole) {
    superAdminRole = await CmsRole.create({
      name: 'Super Admin',
      department_id: superAdminDept._id,
      level_id: globalLevel._id,
      parent_role_id: null,
      access_modules_by_parent: false,
      is_system: true,
      is_protected: true,
      is_active: true
    });
    console.log(`  ✓ Role 'Super Admin' seeded.`);
  }

  // 4. Seed cms_users (Super Admin User from environment variable)
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (superAdminEmail) {
    const emailLower = superAdminEmail.toLowerCase().trim();
    const exists = await CmsUser.findOne({ email: emailLower });
    if (!exists) {
      await CmsUser.create({
        name: 'Ravi Harsoda',
        email: emailLower,
        phone_code: process.env.SUPER_ADMIN_PHONE_CODE || '+91',
        phone: process.env.SUPER_ADMIN_PHONE || '0000000000',
        parent_user_id: null,
        role_id: superAdminRole._id,
        passcode: null,
        is_verified: false,
        is_system: true,
        is_protected: true,
        is_active: true
      });
      console.log(`  ✓ Super Admin user seeded for email: ${superAdminEmail}`);
    }
  } else {
    console.log('⚠️ SUPER_ADMIN_EMAIL env variable not set. Skipping user seeding.');
  }

  // 5. Upsert CMS Modules from seed JSON using bulkWrite
  //    Filters by unique_code (the actual unique index) to avoid duplicate key errors.
  //    _id from seed JSON is only applied on insert ($setOnInsert), preserving any existing DB _id.
  console.log('📦 Upserting CMS Modules from seed data...');
  if (cmsModulesData.length > 0) {
    const bulkOps = cmsModulesData.map((item) => ({
      updateOne: {
        filter: { unique_code: item.unique_code },
        update: {
          $set: {
            name: item.name,
            panel_id: item.panel_id || null,
            level_id: item.level_id || null,
            parent_module_id: item.parent_module_id || null,
            dashboard_context: item.dashboard_context || 'default',
            saas_product_id: item.saas_product_id || null,
            is_active: item.is_active !== false,
            is_deleted: item.is_deleted === true,
            created_at: item.created_at ? new Date(item.created_at) : new Date()
          },
          $setOnInsert: {
            _id: item._id
          }
        },
        upsert: true
      }
    }));

    const result = await CmsModule.bulkWrite(bulkOps, { ordered: false });
    const inserted = result.upsertedCount || 0;
    const modified = result.modifiedCount || 0;
    if (inserted > 0) console.log(`  ✓ Inserted ${inserted} new CMS Modules from seed data.`);
    if (modified > 0) console.log(`  ✓ Updated ${modified} existing CMS Modules from seed data.`);
    if (inserted === 0 && modified === 0) console.log(`  ✓ All ${cmsModulesData.length} CMS Modules already up to date.`);
  }


  // 6. Upsert Account Panel modules (cluster level)
  const { CmsPanel } = require('../../models/user_db');
  const accountPanel = await CmsPanel.findOne({ url_prefix: '/account-panel', is_deleted: false });
  if (accountPanel && clusterLevel) {
    const accModules = [
      { name: 'Accounts Dashboard',         unique_code: 'ACC_HOME' },
      { name: 'E-Way Bill Management',       unique_code: 'ACC_EWAY' },
      { name: 'Customer Invoice Management', unique_code: 'ACC_INVOICES' },
      { name: 'Inventory Inward Invoices',   unique_code: 'ACC_INWARD_INV' },
      { name: 'Supplier Registry',           unique_code: 'ACC_SUPPLIERS' },
      { name: 'Purchase Orders',             unique_code: 'ACC_PO' },
      { name: 'Supplier Payments',           unique_code: 'ACC_PAYMENTS' },
      { name: 'Completed Deliveries',        unique_code: 'ACC_DELIVERIES' }
    ];

    const accBulkOps = accModules.map((m) => ({
      updateOne: {
        filter: { unique_code: m.unique_code },
        update: {
          $set: {
            name: m.name,
            unique_code: m.unique_code,
            panel_id: accountPanel._id,
            level_id: clusterLevel._id,
            parent_module_id: null,
            dashboard_context: 'default',
            is_active: true,
            is_deleted: false
          }
        },
        upsert: true
      }
    }));

    const accResult = await CmsModule.bulkWrite(accBulkOps, { ordered: false });
    const accInserted = accResult.upsertedCount || 0;
    const accModified = accResult.modifiedCount || 0;
    if (accInserted > 0) console.log(`  ✓ Inserted ${accInserted} new Account Panel Modules.`);
    if (accModified > 0) console.log(`  ✓ Updated ${accModified} Account Panel Modules.`);
    if (accInserted === 0 && accModified === 0) console.log(`  ✓ All Account Panel Modules already up to date.`);
  } else {
    console.log('  ⚠️ Account Panel or Cluster level not found — skipping Account Panel modules seeding.');
  }

  // 7. Upsert Operation Management Panel modules (cluster level)
  const opsPanel = await CmsPanel.findOne({ url_prefix: '/operation-management-panel', is_deleted: false });
  if (opsPanel && clusterLevel) {
    // Upsert parent groups first
    const groups = [
      { name: 'Order Operations',       unique_code: 'OP_OPS_GROUP' },
      { name: 'Intelligence & Reports', unique_code: 'OP_INTEL_GROUP' }
    ];

    const groupBulkOps = groups.map((g) => ({
      updateOne: {
        filter: { unique_code: g.unique_code },
        update: {
          $set: {
            name: g.name,
            unique_code: g.unique_code,
            panel_id: opsPanel._id,
            level_id: clusterLevel._id,
            parent_module_id: null,
            dashboard_context: 'default',
            is_active: true,
            is_deleted: false
          }
        },
        upsert: true
      }
    }));
    await CmsModule.bulkWrite(groupBulkOps, { ordered: false });

    // Fetch group IDs after upsert
    const groupIds = {};
    for (const g of groups) {
      const mod = await CmsModule.findOne({ unique_code: g.unique_code }).lean();
      if (mod) groupIds[g.unique_code] = mod._id;
    }

    const opsModules = [
      { name: 'Dashboard',             unique_code: 'OP_HOME',           parentCode: null },
      { name: 'Order Fulfillment',      unique_code: 'OP_FULFILLMENT',    parentCode: 'OP_OPS_GROUP' },
      { name: 'Stock Transfer Mgmt',    unique_code: 'OP_STOCK_TRANSFER', parentCode: 'OP_OPS_GROUP' },
      { name: 'Supplier Procurement',   unique_code: 'OP_PROCUREMENT',    parentCode: 'OP_OPS_GROUP' },
      { name: 'Warehouse Stock Report', unique_code: 'OP_WH_STOCK',       parentCode: 'OP_OPS_GROUP' },
      { name: 'Analytics Suite',        unique_code: 'OP_ANALYTICS',      parentCode: 'OP_INTEL_GROUP' },
      { name: 'Demand Prediction AI',   unique_code: 'OP_PREDICTION',     parentCode: 'OP_INTEL_GROUP' }
    ];

    const opsBulkOps = opsModules.map((m) => ({
      updateOne: {
        filter: { unique_code: m.unique_code },
        update: {
          $set: {
            name: m.name,
            unique_code: m.unique_code,
            panel_id: opsPanel._id,
            level_id: clusterLevel._id,
            parent_module_id: m.parentCode ? (groupIds[m.parentCode] || null) : null,
            dashboard_context: 'default',
            is_active: true,
            is_deleted: false
          }
        },
        upsert: true
      }
    }));

    const opsResult = await CmsModule.bulkWrite(opsBulkOps, { ordered: false });
    const opsInserted = opsResult.upsertedCount || 0;
    const opsModified = opsResult.modifiedCount || 0;
    if (opsInserted > 0) console.log(`  ✓ Inserted ${opsInserted} new Operation Panel Modules.`);
    if (opsModified > 0) console.log(`  ✓ Updated ${opsModified} Operation Panel Modules.`);
    if (opsInserted === 0 && opsModified === 0) console.log(`  ✓ All Operation Panel Modules already up to date.`);
  } else {
    console.log('  ⚠️ Operation Panel or Cluster level not found — skipping Operation Panel modules seeding.');
  }

  // 8. Upsert role-wise module permissions for all modules × all roles
  //    Uses $setOnInsert so existing permission overrides (can_edit: false etc.) are NOT overwritten.
  console.log('🔑 Syncing Role-wise Module Permissions...');
  const allModules = await CmsModule.find({}).lean();
  const roles = await CmsRole.find({}).lean();
  let createdMappingCount = 0;

  for (const moduleItem of allModules) {
    if (roles.length === 0) break;
    const permBulkOps = roles.map((role) => ({
      updateOne: {
        filter: { role_id: role._id, module_id: moduleItem._id, deleted_at: null },
        update: {
          $setOnInsert: {
            role_id: role._id,
            module_id: moduleItem._id,
            can_view: true,
            can_add: true,
            can_edit: true,
            can_delete: true,
            created_at: new Date()
          }
        },
        upsert: true
      }
    }));

    const permResult = await CmsRoleWiseModule.bulkWrite(permBulkOps, { ordered: false });
    createdMappingCount += permResult.upsertedCount || 0;
  }

  if (createdMappingCount > 0) {
    console.log(`  ✓ Created ${createdMappingCount} new role-wise module mappings.`);
  } else {
    console.log('  ✓ All role-wise module mappings already up to date.');
  }

  console.log('✅ CMS Seeding completed.');
};

module.exports = { seedCMS };
