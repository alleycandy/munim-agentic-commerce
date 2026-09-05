export type OfferChannel = "agent_protocol" | "whatsapp_b2b" | "sms_broadcast" | "counter_popup";
export type OfferStatus = "active" | "scheduled" | "paused" | "completed";
export type OfferTarget = "ai_agents" | "hotels_dhabas" | "halwais_caterers" | "retail_households" | "all_buyers";

export interface Offer {
  id: string;
  title: string;
  description: string;
  targetAudience: OfferTarget;
  targetLabel: string;
  channels: OfferChannel[];
  discountType: "percentage" | "fixed_amount" | "tiered_volume";
  discountValue: number; // e.g. 10 for 10%, 25000 for ₹250 in paise
  minOrderValuePaise: number;
  badge: string;
  status: OfferStatus;
  startDate: string;
  endDate: string;
  metrics: {
    impressions: number;
    agentEngagements: number;
    conversions: number;
    revenueGeneratedPaise: number;
    roas: number;
  };
  aiGeneratedReasoning?: string;
  appliedCategories?: string[];
}

export const INITIAL_OFFERS: Offer[] = [
  {
    id: "off-chhath-2026",
    title: "Chhath Puja Mahaparv Bulk Saver",
    description: "Special festival pricing on Premium Sona Masoori Rice, Pure Cow Ghee & Shakkar for bulk buyers and temple caterers across Bihar.",
    targetAudience: "halwais_caterers",
    targetLabel: "Caterers, Temples & Families",
    channels: ["agent_protocol", "whatsapp_b2b"],
    discountType: "percentage",
    discountValue: 12,
    minOrderValuePaise: 300000,
    badge: "Festival Special",
    status: "active",
    startDate: "2026-09-01",
    endDate: "2026-11-15",
    metrics: {
      impressions: 1420,
      agentEngagements: 184,
      conversions: 42,
      revenueGeneratedPaise: 18500000,
      roas: 11.2,
    },
    aiGeneratedReasoning: "Peak demand in Bihar for Chhath Puja preparations. High ticket-size orders from community groups.",
    appliedCategories: ["rice", "ghee", "sweet", "atta"],
  },
  {
    id: "off-hotel-morning-refill",
    title: "Hotel & Guest House Daily Refill Deal",
    description: "Automated morning bulk discount for Fraser Road & Station Road hotels ordering Thick Poha, Coconut Oil & Tea before 10 AM.",
    targetAudience: "hotels_dhabas",
    targetLabel: "Patna Hotels & Guest Houses",
    channels: ["agent_protocol"],
    discountType: "percentage",
    discountValue: 10,
    minOrderValuePaise: 150000,
    badge: "B2B Morning Pass",
    status: "active",
    startDate: "2026-08-15",
    endDate: "2026-12-31",
    metrics: {
      impressions: 890,
      agentEngagements: 142,
      conversions: 38,
      revenueGeneratedPaise: 12400000,
      roas: 9.4,
    },
    aiGeneratedReasoning: "Hotels have recurring daily purchasing routines. Offering automated AI Agent Protocol discount locks in repeat buyers.",
    appliedCategories: ["rice", "oil", "tea"],
  },
  {
    id: "off-dhaba-mustard-oil",
    title: "Dhaba & Highway Kitchen Kachi Ghani Pass",
    description: "Flat ₹250 instant cashback on 15L Mustard Oil Tins & Fine Besan 10kg for roadside dhabas along NH-30 & Bypass Road.",
    targetAudience: "hotels_dhabas",
    targetLabel: "Highway Dhabas & Small Kitchens",
    channels: ["sms_broadcast", "whatsapp_b2b"],
    discountType: "fixed_amount",
    discountValue: 25000,
    minOrderValuePaise: 250000,
    badge: "Kitchen Saver",
    status: "active",
    startDate: "2026-09-01",
    endDate: "2026-10-31",
    metrics: {
      impressions: 650,
      agentEngagements: 98,
      conversions: 27,
      revenueGeneratedPaise: 8900000,
      roas: 7.8,
    },
    aiGeneratedReasoning: "High margin item with high repeat rate. Direct SMS broadcast to kitchen managers converts rapidly.",
    appliedCategories: ["oil", "pulse"],
  },
  {
    id: "off-ai-agent-welcome",
    title: "AI Buyer Agent Zero-Friction Welcome Incentive",
    description: "Instant 5% extra discount + priority dispatch for any autonomous AI procurement agent placing orders via Agent Protocol.",
    targetAudience: "ai_agents",
    targetLabel: "Autonomous AI Agents",
    channels: ["agent_protocol"],
    discountType: "percentage",
    discountValue: 5,
    minOrderValuePaise: 50000,
    badge: "AI Protocol Boost",
    status: "active",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    metrics: {
      impressions: 2300,
      agentEngagements: 410,
      conversions: 95,
      revenueGeneratedPaise: 24500000,
      roas: 14.5,
    },
    aiGeneratedReasoning: "Attracts autonomous agent web-scrapers and buyers. Generates high-frequency zero-touch counter transactions.",
    appliedCategories: ["all"],
  },
];

const OFFERS_STORAGE_KEY = "munim_offers_v1";

export function loadOffers(): Offer[] {
  if (typeof window === "undefined") return INITIAL_OFFERS;
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(INITIAL_OFFERS));
      return INITIAL_OFFERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load offers", e);
    return INITIAL_OFFERS;
  }
}

export function saveOffers(offers: Offer[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
  } catch (e) {
    console.error("Failed to save offers", e);
  }
}

export function toggleOfferStatus(id: string): Offer[] {
  const offers = loadOffers();
  const updated = offers.map((o) => {
    if (o.id === id) {
      const nextStatus: OfferStatus = o.status === "active" ? "paused" : "active";
      return { ...o, status: nextStatus };
    }
    return o;
  });
  saveOffers(updated);
  return updated;
}

export function addCustomOffer(newOffer: Omit<Offer, "id" | "metrics">): Offer[] {
  const offers = loadOffers();
  const fullOffer: Offer = {
    ...newOffer,
    id: `off-custom-${Date.now()}`,
    metrics: {
      impressions: 0,
      agentEngagements: 0,
      conversions: 0,
      revenueGeneratedPaise: 0,
      roas: 0,
    },
  };
  const updated = [fullOffer, ...offers];
  saveOffers(updated);
  return updated;
}

export function getActiveOffers(): Offer[] {
  const all = loadOffers();
  return all.filter((o) => o.status === "active");
}
