const express = require('express');
const { getPassAnalysis } = require('../controllers/passAnalysisController');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateJWT, authorizeRoles(['admin', 'operator']));

// Define the GET route for passAnalysis
router.get('/:stationOpID/:tagOpID/:date_from/:date_to', getPassAnalysis);

module.exports = router;
