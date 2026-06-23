# 🤖 BitBoard — AI-Powered Project Management Platform

> **Master Thesis Project · SRH Universität Heidelberg · Grade: 1.5**

A production-grade, full-stack SaaS platform for collaborative project management — powered by autonomous AI agents, real-time code collaboration, interactive whiteboards, and a true microservices backend.

---

## ✨ Key Features

- 🧠 **Autonomous AI Planner** — LangChain + LangGraph agents that plan tasks, break down goals, and execute multi-step workflows autonomously
- 🎨 **Real-Time Whiteboard** — collaborative infinite canvas powered by tldraw with live multi-user sync via WebSockets
- 💻 **Live Code Editor** — real-time collaborative code synchronization (CodeSync service)
- 💬 **Comment & Collaboration System** — threaded comments, mentions, and workspace activity
- 💳 **Stripe Payments** — subscription and billing management built in
- 🔐 **Google OAuth + JWT Auth** — secure authentication with disposable email detection
- 🌍 **Multi-language Support** — i18n via i18next (internationalization ready)
- 🛡️ **Security-first** — Helmet, rate limiting, GeoIP detection, user-agent analysis
- 📊 **Analytics Dashboard** — charts and reporting via Chart.js and Recharts
- 📄 **PDF Viewer** — built-in document viewing with react-pdf

---

## 🏗️ Architecture

```
BitBoard (Microservices)
│
├── frontend/                  # React 19 + TypeScript + Vite
│
└── backend/
    ├── services/
    │   ├── authService/       # Authentication, JWT, Google OAuth
    │   ├── workspaceService/  # Projects, tasks, boards, members
    │   ├── commentService/    # Threaded comments & mentions
    │   ├── ai-PlannerService/ # LangGraph autonomous AI agents
    │   └── codeSyncService/   # Real-time code collaboration
    │
    └── [RabbitMQ message bus between all services]
```

Each service is **independently deployable** and communicates asynchronously via **RabbitMQ (AMQP)**.

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Redux](https://img.shields.io/badge/Redux_Toolkit-593D88?style=for-the-badge&logo=redux&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)

### Backend (Microservices)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=python&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph_Agents-FF6F00?style=for-the-badge&logo=python&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## 🤖 AI Planner Service

The `ai-PlannerService` uses **LangGraph** to build a stateful agent graph that:

- Accepts natural language project goals from users
- Autonomously breaks goals into actionable tasks and sprints
- Uses **tool calling** to create, assign, and update tasks in the workspace
- Maintains **agent memory** across multi-step planning sessions
- Streams responses back to the frontend in real time

```
User Goal → LangGraph Agent → Tool Calls → Workspace Tasks
                ↑                               ↓
           Memory / State ←──── Reflection Loop
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- RabbitMQ instance
- MongoDB & Redis
- OpenAI API key

### Installation

```bash
# Clone the repo
git clone https://github.com/mbilalhussain15/BitBoard-Manager-v1.git
cd BitBoard-Manager-v1

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install all backend microservice dependencies
cd backend
npm install --workspaces
cd ..
```

### Running the App

```bash
# Start frontend + code-sync client concurrently
npm run dev

# Start all backend microservices
cd backend && npm start
```

### Environment Variables

Each microservice requires its own `.env` file. Example for `ai-PlannerService`:

```env
OPENAI_API_KEY=your_key_here
RABBITMQ_URL=amqp://localhost
MONGODB_URI=mongodb://localhost:27017/bitboard
REDIS_URL=redis://localhost:6379
```

---

## 📁 Project Structure

```
BitBoard-Manager-v1/
├── frontend/                   # React 19 SPA
│   ├── src/
│   │   ├── components/         # Radix UI + custom components
│   │   ├── pages/              # React Router v7 pages
│   │   ├── store/              # Redux Toolkit slices
│   │   └── i18n/               # Internationalization
├── backend/
│   └── services/
│       ├── authService/        # JWT, Google OAuth, rate limiting
│       ├── workspaceService/   # Boards, tasks, members
│       ├── commentService/     # Comments, mentions
│       ├── ai-PlannerService/  # LangChain + LangGraph agents
│       └── codeSyncService/    # WebSocket code sync
└── package.json
```

---

## 🔒 Security

- **Helmet.js** — secure HTTP headers
- **Rate limiting** — per-IP request throttling via `rate-limiter-flexible`
- **GeoIP detection** — flag suspicious login locations
- **Disposable email blocking** — prevent throwaway signups
- **JWT + Refresh tokens** — stateless, secure auth

---

## 📄 License

MIT © [Bilal Hussain](https://github.com/mbilalhussain15)
