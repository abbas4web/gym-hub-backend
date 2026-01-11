const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Serve the Terms Acceptance Page (HTML)
router.get('/terms/:clientId', publicController.getTermsPage);

// Handle Acceptance Action
router.post('/accept/:clientId', publicController.acceptTerms);

module.exports = router;
