const fs = require('fs')
const jwt = require('jsonwebtoken')
const path = require('path')

let public_key = process.env.PUBLIC_KEY;

if (!public_key && process.env.PUBLIC_KEY_PATH) {
    try {
        public_key = fs.readFileSync(path.resolve(process.env.PUBLIC_KEY_PATH), 'utf8');
    } catch (err) {
        console.warn(`[JWT Warning] Could not load public key from ${process.env.PUBLIC_KEY_PATH}: ${err.message}`);
    }
}


const decode_token = (token) => {
    try {
        return jwt.verify(token, public_key, { algorithms: ['RS512'] })
    } catch (err) {
        throw err;
    }
}

module.exports = { decode_token }