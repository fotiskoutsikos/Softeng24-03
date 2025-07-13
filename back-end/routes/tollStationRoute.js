const express = require('express');
const { getTollStationPasses } = require('../controllers/tollStationController');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateJWT, authorizeRoles(['admin', 'operator']));

// Define the GET route for tollStationPasses
router.get('/:tollStationID/:date_from/:date_to', getTollStationPasses);

module.exports = router;
