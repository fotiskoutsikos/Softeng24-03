// tollStatsRoute.js
const express = require('express');
const { getTollStats } = require('../controllers/tollStatsController');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateJWT, authorizeRoles(['admin', 'operator']));

// Define the GET route for tollStats

//router.get('/:operator/:year', getTollStats);
router.get('/:operator/:periodType/:year/:periodValue?', getTollStats); // periodValue is optional

module.exports = router;
