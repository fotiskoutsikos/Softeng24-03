require('dotenv').config(); // Load environment variables

module.exports = {
    jwtSecret: process.env.JWT_SECRET, // Fallback if .env is missing
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION,
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION
};
