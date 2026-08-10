const fs = require('fs')
const jwt = require('jsonwebtoken')
const path = require('path')

let private_key = process.env.PRIVATE_KEY;
let public_key = process.env.PUBLIC_KEY;

if (!private_key && process.env.PRIVATE_KEY_PATH) {
    try {
        private_key = fs.readFileSync(path.resolve(process.env.PRIVATE_KEY_PATH), 'utf8');
    } catch (err) {
        console.warn(`[JWT Warning] Could not load private key from ${process.env.PRIVATE_KEY_PATH}: ${err.message}`);
    }
}

if (!public_key && process.env.PUBLIC_KEY_PATH) {
    try {
        public_key = fs.readFileSync(path.resolve(process.env.PUBLIC_KEY_PATH), 'utf8');
    } catch (err) {
        console.warn(`[JWT Warning] Could not load public key from ${process.env.PUBLIC_KEY_PATH}: ${err.message}`);
    }
}


const generate_token = (data,expiresIn) => {
    try {
        if (!private_key) {
            throw new Error('JWT_PRIVATE_KEY is not defined.');
        }
        return jwt.sign(data, private_key, { expiresIn, algorithm: 'RS512' })
    } catch (err) {
        throw err;
    }
}
const decode_token = (token) => {
    try{
        return jwt.verify(token, public_key, { algorithms: ['RS512'] })
    }catch(err){
        throw err;
    }
}

module.exports = { generate_token, decode_token }