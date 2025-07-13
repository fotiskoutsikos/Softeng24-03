const express = require('express');
const { getMonthlyCharges } = require('../controllers/monthlyChargesController');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateJWT, authorizeRoles(['admin', 'operator']));

// Route για την ανάκτηση operator financials
router.get('/:operatorID', getMonthlyCharges);

module.exports = router;