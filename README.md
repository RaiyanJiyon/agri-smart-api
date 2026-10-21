# 🌾 Agri-Smart Backend API

[![Continuous Integration](https://github.com/RaiyanJiyon/agri-smart-api/actions/workflows/ci.yml/badge.svg)](https://github.com/RaiyanJiyon/agri-smart-api/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-10.5.2-blue.svg)](https://pnpm.io/)
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0.3-orange.svg)](http://localhost:5000/api/v1/docs)

> A modular Node.js/TypeScript backend powering an AI-driven agricultural platform with secure authentication, farm management, AI recommendations, plant disease diagnosis, background job processing, and administrative APIs.

## 🔗 Quick Links

- **Live API:** https://agri-smart-api-meud.onrender.com/
- **API Documentation:** https://agri-smart-api-meud.onrender.com/api/v1/docs
- **GitHub Repository:** https://github.com/RaiyanJiyon/agri-smart-api
- **Architecture Documentation:** [`/docs`](./docs)

> **Deployment note:** The live API is deployed on Render's Free tier. The service may take a short time to wake up after a period of inactivity.

---

## 📌 Project Overview

**Agri-Smart API** is the backend service for an AI-powered farming platform.

The system provides RESTful APIs for farmer authentication, farm profile management, AI-powered crop recommendations, plant disease diagnosis, conversational AI assistance, dashboard metrics, and administrative operations.

The backend is designed around a modular, layered architecture using **Node.js, Express, TypeScript, MongoDB, Redis, and BullMQ**, with Docker-based development and CI validation through GitHub Actions.

### Core Engineering Focus

- Modular feature-based backend architecture
- Controller-Service-Repository separation
- Secure authentication and session management
- Asynchronous processing for long-running AI workloads
- Redis-backed queues and rate limiting
- Secure image/file handling
- Automated testing with high statement coverage
- CI validation and Docker build verification
- OpenAPI 3.0 API documentation

---

## ✨ Features & Capabilities

* **🔐 Authentication & Security**: Multi-session management, Argon2 password hashing, JWT Access & Refresh Token cookies, account recovery, rate limiting, and role-based access control (RBAC).
* **🌾 AI Crop Recommendation**: Multi-factor crop advisory based on soil NPK ratios, rainfall, pH, temperature, and atmospheric humidity.
* **🩺 Automated Plant Disease Detection**: Image diagnosis pipeline with cloud asset handling and BullMQ retry queues.
* **🤖 AI Assistant**: Conversational AI integration via Google Gemini and Mistral AI models.
* **📊 Dashboard & Metrics**: Personalized farmer metrics and activity aggregation.
* **📜 Interactive Swagger Documentation**: Native OpenAPI 3.0.3 documentation hosted at `/api/v1/docs`.
* **🐳 Container Native**: Multi-stage Docker containerization and Docker Compose orchestration.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Runtime & Language** | Node.js (v20+ LTS) / TypeScript (v6) |
| **Web Framework** | Express (v5) |
| **Database & ODM** | MongoDB / Mongoose (v9) |
| **Queue & Cache** | Redis (v7) / BullMQ (v6) |
| **Validation & Security** | Zod (v4), Helmet, Argon2 |
| **Testing & Coverage** | Vitest (v4) / v8 Coverage Engine |
| **API Documentation** | OpenAPI 3.0.3 / Swagger UI Express |
| **Package Manager** | `pnpm` (v10) |

---

## 🚀 Quick Start & Installation

### Option 1: Docker Development with Live Reload (Recommended for Dev)

Runs MongoDB, Redis, and the API container mounted with live source code reloading (`tsx watch`). The single-node MongoDB replica set is initialized automatically on startup:

```bash
# 1. Clone repository & configure environment
git clone https://github.com/RaiyanJiyon/agri-smart-api.git
cd agri-smart-api
cp .env.example .env

# 2. Start the development stack with live reloading
pnpm docker:dev:up
# Or directly with docker compose:
# docker compose -f docker-compose.dev.yml up -d

# 3. View live logs
pnpm docker:dev:logs
```

---

### Option 2: Docker Production Container (Pre-built Image)

Runs the fully compiled production image (`node dist/server.js`) without source mounts:

```bash
# Start production containers (builds dist & auto-initiates replica set)
pnpm docker:up
# Or: docker compose up -d --build
```

---

### Option 3: Manual Local Setup (Native Node.js)

```bash
# 1. Install dependencies
pnpm install

# 2. Configure Environment
cp .env.example .env

# 3. Start Local Development Server (tsx watch)
pnpm dev
```

---

## 📖 API Documentation & Swagger UI

Interactive API documentation is generated using OpenAPI 3.0.3 standards.

* **Swagger UI Route**: `http://localhost:5000/api/v1/docs`
* **Specification File**: [`src/app/docs/swagger.ts`](./src/app/docs/swagger.ts)

---

## 🧪 Testing & Code Quality

```bash
# Run unit tests
pnpm test:unit

# Run full test suite with coverage report
pnpm test:coverage

# Check code formatting (Prettier)
pnpm format:check

# Run static lint analysis (ESLint 10)
pnpm lint

# Compile TypeScript
pnpm build
```

---

## 📁 Repository Structure

```text
agri-smart-api/
├── .github/              # CI/CD Workflows, Dependabot, PR Templates
├── docs/                 # System Documentation & Architecture Specs
├── src/
│   ├── app/
│   │   ├── docs/         # OpenAPI Spec & Swagger Router
│   │   ├── jobs/         # BullMQ Background Job Workers
│   │   ├── modules/      # Feature Modules (Auth, Farm, AI, Admin, etc.)
│   │   ├── routes/       # Router Aggregator
│   │   └── shared/       # Middleware, Utils, Config, Errors, Integrations
│   ├── app.ts            # Express App Middleware Setup
│   └── server.ts         # HTTP Listener & Graceful Shutdown
├── tests/
│   ├── unit/             # Isolated Unit Test Suites
│   ├── integration/      # Repository & Database Integration Tests
│   └── e2e/              # End-to-End Endpoint Specifications
├── Dockerfile                  # Multi-stage Container Build
├── docker-compose.yml          # Production Container Stack
└── docker-compose.dev.yml      # Development Stack with Live Reload
```

---

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.