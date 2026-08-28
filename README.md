# 🌾 Agri-Smart Backend API

[![Continuous Integration](https://github.com/RaiyanJiyon/agri-smart-api/actions/workflows/ci.yml/badge.svg)](https://github.com/RaiyanJiyon/agri-smart-api/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-10.5.2-blue.svg)](https://pnpm.io/)
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0.3-orange.svg)](http://localhost:5000/api/v1/docs)

## 📌 Project Overview

The **Agri-Smart API** is a high-performance, modular Node.js/Express backend powering the Agri-Smart platform. It delivers real-time AI-driven agricultural recommendations, automated plant disease detection, farm profile management, interactive AI advisory assistants, and administrative platform controls.

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

### Option 1: Running with Docker Compose (Recommended)

Spin up MongoDB, Redis, and the Agri-Smart API service in containerized mode:

```bash
# 1. Clone repository
git clone https://github.com/RaiyanJiyon/agri-smart-api.git
cd agri-smart-api

# 2. Setup Environment Variables
cp .env.example .env

# 3. Start full stack with Docker Compose
pnpm docker:up
```

Access the API at `http://localhost:5000` and Swagger UI at `http://localhost:5000/api/v1/docs`.

---

### Option 2: Manual Local Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure Environment
cp .env.example .env

# 3. Start Local Development Server
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
├── Dockerfile            # Multi-stage Container Build
└── docker-compose.yml    # Development Stack Orchestration
```

---

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.