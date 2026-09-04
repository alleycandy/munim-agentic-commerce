# Munim backend

A Spring Boot + PostgreSQL backend for **Munim**, the agent-payments counter
at Rao & Sons (a Pune kirana store). This is a full backend port of the
original TypeScript/TanStack demo's engine: `catalog.ts`, `policy.ts`,
`payments.ts`, `store.ts`, `ai.ts`, and `demo-script.ts`. The deterministic
commerce engine (quoting, GST, agent mandates, mock Razorpay capture, audit
tape) is byte-for-byte-faithful to the original logic; the optional chat
endpoint reuses the exact system prompt and JSON turn contract, but every
action the model proposes is re-validated by the same engine a direct API
call would use — the model never touches the till directly.

## Stack

- Java 17, Spring Boot 3.3
- Spring Web, Spring Data JPA
- PostgreSQL, Flyway migrations
- springdoc-openapi (Swagger UI at `/swagger-ui.html`)

## Running it

```bash
# 1. Start Postgres
docker compose up -d db

# 2. Configure environment (edit as needed)
cp .env.example .env

# 3. Run
export $(grep -v '^#' .env | xargs)   # or use direnv / your IDE's env support
mvn spring-boot:run
```

The API listens on `http://localhost:8080`. Flyway creates the schema and
seeds the catalog, merchant, policy, and two historical demo orders on first
boot.

Without `XAI_API_KEY` set, everything works except `/chat` — use
`/demo/hotel-breakfast` to exercise the full engine (quote → mandate →
capture → order) with a recorded conversation instead of a live model call.

## Data model in one paragraph

Money is always in **paise** (`long`), never floating point. Each buyer talks
to one `ShopSession` (`POST /api/sessions`), which holds a per-session cart
and pointers to the *current* quote / mandate / payment — exactly one of
each at a time, cleared whenever the cart changes, just like the original
single-slot Zustand store. Catalog, policy, orders, and the audit tape are
shared across all sessions.

## API reference

All routes are under `/api`. Amounts are in paise unless the field name says
`_inr`.

### Catalog & merchant

| Method | Path | Notes |
|---|---|---|
| GET | `/catalog/products` | optional `?q=` full-text-ish search across name/alias/notes |
| GET | `/catalog/products/{sku}` | 404 if unknown |
| GET | `/catalog/agents` | machine-readable catalog + merchant info, for a purchasing agent |
| GET | `/merchant` | shop info |

### Policy (the wall rules)

| Method | Path | Notes |
|---|---|---|
| GET | `/policy` | |
| PATCH | `/policy` | partial update; any subset of fields |
| POST | `/policy/restock` | resets every SKU's stock to its seed level |

### Sessions

| Method | Path | Notes |
|---|---|---|
| POST | `/sessions` | body `{"buyerName": "optional"}` → `201` with full state |
| GET | `/sessions/{id}` | full state: cart, quote, mandate, payment |
| PATCH | `/sessions/{id}/buyer-name` | body `{"buyerName": "..."}` |

### Cart

| Method | Path | Notes |
|---|---|---|
| GET | `/sessions/{id}/cart` | |
| POST | `/sessions/{id}/cart/lines` | body `{"sku","qty","note?"}`; merges qty if the SKU is already on the chit |
| DELETE | `/sessions/{id}/cart/lines/{sku}` | |
| DELETE | `/sessions/{id}/cart` | clears the chit |

Any cart mutation invalidates the session's current quote/mandate/payment.

### Quote → mandate → capture

| Method | Path | Notes |
|---|---|---|
| POST | `/sessions/{id}/quote` | prices the cart from the book; returns warnings/blockers |
| POST | `/sessions/{id}/mandate` | body `{"purpose"}`; auto-approves under the policy line, holds above it, blocks if the quote is blocked |
| POST | `/sessions/{id}/mandate/{mandateId}/approve` | desk approval of a held mandate |
| POST | `/sessions/{id}/capture` | captures payment against the current mandate + quote; on success, files an order and decrements stock |
| POST | `/sessions/{id}/capture/retry` | same as capture — one retry is allowed by policy, then the engine stops |

### Orders & audit

| Method | Path | Notes |
|---|---|---|
| GET | `/orders` | optional `?sessionId=` |
| GET | `/orders/{id}` | |
| GET | `/audit?limit=50` | optional `&sessionId=`, newest first |

### Chat (optional, needs `XAI_API_KEY`)

| Method | Path | Notes |
|---|---|---|
| POST | `/sessions/{id}/chat` | body `{"text"}`; returns `{"ok":true,"turn",...}` or `{"ok":false,"error"}` — never a 5xx just because the model is unavailable |
| GET | `/sessions/{id}/messages` | full transcript |
| POST | `/sessions/{id}/demo/hotel-breakfast` | resets the session and plays the recorded script against the real engine |

## Quick walkthrough

```bash
# Create a session
SID=$(curl -s -X POST localhost:8080/api/sessions -H 'Content-Type: application/json' \
  -d '{"buyerName":"Hotel Surya purchasing agent"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')

# Add lines
curl -s -X POST localhost:8080/api/sessions/$SID/cart/lines \
  -H 'Content-Type: application/json' -d '{"sku":"POH-THK-1","qty":6}'
curl -s -X POST localhost:8080/api/sessions/$SID/cart/lines \
  -H 'Content-Type: application/json' -d '{"sku":"OIL-GNT-1","qty":2}'

# Quote, mandate, capture
curl -s -X POST localhost:8080/api/sessions/$SID/quote
curl -s -X POST localhost:8080/api/sessions/$SID/mandate \
  -H 'Content-Type: application/json' -d '{"purpose":"breakfast dry goods"}'
curl -s -X POST localhost:8080/api/sessions/$SID/capture

# See the order and the tape
curl -s localhost:8080/api/orders?sessionId=$SID
curl -s localhost:8080/api/audit?sessionId=$SID
```

Or, with no API key at all:

```bash
SID=$(curl -s -X POST localhost:8080/api/sessions | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
curl -s -X POST localhost:8080/api/sessions/$SID/demo/hotel-breakfast | python3 -m json.tool
```

## Notes on fidelity to the original

- GST is inclusive-of-price (matches `quoteCart` in `policy.ts`): `totalPaise == subtotalPaise`; `gstPaise` is informational, extracted via `round(unit*qty*gst / (100+gst))`.
- The daily cap check sums `PAID` orders since local midnight **Asia/Kolkata**, matching the shop's own clock.
- `tripNextPayment` is a one-shot policy lever for demoing a failed capture; it resets itself the moment it fires, exactly like the original store.
- The chat system prompt, JSON turn contract, and action vocabulary (`add`/`remove`/`clear`/`quote`/`mandate`/`capture`/`retry`) are unchanged from `ai.ts`; only the plumbing moved server-side.

## Production notes

- CORS is wide open (`CorsConfig`) for easy local/demo use — restrict `allowedOriginPatterns` before deploying publicly.
- `spring.jpa.hibernate.ddl-auto` is `validate`; schema changes go through Flyway (`src/main/resources/db/migration`).
- No auth layer is included — add one (API key, OAuth2 resource server, etc.) before exposing this beyond a demo.
