const express = require('express');
const { getOperatorFinancials } = require('../controllers/operatorFinancialsController');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateJWT, authorizeRoles(['admin', 'operator']));

// Route για την ανάκτηση operator financials
router.get('/:operatorID/:date_from/:date_to', getOperatorFinancials);

module.exports = router;