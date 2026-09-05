export type CampaignChannel = "agent_protocol" | "whatsapp_b2b" | "sms_broadcast" | "counter_popup";
export type CampaignStatus = "active" | "scheduled" | "paused" | "completed";
export type CampaignTarget = "ai_agents" | "hotels_dhabas" | "halwais_caterers" | "retail_households" | "all_buyers";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  targetAudience: CampaignTarget;
  targetLabel: string;
  channels: CampaignChannel[];
  discountType: "percentage" | "fixed_amount" | "tiered_volume";
  discountValue: number; // e.g. 10 for 10%, 50000 for ₹500 in paise
  minOrderValuePaise: number;
  badge: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  metrics: {
    impressions: number;
    agentEngagements: number;
    conversions: number;
    revenueGeneratedPaise: number;
    roas: number; // Return on Ad Spend e.g. 8.4x
  };
  aiGeneratedReasoning?: string;
  appliedCategories?: string[];
}

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-chhath-2026",
    title: "Chhath Puja Mahaparv Bulk Saver",
    description: "Special festival pricing on Premium Sona Masoori Rice, Pure Cow Ghee & Shakkar for bulk buyers and temple caterers across Bihar.",
    targetAudience: "halwais_caterers",
    targetLabel: "Caterers, Temples & Families",
    channels: ["agent_protocol", "whatsapp_b2b"],
    discountType: "percentage",
    discountValue: 12,
    minOrderValuePaise: 300000, // ₹3,000
    badge: "🪔 Festival Special",
    status: "active",
    startDate: "2026-09-01",
    endDate: "2026-11-15",
    metrics: {
      impressions: 1420,
      agentEngagements: 184,
      conversions: 42,
      revenueGeneratedPaise: 18500000, // ₹1,85,000
      roas: 11.2,
    },
    aiGeneratedReasoning: "Peak demand in Bihar for Chhath Puja preparations. High ticket-size orders from community groups.",
    appliedCategories: ["rice", "ghee", "sweet", "atta"],
  },
  {
    id: "camp-hotel-morning-refill",
    title: "Hotel & Guest House Daily Refill Deal",
    description: "Automated morning bulk discount for Fraser Road & Station Road hotels ordering Thick Poha, Cutting Tea & Coconut Oil before 10 AM.",
    targetAudience: "hotels_dhabas",
    targetLabel: "Patna Hotels & Guest Houses",
    channels: ["agent_protocol"],
    discountType: "percentage",
    discountValue: 10,
    minOrderValuePaise: 150000, // ₹1,500
    badge: "🏨 B2B Morning Pass",
    status: "active",
    startDate: "2026-08-15",
    endDate: "2026-12-31",
    metrics: {
      impressions: 890,
      agentEngagements: 142,
      conversions: 38,
      revenueGeneratedPaise: 12400000, // ₹1,24,000
      roas: 9.4,
    },
    aiGeneratedReasoning: "Hotels have recurring daily purchasing routines. Offering automated AI Agent Protocol discount locks in repeat buyers.",
    appliedCategories: ["rice", "oil", "tea"],
  },
  {
    id: "camp-dhaba-mustard-oil",
    title: "Dhaba & Highway Kitchen Kachi Ghani Pass",
    description: "Flat ₹250 instant cashback on 15L Mustard Oil Tins & Fine Besan 10kg for roadside dhabas along NH-30 & Bypass Road.",
    targetAudience: "hotels_dhabas",
    targetLabel: "Highway Dhabas & Small Kitchens",
    channels: ["sms_broadcast", "whatsapp_b2b"],
    discountType: "fixed_amount",
    discountValue: 25000, // ₹250 in paise
    minOrderValuePaise: 250000, // ₹2,500
    badge: "🛢️ Kitchen Saver",
    status: "active",
    startDate: "2026-09-01",
    endDate: "2026-10-31",
    metrics: {
      impressions: 650,
      agentEngagements: 98,
      conversions: 27,
      revenueGeneratedPaise: 8900000, // ₹89,000
      roas: 7.8,
    },
    aiGeneratedReasoning: "High margin item with high repeat rate. Direct SMS broadcast to kitchen managers converts rapidly.",
    appliedCategories: ["oil", "pulse"],
  },
  {
    id: "camp-ai-agent-welcome",
    title: "AI Buyer Agent Zero-Friction Welcome Incentive",
    description: "Instant 5% extra discount + priority dispatch for any autonomous AI procurement agent placing orders via Agent Protocol.",
    targetAudience: "ai_agents",
    targetLabel: "Autonomous AI Agents",
    channels: ["agent_protocol"],
    discountType: "percentage",
    discountValue: 5,
    minOrderValuePaise: 50000, // ₹500
    badge: "🤖 AI Protocol Boost",
    status: "active",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    metrics: {
      impressions: 2300,
      agentEngagements: 410,
      conversions: 95,
      revenueGeneratedPaise: 24500000, // ₹2,45,000
      roas: 14.5,
    },
    aiGeneratedReasoning: "Attracts autonomous agent web-scrapers and buyers. Generates high-frequency zero-touch counter transactions.",
    appliedCategories: ["all"],
  },
];

const CAMPAIGNS_STORAGE_KEY = "munim_campaigns_v1";

export function loadCampaigns(): Campaign[] {
  if (typeof window === "undefined") return INITIAL_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(INITIAL_CAMPAIGNS));
      return INITIAL_CAMPAIGNS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load campaigns", e);
    return INITIAL_CAMPAIGNS;
  }
}

export function saveCampaigns(campaigns: Campaign[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error("Failed to save campaigns", e);
  }
}

export function toggleCampaignStatus(id: string): Campaign[] {
  const campaigns = loadCampaigns();
  const updated = campaigns.map((c) => {
    if (c.id === id) {
      const nextStatus: CampaignStatus = c.status === "active" ? "paused" : "active";
      return { ...c, status: nextStatus };
    }
    return c;
  });
  saveCampaigns(updated);
  return updated;
}

export function addCustomCampaign(newCamp: Omit<Campaign, "id" | "metrics">): Campaign[] {
  const campaigns = loadCampaigns();
  const fullCamp: Campaign = {
    ...newCamp,
    id: `camp-custom-${Date.now()}`,
    metrics: {
      impressions: 0,
      agentEngagements: 0,
      conversions: 0,
      revenueGeneratedPaise: 0,
      roas: 0,
    },
  };
  const updated = [fullCamp, ...campaigns];
  saveCampaigns(updated);
  return updated;
}

export function getActiveCampaigns(): Campaign[] {
  const all = loadCampaigns();
  return all.filter((c) => c.status === "active");
}
