const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { authenticateJWT, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateJWT, authorizeRoles(['admin', 'operator']));
router.get('/operators', adminController.getOperators);

router.use(authenticateJWT, authorizeRoles(['admin']));

router.get('/healthcheck', adminController.healthCheck);
router.post('/resetstations', upload.single('file'), adminController.resetStations);
router.post('/resetpasses', adminController.resetPasses);
router.post('/addpasses', upload.single('file'), adminController.addPasses);
router.post('/usermod/:username/:password/:role?', adminController.modifyUser);
router.get('/users', adminController.getUsers);
router.post('/userdel/:username', adminController.deleteUser);
router.get('/operators', adminController.getOperators);

module.exports = router;
