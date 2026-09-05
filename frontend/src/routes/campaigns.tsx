import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  loadCampaigns,
  toggleCampaignStatus,
  addCustomCampaign,
  type Campaign,
  type CampaignChannel,
} from "@/lib/campaigns";
import { generateCampaignStrategyFn } from "@/lib/ai";
import { cn, formatInr } from "@/lib/utils";

export const Route = createFileRoute("/campaigns")({
  component: CampaignsPage,
});

const TABS = ["Active Campaigns", "AI Generator", "Outreach Channels", "Analytics"] as const;

function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadCampaigns());
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Active Campaigns");

  // AI Generator state
  const [aiGoal, setAiGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleToggleStatus = (id: string) => {
    const updated = toggleCampaignStatus(id);
    setCampaigns(updated);
  };

  const handleGenerateStrategy = async (goalToUse?: string) => {
    const promptText = goalToUse || aiGoal;
    if (!promptText.trim()) return;

    setIsGenerating(true);
    setAiError(null);
    setGeneratedStrategy(null);

    try {
      const res = await generateCampaignStrategyFn({ data: { goal: promptText } });
      if (res.ok) {
        setGeneratedStrategy(res.strategy);
      } else {
        setAiError(res.error || "Failed to generate campaign.");
      }
    } catch (err: any) {
      setAiError(err?.message || "Unexpected error standardizing AI strategy.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActivateGenerated = () => {
    if (!generatedStrategy) return;
    const updated = addCustomCampaign({
      title: generatedStrategy.title || "Custom AI Campaign",
      description: generatedStrategy.description || "",
      targetAudience: generatedStrategy.targetAudience || "all_buyers",
      targetLabel: generatedStrategy.targetLabel || "Target Buyers",
      channels: generatedStrategy.channels || ["agent_protocol", "whatsapp_b2b"],
      discountType: generatedStrategy.discountType || "percentage",
      discountValue: generatedStrategy.discountValue || 10,
      minOrderValuePaise: generatedStrategy.minOrderValuePaise || 200000,
      badge: generatedStrategy.badge || "✨ AI Strategy",
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "2026-12-31",
      aiGeneratedReasoning: generatedStrategy.aiGeneratedReasoning,
      appliedCategories: generatedStrategy.appliedCategories || ["all"],
    });
    setCampaigns(updated);
    setGeneratedStrategy(null);
    setAiGoal("");
    setActiveTab("Active Campaigns");
  };

  // Metrics summary
  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.metrics.impressions, 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + c.metrics.conversions, 0);
  const totalRevenuePaise = campaigns.reduce((acc, c) => acc + c.metrics.revenueGeneratedPaise, 0);
  const avgRoas = (
    campaigns.reduce((acc, c) => acc + c.metrics.roas, 0) / (campaigns.length || 1)
  ).toFixed(1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Customer Attraction & Revenue Growth Engine
          </p>
          <h1 className="mt-1 font-display text-4xl tracking-tight text-ink sm:text-5xl">
            Campaign Orchestrator
          </h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Deploy targeted AI pricing incentives, broadcast festival deals to hotels and dhabas,
            and attract autonomous AI Buyer Agents across Patna and Bihar.
          </p>
        </div>
        <Button
          onClick={() => setActiveTab("AI Generator")}
          className="self-start md:self-auto rounded-[12px] bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md transition-all hover:scale-105"
        >
          ✨ AI Campaign Assistant
        </Button>
      </div>

      {/* Metric Cards */}
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Active Campaigns" value={String(activeCount)} subtitle="Live customer magnets" />
        <StatCard title="Total Audience Reach" value={totalImpressions.toLocaleString()} subtitle="Impressions & scrapes" />
        <StatCard title="Attracted Orders" value={totalConversions.toLocaleString()} subtitle="Conversions closed" />
        <StatCard title="Campaign Revenue" value={formatInr(totalRevenuePaise)} subtitle={`Avg ROAS ${avgRoas}x`} highlight />
      </dl>

      {/* Tabs Bar */}
      <div className="mt-8 flex overflow-x-auto gap-1 rounded-[14px] bg-paper-2 p-1.5 border border-line">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 min-w-[120px] rounded-[10px] px-4 py-2.5 text-sm font-medium transition-all duration-150",
              activeTab === tab
                ? "bg-paper text-ink shadow-sm border border-line/60"
                : "text-muted hover:text-ink hover:bg-paper/40"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Active Campaigns */}
      {activeTab === "Active Campaigns" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl tracking-tight text-ink">
              All Customer Attraction Campaigns ({campaigns.length})
            </h2>
            <span className="text-xs text-muted">
              Live updates applied to Counter AI & Agent Aisle
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-[20px] border p-5 transition-all duration-200 shadow-sm",
                  camp.status === "active"
                    ? "border-amber-500/40 bg-gradient-to-br from-paper to-amber-50/20"
                    : "border-line bg-paper-2/40 opacity-75"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      {camp.badge}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(camp.id)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        camp.status === "active"
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      )}
                    >
                      {camp.status === "active" ? "🟢 Active (Click to Pause)" : "⏸️ Paused (Click to Activate)"}
                    </button>
                  </div>

                  <h3 className="mt-3 font-display text-lg tracking-tight text-ink">
                    {camp.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft line-clamp-2">
                    {camp.description}
                  </p>

                  {camp.aiGeneratedReasoning && (
                    <p className="mt-2 rounded-[10px] bg-amber-500/10 p-2 text-xs italic text-amber-900 border border-amber-500/20">
                      💡 <strong>AI Strategy:</strong> {camp.aiGeneratedReasoning}
                    </p>
                  )}

                  {/* Channel Badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {camp.channels.map((ch) => (
                      <ChannelTag key={ch} channel={ch} />
                    ))}
                    <span className="rounded-md bg-paper-2 px-2 py-0.5 text-[11px] text-muted border border-line">
                      Target: {camp.targetLabel}
                    </span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mt-4 border-t border-line/60 pt-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-paper/60 p-2">
                      <p className="text-muted text-[10px]">REACH</p>
                      <p className="font-semibold text-ink">{camp.metrics.impressions}</p>
                    </div>
                    <div className="rounded-lg bg-paper/60 p-2">
                      <p className="text-muted text-[10px]">CONVERSIONS</p>
                      <p className="font-semibold text-emerald-700">{camp.metrics.conversions} orders</p>
                    </div>
                    <div className="rounded-lg bg-paper/60 p-2">
                      <p className="text-muted text-[10px]">REVENUE LIFT</p>
                      <p className="font-semibold text-amber-700">{formatInr(camp.metrics.revenueGeneratedPaise)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: AI Generator */}
      {activeTab === "AI Generator" && (
        <div className="mt-6 rounded-[24px] border border-amber-500/30 bg-gradient-to-br from-paper via-paper to-amber-50/30 p-6 shadow-sm">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              ✨ Gemini 2.5 Flash Powered
            </span>
            <h2 className="mt-2 font-display text-2xl tracking-tight text-ink">
              AI Customer Attraction Generator
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Tell the AI what type of buyers or growth metric you want to target in Patna & Bihar.
              The Orchestrator will design a full campaign with optimal discounts, channel rules, and buyer incentives.
            </p>

            {/* Presets */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted flex items-center">Preset goals:</span>
              {[
                "Attract 50 new highway dhabas with mustard oil bulk deals",
                "Target autonomous AI procurement agents with 5% instant cashback",
                "Chhath Puja festival bulk offer on Sona Masoori Rice and Cow Ghee",
                "Morning hotel breakfast package for Fraser Road guest houses",
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setAiGoal(preset);
                    handleGenerateStrategy(preset);
                  }}
                  className="rounded-full bg-paper border border-line px-3 py-1 text-xs text-ink-soft hover:border-amber-500 hover:text-amber-800 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Prompt Form */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                placeholder="e.g. Attract 30 new sweet shops in Patna for bulk Shakkar and Besan..."
                className="flex-1 rounded-[12px] border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Button
                onClick={() => handleGenerateStrategy()}
                disabled={isGenerating || !aiGoal.trim()}
                className="rounded-[12px] bg-amber-600 hover:bg-amber-700 text-white font-medium px-5"
              >
                {isGenerating ? "Orchestrating AI..." : "Generate Campaign"}
              </Button>
            </div>

            {aiError && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                ⚠️ {aiError}
              </p>
            )}

            {/* Generated Campaign Preview Card */}
            {generatedStrategy && (
              <div className="mt-6 rounded-[20px] border border-amber-500/50 bg-paper p-5 shadow-lg animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {generatedStrategy.badge || "✨ AI Strategy"}
                  </span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Target: {generatedStrategy.targetLabel}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-xl tracking-tight text-ink">
                  {generatedStrategy.title}
                </h3>
                <p className="mt-1 text-sm text-ink-soft">
                  {generatedStrategy.description}
                </p>

                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
                  💡 <strong>Strategic Rationale:</strong> {generatedStrategy.aiGeneratedReasoning}
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg bg-paper-2 p-2.5">
                    <p className="text-muted">DISCOUNT RULE</p>
                    <p className="font-semibold text-ink">
                      {generatedStrategy.discountType === "percentage"
                        ? `${generatedStrategy.discountValue}% OFF`
                        : `${formatInr(generatedStrategy.discountValue)} OFF`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-paper-2 p-2.5">
                    <p className="text-muted">MIN ORDER</p>
                    <p className="font-semibold text-ink">
                      {formatInr(generatedStrategy.minOrderValuePaise)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-paper-2 p-2.5 col-span-2 sm:col-span-1">
                    <p className="text-muted">BROADCAST CHANNELS</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {generatedStrategy.channels?.map((ch: CampaignChannel) => (
                        <ChannelTag key={ch} channel={ch} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedStrategy(null)}
                    className="rounded-xl border-line text-xs"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={handleActivateGenerated}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4"
                  >
                    🚀 Activate & Deploy Live
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Outreach Channels */}
      {activeTab === "Outreach Channels" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ChannelCard
            icon="🤖"
            title="AI Buyer Agent Protocol (Machine-to-Machine)"
            description="Broadcasts active campaign prices and low authorization limits directly to autonomous AI agents scraping product catalogs across Bihar."
            status="Active & Broadcasting"
            reach="2,300 Agent Scrapes/day"
            color="emerald"
          />
          <ChannelCard
            icon="💬"
            title="WhatsApp B2B Broadcast"
            description="Sends direct promotional messages to verified Fraser Road hotel procurement officers, caterers, and sweet shop owners."
            status="Ready for Next Broadcast"
            reach="450 Verified B2B Numbers"
            color="green"
          />
          <ChannelCard
            icon="📲"
            title="SMS Highway Kitchen Express"
            description="Instant SMS alerts to highway dhaba managers along Patna Bypass and NH-30 for bulk oil tins and pulse refills."
            status="Automated Weekly"
            reach="320 Registered Kitchens"
            color="blue"
          />
          <ChannelCard
            icon="🧾"
            title="Munim Counter AI Integration"
            description="Munim's counter chatbot dynamically introduces active campaign discounts during live negotiation chats."
            status="Synchronized with AI Counter"
            reach="100% Live Counter Chats"
            color="amber"
          />
        </div>
      )}

      {/* Tab 4: Analytics */}
      {activeTab === "Analytics" && (
        <div className="mt-6 rounded-[20px] border border-line bg-paper p-6 shadow-sm">
          <h2 className="font-display text-xl tracking-tight text-ink">
            Customer Attraction & Conversion Funnel
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Tracking how campaign incentives convert initial agent scrapes into paid merchant chits.
          </p>

          <div className="mt-6 space-y-4 max-w-2xl">
            <FunnelStage
              stage="1. Total Campaign Impressions / Scrapes"
              count="5,260"
              percentage="100%"
              color="bg-amber-500"
            />
            <FunnelStage
              stage="2. AI Agent & Merchant Engagements"
              count="834"
              percentage="15.8%"
              color="bg-amber-600"
            />
            <FunnelStage
              stage="3. Cart Building & Counter Quotes"
              count="312"
              percentage="5.9%"
              color="bg-emerald-600"
            />
            <FunnelStage
              stage="4. Paid Chits & Completed Orders"
              count="202"
              percentage="3.8%"
              color="bg-emerald-700"
            />
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  highlight = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border p-4 transition-all",
        highlight
          ? "border-amber-500/40 bg-amber-50/30"
          : "border-line bg-paper-2/60"
      )}
    >
      <dt className="text-xs font-mono uppercase tracking-[0.16em] text-muted">{title}</dt>
      <dd className="mt-1 font-display text-2xl tracking-tight text-ink">{value}</dd>
      <p className="mt-1 text-[11px] text-muted">{subtitle}</p>
    </div>
  );
}

function ChannelTag({ channel }: { channel: CampaignChannel }) {
  const labels: Record<CampaignChannel, { label: string; icon: string }> = {
    agent_protocol: { label: "Agent Protocol", icon: "🤖" },
    whatsapp_b2b: { label: "WhatsApp B2B", icon: "💬" },
    sms_broadcast: { label: "SMS Broadcast", icon: "📲" },
    counter_popup: { label: "Counter AI", icon: "🧾" },
  };

  const info = labels[channel] || { label: channel, icon: "📢" };

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-paper border border-line px-2 py-0.5 text-[11px] font-medium text-ink-soft">
      <span>{info.icon}</span> {info.label}
    </span>
  );
}

function ChannelCard({
  icon,
  title,
  description,
  status,
  reach,
}: {
  icon: string;
  title: string;
  description: string;
  status: string;
  reach: string;
  color: string;
}) {
  return (
    <div className="rounded-[20px] border border-line bg-paper p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-display text-base tracking-tight text-ink">{title}</h3>
          <span className="inline-block text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {status}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">{description}</p>
      <div className="mt-4 border-t border-line/60 pt-3 text-xs font-mono text-muted flex justify-between">
        <span>Audience Reach:</span>
        <span className="text-ink font-semibold">{reach}</span>
      </div>
    </div>
  );
}

function FunnelStage({
  stage,
  count,
  percentage,
  color,
}: {
  stage: string;
  count: string;
  percentage: string;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-ink mb-1">
        <span>{stage}</span>
        <span>
          {count} ({percentage})
        </span>
      </div>
      <div className="h-3 rounded-full bg-paper-2 overflow-hidden border border-line">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: percentage }} />
      </div>
    </div>
  );
}
