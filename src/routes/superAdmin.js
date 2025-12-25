const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { verifySuperAdminToken } = require('../middleware/auth');

// Public routes
router.post('/login', superAdminController.login);

// Protected routes
router.get('/me', verifySuperAdminToken, superAdminController.getMe);
router.get('/admins', verifySuperAdminToken, superAdminController.getAllAdmins);
router.put('/admins/:id/status', verifySuperAdminToken, superAdminController.updateAdminStatus);
router.get('/analytics/overview', verifySuperAdminToken, superAdminController.getDashboardStats);

module.exports = router;
