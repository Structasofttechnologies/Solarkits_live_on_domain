require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');

async function reactivateSubscriptions() {
  console.log('🔄 Connecting to MongoDB to restore active franchise subscriptions...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const defaultPlan = await db.collection('reseller_plans').findOne({ name: 'District Franchise Plan' });
  if (!defaultPlan) {
    console.error('District plan not found!');
    process.exit(1);
  }
  console.log('Using Plan:', defaultPlan._id, defaultPlan.name);

  const resellers = await db.collection('resellers').find({}).toArray();
  console.log('Found', resellers.length, 'resellers');

  // Clear any existing subscriptions first to avoid duplicates
  await db.collection('reseller_plan_subscriptions').deleteMany({});

  for (const r of resellers) {
    const subDoc = {
      reseller_id: r._id,
      plan_id: defaultPlan._id,
      start_date: new Date('2026-01-01'),
      expiry_date: new Date('2028-12-31'),
      amount_paid: 25000,
      currency: 'INR',
      payment_method: 'bank_transfer',
      payment_status: 'verified',
      payment_reference: 'SUB-' + r._id.toString().slice(-6).toUpperCase(),
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    const ins = await db.collection('reseller_plan_subscriptions').insertOne(subDoc);
    console.log('Created active subscription for reseller:', r.email || r._id, 'subId:', ins.insertedId);

    const updateObj = {
      plan_id: defaultPlan._id,
      plan_subscription_id: ins.insertedId,
      is_active: true,
      status: 'active'
    };

    await db.collection('resellers').updateOne(
      { _id: r._id },
      { $set: updateObj }
    );
  }

  // Also ensure franchisee_plan_po_settings allows both combo kits
  const kits = await db.collection('pc_comobo_kit').find({ deleted_at: null }).toArray();
  const kitIds = kits.map(k => k._id.toString());
  console.log('Configuring PO settings with kit IDs:', kitIds);

  const poUpdateObj = {
    po_enabled: true,
    is_active: true,
    allowed_combo_kit_ids: kitIds,
    min_po_quantity: 10,
    max_po_quantity: 500,
    updated_at: new Date()
  };

  await db.collection('franchisee_plan_po_settings').updateMany(
    {},
    { $set: poUpdateObj }
  );

  console.log('🎉 ALL RESELLER FRANCHISE PLAN SUBSCRIPTIONS SUCCESSFULLY REACTIVATED!');
  process.exit(0);
}

reactivateSubscriptions().catch(err => {
  console.error('Reactivation error:', err);
  process.exit(1);
});
