# James — Personal AI Agent & Digital Operating System

<div align="center">

**An extensible, context-aware, tool-calling personal AI agent designed to act as an executive partner and intelligent operating system for your digital life.**

[![Node](https://img.shields.io/badge/Node.js-24+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-Relational-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)

</div>

---

## 1. Overview & Vision

James is **not just a chatbot**. It is built on the foundational architecture of an autonomous **AI Agent**:
- **Strict Separation of Concerns**: Clean boundaries between the Client UI, AI/LLM Provider layer, Agent Orchestration runtime, Relational Database, and Tool System.
- **Action Veracity**: The AI calls verified server-side tools instead of pretending to perform actions. When a task is created or memory stored, it exists in the relational database.
- **Provider Agnostic**: Unified `AIProvider` contract allowing instant switching between **Google Gemini**, **OpenAI**, **Anthropic**, and a built-in **Offline Mock Provider**.
- **User Data Isolation**: Multi-user support with JWT authentication, bcrypt password hashing, and user-scoped data access.

---

## 2. System Architecture

```text
                           ┌────────────────────────┐
                           │   React 19 Client UI   │
                           │ (Vite + Modern Dark)   │
                           └───────────┬────────────┘
                                       │ HTTP / REST / Bearer JWT
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express + TypeScript Server                     │
│                                                                        │
│  ┌──────────────────┐    ┌────────────────────┐    ┌─────────────────┐ │
│  │   Auth Router    │    │ Conversation Router│    │   Chat Router   │ │
│  │ (Bcrypt / JWT)   │    │  (CRUD + Titling)  │    │ (Orchestrator)  │ │
│  └─────────┬────────┘    └─────────┬──────────┘    └────────┬────────┘ │
│            │                       │                        │          │
│            ▼                       ▼                        ▼          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     Agent Orchestrator Service                    │ │
│  │  - Context Aggregator (User Profile + Long-term Memories)          │ │
│  │  - Structured Prompt Composer (James Persona + Time + Rules)      │ │
│  │  - Action / Tool Dispatcher (Phase 4 Foundation)                  │ │
│  └─────────────────────────────────┬─────────────────────────────────┘ │
│                                    │                                   │
│            ┌───────────────────────┴───────────────────────┐           │
│            ▼                                               ▼           │
│  ┌─────────────────────┐                         ┌───────────────────┐ │
│  │  AI Provider Layer  │                         │ Prisma ORM Client │ │
│  │  - Google Gemini    │                         │ (SQLite / Postgre)│ │
│  │  - OpenAI GPT-4o    │                         └─────────┬─────────┘ │
│  │  - Local Mock Engine│                                   │           │
│  └─────────────────────┘                                   ▼           │
│                                                   ┌──────────────────┐ │
│                                                   │ dev.db (SQLite)  │ │
│                                                   └──────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Relational Database Schema

All entities are defined in `server/prisma/schema.prisma` with foreign keys and cascade rules:

- **`User`**: Account identity (`id`, `email`, `passwordHash`, `createdAt`, `updatedAt`).
- **`Profile`**: User personalization (`name`, `preferredName`, `timezone`, `profession`, `communicationStyle`, `aiPreferences`).
- **`Conversation`**: Conversation threads (`id`, `userId`, `title`, timestamps).
- **`Message`**: Persisted dialogue history (`id`, `conversationId`, `role` [user/assistant/system], `content`).
- **`Memory`**: Persistent long-term memory facts (`id`, `userId`, `category`, `content`, `importance`).
- **`Task`**: Task lifecycle (`id`, `userId`, `title`, `description`, `status`, `priority`, `dueDate`).
- **`Reminder`**: Future scheduled events (`id`, `userId`, `taskId`, `title`, `remindAt`, `status`).
- **`ToolCall`**: Audit trail of tool invocations (`id`, `messageId`, `toolName`, `inputArgs`, `outputResult`, `status`).

---

## 4. Key Features Delivered in Phase 1

1. **Authentication & Session Security**:
   - Registration and login with bcrypt hashing.
   - JWT tokens stored in browser `localStorage` and validated on every API call.
   - Demo mode button for instant one-click onboarding.
2. **Multi-Conversation Management**:
   - Create, switch, rename, and delete conversation threads.
   - Automatic conversation title generation from the first meaningful user message.
   - Full conversation history and message search.
3. **Conversational AI Experience**:
   - Executive dark interface with custom CSS design tokens.
   - Markdown formatting with code syntax styling and 1-click clipboard copy.
   - Typing state indicators and error resilience.
4. **AI Model Abstraction**:
   - Seamless switching between `James Core (Local)` (works 100% offline without API keys), `Google Gemini 1.5 Flash`, and `OpenAI GPT-4o-mini`.
   - API keys can be configured via `.env` or set dynamically in the Settings modal.
5. **Phase 2 & Phase 3 Foundations**:
   - Interactive Tasks Modal with priority badges (Low, Medium, High, Urgent) and status toggles.
   - Interactive Long-Term Memory Modal with category tags (preference, context, instruction, project).

---

## 5. Getting Started

### Prerequisites
- Node.js `v18+` (Tested on `v24.20.0`)
- npm `v9+` (Tested on `11.19.0`)

### Installation
```bash
# From the project root (c:\Users\Maqhawe T Ngwenya\Desktop\James):
npm install
cd server && npm install
cd ../client && npm install
```

### Database Initialization
```bash
cd server
npx prisma db push
```

### Environment Configuration
Copy `.env.example` to `server/.env`:
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your_secure_32_character_jwt_secret_key
DATABASE_URL="file:./prisma/dev.db"

# AI Provider: 'mock' | 'gemini' | 'openai'
AI_PROVIDER=mock

# Optional API Keys (for live LLM inference):
GEMINI_API_KEY=
OPENAI_API_KEY=
```

### Running Locally
To launch both the server (port `4000`) and client (port `5173`) concurrently:
```bash
npm run dev
```

Or run them individually:
```bash
# Terminal 1 (Backend):
cd server
npm run dev

# Terminal 2 (Frontend):
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 6. Development Roadmap

- [x] **Phase 1: Foundation (Current)**
  - Relational schema & migrations
  - Authentication & user isolation
  - Decoupled server + client architecture
  - Multi-conversation chat with auto-titling and markdown
  - AIProvider abstraction layer (Gemini, OpenAI, Mock)
- [ ] **Phase 2: Memory & Personalization**
  - Natural language memory extraction ("Remember that...")
  - Relevance filtering and semantic memory ranking
- [ ] **Phase 3: Task Management**
  - Full natural language task creation and status tracking via dialogue
- [ ] **Phase 4: Agent & Tool System**
  - Centralized tool registry with JSON Schema parameter validation
  - Observable tool execution badges in chat stream
- [ ] **Phase 5: Automation & Reminders**
  - Background scheduler and notification dispatch
- [ ] **Phase 6: Advanced Capabilities**
  - Web search, file analysis, browser automation, code execution
