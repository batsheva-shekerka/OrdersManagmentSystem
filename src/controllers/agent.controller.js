/**
 * Agent Controller — Virtual Waiter (powered by Google Gemini)
 *
 * POST /api/agent/chat
 * Body: { message: string, userId?: string, history?: GeminiContent[] }
 * Response: { response: string, history: GeminiContent[] }
 *
 * The endpoint itself is stateless — no session is kept in server memory.
 * Instead, the *raw* Gemini conversation history (including tool calls and
 * their results — not just display text) is round-tripped with the client
 * on every request, so the LLM keeps full context AND the exact product
 * IDs it already looked up, instead of ever having to guess/hallucinate them.
 */

const { GoogleGenAI } = require("@google/genai");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { searchProducts } = require("../services/product.service");
const { addToCart } = require("../services/cart.service");

// ---------- Gemini client ----------------------------------------

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

// ---------- Tool declarations (Gemini FunctionDeclaration format) -

const FUNCTION_DECLARATIONS = [
  {
    name: "searchProducts",
    description:
      "Search the restaurant menu for available products. " +
      "Use this when the customer asks what is available, asks about a category, " +
      "or wants to know which products are under a certain price.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Category name in Hebrew (e.g. 'בשרים', 'מגשי אירוח'), " +
            "its English slug (e.g. 'meats'), or its MongoDB ObjectId. " +
            "Omit to search across all categories.",
        },
        maxPrice: {
          type: "number",
          description:
            "Maximum price in NIS (inclusive). Omit to return products at any price.",
        },
      },
    },
  },
  {
    name: "addToCart",
    description:
      "Add a product to the current customer's cart. " +
      "Always call this immediately when the customer asks to order, buy, or add an item — " +
      "never ask the customer for their user ID or login status yourself; " +
      "the system identifies the customer automatically. " +
      "If there is a problem, the tool result will tell you what went wrong.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "The MongoDB ObjectId of the product to add.",
        },
        quantity: {
          type: "number",
          description: "How many units to add. Defaults to 1.",
        },
      },
      required: ["productId"],
    },
  },
];

// ---------- System prompt ----------------------------------------

const SYSTEM_PROMPT = `אתה מלצר וירטואלי מקצועי וידידותי של גולדיס — שירות הזמנות אוכל ואירוח פרימיום ישראלי.
תמיד תענה בעברית.
שמור על תשובות קצרות וממוקדות — כמו מלצר אמיתי.
כשאתה מציג רשימת מוצרים, הצג אותם בצורה ברורה עם שם ומחיר ב-₪.
כשהלקוח מבקש להוסיף מוצר לסל, תמיד תשתמש מיד בכלי addToCart - אל תבקש מהלקוח מזהה משתמש או פרטי התחברות, המערכת מזהה אותו אוטומטית.
אל תמציא מוצרים — השתמש תמיד בכלי searchProducts כדי לקבל נתונים אמיתיים.`;

// ---------- Tool executor ----------------------------------------

async function executeTool(toolName, args, userId) {
  if (toolName === "searchProducts") {
    const products = await searchProducts({
      category: args.category,
      maxPrice: args.maxPrice,
    });

    if (products.length === 0) {
      return { result: "לא נמצאו מוצרים התואמים לחיפוש." };
    }

    return {
      products: products.map((p) => ({
        id: String(p._id),
        name: p.name,
        price: p.price,
        description: p.description || "",
        category: p.category?.name || "",
        status: p.status,
      })),
    };
  }

  if (toolName === "addToCart") {
    if (!userId) {
      return { error: "המשתמש לא מחובר. לא ניתן להוסיף לסל." };
    }
    try {
      const qty = args.quantity ?? 1;
      const cart = await addToCart(userId, args.productId, qty);
      const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      const addedItem = cart.items.find(
        (i) => String(i.product._id) === String(args.productId)
      );
      return {
        success: true,
        totalItemsInCart: totalItems,
        addedProduct: addedItem
          ? {
              _id: String(addedItem.product._id),
              name: addedItem.product.name,
              price: addedItem.product.price,
              imageUrl: addedItem.product.imageUrl ?? "",
              status: "available",
              quantity: qty,
            }
          : null,
      };
    } catch (err) {
      console.error("[agent] addToCart failed:", err); // eslint-disable-line no-console
      return { error: err.message };
    }
  }

  return { error: `Unknown tool: ${toolName}` };
}

// ---------- History sanitation -------------------------------------

/**
 * Lightly validate the client-supplied Gemini history (as returned by a
 * previous call to this same endpoint) before feeding it back to the SDK.
 * Anything malformed is dropped rather than rejected, so a corrupted
 * client-side cache can't break the conversation entirely.
 */
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.filter(
    (turn) =>
      turn &&
      (turn.role === "user" || turn.role === "model") &&
      Array.isArray(turn.parts)
  );
}

// ---------- Chat handler -----------------------------------------

const chat = asyncHandler(async (req, res) => {
  const { message, userId, history } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    throw ApiError.badRequest("message is required");
  }

  if (!env.geminiApiKey) {
    throw ApiError.badRequest(
      "GEMINI_API_KEY is not configured. Please add your key to .env"
    );
  }

  // Rebuild the chat session from the history the client sends back on
  // every request (this endpoint keeps no state between requests).
  const session = ai.chats.create({
    model: "gemini-2.5-flash-lite",
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
    },
    history: sanitizeHistory(history),
  });

  // ---- Agentic loop ---------------------------------------------------
  const MAX_ITERATIONS = 5;
  let userTurn = message.trim();
  const cartAdditions = [];

  /** Wrap sendMessage so 429/503 from Gemini surfaces as a friendly ApiError */
  async function safeSend(session, turn) {
    try {
      return await session.sendMessage({ message: turn });
    } catch (err) {
      const code = err?.status ?? err?.code;
      if (code === 429) {
        throw ApiError.create(
          429,
          "המלצר הווירטואלי עסוק מאוד כרגע — אנא נסה שוב בעוד כמה שניות."
        );
      }
      if (code === 503) {
        throw ApiError.create(
          503,
          "שירות ה-AI אינו זמין כרגע — נסה שוב בעוד מספר שניות."
        );
      }
      throw err;
    }
  }

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await safeSend(session, userTurn);

    const functionCalls = response.functionCalls;

    // No tool calls → final text answer
    if (!functionCalls || functionCalls.length === 0) {
      return res.json({
        response: response.text,
        history: session.getHistory(),
        cartAdditions,
      });
    }

    // Execute each tool call and collect results
    const functionResponses = [];
    for (const call of functionCalls) {
      const toolResult = await executeTool(call.name, call.args, userId);

      // Track successful cart additions so the frontend can sync its local cart
      if (
        call.name === "addToCart" &&
        toolResult.success &&
        toolResult.addedProduct
      ) {
        cartAdditions.push({
          ...toolResult.addedProduct,
          quantity: toolResult.addedProduct.quantity,
        });
      }

      functionResponses.push({
        functionResponse: {
          name: call.name,
          response: toolResult,
        },
      });
    }

    // Feed results back as the next turn
    userTurn = functionResponses;
  }

  // Safety fallback
  res.json({
    response: "מצטערים, לא הצלחתי לעבד את הבקשה. נסה שנית בבקשה.",
    history: session.getHistory(),
    cartAdditions,
  });
});

module.exports = { chat };
