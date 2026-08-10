const mongoose = require('mongoose');

const uri = "mongodb+srv://test:U00VAHrtpWdqln6W@cluster0.gqiyonh.mongodb.net/emergesun_cms_users?retryWrites=true&w=majority";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully to MongoDB");

    const db = mongoose.connection.db;

    const modules = await db.collection('cms_modules').find({}).toArray();
    console.log("=== CMS MODULES ===");
    console.log(JSON.stringify(modules.map(m => ({
      _id: m._id,
      name: m.name,
      dashboard_context: m.dashboard_context,
      dashboard_type_id: m.dashboard_type_id,
      saas_product_id: m.saas_product_id
    })), null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
