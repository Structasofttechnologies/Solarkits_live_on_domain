const { india_core_db, india_solarshop_db, geolocation_db } = require('../../solarshop-india/config/databases');
const EpcCompany = require('../../solarshop-india/models/india_core_db/epc_companies.schema');
const EpcAccount = require('../../solarshop-india/models/india_solarshop_db/epc_accounts.schema');
const EpcSignupRequest = require('../../solarshop-india/models/india_solarshop_db/epc_signup_requests.schema');
const GeoLevel0 = require('../../solarshop-india/models/geolocation_db/geo_level_0.schema');
const GeoLevel1 = require('../../solarshop-india/models/geolocation_db/geo_level_1.schema');
const { sendOTP } = require('../../solarshop-india/utils/nodemailer');

const epcOtpMemoryStore = new Map();

// 1. Send OTP to registered EPC email
const send_epc_otp = async (req, res) => {
  try {
    const { email, company_name } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const targetEmail = email.trim().toLowerCase();
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    epcOtpMemoryStore.set(targetEmail, {
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    try {
      await sendOTP(targetEmail, generatedOtp, company_name || 'EmergeSun Account');
    } catch (mailErr) {
      console.warn("Nodemailer OTP sending warning:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to registered Email: ${targetEmail}`,
      otp: process.env.NODE_ENV === 'development' ? generatedOtp : undefined,
    });
  } catch (error) {
    console.error("send_epc_otp error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Verify OTP code
const verify_epc_otp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP code are required" });
    }
    const targetEmail = email.trim().toLowerCase();
    const enteredOtp = otp.toString().trim();

    const record = epcOtpMemoryStore.get(targetEmail);
    if (!record) {
      return res.status(400).json({ success: false, message: "OTP expired or not found. Please click 'Resend Email OTP'." });
    }

    if (Date.now() > record.expiresAt) {
      epcOtpMemoryStore.delete(targetEmail);
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    if (record.otp !== enteredOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP code entered." });
    }

    epcOtpMemoryStore.delete(targetEmail);
    return res.status(200).json({ success: true, message: "OTP verified successfully!" });
  } catch (error) {
    console.error("verify_epc_otp error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Register EPC User Account (Store in MongoDB)
const create_epc_account = async (req, res) => {
  try {
    const { name, email, company_name, gst_number, whatsapp, registered_whatsapp, state_name, country } = req.body;
    if (!email || !company_name) {
      return res.status(400).json({ success: false, message: "Email and company name are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanComp = company_name.trim();

    const existing = await EpcAccount.findOne({ email: cleanEmail, deleted_at: null });
    if (existing) {
      return res.status(200).json({ success: true, message: "EPC Account already registered", user_id: existing._id });
    }

    const newAccount = await EpcAccount.create({
      name: name || cleanComp + ' Admin',
      email: cleanEmail,
      whatsapp: whatsapp || '+91 9876543210',
      registered_whatsapp: registered_whatsapp || whatsapp || '+91 9876543210',
      is_email_verified: true,
      status: 'pending',
      created_at: new Date(),
    });

    await EpcSignupRequest.create({
      account_id: newAccount._id,
      company_name: cleanComp,
      email: cleanEmail,
      whatsapp: whatsapp || '+91 9876543210',
      status: 'pending',
      created_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "EPC account registration submitted successfully for approval",
      user_id: newAccount._id,
    });
  } catch (error) {
    console.error("create_epc_account error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get EPC Companies list for Autocomplete
const get_epc_companies = async (req, res) => {
  try {
    const epcs = await EpcCompany.find({ deleted_at: null }).select('_id name email source').sort({ name: 1 }).lean();
    return res.status(200).json({ status: "success", data: epcs });
  } catch (error) {
    console.error("get_epc_companies error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 5. Get Active Countries from Location Settings Master
const get_active_countries = async (req, res) => {
  try {
    const countries = await GeoLevel0.find({ is_active: true, deleted_at: null })
      .select('_id name iso2 phone_code flag')
      .sort({ name: 1 })
      .lean();

    const formatted = countries.map((c) => ({
      code: c.iso2 ? c.iso2.toUpperCase() : 'IN',
      name: c.name,
      dial: c.phone_code ? (c.phone_code.startsWith('+') ? c.phone_code : `+${c.phone_code}`) : '+91',
      flag: c.flag || '🌐',
      status: 'active',
    }));

    return res.status(200).json({ status: "success", countries: formatted });
  } catch (error) {
    console.error("get_active_countries error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 6. Get Active States list for State Dropdown from Admin Panel Location Settings
const get_active_states = async (req, res) => {
  try {
    const { country } = req.query;
    let countryDoc = null;

    if (country) {
      countryDoc = await GeoLevel0.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${country}$`, 'i') } },
          { iso2: { $regex: new RegExp(`^${country}$`, 'i') } }
        ]
      });
    }

    if (!countryDoc) {
      countryDoc = await GeoLevel0.findOne({
        $or: [
          { name: { $regex: /^india$/i } },
          { iso2: 'IN' }
        ]
      });
    }

    let states = [];
    if (countryDoc) {
      states = await GeoLevel1.find({
        level_0: countryDoc._id,
        is_active: true,
        $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }]
      }).select('_id name code').sort({ name: 1 }).lean();

      if (!states || states.length === 0) {
        states = await GeoLevel1.find({
          level_0: countryDoc._id,
          $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }]
        }).select('_id name code').sort({ name: 1 }).lean();
      }
    }

    if (!states || states.length === 0) {
      states = await GeoLevel1.find({
        $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }]
      }).select('_id name code').sort({ name: 1 }).limit(30).lean();
    }

    return res.status(200).json({ status: "success", states });
  } catch (error) {
    console.error("get_active_states error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  send_epc_otp,
  verify_epc_otp,
  create_epc_account,
  get_epc_companies,
  get_active_countries,
  get_active_states,
};
