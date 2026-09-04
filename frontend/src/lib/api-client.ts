/**
 * Munim API Client - Connects the frontend to the Spring Boot REST API.
 */

export interface ProductDto {
  sku: string;
  name: string;
  aliases: string[];
  category: string;
  unit: string;
  packQty: number;
  packUnit: string;
  pricePaise: number;
  mrpPaise: number;
  stock: number;
  gstPct: number;
  origin: string;
  notesForAgents: string;
  substitutions: string[];
  perishable: boolean;
}

export interface MerchantDto {
  name: string;
  legal: string;
  est: number;
  address: string;
  gstin: string;
  hours: string;
  phone: string;
  munim: string;
  razorpayAccount: string;
  story: string;
}

export interface SessionStateDto {
  sessionId: string;
  buyerName: string | null;
  createdAt: string;
  cart: {
    sku: string;
    name: string;
    qty: number;
    unitPaise: number;
    gstPct: number;
    note?: string;
  }[];
  quote: {
    totalPaise: number;
    subtotalPaise: number;
    gstPaise: number;
    warnings: string[];
    blockers: string[];
  } | null;
  mandate: {
    id: string;
    buyer: string;
    purpose: string;
    maxPaise: number;
    status: string;
    reason: string;
  } | null;
  payment: {
    id: string;
    amountPaise: number;
    status: string;
    failureCode?: string;
    failureMessage?: string;
  } | null;
}

export interface EngineResultDto {
  notes: string[];
  session: SessionStateDto;
}

export interface PolicyDto {
  maxOrderPaise: number;
  autoApproveBelowPaise: number;
  dailyCapPaise: number;
  holdMinutes: number;
  maxPaymentRetries: number;
  tripNextPayment: boolean;
}

export interface AuditEventDto {
  id: string;
  kind: string;
  summary: string;
  amountPaise?: number;
  at: number;
}

export interface OrderDto {
  id: string;
  buyer: string;
  totalPaise: number;
  status: string;
  createdAt: number;
  lines: {
    sku: string;
    name: string;
    qty: number;
    unitPaise: number;
    gstPct: number;
  }[];
}

const API_BASE = ""; // Uses relative /api via Vite proxy or direct relative fetch

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${errText || res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Catalog
  async listProducts(query?: string): Promise<ProductDto[]> {
    const q = query ? `?q=${encodeURIComponent(query)}` : "";
    return apiFetch<ProductDto[]>(`/api/catalog/products${q}`);
  },

  async getMerchant(): Promise<MerchantDto> {
    return apiFetch<MerchantDto>("/api/merchant");
  },

  // Session
  async createSession(buyerName?: string): Promise<SessionStateDto> {
    return apiFetch<SessionStateDto>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ buyerName: buyerName || null }),
    });
  },

  async getSession(sessionId: string): Promise<SessionStateDto> {
    return apiFetch<SessionStateDto>(`/api/sessions/${sessionId}`);
  },

  async setBuyerName(sessionId: string, buyerName: string): Promise<SessionStateDto> {
    return apiFetch<SessionStateDto>(`/api/sessions/${sessionId}/buyer-name`, {
      method: "PATCH",
      body: JSON.stringify({ buyerName }),
    });
  },

  // Cart
  async addCartLine(sessionId: string, sku: string, qty: number, note?: string): Promise<EngineResultDto> {
    return apiFetch<EngineResultDto>(`/api/sessions/${sessionId}/cart/lines`, {
      method: "POST",
      body: JSON.stringify({ sku, qty, note }),
    });
  },

  async removeCartLine(sessionId: string, sku: string): Promise<EngineResultDto> {
    return apiFetch<EngineResultDto>(`/api/sessions/${sessionId}/cart/lines/${sku}`, {
      method: "DELETE",
    });
  },

  async clearCart(sessionId: string): Promise<EngineResultDto> {
    return apiFetch<EngineResultDto>(`/api/sessions/${sessionId}/cart`, {
      method: "DELETE",
    });
  },

  // Quote / Mandate / Capture
  async runQuote(sessionId: string): Promise<EngineResultDto> {
    return apiFetch<EngineResultDto>(`/api/sessions/${sessionId}/quote`, {
      method: "POST",
    });
  },

  async requestMandate(sessionId: string, purpose: string): Promise<EngineResultDto> {
    return apiFetch<EngineResultDto>(`/api/sessions/${sessionId}/mandate`, {
      method: "POST",
      body: JSON.stringify({ purpose }),
    });
  },

  async approveMandate(sessionId: string, mandateId: string): Promise<EngineResultDto> {
    return apiFetch<EngineResultDto>(`/api/sessions/${sessionId}/mandate/${mandateId}/approve`, {
      method: "POST",
    });
  },

  async capture(sessionId: string): Promise<EngineResultDto> {
    return apiFetch<EngineResultDto>(`/api/sessions/${sessionId}/capture`, {
      method: "POST",
    });
  },

  // Chat & Demo
  async sendChat(sessionId: string, text: string) {
    return apiFetch<{ ok: boolean; say?: string; buyerName?: string; actions?: any[]; error?: string }>(
      `/api/sessions/${sessionId}/chat`,
      {
        method: "POST",
        body: JSON.stringify({ text }),
      }
    );
  },

  async playHotelBreakfast(sessionId: string): Promise<EngineResultDto> {
    return apiFetch<EngineResultDto>(`/api/sessions/${sessionId}/demo/hotel-breakfast`, {
      method: "POST",
    });
  },

  // Policy & Audit & Orders
  async getPolicy(): Promise<PolicyDto> {
    return apiFetch<PolicyDto>("/api/policy");
  },

  async updatePolicy(patch: Partial<PolicyDto>): Promise<PolicyDto> {
    return apiFetch<PolicyDto>("/api/policy", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async restock(): Promise<void> {
    await fetch("/api/policy/restock", { method: "POST" });
  },

  async listAudit(limit = 50, sessionId?: string): Promise<AuditEventDto[]> {
    const q = sessionId ? `?limit=${limit}&sessionId=${sessionId}` : `?limit=${limit}`;
    return apiFetch<AuditEventDto[]>(`/api/audit${q}`);
  },

  async listOrders(sessionId?: string): Promise<OrderDto[]> {
    const q = sessionId ? `?sessionId=${sessionId}` : "";
    return apiFetch<OrderDto[]>(`/api/orders${q}`);
  },
};
