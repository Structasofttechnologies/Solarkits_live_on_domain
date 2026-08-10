const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Read RS512 key pair
const private_key_path = process.env.PRIVATE_KEY_PATH || './src/keys/private.pem';
const public_key_path  = process.env.PUBLIC_KEY_PATH  || './src/keys/public.pem';

let private_key = process.env.PRIVATE_KEY;
let public_key  = process.env.PUBLIC_KEY;

if (!private_key) {
    try {
        if (fs.existsSync(path.resolve(private_key_path))) {
            private_key = fs.readFileSync(path.resolve(private_key_path), 'utf8');
        }
    } catch (err) {
        console.warn(`[JWT Warning] Could not load private key from ${private_key_path}: ${err.message}`);
    }
}

if (!public_key) {
    try {
        if (fs.existsSync(path.resolve(public_key_path))) {
            public_key = fs.readFileSync(path.resolve(public_key_path), 'utf8');
        }
    } catch (err) {
        console.warn(`[JWT Warning] Could not load public key from ${public_key_path}: ${err.message}`);
    }
}


const generate_token = (data, expiresIn) => {
    if (!private_key) throw new Error('Private key not found. Check PRIVATE_KEY_PATH.');
    return jwt.sign(data, private_key, { expiresIn, algorithm: 'RS512' });
};

const decode_token = (token) => {
    if (!public_key) throw new Error('Public key not found. Check PUBLIC_KEY_PATH.');
    return jwt.verify(token, public_key, { algorithms: ['RS512'] });
};

/**
 * Sign a supplier-scoped JWT token.
 */
const sign_supplier_token = (payload, expiresIn = '1d') => generate_token(payload, expiresIn);

/**
 * Verify a supplier-scoped JWT token.
 */
const verify_supplier_token = (token) => decode_token(token);

// Legacy aliases kept for backward compatibility
const generate_access_token  = (data) => generate_token(data, '15m');
const generate_refresh_token = (data) => generate_token(data, '7d');

module.exports = {
    generate_token,
    decode_token,
    sign_supplier_token,
    verify_supplier_token,
    generate_access_token,
    generate_refresh_token,
};
