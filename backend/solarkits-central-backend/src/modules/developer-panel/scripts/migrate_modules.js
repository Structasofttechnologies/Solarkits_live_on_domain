const mongoose = require('mongoose');

const uri = "mongodb+srv://test:U00VAHrtpWdqln6W@cluster0.gqiyonh.mongodb.net/solarkits_cms_users?retryWrites=true&w=majority";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully to MongoDB");

    const db = mongoose.connection.db;

    // 1. For default context modules: set saas_product_id to null and remove dashboard_type_id
    const resDefault = await db.collection('cms_modules').updateMany(
      { dashboard_context: 'default' },
      {
        $set: { saas_product_id: null },
        $unset: { dashboard_type_id: "" }
      }
    );
    console.log(`Updated default context modules:`, resDefault.modifiedCount);

    // 2. For product context modules: map old EPC saas_product_id to new EPC saas_product_id, remove dashboard_type_id
    // Old EPC ID was "6a0adf3936b74a4303d2e668" or similar
    // New EPC ID is "6a0c02e8623d0970cd491f6e" (ObjectId)
    const newEpcObjectId = new mongoose.Types.ObjectId("6a0c02e8623d0970cd491f6e");

    const resProduct = await db.collection('cms_modules').updateMany(
      { dashboard_context: 'product' },
      {
        $set: { saas_product_id: newEpcObjectId },
        $unset: { dashboard_type_id: "" }
      }
    );
    console.log(`Updated product context modules:`, resProduct.modifiedCount);

    // Double check modules after migration
    const modules = await db.collection('cms_modules').find({}).toArray();
    console.log("=== CMS MODULES AFTER MIGRATION ===");
    console.log(JSON.stringify(modules.map(m => ({
      _id: m._id,
      name: m.name,
      dashboard_context: m.dashboard_context,
      saas_product_id: m.saas_product_id
    })), null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
