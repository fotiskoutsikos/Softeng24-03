require('dotenv').config(); // Load environment variables

module.exports = {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017'
};
