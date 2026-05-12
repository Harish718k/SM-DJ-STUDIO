/**
 * agent.routes.js
 *
 * Mount in server.js:
 *   const agentRoutes = require('./routes/agent.routes');
 *   app.use('/api/agent', agentRoutes);
 */

const express = require('express');
const router  = express.Router();
const { agentChat } = require('../controllers/agent.controller');
const { protect }   = require('../middleware/auth.middleware');

// The chat endpoint requires a valid JWT so we can attach userId to bookings
router.post('/chat', protect, agentChat);

module.exports = router;
