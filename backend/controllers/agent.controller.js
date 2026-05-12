/**
 * agent.controller.js
 *
 * Route: POST /api/agent/chat
 * Access: Protected (JWT) — we need the userId to create bookings
 */

const { chat } = require('../services/agent.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.agentChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return errorResponse(res, 'message is required', 400);
    }

    const result = await chat(history, message, req.user.id);

    return successResponse(res, {
      reply:          result.reply,
      bookingPreview: result.bookingPreview ?? null,
      history:        result.history,
    });
  } catch (err) {
    console.error('[AgentController] Error:', err.message);
    return errorResponse(res, 'AI agent error: ' + err.message);
  }
};
