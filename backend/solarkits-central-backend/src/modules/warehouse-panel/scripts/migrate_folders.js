require('dotenv').config();
process.env.SKIP_SEEDING = 'true';
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');
const { company_warehouse_db } = require('../config/databases');
const { CompanyWarehouse, CompanyWarehouseFieldData } = require('../models/company_warehouse_db');

const publicDir = path.join(__dirname, '../../public');

// -------------------------------------------------
// Helper to clean path from relative notation
// -------------------------------------------------
const cleanPath = (p) => {
  if (!p) return null;
  if (typeof p !== 'string') return null;
  if (p.startsWith('http')) return null;
  let clean = p;
  if (clean.startsWith('/')) {
    clean = clean.substring(1);
  }
  return clean;
};

// -------------------------------------------------
// Stream upload to Cloudinary via buffer
// -------------------------------------------------
function stream_upload(buffer, options) {
  return new Promise((resolve, reject) => {
    const upload_stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(upload_stream);
  });
}

// -------------------------------------------------
// Upload local file preserving folder layout
// -------------------------------------------------
const uploadLocalFile = async (relativeFilePath, targetFolder) => {
  const cleaned = cleanPath(relativeFilePath);
  if (!cleaned) return null;

  const absolutePath = path.join(publicDir, cleaned);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`⚠️ File not found locally: ${absolutePath}`);
    return null;
  }

  const parsed = path.parse(cleaned);
  const ext = parsed.ext.slice(1).toLowerCase();

  try {
    const fileBuffer = fs.readFileSync(absolutePath);
    const result = await stream_upload(fileBuffer, {
      folder: targetFolder,
      public_id: parsed.name,
      resource_type: 'auto',
      ...(ext ? { format: ext } : {})
    });
    console.log(`✅ Uploaded local file: ${cleaned} -> ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`❌ Failed to upload local file ${cleaned}:`, err.message);
    return null;
  }
};

// -------------------------------------------------
// Extract Cloudinary info from URL
// -------------------------------------------------
function extract_cloudinary_info(url) {
  if (!url || !url.includes("cloudinary.com")) return null;
  const match = url.match(/\/(image|video|raw)\/(?:upload|authenticated|private)\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
  if (match) {
    return {
      resource_type: match[1],
      public_id: match[2]
    };
  }
  const simpleMatch = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
  if (simpleMatch) {
    return {
      resource_type: "image",
      public_id: simpleMatch[1]
    };
  }
  return null;
}

// -------------------------------------------------
// Get resource type based on extension
// -------------------------------------------------
const getResourceType = (ext) => {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg'];
  const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'];
  const cleanedExt = (ext || '').replace('.', '').toLowerCase().trim();
  if (imageExts.includes(cleanedExt)) return 'image';
  if (videoExts.includes(cleanedExt)) return 'video';
  return 'raw';
};

// -------------------------------------------------
// Migrate/Rename a single URL if needed (with Cloudinary fallback)
// -------------------------------------------------
const migrateUrl = async (url, targetFolder) => {
  if (!url) return null;
  if (typeof url !== 'string') return null;

  let filename = "";
  let oldCloudinaryInfos = [];
  let isLocal = !url.startsWith('http');

  if (isLocal) {
    const cleaned = cleanPath(url);
    if (!cleaned) return null;
    const parsed = path.parse(cleaned);
    filename = parsed.name;

    // Check if it exists locally first
    const absolutePath = path.join(publicDir, cleaned);
    if (fs.existsSync(absolutePath)) {
      return await uploadLocalFile(url, targetFolder);
    }

    // Fallback: If not found locally, construct old Cloudinary public IDs
    const dirPath = parsed.dir.replace(/\\/g, '/'); // e.g. "public/uploads/warehouse_docs" or "uploads/warehouse_docs"
    const resourceType = getResourceType(parsed.ext);

    oldCloudinaryInfos.push({
      public_id: `solarkits/${dirPath}/${filename}`,
      resource_type: resourceType
    });
    if (dirPath.startsWith('public/')) {
      const withoutPublic = dirPath.replace('public/', '');
      oldCloudinaryInfos.push({
        public_id: `solarkits/${withoutPublic}/${filename}`,
        resource_type: resourceType
      });
    } else {
      oldCloudinaryInfos.push({
        public_id: `solarkits/public/${dirPath}/${filename}`,
        resource_type: resourceType
      });
    }
  } else {
    // Cloudinary URL
    const info = extract_cloudinary_info(url);
    if (!info) return null;
    filename = info.public_id.split('/').pop();
    oldCloudinaryInfos.push(info);
  }

  const newPublicId = `${targetFolder}/${filename}`;

  // Try to rename from each potential old public ID
  for (const info of oldCloudinaryInfos) {
    if (info.public_id === newPublicId) {
      // Already correct!
      return null;
    }
    try {
      console.log(`🔄 Moving/Renaming on Cloudinary: ${info.public_id} -> ${newPublicId}`);
      const result = await cloudinary.uploader.rename(info.public_id, newPublicId, {
        resource_type: info.resource_type || 'image',
        overwrite: true
      });
      console.log(`   ✅ Success! New URL: ${result.secure_url}`);
      return result.secure_url;
    } catch (err) {
      // Ignore and try next potential old public ID
    }
  }

  if (isLocal) {
    console.warn(`⚠️ File not found locally and could not be resolved/renamed on Cloudinary: ${url}`);
  }
  return null;
};

// -------------------------------------------------
// Helper to parse/migrate value field containing potential json/arrays
// -------------------------------------------------
const migrateValue = async (value, targetFolder) => {
  if (!value) return null;

  let parsed = null;
  let isJson = false;
  try {
    parsed = JSON.parse(value);
    isJson = (typeof parsed === 'object' && parsed !== null);
  } catch (e) {
    // Not JSON
  }

  if (isJson) {
    let updated = false;
    if (Array.isArray(parsed)) {
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (typeof item === 'string') {
          const newUrl = await migrateUrl(item, targetFolder);
          if (newUrl) {
            parsed[i] = newUrl;
            updated = true;
          }
        } else if (typeof item === 'object' && item !== null && item.path) {
          const newUrl = await migrateUrl(item.path, targetFolder);
          if (newUrl) {
            item.path = newUrl;
            updated = true;
          }
        }
      }
    } else {
      if (parsed.path) {
        const newUrl = await migrateUrl(parsed.path, targetFolder);
        if (newUrl) {
          parsed.path = newUrl;
          updated = true;
        }
      }
    }
    return updated ? JSON.stringify(parsed) : null;
  } else {
    if (typeof value === 'string') {
      const newUrl = await migrateUrl(value, targetFolder);
      if (newUrl) {
        return newUrl;
      }
    }
  }
  return null;
};

// -------------------------------------------------
// Migrate CompanyWarehouse images
// -------------------------------------------------
const migrateWarehouseImages = async () => {
  const targetFolder = 'solarkits/solarkits-warehouse-panel-backend/public/uploads/warehouse_docs';
  const warehouses = await CompanyWarehouse.find({ images: { $ne: null } });
  console.log(`🔍 Checking ${warehouses.length} warehouses for images...`);
  for (const wh of warehouses) {
    const newValue = await migrateValue(wh.images, targetFolder);
    if (newValue) {
      wh.images = newValue;
      await wh.save();
      console.log(`✨ Updated warehouse images for ID: ${wh._id}`);
    }
  }
};

// -------------------------------------------------
// Migrate CompanyWarehouseFieldData values
// -------------------------------------------------
const migrateFieldData = async () => {
  const targetFolder = 'solarkits/solarkits-warehouse-panel-backend/public/uploads/warehouse_docs';
  const dataRecords = await CompanyWarehouseFieldData.find({ value: { $ne: null } });
  console.log(`🔍 Checking ${dataRecords.length} field data records...`);
  for (const record of dataRecords) {
    const newValue = await migrateValue(record.value, targetFolder);
    if (newValue) {
      record.value = newValue;
      await record.save();
      console.log(`✨ Updated field data value for ID: ${record._id}`);
    }
  }
};

// -------------------------------------------------
// Main Execution Block
// -------------------------------------------------
const main = async () => {
  console.log('⚡ Waiting for database connection...');
  if (company_warehouse_db.readyState !== 1) {
    await new Promise((resolve) => company_warehouse_db.once('connected', resolve));
  }
  console.log('✅ Database connected! Starting folder migration...');

  try {
    await migrateWarehouseImages();
    await migrateFieldData();
    console.log('🎉 Folder migration completed successfully!');
  } catch (err) {
    console.error('❌ Folder migration failed:', err);
  } finally {
    await company_warehouse_db.close();
    process.exit(0);
  }
};

main();
