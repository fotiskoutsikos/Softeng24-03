const express = require('express');
const { getChargesBy } = require('../controllers/chargesByController');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateJWT, authorizeRoles(['admin', 'operator']));
// Define the GET route for chargesBy
router.get('/:tollOpID/:date_from/:date_to', getChargesBy);

module.exports = router;
