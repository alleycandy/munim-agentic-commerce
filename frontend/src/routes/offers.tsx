import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MERCHANT } from "@/lib/catalog";
import {
  loadOffers,
  toggleOfferStatus,
  addCustomOffer,
  type Offer,
  type OfferChannel,
} from "@/lib/offers";
import { generateOfferStrategyFn } from "@/lib/ai";
import { cn, formatInr } from "@/lib/utils";

export const Route = createFileRoute("/offers")({ component: OffersPage });

const TABS = ["Active offers", "AI assistant", "Outreach channels", "Performance"] as const;

function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(() => loadOffers());
  const [tab, setTab] = useState<(typeof TABS)[number]>("Active offers");

  // AI Assistant state
  const [aiGoal, setAiGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleToggleStatus = (id: string) => {
    const updated = toggleOfferStatus(id);
    setOffers(updated);
  };

  const handleGenerateStrategy = async (goalToUse?: string) => {
    const promptText = goalToUse || aiGoal;
    if (!promptText.trim()) return;

    setIsGenerating(true);
    setAiError(null);
    setGeneratedStrategy(null);

    try {
      const res = await generateOfferStrategyFn({ data: { goal: promptText } });
      if (res.ok) {
        setGeneratedStrategy(res.strategy);
      } else {
        setAiError(res.error || "Failed to generate offer strategy.");
      }
    } catch (err: any) {
      setAiError(err?.message || "Unexpected error generating offer strategy.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActivateGenerated = () => {
    if (!generatedStrategy) return;
    const updated = addCustomOffer({
      title: generatedStrategy.title || "Custom Commercial Offer",
      description: generatedStrategy.description || "",
      targetAudience: generatedStrategy.targetAudience || "all_buyers",
      targetLabel: generatedStrategy.targetLabel || "Target Buyers",
      channels: generatedStrategy.channels || ["agent_protocol", "whatsapp_b2b"],
      discountType: generatedStrategy.discountType || "percentage",
      discountValue: generatedStrategy.discountValue || 10,
      minOrderValuePaise: generatedStrategy.minOrderValuePaise || 200000,
      badge: generatedStrategy.badge || "AI Strategy",
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "2026-12-31",
      aiGeneratedReasoning: generatedStrategy.aiGeneratedReasoning,
      appliedCategories: generatedStrategy.appliedCategories || ["all"],
    });
    setOffers(updated);
    setGeneratedStrategy(null);
    setAiGoal("");
    setTab("Active offers");
  };

  // Metrics summary
  const activeCount = offers.filter((o) => o.status === "active").length;
  const totalImpressions = offers.reduce((acc, o) => acc + o.metrics.impressions, 0);
  const totalConversions = offers.reduce((acc, o) => acc + o.metrics.conversions, 0);
  const totalRevenuePaise = offers.reduce((acc, o) => acc + o.metrics.revenueGeneratedPaise, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">
        The shop · {MERCHANT.address} · Commercial Offers
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
        Commercial offers & incentives.
      </h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Configure automated discounts, buyer incentives, and commercial passes for autonomous agents
        and regional B2B buyers across Patna and Bihar.
      </p>

      <div className="mt-5 rounded-[16px] border border-line bg-paper-2/70 p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          Offer engine · Active rules
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Active offers automatically adjust agent protocol search pricing and inform Munim during
          counter chats. Lower authorization limits encourage high-frequency bulk procurement.
        </p>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat k="Active offers" v={String(activeCount)} />
        <Stat k="Total reach" v={totalImpressions.toLocaleString()} />
        <Stat k="Attracted orders" v={String(totalConversions)} />
        <Stat k="Offer revenue" v={formatInr(totalRevenuePaise)} />
      </dl>

      <div className="mt-8 flex gap-1 rounded-[12px] bg-paper-2 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "h-10 flex-1 rounded-[10px] text-sm transition-colors",
              tab === t ? "bg-receipt text-ink shadow-[var(--shadow-page)]" : "text-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Active offers" ? (
        <ActiveOffersSection offers={offers} onToggleStatus={handleToggleStatus} />
      ) : null}
      {tab === "AI assistant" ? (
        <AiAssistantSection
          aiGoal={aiGoal}
          setAiGoal={setAiGoal}
          isGenerating={isGenerating}
          generatedStrategy={generatedStrategy}
          aiError={aiError}
          onGenerate={handleGenerateStrategy}
          onActivate={handleActivateGenerated}
          onDiscard={() => setGeneratedStrategy(null)}
        />
      ) : null}
      {tab === "Outreach channels" ? <ChannelsSection /> : null}
      {tab === "Performance" ? <PerformanceSection /> : null}
    </main>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-[16px] bg-paper-2 px-4 py-4">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="mt-1 font-display text-2xl tabular-nums tracking-tight text-ink">{v}</dd>
    </div>
  );
}

function ActiveOffersSection({
  offers,
  onToggleStatus,
}: {
  offers: Offer[];
  onToggleStatus: (id: string) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl tracking-tight text-ink">
          Configured Offers ({offers.length})
        </h2>
        <span className="font-mono text-xs text-muted">Active rules applied to counter & aisle</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className={cn(
              "flex flex-col justify-between rounded-[16px] border p-5 transition-colors",
              offer.status === "active"
                ? "border-line bg-paper-2/90"
                : "border-line/50 bg-paper-2/40 opacity-70"
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-paper border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  {offer.badge}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleStatus(offer.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-mono transition-colors border",
                    offer.status === "active"
                      ? "border-emerald-800/20 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "border-line bg-paper text-muted hover:text-ink"
                  )}
                >
                  {offer.status === "active" ? "Active" : "Paused"}
                </button>
              </div>

              <h3 className="mt-3 font-display text-lg tracking-tight text-ink">
                {offer.title}
              </h3>
              <p className="mt-1 text-sm text-ink-soft line-clamp-2">{offer.description}</p>

              {offer.aiGeneratedReasoning && (
                <div className="mt-3 rounded-[12px] border border-line bg-paper px-3 py-2 text-xs text-muted">
                  <span className="font-mono uppercase tracking-wider text-[10px] text-ink">Strategy: </span>
                  {offer.aiGeneratedReasoning}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {offer.channels.map((ch) => (
                  <span
                    key={ch}
                    className="rounded-md bg-paper px-2 py-0.5 font-mono text-[11px] text-muted border border-line"
                  >
                    {ch.replace("_", " ")}
                  </span>
                ))}
                <span className="rounded-md bg-paper px-2 py-0.5 font-mono text-[11px] text-muted border border-line">
                  {offer.targetLabel}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-line/70 pt-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-paper p-2 border border-line/60">
                  <p className="font-mono text-[10px] text-muted">REACH</p>
                  <p className="font-display text-sm text-ink">{offer.metrics.impressions}</p>
                </div>
                <div className="rounded-lg bg-paper p-2 border border-line/60">
                  <p className="font-mono text-[10px] text-muted">ORDERS</p>
                  <p className="font-display text-sm text-ink">{offer.metrics.conversions}</p>
                </div>
                <div className="rounded-lg bg-paper p-2 border border-line/60">
                  <p className="font-mono text-[10px] text-muted">REVENUE</p>
                  <p className="font-display text-sm text-ink">{formatInr(offer.metrics.revenueGeneratedPaise)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiAssistantSection({
  aiGoal,
  setAiGoal,
  isGenerating,
  generatedStrategy,
  aiError,
  onGenerate,
  onActivate,
  onDiscard,
}: {
  aiGoal: string;
  setAiGoal: (v: string) => void;
  isGenerating: boolean;
  generatedStrategy: any;
  aiError: string | null;
  onGenerate: (goal?: string) => void;
  onActivate: () => void;
  onDiscard: () => void;
}) {
  const PRESETS = [
    "Attract 50 new highway dhabas with mustard oil bulk deals",
    "Target autonomous AI procurement agents with 5 percent instant cashback",
    "Chhath Puja festival bulk offer on Sona Masoori Rice and Cow Ghee",
    "Morning hotel breakfast package for Fraser Road guest houses",
  ];

  return (
    <div className="mt-6 rounded-[16px] border border-line bg-paper-2 p-6">
      <div className="max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
          Gemini 2.5 Flash Engine
        </span>
        <h2 className="mt-1 font-display text-2xl tracking-tight text-ink">
          AI Offer Strategy Assistant
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Describe the commercial objective or buyer segment you want to attract. The assistant
          will compute discount thresholds and communication parameters.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="font-mono text-xs text-muted">Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAiGoal(preset);
                onGenerate(preset);
              }}
              className="rounded-md bg-paper border border-line px-2.5 py-1 text-xs text-ink-soft hover:text-ink transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={aiGoal}
            onChange={(e) => setAiGoal(e.target.value)}
            placeholder="e.g. Attract 30 new sweet shops in Patna for bulk Shakkar and Besan..."
            className="flex-1 rounded-[10px] border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
          <Button
            type="button"
            onClick={() => onGenerate()}
            disabled={isGenerating || !aiGoal.trim()}
            className="rounded-[10px] bg-ink text-paper hover:bg-ink/90 text-sm font-medium px-4"
          >
            {isGenerating ? "Computing..." : "Generate offer"}
          </Button>
        </div>

        {aiError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {aiError}
          </p>
        ) : null}

        {generatedStrategy ? (
          <div className="mt-6 rounded-[16px] border border-line bg-paper p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-paper-2 border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-ink">
                {generatedStrategy.badge || "AI Strategy"}
              </span>
              <span className="font-mono text-xs text-muted">
                Target: {generatedStrategy.targetLabel}
              </span>
            </div>

            <h3 className="mt-3 font-display text-xl tracking-tight text-ink">
              {generatedStrategy.title}
            </h3>
            <p className="mt-1 text-sm text-ink-soft">{generatedStrategy.description}</p>

            <div className="mt-3 rounded-lg border border-line bg-paper-2 p-3 text-xs text-muted">
              <span className="font-mono uppercase tracking-wider text-[10px] text-ink">
                Rationale:{" "}
              </span>
              {generatedStrategy.aiGeneratedReasoning}
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-paper-2 p-2.5 border border-line/60">
                <p className="font-mono text-[10px] text-muted">DISCOUNT</p>
                <p className="font-display text-sm text-ink">
                  {generatedStrategy.discountType === "percentage"
                    ? `${generatedStrategy.discountValue}% OFF`
                    : `${formatInr(generatedStrategy.discountValue)} OFF`}
                </p>
              </div>
              <div className="rounded-lg bg-paper-2 p-2.5 border border-line/60">
                <p className="font-mono text-[10px] text-muted">MIN ORDER</p>
                <p className="font-display text-sm text-ink">
                  {formatInr(generatedStrategy.minOrderValuePaise)}
                </p>
              </div>
              <div className="rounded-lg bg-paper-2 p-2.5 border border-line/60 col-span-2 sm:col-span-1">
                <p className="font-mono text-[10px] text-muted">CHANNELS</p>
                <p className="font-mono text-xs text-ink mt-0.5">
                  {generatedStrategy.channels?.join(", ")}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={onDiscard}
                className="rounded-lg border-line text-xs"
              >
                Discard
              </Button>
              <Button
                type="button"
                onClick={onActivate}
                className="rounded-lg bg-ink text-paper hover:bg-ink/90 text-xs px-4"
              >
                Deploy offer rule
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChannelsSection() {
  const CHANNELS = [
    {
      title: "AI Buyer Agent Protocol (Machine-to-Machine)",
      description: "Broadcasts active offer pricing and authorization parameters directly to autonomous AI agents querying the catalog.",
      status: "Active & Broadcasting",
      reach: "2,300 agent queries/day",
    },
    {
      title: "WhatsApp B2B Broadcast",
      description: "Direct commercial updates sent to verified Fraser Road hotel procurement managers, caterers, and sweet shop owners.",
      status: "Ready for Dispatch",
      reach: "450 B2B contacts",
    },
    {
      title: "SMS Highway Kitchen Express",
      description: "Automated SMS alerts to highway dhaba managers along Patna Bypass and NH-30 for oil tins and pulse refills.",
      status: "Automated Weekly",
      reach: "320 registered kitchens",
    },
    {
      title: "Munim Counter Integration",
      description: "Munim's counter logic introduces active offer discounts during live negotiation turns.",
      status: "Synchronized",
      reach: "100% counter turns",
    },
  ];

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {CHANNELS.map((ch) => (
        <div key={ch.title} className="rounded-[16px] border border-line bg-paper-2 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base tracking-tight text-ink">{ch.title}</h3>
            <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {ch.status}
            </span>
          </div>
          <p className="mt-3 text-sm text-ink-soft">{ch.description}</p>
          <div className="mt-4 border-t border-line/60 pt-3 font-mono text-xs text-muted flex justify-between">
            <span>AUDIENCE REACH:</span>
            <span className="text-ink font-semibold">{ch.reach}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PerformanceSection() {
  const STAGES = [
    { name: "1. Total Catalog Impressions & Agent Scrapes", count: "5,260", pct: "100%" },
    { name: "2. Agent & Merchant Counter Inquiries", count: "834", pct: "15.8%" },
    { name: "3. Quote Building & Mandate Approvals", count: "312", pct: "5.9%" },
    { name: "4. Paid Chits & Completed Transactions", count: "202", pct: "3.8%" },
  ];

  return (
    <div className="mt-6 rounded-[16px] border border-line bg-paper-2 p-6">
      <h2 className="font-display text-xl tracking-tight text-ink">
        Commercial Offer Conversion Funnel
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Tracking how active offer rules convert initial agent queries into finalized ledger payments.
      </p>

      <div className="mt-6 space-y-4 max-w-2xl">
        {STAGES.map((s) => (
          <div key={s.name}>
            <div className="flex justify-between text-xs font-mono text-ink mb-1">
              <span>{s.name}</span>
              <span>
                {s.count} ({s.pct})
              </span>
            </div>
            <div className="h-2 rounded-full bg-paper overflow-hidden border border-line">
              <div
                className="h-full bg-ink rounded-full transition-all duration-500"
                style={{ width: s.pct }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
