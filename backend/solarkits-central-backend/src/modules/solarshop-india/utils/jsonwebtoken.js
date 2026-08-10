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



const sign_token = (payload, options = {}) => {
    return jwt.sign(payload, private_key, {
        algorithm: 'RS512',
        ...options
    });
};

// ✅ VERIFY TOKEN
const decode_token = (token) => {
    try {
        return jwt.verify(token, public_key, { algorithms: ['RS512'] });
    } catch (err) {
        throw err;
    }
};

module.exports = { sign_token, decode_token };