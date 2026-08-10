require('dotenv').config();
const mongoose = require('mongoose');

// We need to run before importing models to ensure db connection uses right env
const { user_db } = require('../config/databases');
const {
  CmsPanel,
  CmsDepartment,
  CmsLevel,
  CmsModule,
  CmsRole,
  CmsUser,
  SaaSProduct,
  DepartmentPanel,
  RolePanel,
  PanelSaaSProduct,
  CountrySaaSProduct,
} = require('../models/user_db');

async function runMigration() {
  try {
    console.log('🔄 Waiting for database connection to open...');
    if (user_db.readyState !== 1) {
      await new Promise((resolve) => user_db.once('open', resolve));
    }
    console.log('✅ Database connected! Starting Migration...');

    // 1. Migrate cms_dashboard_types -> saas_products
    console.log('📦 Migrating cms_dashboard_types...');
    const db = user_db.db;
    const dashboardTypes = await db.collection('cms_dashboard_types').find({}).toArray();

    // Map to keep track of old _id to new saas_product _id
    const productMap = {};

    for (const dt of dashboardTypes) {
      if (dt.name.toLowerCase() === 'main') {
        console.log('ℹ️ Skipping "main" dashboard type as it becomes "default" context.');
        continue;
      }

      const slug = dt.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      let prod = await SaaSProduct.findOne({ slug });
      if (!prod) {
        prod = await SaaSProduct.create({
          name: dt.name,
          slug: slug,
          description: dt.description || `${dt.name} SaaS Product`,
          is_active: dt.is_active !== undefined ? dt.is_active : true,
          is_system: false,
          is_protected: false,
        });
        console.log(`✅ Created SaaS Product: ${prod.name} (${prod.slug})`);
      }
      productMap[dt._id.toString()] = prod._id;
    }

    // 2. Ensure all Panels have unique slugs
    console.log('🖥️ Checking Panels for slugs...');
    const panels = await CmsPanel.find({});
    for (const panel of panels) {
      if (!panel.slug) {
        const slug = panel.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
        panel.slug = slug;
        await panel.save();
        console.log(`✅ Set slug for Panel ${panel.name} -> ${slug}`);
      }
    }

    // 3. Migrate Departments: panel_id to department_panels & set level/country
    console.log('🏢 Migrating Departments and creating department_panels...');
    const departments = await CmsDepartment.find({});
    for (const dept of departments) {
      // Set default level if not set
      if (!dept.level) {
        dept.level = dept.country_id ? 'country' : 'global';
        await dept.save();
      }

      // If department had a panel_id, migrate it
      if (dept.panel_id) {
        const exists = await DepartmentPanel.findOne({ department_id: dept._id, panel_id: dept.panel_id });
        if (!exists) {
          await DepartmentPanel.create({
            department_id: dept._id,
            panel_id: dept.panel_id,
          });
          console.log(`✅ Linked Department ${dept.name} with Panel ID ${dept.panel_id}`);
        }
      }
    }

    // 4. Seed system protected departments
    console.log('🛡️ Seeding Protected Departments...');
    const protectedDepts = [
      { name: 'Super Admin', level: 'global', is_system: true, is_protected: true },
      { name: 'Developer', level: 'global', is_system: true, is_protected: true },
      { name: 'Admin', level: 'global', is_system: true, is_protected: true },
    ];

    const seededDepts = {};
    for (const pd of protectedDepts) {
      let dept = await CmsDepartment.findOne({ name: pd.name });
      if (!dept) {
        dept = await CmsDepartment.create(pd);
        console.log(`✅ Seeded Protected Department: ${pd.name}`);
      } else {
        dept.is_system = true;
        dept.is_protected = true;
        await dept.save();
      }
      seededDepts[pd.name] = dept;
    }

    // Ensure protected departments are linked to their respective panels
    const allPanels = await CmsPanel.find({});
    const adminPanel = allPanels.find(p => p.url_prefix === '/admin-panel');
    const devPanel = allPanels.find(p => p.url_prefix === '/developer-panel');

    if (adminPanel) {
      const superAdminDept = seededDepts['Super Admin'];
      const exists1 = await DepartmentPanel.findOne({ department_id: superAdminDept._id, panel_id: adminPanel._id });
      if (!exists1) {
        await DepartmentPanel.create({ department_id: superAdminDept._id, panel_id: adminPanel._id });
      }

      const adminDept = seededDepts['Admin'];
      const exists2 = await DepartmentPanel.findOne({ department_id: adminDept._id, panel_id: adminPanel._id });
      if (!exists2) {
        await DepartmentPanel.create({ department_id: adminDept._id, panel_id: adminPanel._id });
      }
    }

    if (devPanel) {
      const devDept = seededDepts['Developer'];
      const exists3 = await DepartmentPanel.findOne({ department_id: devDept._id, panel_id: devPanel._id });
      if (!exists3) {
        await DepartmentPanel.create({ department_id: devDept._id, panel_id: devPanel._id });
      }
    }

    // 5. Ensure levels 'global' and 'country' exist in cms_levels
    console.log('📊 Seeding levels...');
    let globalLevel = await CmsLevel.findOne({ name: 'global' });
    if (!globalLevel) {
      globalLevel = await CmsLevel.create({ name: 'global', scope_priority: 1 });
      console.log('✅ Seeded level: global');
    }
    let countryLevel = await CmsLevel.findOne({ name: 'country' });
    if (!countryLevel) {
      countryLevel = await CmsLevel.create({ name: 'country', scope_priority: 2 });
      console.log('✅ Seeded level: country');
    }

    // 6. Seed system protected roles
    console.log('🛡️ Seeding Protected Roles...');
    const protectedRoles = [
      { name: 'Super Admin', departmentName: 'Super Admin', levelId: globalLevel._id },
      { name: 'Developer', departmentName: 'Developer', levelId: globalLevel._id },
    ];

    const seededRoles = {};
    for (const pr of protectedRoles) {
      let role = await CmsRole.findOne({ name: pr.name });
      const dept = seededDepts[pr.departmentName];
      if (!role) {
        role = await CmsRole.create({
          name: pr.name,
          department_id: dept._id,
          level_id: pr.levelId,
          is_system: true,
          is_protected: true,
          parent_role_id: null,
        });
        console.log(`✅ Seeded Protected Role: ${pr.name}`);
      } else {
        role.is_system = true;
        role.is_protected = true;
        role.department_id = dept._id;
        role.level_id = pr.levelId;
        await role.save();
      }
      seededRoles[pr.name] = role;
    }

    // Ensure role_panels are set up for protected roles
    if (adminPanel) {
      const superAdminRole = seededRoles['Super Admin'];
      const exists = await RolePanel.findOne({ role_id: superAdminRole._id, panel_id: adminPanel._id });
      if (!exists) {
        await RolePanel.create({ role_id: superAdminRole._id, panel_id: adminPanel._id });
      }
    }
    if (devPanel) {
      const devRole = seededRoles['Developer'];
      const exists = await RolePanel.findOne({ role_id: devRole._id, panel_id: devPanel._id });
      if (!exists) {
        await RolePanel.create({ role_id: devRole._id, panel_id: devPanel._id });
      }
    }

    // 7. Seed system protected users
    console.log('🛡️ Seeding Protected Users...');
    const protectedUsers = [
      {
        name: 'Super Admin User',
        email: 'superadmin@solarkits.com',
        phone_code: '+91',
        phone: '9999999999',
        roleName: 'Super Admin',
      },
      {
        name: 'Developer User',
        email: 'developer@solarkits.com',
        phone_code: '+91',
        phone: '8888888888',
        roleName: 'Developer',
      },
    ];

    for (const pu of protectedUsers) {
      let user = await CmsUser.findOne({ email: pu.email });
      const role = seededRoles[pu.roleName];
      if (!user) {
        user = await CmsUser.create({
          name: pu.name,
          email: pu.email,
          phone_code: pu.phone_code,
          phone: pu.phone,
          role_id: role._id,
          is_system: true,
          is_protected: true,
          is_active: true,
          is_verified: true,
          passcode: null, // must set via verification / onboarding
        });
        console.log(`✅ Seeded Protected User: ${pu.name}`);
      } else {
        user.is_system = true;
        user.is_protected = true;
        user.role_id = role._id;
        await user.save();
      }
    }

    // 8. Migrate Roles: inherit panel access
    console.log('🔑 Migrating Roles panel inheritance...');
    const roles = await CmsRole.find({});
    for (const role of roles) {
      if (!role.department_id) continue;
      const deptPanels = await DepartmentPanel.find({ department_id: role.department_id });
      for (const dp of deptPanels) {
        const exists = await RolePanel.findOne({ role_id: role._id, panel_id: dp.panel_id });
        if (!exists) {
          await RolePanel.create({
            role_id: role._id,
            panel_id: dp.panel_id,
          });
          console.log(`✅ Role ${role.name} inherited Panel ID ${dp.panel_id}`);
        }
      }
    }

    // 9. Migrate Modules: dashboard_type_id -> dashboard_context & saas_product_id
    console.log('🧩 Migrating Modules context...');
    const modules = await CmsModule.find({});
    for (const mod of modules) {
      let updated = false;

      // Migrate dashboard_type_id to saas_product_id
      if (mod.dashboard_type_id) {
        const dtIdStr = mod.dashboard_type_id.toString();
        const oldDt = dashboardTypes.find(dt => dt._id.toString() === dtIdStr);

        if (oldDt && oldDt.name.toLowerCase() === 'main') {
          mod.dashboard_context = 'default';
          mod.saas_product_id = null;
          updated = true;
        } else if (productMap[dtIdStr]) {
          mod.dashboard_context = 'product';
          mod.saas_product_id = productMap[dtIdStr];
          updated = true;
        }
      } else {
        // If no dashboard_type_id, default it to 'default'
        mod.dashboard_context = 'default';
        mod.saas_product_id = null;
        updated = true;
      }

      if (updated) {
        await mod.save();
        console.log(`✅ Updated Module ${mod.name} -> context: ${mod.dashboard_context}`);
      }
    }

    // 10. Seed panel_saas_products with default mappings
    console.log('🔌 Mapping Panels to SaaS Products...');
    const allProducts = await SaaSProduct.find({});
    for (const p of allPanels) {
      for (const prod of allProducts) {
        // By default, let's map ERP and Eshop to Admin panel, and ERP to Warehouse panel
        let map = false;
        if (p.url_prefix === '/admin-panel' && (prod.slug === 'erp' || prod.slug === 'eshop')) {
          map = true;
        } else if (p.url_prefix === '/warehouse-management-panel' && prod.slug === 'erp') {
          map = true;
        }

        if (map) {
          const exists = await PanelSaaSProduct.findOne({ panel_id: p._id, saas_product_id: prod._id });
          if (!exists) {
            await PanelSaaSProduct.create({ panel_id: p._id, saas_product_id: prod._id });
            console.log(`✅ Mapped Panel ${p.name} -> SaaS Product ${prod.name}`);
          }
        }
      }
    }

    console.log('🎉 Migration Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration Failed with Error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
