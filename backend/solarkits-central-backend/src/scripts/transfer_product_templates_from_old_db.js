/**
 * =========================================================================
 * TRANSFER PRODUCT TEMPLATES & ATTRIBUTES HIERARCHY (OLD DB -> NEW DB)
 * =========================================================================
 * Old Database : solarkits-e-shop.2tdrpuq.mongodb.net/solarkits_central_db
 * New Database : (from backend/.env MONGODB_URI)
 * Collections  :
 *   1. pc_product_templates (Templates)
 *   2. pc_product_subtypes (Subtypes)
 *   3. pc_attribute_groups (Attribute Groups)
 *   4. pc_subtype_attributes (Subtype Attributes)
 *   5. pc_attribute_options (Attribute Options)
 * =========================================================================
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { MongoClient, ObjectId } = require('mongodb');

const OLD_URI = 'mongodb+srv://ravistructasoftadmin_db_user:oWoo6Hal5T050ALF@solarkits-e-shop.2tdrpuq.mongodb.net/solarkits_central_db?retryWrites=true&w=majority';
const NEW_URI = process.env.MONGODB_URI;

if (!NEW_URI) {
  console.error('❌ MONGODB_URI is missing in backend .env');
  process.exit(1);
}

function toObjectId(id) {
  if (!id) return null;
  return id instanceof ObjectId ? id : new ObjectId(id);
}

function toDate(d) {
  if (!d) return null;
  return new Date(d);
}

async function transferProductTemplates() {
  console.log('====================================================');
  console.log('🚀 STARTING PRODUCT TEMPLATES DATA TRANSFER (OLD -> NEW)');
  console.log('====================================================');

  const oldClient = new MongoClient(OLD_URI);
  const newClient = new MongoClient(NEW_URI);

  try {
    console.log('Connecting to Old Database...');
    await oldClient.connect();
    const oldDb = oldClient.db('solarkits_central_db');
    console.log('✅ Connected to Old Database (solarkits_central_db)');

    console.log('Connecting to New Database...');
    await newClient.connect();
    const newDb = newClient.db();
    console.log(`✅ Connected to New Database (${newDb.databaseName})`);

    // 1. Fetch data from Old DB
    console.log('\n📥 Fetching records from Old Database...');
    const [templates, subtypes, attrGroups, attrs, attrOptions] = await Promise.all([
      oldDb.collection('pc_product_templates').find({}).toArray(),
      oldDb.collection('pc_product_subtypes').find({}).toArray(),
      oldDb.collection('pc_attribute_groups').find({}).toArray(),
      oldDb.collection('pc_subtype_attributes').find({}).toArray(),
      oldDb.collection('pc_attribute_options').find({}).toArray()
    ]);

    console.log(`  - pc_product_templates : ${templates.length}`);
    console.log(`  - pc_product_subtypes  : ${subtypes.length}`);
    console.log(`  - pc_attribute_groups  : ${attrGroups.length}`);
    console.log(`  - pc_subtype_attributes: ${attrs.length}`);
    console.log(`  - pc_attribute_options : ${attrOptions.length}`);

    // 2. Transfer pc_product_templates
    if (templates.length > 0) {
      console.log(`\nWriting ${templates.length} Product Templates...`);
      const templateOps = templates.map(t => ({
        updateOne: {
          filter: { _id: toObjectId(t._id) },
          update: {
            $set: {
              _id: toObjectId(t._id),
              name: t.name.trim(),
              description: t.description || null,
              is_system: typeof t.is_system === 'boolean' ? t.is_system : false,
              qty_unit_id: toObjectId(t.qty_unit_id),
              deleted_at: toDate(t.deleted_at),
              created_at: toDate(t.created_at) || new Date(),
              __v: t.__v || 0
            }
          },
          upsert: true
        }
      }));
      const resT = await newDb.collection('pc_product_templates').bulkWrite(templateOps);
      console.log('  ✅ Templates transferred:', { upserted: resT.upsertedCount, modified: resT.modifiedCount, matched: resT.matchedCount });
    }

    // 3. Transfer pc_product_subtypes
    if (subtypes.length > 0) {
      console.log(`\nWriting ${subtypes.length} Product Subtypes...`);
      const subtypeOps = subtypes.map(s => ({
        updateOne: {
          filter: { _id: toObjectId(s._id) },
          update: {
            $set: {
              _id: toObjectId(s._id),
              name: s.name.trim(),
              template_id: toObjectId(s.template_id),
              is_system: typeof s.is_system === 'boolean' ? s.is_system : false,
              deleted_at: toDate(s.deleted_at),
              created_at: toDate(s.created_at) || new Date(),
              __v: s.__v || 0
            }
          },
          upsert: true
        }
      }));
      const resS = await newDb.collection('pc_product_subtypes').bulkWrite(subtypeOps);
      console.log('  ✅ Subtypes transferred:', { upserted: resS.upsertedCount, modified: resS.modifiedCount, matched: resS.matchedCount });
    }

    // 4. Transfer pc_attribute_groups
    if (attrGroups.length > 0) {
      console.log(`\nWriting ${attrGroups.length} Attribute Groups...`);
      const groupOps = attrGroups.map(g => ({
        updateOne: {
          filter: { _id: toObjectId(g._id) },
          update: {
            $set: {
              _id: toObjectId(g._id),
              name: g.name.trim(),
              subtype_id: toObjectId(g.subtype_id),
              display_order: typeof g.display_order === 'number' ? g.display_order : 0,
              deleted_at: toDate(g.deleted_at),
              created_at: toDate(g.created_at) || new Date(),
              __v: g.__v || 0
            }
          },
          upsert: true
        }
      }));
      const resG = await newDb.collection('pc_attribute_groups').bulkWrite(groupOps);
      console.log('  ✅ Attribute Groups transferred:', { upserted: resG.upsertedCount, modified: resG.modifiedCount, matched: resG.matchedCount });
    }

    // 5. Transfer pc_subtype_attributes
    if (attrs.length > 0) {
      console.log(`\nWriting ${attrs.length} Subtype Attributes...`);
      const attrOps = attrs.map(a => ({
        updateOne: {
          filter: { _id: toObjectId(a._id) },
          update: {
            $set: {
              _id: toObjectId(a._id),
              name: a.name.trim(),
              subtype_id: toObjectId(a.subtype_id),
              group_id: toObjectId(a.group_id),
              unit_group_id: toObjectId(a.unit_group_id),
              data_type: a.data_type || 'text',
              is_required: Boolean(a.is_required),
              is_variant: Boolean(a.is_variant),
              is_sku_part: Boolean(a.is_sku_part),
              is_filterable: Boolean(a.is_filterable),
              attribute_type: a.attribute_type || 'custom',
              is_system: typeof a.is_system === 'boolean' ? a.is_system : false,
              display_order: typeof a.display_order === 'number' ? a.display_order : 0,
              deleted_at: toDate(a.deleted_at),
              created_at: toDate(a.created_at) || new Date(),
              __v: a.__v || 0
            }
          },
          upsert: true
        }
      }));
      const resA = await newDb.collection('pc_subtype_attributes').bulkWrite(attrOps);
      console.log('  ✅ Subtype Attributes transferred:', { upserted: resA.upsertedCount, modified: resA.modifiedCount, matched: resA.matchedCount });
    }

    // 6. Transfer pc_attribute_options
    if (attrOptions.length > 0) {
      console.log(`\nWriting ${attrOptions.length} Attribute Options...`);
      const optionOps = attrOptions.map(o => ({
        updateOne: {
          filter: { _id: toObjectId(o._id) },
          update: {
            $set: {
              _id: toObjectId(o._id),
              attribute_id: toObjectId(o.attribute_id),
              value: o.value.trim(),
              display_order: typeof o.display_order === 'number' ? o.display_order : 0,
              is_active: typeof o.is_active === 'boolean' ? o.is_active : true,
              deleted_at: toDate(o.deleted_at),
              created_at: toDate(o.created_at) || new Date(),
              __v: o.__v || 0
            }
          },
          upsert: true
        }
      }));
      const resO = await newDb.collection('pc_attribute_options').bulkWrite(optionOps);
      console.log('  ✅ Attribute Options transferred:', { upserted: resO.upsertedCount, modified: resO.modifiedCount, matched: resO.matchedCount });
    }

    // 7. Verification Counts in New DB
    const [nT, nS, nG, nA, nO] = await Promise.all([
      newDb.collection('pc_product_templates').countDocuments(),
      newDb.collection('pc_product_subtypes').countDocuments(),
      newDb.collection('pc_attribute_groups').countDocuments(),
      newDb.collection('pc_subtype_attributes').countDocuments(),
      newDb.collection('pc_attribute_options').countDocuments()
    ]);

    console.log('\n====================================================');
    console.log('🎉 PRODUCT TEMPLATES TRANSFER COMPLETED SUCCESSFULLY!');
    console.log(`📊 Total Templates in New DB         : ${nT}`);
    console.log(`📊 Total Subtypes in New DB          : ${nS}`);
    console.log(`📊 Total Attribute Groups in New DB  : ${nG}`);
    console.log(`📊 Total Subtype Attributes in New DB: ${nA}`);
    console.log(`📊 Total Attribute Options in New DB : ${nO}`);
    console.log('====================================================\n');

  } finally {
    await oldClient.close();
    await newClient.close();
  }
}

transferProductTemplates().catch(err => {
  console.error('❌ Transfer Error:', err);
  process.exit(1);
});
