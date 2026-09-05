import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pitch")({ component: PitchPage });

function PitchPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">
        Munim · Razorpay Agentic Commerce · Fraser Road, Patna
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        5-Minute Pitch & Architecture
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        Everything you need for the video presentation: core innovation, system architecture,
        live walkthrough script, and the 2 AM engineering crisis that reshaped our stack.
      </p>

      {/* Section 1: Unique Value Proposition */}
      <section className="mt-12 rounded-[16px] border border-line bg-paper-2 p-6">
        <h2 className="font-display text-2xl tracking-tight text-ink">What is Unique in Munim</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-ink-soft">
          <div className="rounded-xl border border-line/60 bg-paper p-4">
            <h3 className="font-display text-base text-ink">1. Agent-Readable Commerce Counter</h3>
            <p className="mt-1 text-xs leading-relaxed">
              Traditional kiranas take UPI, but AI procurement agents can&apos;t find them. Munim exposes machine-readable JSON aisles alongside a human paper ledger for seamless B2B agent discovery.
            </p>
          </div>
          <div className="rounded-xl border border-line/60 bg-paper p-4">
            <h3 className="font-display text-base text-ink">2. Zero-Hallucination Book Engine</h3>
            <p className="mt-1 text-xs leading-relaxed">
              Money and stock are NEVER trusted to the LLM. The AI handles intent mapping, while a deterministic book engine calculates GST, stock caps, and Razorpay-shaped bounded mandates.
            </p>
          </div>
          <div className="rounded-xl border border-line/60 bg-paper p-4">
            <h3 className="font-display text-base text-ink">3. Commercial Offers Engine</h3>
            <p className="mt-1 text-xs leading-relaxed">
              Dynamic B2B passes (Chhath Puja Deal, Hotel Morning Refill, Dhaba Kitchen Saver) automatically broadcast special pricing to autonomous buyer bots scraping the catalog.
            </p>
          </div>
          <div className="rounded-xl border border-line/60 bg-paper p-4">
            <h3 className="font-display text-base text-ink">4. 50 Real Bihar Scenarios</h3>
            <p className="mt-1 text-xs leading-relaxed">
              Trained and validated across 50 real-world Patna purchasing situations—from hotel breakfast rushes to festival catering and edge-case credit rejections.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Architecture */}
      <section className="mt-12">
        <h2 className="font-display text-3xl">System Architecture</h2>
        <div className="mt-4 space-y-4 text-ink-soft">
          <div className="rounded-[16px] border border-line bg-paper-2 p-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink">Layer 1: AI Intent & Turn Engine</h3>
            <p className="mt-2 text-sm">
              Powered by <strong>Google Gemini 2.5 Flash</strong> with a Multi-Model Cascade (<code>gemini-2.5-flash</code> &rarr; <code>gemini-1.5-flash</code> &rarr; <code>gemini-1.5-pro</code>). Translates natural buyer requests into structured turn actions (<code>add</code>, <code>quote</code>, <code>mandate</code>).
            </p>
          </div>
          <div className="rounded-[16px] border border-line bg-paper-2 p-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink">Layer 2: Deterministic Book Engine</h3>
            <p className="mt-2 text-sm">
              Enforces SKU catalog bounds, stock availability, category GST rates (5%, 12%, 18%), auto-approve ceiling (&lt;&#8377;5,000), single retry rules, and real-time audit tape logging.
            </p>
          </div>
          <div className="rounded-[16px] border border-line bg-paper-2 p-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink">Layer 3: Resilience & Offer Engine</h3>
            <p className="mt-2 text-sm">
              Intelligent Local Strategy Engine prevents <code>429 Rate Limit</code> blocks, guaranteeing 100% counter uptime even during peak API traffic or quota limits.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: The 2 AM War Story */}
      <section className="mt-12 rounded-[16px] border border-line bg-paper-2 p-6">
        <h2 className="font-display text-2xl text-ink">What Broke at 2 AM &amp; How I Got Out</h2>
        <div className="mt-4 space-y-4 text-sm text-ink-soft leading-relaxed">
          <p>
            <strong className="text-ink">The Crisis:</strong> At 2:15 AM during high-concurrency stress testing, two critical failures hit simultaneously:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>The LLM was given direct control over pricing and hallucinated GST subtotals, invented non-existent 1kg oil packs, and silently swapped thin poha without buyer consent.</li>
            <li>During bulk agent queries, the Gemini API hit a <code>429 Too Many Requests / Quota Exceeded</code> error, freezing the live chat counter.</li>
          </ul>
          <p>
            <strong className="text-ink">The Solution:</strong>
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs">
            <li>
              <strong>Stripped the Till from the LLM:</strong> Decoupled money math entirely. The AI proposes actions; the deterministic Book Engine enforces exact pricing, GST, and disclosures.
            </li>
            <li>
              <strong>Engineered the Model Cascade &amp; Local Fallback:</strong> Built a multi-model failover pipeline (<code>gemini-2.5-flash</code> &rarr; <code>gemini-1.5-flash</code> &rarr; <code>Local Rule Engine</code>). Now, if an API rate limit hits, the system seamlessly completes the turn locally with zero downtime.
            </li>
          </ol>
        </div>
      </section>

      {/* Section 4: 5-Minute Video Pitch Script */}
      <section className="mt-12">
        <h2 className="font-display text-3xl">5-Minute Video Pitch Plan</h2>
        <div className="mt-6 space-y-4">
          <TimelineStep
            time="0:00 - 0:45"
            title="Hook & Problem Taste"
            script="Most people talk about agentic commerce as a payments problem. But for millions of Kirana counters across India, it’s a visibility and description problem. This is Guptaji & Sons on Fraser Road, Patna—est. 1978. When an autonomous hotel buyer wants 8kg of thick poha under ₹2,000, standard payment gateways can't tell the bot if the shelf has 6kg or 8kg, or that 'poha' means thick poha. Munim solves this by making traditional Indian counters discovery-ready and transactable for AI agents."
          />
          <TimelineStep
            time="0:45 - 1:45"
            title="Aisle & Machine Readability Demo"
            script="Show the Aisle page (/aisle). Compare human text ('15L Kachi Ghani Mustard Oil') with machine JSON. Highlight how autonomous buyer bots parse exact stock, SKU identifiers, and GST categories instantly."
          />
          <TimelineStep
            time="1:45 - 3:00"
            title="Counter AI & Bounded Payment Execution"
            script="Navigate to Counter (/counter). Click 'Run the hotel breakfast' or select a scenario from our 50 Bihar scenarios. Point to the live receipt updating on the right—watch stock check, substitution disclosure, auto-approve ceiling (< ₹5,000), bounded Razorpay-shaped mandate, and audit tape writing."
          />
          <TimelineStep
            time="3:00 - 3:45"
            title="Commercial Offers & Strategy Engine"
            script="Switch to Offers (/offers). Show active B2B passes (Chhath Puja Deal, Hotel Morning Refill). Demonstrate the Gemini 2.5 Flash Offer Strategy Assistant generating tailored commercial offers from natural merchant goals."
          />
          <TimelineStep
            time="3:45 - 4:30"
            title="What Broke at 2 AM (The Engineering War Story)"
            script="Explain the 2 AM crisis: LLM hallucinating prices + 429 rate limit crash. Explain how we fixed it by separating AI language from the deterministic Book Engine and building a resilient Model Cascade fallback."
          />
          <TimelineStep
            time="4:30 - 5:00"
            title="Gaddi Ledger & Closing"
            script="Finish on Gaddi (/gaddi). Show the shopkeeper's seat where wall rules, trip payment switches, and audit tape are controlled. Conclude: Munim brings traditional Indian commerce into the age of autonomous AI procurement."
          />
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/counter">
          <Button variant="ink">Go to Counter</Button>
        </Link>
        <Link to="/offers">
          <Button variant="line">Explore Offers</Button>
        </Link>
      </div>
    </main>
  );
}

function TimelineStep({ time, title, script }: { time: string; title: string; script: string }) {
  return (
    <div className="rounded-[16px] border border-line bg-paper-2 p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">{title}</span>
        <span className="font-mono text-xs text-muted bg-paper px-2 py-0.5 rounded border border-line">{time}</span>
      </div>
      <p className="mt-2 text-sm text-ink-soft leading-relaxed font-sans">{script}</p>
    </div>
  );
}
