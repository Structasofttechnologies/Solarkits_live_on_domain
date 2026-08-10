const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_CONNECTION);

const db = mongoose.connection;

db.on('error', (err) => console.error('MongoDB connection error:', err));
db.once('open', () => console.log('MongoDB connected successfully...'));

module.exports = db;
