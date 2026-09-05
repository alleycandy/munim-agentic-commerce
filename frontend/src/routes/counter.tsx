import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Receipt } from "@/components/receipt";
import { Button } from "@/components/ui/button";
import { askMunim, type AgentAction, type AgentTurn } from "@/lib/ai";
import { HOTEL_BREAKFAST } from "@/lib/demo-script";
import { useMunim } from "@/lib/store";
import { cn, formatInr } from "@/lib/utils";

export const Route = createFileRoute("/counter")({ component: CounterPage });

function CounterPage() {
  const {
    cart,
    quote,
    mandate,
    payment,
    messages,
    buyerName,
    policy,
    pushMessage,
    resetConversation,
    audit,
  } = useMunim();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy]);

  async function onSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setDraft("");
    setError(null);
    pushMessage("buyer", trimmed);
    setBusy(true);
    try {
      const state = useMunim.getState();
      const res = await askMunim({
        data: {
          messages: [...state.messages, { role: "buyer" as const, text: trimmed }].map((m) => ({
            role: m.role,
            text: m.text,
          })),
          cart: state.cart.map((l) => ({ sku: l.sku, qty: l.qty })),
          quoteTotalPaise: state.quote?.totalPaise ?? null,
          quoteBlockers: state.quote?.blockers ?? [],
          mandateStatus: state.mandate?.status ?? null,
          paymentStatus: state.payment?.status ?? null,
          lastEngineNotes: [],
          buyerName: state.buyerName,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      applyTurn(res.turn);
    } catch {
      setError("The counter lost the line. Try the breakfast script — the book still works.");
    } finally {
      setBusy(false);
    }
  }

  async function playScript() {
    if (playing) return;
    resetConversation();
    setError(null);
    setPlaying(true);
    setBusy(true);
    for (const beat of HOTEL_BREAKFAST) {
      await wait(beat.wait);
      if (beat.who !== "system") {
        useMunim.getState().pushMessage(beat.who, beat.text);
      } else {
        useMunim.getState().pushMessage("system", beat.text);
      }
      if (beat.act) applyAction(beat.act);
    }
    setPlaying(false);
    setBusy(false);
  }

  const lastAudit = audit.slice(0, 6);

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="min-w-0">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">The counter · Fraser Road, Patna · step 2 of 3</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Speak like a buyer who never walks in.</h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          You are a purchasing agent. Munim will match, disclose, quote from the book, and
          take a bounded payment. The model does not own the till.
        </p>

        <div className="mt-5 rounded-[16px] border border-line bg-paper-2/70 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            First time here?
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Press <strong className="text-ink">Run the hotel breakfast</strong> below. It plays a full
            order end-to-end (stock check → substitute → mandate → payment). Watch the receipt on the
            right update. Then try typing your own request, or go to the gaddi to change rules.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={playScript} disabled={busy} variant="ink">
            {playing ? "Breakfast order running…" : "Run the hotel breakfast"}
          </Button>
          <Button
            variant="line"
            disabled={busy}
            onClick={() => {
              resetConversation();
              setError(null);
            }}
          >
            Clear the counter
          </Button>
          <Link to="/gaddi" className="inline-flex">
            <Button variant="ghost">Next → Gaddi (step 3)</Button>
          </Link>
        </div>

        <div
          ref={scroller}
          className="mt-8 h-[min(28rem,55dvh)] overflow-y-auto rounded-[22px] bg-paper-2 p-4 sm:p-5"
        >
          {messages.length === 0 && !busy ? (
            <EmptyPrompts
              onPick={(t) => {
                setDraft(t);
                void onSend(t);
              }}
            />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <figure
                  key={m.id}
                  className={cn("max-w-[36rem]", m.role === "buyer" && "ml-auto")}
                >
                  <blockquote
                    className={cn(
                      "rounded-[18px] px-4 py-3 text-[15px] leading-snug",
                      m.role === "buyer" && "rounded-br-md bg-ink text-paper",
                      m.role === "munim" && "rounded-bl-md bg-receipt text-ink shadow-[var(--shadow-page)]",
                      m.role === "system" && "rounded-md bg-transparent px-0 font-mono text-xs text-muted",
                    )}
                  >
                    {m.text}
                  </blockquote>
                  {m.role !== "system" ? (
                    <figcaption className="mt-1 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      {m.role === "buyer" ? buyerName || "Purchasing agent" : "Munim"}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
              {busy ? (
                <p className="font-mono text-xs text-muted">Munim is looking at the shelf…</p>
              ) : null}
            </div>
          )}
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void onSend(draft);
          }}
        >
          <label className="sr-only" htmlFor="buyer-line">
            Message to Munim
          </label>
          <input
            id="buyer-line"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="8 kg thick poha, stay under two thousand…"
            className="h-12 min-w-0 flex-1 rounded-[12px] bg-receipt px-4 text-ink shadow-[0_0_0_1px_var(--color-line)] placeholder:text-faint focus:outline-none focus:shadow-[0_0_0_2px_var(--color-tide)]"
            disabled={busy}
          />
          <Button type="submit" disabled={busy || !draft.trim()} size="lg">
            Send
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-stamp">{error}</p> : null}
        <p className="mt-3 text-xs text-muted">
          Auto-approve below {formatInr(policy.autoApproveBelowPaise)}. Shop cap{" "}
          {formatInr(policy.maxOrderPaise)}. One retry.
        </p>
      </section>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Receipt
          lines={cart}
          quote={quote}
          mandate={mandate}
          payment={payment}
          buyer={buyerName}
          className="rounded-[4px]"
        />
        <div className="rounded-[16px] bg-ink px-4 py-3 text-paper">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Audit tape</p>
          <ul className="mt-2 space-y-1.5 font-mono text-[11px] leading-snug text-paper-2">
            {lastAudit.length === 0 ? (
              <li>Nothing written yet.</li>
            ) : (
              lastAudit.map((a) => (
                <li key={a.id}>
                  <span className="text-faint">{a.kind}</span> · {a.summary}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}

function EmptyPrompts({ onPick }: { onPick: (t: string) => void }) {
  const categories = [
    {
      label: "🏨 Hotels & Guest Houses",
      prompts: [
        "Hotel Surya. Breakfast for forty rooms. 8 kg thick poha, 2 litres coconut oil, 1 kg cutting chai. Under ₹2000.",
        "Patna Residency Hotel. Daily kitchen restock: 25 kg sona masoori, 5L groundnut oil, 2 kg toor dal, 1 kg turmeric. Give me the total.",
        "Hotel Maurya. Need 10 kg basmati for biryani night, 500g garam masala, 2 kg cashews for halwa. What's the damage?",
        "Clark's Inn guest house. 15 kg atta, 5L mustard oil, 3 kg chana dal, 2 packs papad. Budget ₹3000.",
        "Hotel Chanakya Patna. Monthly stock: 50 kg sugar, 10 kg moong dal, 5 kg besan, 3 kg cutting chai. Invoice it.",
        "Rajgir Eco Resort. Organic buyer — do you have cow ghee? Need 2L. Also 2 kg Assam leaf tea and 1 kg almonds.",
        "Buddha Hotel, Gaya. Pilgrimage season — need 20 kg rice, 5 kg masoor dal, 2 kg ghee, 5 kg jaggery. Festival pricing?",
      ],
    },
    {
      label: "🍽️ Dhabas & Canteens",
      prompts: [
        "Canteen order: 20 kg sona masoori, 10L groundnut oil. We can go to ₹8,000.",
        "Highway dhaba, NH31. Weekly: 10L mustard oil, 5 kg toor dal, 2 kg chilli powder, 1 kg jeera, 1 kg turmeric.",
        "Railway canteen, Patna Junction. Need 30 kg atta, 10L oil, 5 kg besan, 3 kg tea. Monthly supply.",
        "SAIL canteen, Bokaro. Bulk: 100 kg sugar, 20 kg rice, 10 kg dal. Can you deliver Tuesday?",
        "Medical college canteen. 40 kg atta, 20 kg rice, 10 kg toor dal, 5L oil. Quote with GST breakdown.",
        "Truck drivers dhaba, Hajipur. Oil, dal, atta. 10 each. Mustard oil only — coconut not for us.",
      ],
    },
    {
      label: "🏠 Households & Regulars",
      prompts: [
        "Iyer household. The usual 5 kg Lokwan atta and a jar of the May mango pickle.",
        "Sharma ji here. 2 kg sattu, 1 kg masoor dal, 500g hing — wait, do you even stock hing?",
        "Monthly kirana for a family of six. 10 kg atta, 5 kg rice, 2 kg sugar, 1L oil, 500g tea, assorted dal.",
        "Singh household. 2 packs tilkut as Sankranti gift, plus the regular — 5 kg atta and mustard oil.",
        "Verma madam's list: 1 kg moong, 1 kg chana dal, 200g chutney powder, 100g jeera, 100g dhania. Total?",
        "Jha sahib. Just sattu and gur. 2 kg sattu, 1 kg Bihar jaggery. That's it.",
      ],
    },
    {
      label: "🎉 Events & Festivals",
      prompts: [
        "Wedding catering, 500 guests. Need 50 kg basmati, 20 kg ghee, 10 kg cashews, 5 kg almonds, 5 kg raisins. Quote.",
        "Chhat Puja prasad: 5 kg til, 10 kg gur, 2 kg rice, 1 kg coconut oil. Festival special rate?",
        "Office Diwali hampers for 30 employees. Each box: tilkut, chivda, almonds, raisins. Give me cost per box.",
        "School annual function lunch — 200 kids. 20 kg rice, 10 kg dal, 5 kg atta, 3L oil. Cheap and fast.",
        "Makar Sankranti order. 5 kg tilkut, 3 kg til laddoo — wait, what do you have for Sankranti exactly?",
      ],
    },
    {
      label: "🔄 Substitution & Stock Tests",
      prompts: [
        "I need 10 kg thick poha. Any issues with stock?",
        "Coconut oil, 5 litres. If you're out, what's the alternative at similar quality?",
        "Cow ghee, 3 kg. If unavailable, do you have buffalo ghee? What's the price difference?",
        "Kashmiri chilli powder, 500g. You have it? Otherwise Guntur will do but I need to know what I'm getting.",
        "Green tea, 1 kg. Is that in stock? If not, Assam leaf tea.",
        "Tilkut, 2 kg. Is this season's batch or last year? How much stock left?",
        "Garlic pickle, 5 jars. That's your lowest stock item I think — confirm availability before I commit.",
      ],
    },
    {
      label: "💰 Budget & Negotiation",
      prompts: [
        "Total budget ₹1500. What can I get for breakfast supplies for 20 people?",
        "₹5000 budget for a week's household groceries. Suggest what to pick from your catalog.",
        "Best value oil for cooking — what gives me the most litres under ₹1000?",
        "I need dal for 100 portions. Which dal is cheapest and most filling? Budget ₹800.",
        "Compare price of 5 kg sona masoori vs 5 packs of kolam rice. Which is better deal?",
      ],
    },
    {
      label: "📋 Bulk & Commercial",
      prompts: [
        "School hostel, 80 students. Monthly supply of atta, rice, dal, oil, sugar. Give me a full quote.",
        "Nursing home kitchen. Weekly: 10 kg masoor dal, 10L mustard oil, 5 kg rava, 3 kg tea, 2 kg turmeric.",
        "Construction site canteen, 120 workers. Need cheapest calories — rice, dal, oil. 50 kg each. Total?",
        "Printing press monthly snack budget: 20 packs banana chips, 10 packs chivda, 5 packs papad. Invoice.",
        "Petrol pump dhaba. Every Monday: 5L mustard oil, 2 kg chilli powder, 1 kg jeera, 500g hing.",
      ],
    },
    {
      label: "🧪 Edge Cases",
      prompts: [
        "Do you sell items not in your catalog? I'm looking for bread.",
        "I want to return last week's lime pickle — jar was leaking. How do you handle that?",
        "Can I get credit? I'll pay next week. We're a regular buyer.",
        "Same order as last Thursday — 8 kg poha, 2L oil, 1 kg chai. Pull it from history.",
        "I need maida AND atta. What's the difference in your catalog? Which for roti, which for paratha?",
        "Is your mustard oil kachchi ghani or refined? Important for our pickle recipe.",
        "What's your GSTIN? I need the invoice for company records with full breakup.",
        "Can you split the order — 50% now, 50% next week same price?",
        "Order for Bihar Sharif food bank. 100 kg rice, 50 kg dal — do you give NGO rate?",
        "I need everything for a chhole bhature stall startup — besan, chana dal, oil, spices. What's the kit?",
      ],
    },
  ];

  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div>
      <p className="font-display text-xl">The stool is empty.</p>
      <p className="mt-2 max-w-md text-sm text-muted">
        Pick a scenario below or type your own. 50 real purchasing situations — hotels, dhabas,
        households, festivals, edge cases.
      </p>

      {/* Category tabs */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {categories.map((cat, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveCategory(i)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-[0.12em] transition-colors",
              activeCategory === i
                ? "bg-ink text-paper"
                : "bg-receipt text-muted shadow-[0_0_0_1px_var(--color-line)] hover:bg-paper",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Scenario list */}
      <ul className="mt-3 space-y-2">
        {categories[activeCategory].prompts.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onPick(p)}
              className="w-full rounded-[14px] bg-receipt px-4 py-3 text-left text-sm text-ink-soft shadow-[0_0_0_1px_var(--color-line)] transition-colors hover:bg-paper"
            >
              {p}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}


function applyTurn(turn: AgentTurn) {
  const s = useMunim.getState();
  if (turn.buyer_name) s.setBuyerName(turn.buyer_name);
  for (const action of turn.actions) applyAction(action);
  s.pushMessage("munim", turn.say);
}

function applyAction(action: AgentAction | NonNullable<(typeof HOTEL_BREAKFAST)[number]["act"]>) {
  const s = useMunim.getState();
  if (action.op === "buyerName") {
    s.setBuyerName(action.name);
    return;
  }
  if (action.op === "add") s.addLine(action.sku, action.qty, action.note);
  if (action.op === "remove") s.removeLine(action.sku);
  if (action.op === "clear") s.clearCart();
  if (action.op === "quote") s.runQuote();
  if (action.op === "mandate") s.requestMandate(action.purpose);
  if (action.op === "capture" || action.op === "retry") s.capture();
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
