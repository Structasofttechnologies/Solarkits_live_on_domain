const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');

let public_key = process.env.PUBLIC_KEY;

if (!public_key) {
    const keyPath = process.env.PUBLIC_KEY_PATH || path.join(__dirname, '../keys/public.key');
    try {
        public_key = fs.readFileSync(path.resolve(keyPath), 'utf8');
    } catch (err) {
        console.warn(`[JWT Warning] Could not load public key from ${keyPath}. Verification will fail if token is checked. Error: ${err.message}`);
    }
}

const decode_token = (token) => {
    try {
        if (!public_key) {
            throw new Error('Public key is not defined. Set PUBLIC_KEY or PUBLIC_KEY_PATH.');
        }
        return jwt.verify(token, public_key, { algorithms: ['RS512'] });
    } catch (err) {
        throw err;
    }
}

module.exports = { decode_token };

