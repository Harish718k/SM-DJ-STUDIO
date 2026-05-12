const express = require('express');
const router  = express.Router();
const { createPaymentIntent, confirmPayment } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

// Both routes require a valid JWT — no raw-body or webhook secret needed
router.use(protect);

router.post('/create-intent',   createPaymentIntent);
router.post('/confirm-payment', confirmPayment);

module.exports = router;
