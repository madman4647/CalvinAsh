const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const adminController = require('../controllers/admin.controller');

// All admin settings routes require council role
router.use(auth, roleGuard('council'));

router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;
