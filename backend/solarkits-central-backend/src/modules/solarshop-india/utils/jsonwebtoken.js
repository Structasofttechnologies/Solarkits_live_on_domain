const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');

let public_key = process.env.PUBLIC_KEY;
let private_key = process.env.PRIVATE_KEY;

if (!public_key && process.env.PUBLIC_KEY_PATH) {
  try {
    public_key = fs.readFileSync(path.resolve(process.env.PUBLIC_KEY_PATH), 'utf8');
  } catch (err) {
    console.warn(`[JWT Warning] Could not load public key from ${process.env.PUBLIC_KEY_PATH}: ${err.message}`);
  }
}

if (!private_key && process.env.PRIVATE_KEY_PATH) {
  try {
    private_key = fs.readFileSync(path.resolve(process.env.PRIVATE_KEY_PATH), 'utf8');
  } catch (err) {
    console.warn(`[JWT Warning] Could not load private key from ${process.env.PRIVATE_KEY_PATH}: ${err.message}`);
  }
}

const secret_or_private = private_key || process.env.JWT_SECRET || 'solarkits_reseller_secret_key_2026';
const secret_or_public  = public_key || private_key || process.env.JWT_SECRET || 'solarkits_reseller_secret_key_2026';

const sign_token = (payload, options = {}) => {
  const isRsa = Boolean(private_key);
  return jwt.sign(payload, secret_or_private, {
    ...(isRsa ? { algorithm: 'RS512' } : { algorithm: 'HS256' }),
    ...options
  });
};

const generate_token = sign_token;

// ✅ VERIFY TOKEN
const decode_token = (token) => {
  try {
    const isRsa = Boolean(public_key);
    return jwt.verify(token, secret_or_public, {
      algorithms: isRsa ? ['RS512'] : ['HS256', 'RS512']
    });
  } catch (err) {
    throw err;
  }
};

module.exports = { sign_token, generate_token, decode_token };