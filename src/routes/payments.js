const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// Create a new order
// Route: POST /api/payments/create-order
// Access: Private (Requires login)
router.post('/create-order', auth, paymentController.createOrder);

// Verify payment
// Route: POST /api/payments/verify
// Access: Private (Requires login)
router.post('/verify', auth, paymentController.verifyPayment);

module.exports = router;
