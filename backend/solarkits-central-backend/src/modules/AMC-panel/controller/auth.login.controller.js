const AmcAuthUser = require('../models/auth.login.model');

// LOGIN Controller (Verifies user credentials directly from MongoDB)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await AmcAuthUser.findOne({ email: cleanEmail });

    // Reject login if user is not registered in MongoDB
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please create a free trial account first!',
      });
    }

    // Verify Password
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check your password and try again.',
      });
    }

    // Generate session token
    const token = `amc_token_${user._id}_${Date.now()}`;
    user.token = token;
    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      company: user.company,
      branch: user.branch,
      greeting: `Good day, ${user.name.split(' ')[0]}`,
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// REGISTER Controller ("Start your free trial" - Stores exact user input into MongoDB)
const registerUser = async (req, res) => {
  try {
    const { companyName, email, phone, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await AmcAuthUser.findOne({ email: cleanEmail });

    if (user) {
      // Account exists: update password, phone, company name
      user.password = password;
      if (phone) user.phone = phone;
      if (companyName) {
        user.name = companyName;
        user.company = {
          ...user.company,
          name: companyName,
        };
      }
      await user.save();
      console.log(`✅ Updated existing user in MongoDB: Email=${cleanEmail}`);
    } else {
      // Create brand new user
      const nameToSave = companyName || cleanEmail.split('@')[0];
      user = new AmcAuthUser({
        name: nameToSave,
        email: cleanEmail,
        phone: phone || '',
        password: password,
        role: 'epc_owner',
        company: {
          id: `comp_${Date.now()}`,
          name: companyName || nameToSave,
          plan: 'professional',
        },
        branch: {
          id: `br_${Date.now()}`,
          name: 'Main Branch',
        },
      });
      await user.save();
      console.log(`✅ Stored new user in MongoDB: Email=${cleanEmail}`);
    }

    const token = `amc_token_${user._id}_${Date.now()}`;
    user.token = token;
    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      company: user.company,
      branch: user.branch,
      greeting: `Welcome, ${user.name.split(' ')[0]}`,
    };

    return res.status(200).json({
      success: true,
      message: 'Account created successfully! Please sign in with your credentials.',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// GET USER PROFILE / ME Controller
const getProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '') : req.query.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No authorization token provided' });
    }

    const user = await AmcAuthUser.findOne({ token });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        company: user.company,
        branch: user.branch,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
  getProfile,
};
