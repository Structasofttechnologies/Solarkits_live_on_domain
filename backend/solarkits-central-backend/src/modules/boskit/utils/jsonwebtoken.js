'use strict';

const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');

let public_key = process.env.PUBLIC_KEY;
let private_key = process.env.PRIVATE_KEY;

if (!public_key && process.env.PUBLIC_KEY_PATH) {
  try {
    public_key = fs.readFileSync(path.resolve(process.env.PUBLIC_KEY_PATH), 'utf8');
  } catch (err) {
    console.warn(`[BOSKIT JWT Warning] Could not load public key from ${process.env.PUBLIC_KEY_PATH}: ${err.message}`);
  }
}

if (!private_key && process.env.PRIVATE_KEY_PATH) {
  try {
    private_key = fs.readFileSync(path.resolve(process.env.PRIVATE_KEY_PATH), 'utf8');
  } catch (err) {
    console.warn(`[BOSKIT JWT Warning] Could not load private key from ${process.env.PRIVATE_KEY_PATH}: ${err.message}`);
  }
}

const secret_or_private = private_key || process.env.JWT_SECRET || 'boskit_platform_secret_key_2026';
const secret_or_public  = public_key || private_key || process.env.JWT_SECRET || 'boskit_platform_secret_key_2026';

/**
 * Sign JWT token
 */
const sign_token = (payload, options = {}) => {
  const isRsa = Boolean(private_key);
  return jwt.sign(payload, secret_or_private, {
    ...(isRsa ? { algorithm: 'RS512' } : { algorithm: 'HS256' }),
    ...options,
  });
};

/**
 * Decode / Verify JWT token
 */
const decode_token = (token) => {
  try {
    const isRsa = Boolean(public_key);
    return jwt.verify(token, secret_or_public, {
      algorithms: isRsa ? ['RS512'] : ['HS256', 'RS512'],
    });
  } catch (err) {
    throw err;
  }
};

/**
 * Helper to generate Auth tokens pair (Access + Refresh)
 */
const generate_auth_tokens = (user, role = 'boskit_distributor') => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    mobile: user.mobile,
    business_name: user.business_name,
    role: role,
    token_version: user.token_version || 1,
  };

  const accessToken = sign_token(payload, { expiresIn: '15m' });
  const refreshToken = sign_token(payload, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

/**
 * Set standard BOSKIT HttpOnly auth cookies on response
 */
const set_auth_cookies = (res, req, { accessToken, refreshToken, prefix = 'boskit' }) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  
  const cookieOptions = {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
  };

  res.cookie(`${prefix}_access_token`, accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie(`${prefix}_refresh_token`, refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Also set generic token cookie for compatibility
  res.cookie('boskit_token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
};

/**
 * Clear BOSKIT auth cookies on response
 */
const clear_auth_cookies = (res, prefix = 'boskit') => {
  res.clearCookie(`${prefix}_access_token`);
  res.clearCookie(`${prefix}_refresh_token`);
  res.clearCookie('boskit_token');
  res.clearCookie('boskit_distributor_access_token');
  res.clearCookie('boskit_dealer_access_token');
};

module.exports = {
  sign_token,
  decode_token,
  generate_auth_tokens,
  set_auth_cookies,
  clear_auth_cookies,
};
