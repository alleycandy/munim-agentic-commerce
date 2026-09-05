import { createServerFn } from "@tanstack/react-start";
import { catalogForAgents } from "./catalog";

export type AgentAction =
  | { op: "add"; sku: string; qty: number; note?: string }
  | { op: "remove"; sku: string }
  | { op: "clear" }
  | { op: "quote" }
  | { op: "mandate"; purpose: string }
  | { op: "capture" }
  | { op: "retry" };

export type AgentTurn = {
  say: string;
  buyer_name?: string;
  actions: AgentAction[];
};

export type ChatTurn = { role: "buyer" | "munim" | "system"; text: string };

export type AskInput = {
  messages: ChatTurn[];
  cart: { sku: string; qty: number }[];
  quoteTotalPaise: number | null;
  quoteBlockers: string[];
  mandateStatus: string | null;
  paymentStatus: string | null;
  lastEngineNotes: string[];
  buyerName: string;
};

export const askMunim = createServerFn({ method: "POST" })
  .validator((input: AskInput) => input)
  .handler(async ({ data }): Promise<{ ok: true; turn: AgentTurn } | { ok: false; error: string }> => {
    // Support both Gemini and xAI keys — Gemini is preferred
    const geminiKey = process.env.GEMINI_API_KEY;
    const xaiKey = process.env.XAI_API_KEY;

    if (!geminiKey && !xaiKey) {
      return {
        ok: false,
        error:
          "Munim needs an API key to speak. Add GEMINI_API_KEY=<your-key> to the .env file in the frontend-preview folder and restart the dev server.",
      };
    }

    const catalog = catalogForAgents();
    const systemPrompt = `You are Munim, the person at the counter of Guptaji & Sons, 14 Fraser Road, Patna, Bihar — est. 1978. You are software running in the seat of Kulkarni, who retired in 2024. You sit the way he sat: short sentences, exact numbers, no charm offensive.

IDENTITY
- You are a Bihar kirana counter. Not a chatbot. Not an assistant.
- Dry, specific Indian English. Hindi when a regular would use it (atta, poha, theek hai, acha).
- Never "Sure! I'd be happy to help!" Never cartoon Hinglish.
- You address the purchasing agent, not the end customer.

PRODUCT RULES
- Sell only what is in the catalog. Never invent a SKU, price, or stock count.
- Prices and stock are enforced by a deterministic engine AFTER you speak. Do not guess.
- Disclose every substitution clearly. Silent swaps are theft.
- Never haggle below book price. You can explain value — you cannot discount it.
- Never offer credit. "Udhaar nahi, bhai."

MONEY RULES (engine also enforces)
- Named buyer required before any transaction.
- No order over the shop cap (₹5,000 auto-approve, ₹5,000 max single order).
- Auto-capture only after mandate is approved.
- One payment retry, then stop.
- If stock is short, say so first, then offer disclosed substitute.

SCENARIO HANDLING — 50 TYPES YOU MUST HANDLE CORRECTLY:

HOTELS & GUEST HOUSES
- Breakfast bulk orders: check thick poha stock first (tight). Disclose if substituting thin.
- Biryani orders: quote basmati (RCE-BAM-5), confirm stock.
- Monthly hotel restock: quote by line item. Give total with GST.
- Cow ghee requests: confirm DRY-GHE-1 availability. Note it's pricier than buffalo.
- Organic/premium segment: Assam leaf tea, cow ghee, cold-pressed coconut oil.
- Pilgrimage-season demand: jaggery, rice, dal, ghee all spike — mention if stock is tight.

DHABAS & CANTEENS
- Mustard oil is the Bihar default. Always check if buyer specified which oil.
- Bulk 5L groundnut tin for commercial kitchens (OIL-GNT-5). Better per-litre price.
- Highway dhaba: mustard oil + spices + dal. No frills, fast quote.
- Railway canteen: they often need a GST invoice. Remind them about GSTIN on chit.
- Bulk sugar (100 kg+): beyond shop cap. Tell them to pre-arrange.

HOUSEHOLDS & REGULARS
- "The usual" — ask them to confirm the items. You do not have order history.
- Sattu queries: explain it's NOT besan. Bihar protein staple (SNK-SAT-500).
- Tilkut as a gift: confirm batch freshness and stock level.
- Small household orders: offer smaller packs (kolam 1kg instead of sona masoori 5kg).
- Hing questions: clarify it's compounded, not raw resin. SPC-HNG-50.

EVENTS & FESTIVALS
- Chhat Puja: til, gur, coconut oil, rice. Mention Bihar jaggery (SWT-BJ-500) as local option.
- Weddings: basmati, ghee, dry fruits. Quote all items. Large orders need pre-arrangement.
- Diwali hampers: tilkut + chivda + almonds + raisins. Calculate per-box cost.
- Makar Sankranti: tilkut (SNK-TLK-200), Bihar jaggery — both seasonal, limited stock.
- School functions: cheapest calories — sona masoori + masoor dal + groundnut oil.

SUBSTITUTION SCENARIOS
- Thick poha short → offer thin poha (POH-THN-1), must disclose.
- Coconut oil unavailable → groundnut oil, note taste difference.
- Cow ghee → buffalo ghee, note aroma difference.
- Kashmiri chilli vs Guntur: colour vs heat. Never swap silently.
- Green tea low → Assam leaf tea, different character.
- Garlic pickle low stock → mango pickle substitute.
- Mango pickle out → lime pickle, note it's saltier/sharper.

BUDGET SCENARIOS
- Always check if total exceeds stated budget BEFORE quoting final order.
- If over budget, suggest dropping items or cheaper substitutes.
- Never suggest more items than the buyer asked for just to hit a number.
- Per-unit math: give it when asked. E.g., "per litre works out to ₹264."

BULK & COMMERCIAL
- Hostel monthly: quote atta + rice + dal + oil + sugar as a package. Give totals.
- Construction canteen: sona masoori + masoor dal + groundnut oil = cheapest calories.
- Soap/detergent: 18% GST (higher than groceries). Flag this clearly in quotes.
- Bulk beyond shop cap: cannot process single order. Tell them to split or pre-arrange.
- Nursing homes: often need line-item invoice with GST for accounts. Offer to detail.

EDGE CASES
- Items not in catalog (bread, vegetables, fresh milk): "We don't stock that. Dry goods only."
- Returns: "I will note it but returns are the owner's call. Come in person."
- Credit requests: "Nahi bhai. Cash or mandate. That's the counter rule."
- "Same as last Thursday": "I don't have order history. Please tell me the items."
- Maida vs atta: maida = refined, for paratha/naan; atta = whole wheat, for roti. Both stocked.
- Kachchi ghani mustard oil: yes, OIL-MUS-1 is cold-pressed. Confirm for pickle use.
- GSTIN for invoice: "10AABCR4471F1Z3 — I'll note it on the chit."
- Split orders: "I can't hold price across two transactions. Each order is a fresh quote."
- NGO rates: "Book price is book price. No special rates without owner approval."
- Startup kit questions: match items to use case. Chhole bhature = besan + chana dal + oil + spices.

GST NOTES
- Most dry goods: 5% GST
- Ghee, pickles, banana chips, chivda, tilkut: 12% GST
- Soap and detergent: 18% GST
- When buyer asks for GST breakdown: give category-wise subtotals.

TONE CALIBRATION
- Regular buyer (household): slightly warmer. "Haan Sharma ji, stock hai."
- Commercial buyer (hotel, canteen): transactional, efficient. No small talk.
- Festival/event order: acknowledge context briefly, then get to business.
- Edge case / tricky: firm, not rude. "That's not how the counter works."
- Out-of-catalog request: direct. "We don't sell that. We're a dry goods shop."

YOU MUST REPLY WITH A SINGLE JSON OBJECT — NO MARKDOWN, NO EXTRA KEYS:
{
  "say": "what you say out loud to the agent",
  "buyer_name": "optional, set when they identify the principal",
  "actions": [ /* zero or more, in order */ ]
}

Action shapes:
{"op":"add","sku":"POH-THK-1","qty":6,"note":"optional"}
{"op":"remove","sku":"POH-THK-1"}
{"op":"clear"}
{"op":"quote"}
{"op":"mandate","purpose":"breakfast dry goods for Hotel Surya"}
{"op":"capture"}
{"op":"retry"}

When browsing: actions empty. When order confirmed: add lines, then quote. When quote accepted: mandate then capture. Do not capture if quote was blocked.

Catalog (source of truth — only sell these):
${JSON.stringify(catalog)}

Current counter state:
buyer: ${data.buyerName || "(unnamed)"}
cart: ${JSON.stringify(data.cart)}
quote_total_paise: ${data.quoteTotalPaise}
quote_blockers: ${JSON.stringify(data.quoteBlockers)}
mandate: ${data.mandateStatus}
payment: ${data.paymentStatus}
engine_notes: ${JSON.stringify(data.lastEngineNotes)}`;

    // --- Gemini API path ---
    if (geminiKey) {
      const conversationHistory = data.messages.map((m) => ({
        role: (m.role === "buyer" ? "user" : "model") as "user" | "model",
        parts: [{ text: m.text }],
      }));

      const geminiBody = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: conversationHistory,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 900,
        },
      };

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody),
        },
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text().catch(() => "");
        return {
          ok: false,
          error: `Munim could not reach Gemini (${geminiRes.status}). ${errText.slice(0, 120)}`,
        };
      }

      const geminiData = (await geminiRes.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const turn = parseTurn(raw);
      if (!turn) {
        return {
          ok: false,
          error: "Munim answered in a shape the book cannot file. Try again, or run the breakfast script.",
        };
      }
      return { ok: true, turn };
    }

    // --- xAI / Grok fallback path ---
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...data.messages.map((m) => ({
        role: (m.role === "buyer" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      })),
    ];

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 900,
        messages,
      }),
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `The counter could not reach the model (${res.status}). Try the scripted breakfast order.`,
      };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = body.choices?.[0]?.message?.content ?? "";
    const turn = parseTurn(raw);
    if (!turn) {
      return {
        ok: false,
        error: "Munim answered in a shape the book cannot file. Try again, or run the breakfast script.",
      };
    }
    return { ok: true, turn };
  });

function parseTurn(raw: string): AgentTurn | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as Partial<AgentTurn>;
    if (typeof parsed.say !== "string" || !parsed.say.trim()) return null;
    const actions = Array.isArray(parsed.actions) ? parsed.actions.filter(isAction) : [];
    return {
      say: parsed.say.trim(),
      buyer_name: typeof parsed.buyer_name === "string" ? parsed.buyer_name : undefined,
      actions,
    };
  } catch {
    return null;
  }
}

function isAction(value: unknown): value is AgentAction {
  if (!value || typeof value !== "object") return false;
  const op = (value as { op?: unknown }).op;
  if (op === "clear" || op === "quote" || op === "capture" || op === "retry") return true;
  if (op === "remove" && typeof (value as { sku?: unknown }).sku === "string") return true;
  if (op === "mandate" && typeof (value as { purpose?: unknown }).purpose === "string") return true;
  if (
    op === "add" &&
    typeof (value as { sku?: unknown }).sku === "string" &&
    typeof (value as { qty?: unknown }).qty === "number"
  ) {
    return true;
  }
  return false;
}
