# Munim — Agentic Commerce & Payments Counter

> **Track 01: AI Growth & Agentic Commerce**  
> *Grow merchant revenue and make traditional merchants sellable to AI buyers end-to-end.*

Munim is a full-stack agentic commerce platform built for **Rao & Sons Provisions** (a traditional grocery merchant in Camp, Pune). It enables AI Purchasing Agents to discover products, negotiate orders, request bounded payment mandates, and complete checkouts via Razorpay test mode APIs while enforcing merchant policy rules and an immutable audit tape.

---

## 🌟 Core Features

- **Conversational In-App Checkout (`/counter`)**: Talk directly to Munim (AI counter assistant) using natural language.
- **Agent-Readable Catalog (`/aisle`)**: Exposes complete machine-readable metadata (`/api/catalog/agents`) including regional aliases, GST rates, pack sizes, stock counts, and substitution rules.
- **Merchant Control Desk & Wall Rules (`/gaddi`)**: Configure shop caps, auto-approve limits, and daily spending caps.
- **Bounded & Gated Mandates**: Every transaction is capped by a strict, named buyer mandate.
- **Graceful Failure Handling**: Features a "Trip payment" lever to demonstrate automatic single-retry fallback handling when UPI payments fail at the issuer.
- **Immutable Audit Tape**: Every quote, mandate approval, capture, and warning is logged line-by-line.

---

## 🏗️ Architecture Overview

The repository is structured as a **Full-Stack Monorepo**:

```
munim-agentic-commerce/
├── backend/            # Spring Boot 3 (Java 17) REST API & Business Logic Engine
├── frontend/           # Vite + TanStack Start + React 19 UI
├── run-all.bat         # Batch script to launch backend & frontend concurrently
├── run-backend.bat     # Batch script to start Spring Boot API on port 8080
└── run-frontend.bat    # Batch script to start Vite dev server on port 3000
```

- **Backend (Port 8080)**: Spring Boot 3.3.4, Java 17, JPA/Hibernate, Flyway Migrations, PostgreSQL.
- **Frontend (Port 3000)**: React 19, Tailwind CSS, TanStack Router/Start, Zustand, Vite.

---

## 🚀 Quick Start

### Windows (One-Click)
Double-click `run-all.bat` to automatically open backend and frontend in separate terminals.

### Manual Setup

#### 1. Backend (`/backend`)
```bash
cd backend
mvn spring-boot:run
```
*Backend runs at `http://localhost:8080/api`*

#### 2. Frontend (`/frontend`)
```bash
cd frontend
npm install
npm run dev
```
*Frontend UI opens at `http://localhost:3000`*

---

## 🔗 Endpoints & Documentation

- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080/api`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **Agent Catalog JSON**: `http://localhost:8080/api/catalog/agents`
