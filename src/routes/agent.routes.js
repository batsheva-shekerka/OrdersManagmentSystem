const express = require("express");
const { chat } = require("../controllers/agent.controller");

const router = express.Router();

/**
 * POST /api/agent/chat
 *
 * Body: { message: string, userId?: string }
 * Response: { response: string }
 */
router.post("/chat", chat);

module.exports = router;
