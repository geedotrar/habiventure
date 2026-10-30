# HabiVenture

A gamified two-player habit tracking and mutual accountability Progressive Web App (PWA) built with **Next.js 15 (App Router)**, **React 19**, and **Supabase (PostgreSQL)**.

Designed for couples, accountability partners, or close friends to build habits together through positive reinforcement scoring, streak milestones, monthly cycles, friendly forfeit mini-games, and a full client-side demo sandbox.

---

## Live Demo & Portfolio Preview

The app includes a built-in guest sandbox at `/demo` that runs entirely in-browser using mock data (in-memory + `localStorage`). Anyone visiting via a portfolio link can explore all features—completing tasks, spinning wheels, checking streaks, and testing admin controls—without needing to configure a database or register an account.

### Demo Accounts
On the PIN entry screen, you can use the quick login buttons or enter:
- **Player A**: `1122`
- **Player B**: `3344`
- **Super Admin**: `9999`

---

## Core Features & Game Mechanics

### 1. Habit Management
- **Everyday Habits**: Daily routines that count toward both personal and partner duo streaks.
- **Weekly Habits**: Flexible targets (e.g., 2x, 3x, or custom days per week) that reset every Monday.
- **Cycle Quests**: Monthly milestone goals evaluated at the end of each cycle (+50 points).
- **Personal Habits**: Private daily habits tracked individually without affecting the partner match score.
- **Completion History**: Filterable history log showing dates, points earned, and streak milestones.

### 2. Scoring System
- **Positive Reinforcement**: +10 points per standard habit, +50 points for cycle quests. No negative deductions or penalties for missed days.
- **Team Synergy Bonus**: +10 bonus points awarded when both partners complete all their daily habits on the same calendar day.
- **Monthly Match Cycles**: Players compete friendly over a set calendar period (usually 30 days) to see who earns the highest score.

### 3. Streaks & Grace Shields
- **Dual Streaks**: Tracks both individual consistency and duo accountability concurrently.
- **Cycle Shields**: 3 automatic grace shields per player per monthly cycle. If a player misses a day, a shield is consumed to protect the streak instead of resetting it to zero.
- **Streak Ranks**: Visual flame tiers that level up every 30 days (Tier 1 Starter through Tier 7 Legend).

### 4. Interactive Mini-Games & Audio
- **Decision Wheel**: An interactive wheel to quickly settle everyday choices (what to eat, weekend plans, movie picks) with custom options, instant WhatsApp sharing, and Google Maps search.
- **Punishment Wheel**: Friendly forfeits (dinner treats, coffee, chore passes) unlocked exclusively for the monthly cycle winner to spin for the runner-up.
- **Procedural Sound Effects**: Synthesized audio clicks and victory fanfares generated in real-time via the Web Audio API—no external audio files required.

### 5. Companion Mascot
- **Mood Reactions**: Animated companion mascot that reacts dynamically (idle, thinking, celebrating, encouraging, crying) based on streak status, pending tasks, and cycle outcomes.
- **Haptic Feedback**: Vibration feedback triggered on task completion for mobile devices.

### 6. Admin Dashboard
- **PIN Authentication**: Protected admin panel for managing partner accounts and PIN updates.
- **Habit Catalog**: Create, edit, and archive habits, set frequencies, and adjust base point values.
- **Cycle Governance**: Start new cycles, manually close active cycles, declare winners, and assign forfeits.
- **Data Backup & Restore**: Export and import complete snapshots in JSON format with schema validation.

---

## Architecture & Design Decisions

### Dual Mode: Public Sandbox vs. Private Live Mode
To make the project safe for public portfolio demonstration while serving as a real, private app for daily personal use:
- **Guest / Portfolio Sandbox (`/demo`)**: Unauthenticated or untrusted visitors use an in-browser mock store. All state changes persist locally in `localStorage`, keeping production database records completely isolated.
- **Private Production Mode**: The live app connects to Supabase PostgreSQL using server-side service role queries and Row Level Security (RLS). Access requires an authorized pairing secret (`?pair_key=...`), which generates an HMAC-SHA256 session cookie for trusted devices.

```
                           Incoming Request
                                  │
                       [ Next.js Middleware ]
                                  │
               ┌──────────────────┴──────────────────┐
               │                                     │
       Has Valid Device Token?              Untrusted / Public
      (HMAC-SHA256 Cookie)                           │
               │                                     ▼
               ▼                       [ Client Sandbox Interceptor ]
   [ Supabase PostgreSQL ]                 - In-memory mock store
   - Row Level Security (RLS)              - LocalStorage persistence
   - Server-side service role              - Zero database access
   - Bcrypt PIN authentication             - Preloaded demo data
```

### Mobile-First PWA
- **Installable App**: W3C compliant manifest, maskable app icons, and custom install prompts for both iOS Safari and Android/Chromium.
- **Offline Fallback**: Service Worker caches static assets and provides an offline fallback page (`/offline.html`) when network connectivity drops.
- **Touch-Friendly UI**: Neo-brutalist dark layout optimized for one-handed mobile use with accessible touch targets.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Edge Middleware)
- **Frontend**: [React 19](https://react.dev/), TypeScript
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **Styling**: Vanilla CSS Modules with custom design tokens
- **Audio & Haptics**: Web Audio API (oscillators for synthesized audio), Vibration API
- **Testing**: [Vitest](https://vitest.dev/) (87 unit and domain tests)

---

## Project Structure

```
├── public/                 # Static assets, PWA icons, mascots, offline fallback
├── src/
│   ├── app/                # App Router pages and API routes
│   │   ├── api/            # Backend endpoints (tasks, admin, cycles, auth)
│   │   ├── demo/           # Isolated guest demo sandbox page
│   │   └── layout.tsx      # Root layout, PWA metadata, service worker registration
│   ├── components/         # UI components (Dashboard, SVG Wheels, Modals, Mascot)
│   ├── config/             # Scoring constants and template helpers
│   ├── services/           # Domain logic and data access abstraction
│   │   ├── scoreEngine.ts  # Point calculation and cycle score summaries
│   │   ├── streakEngine.ts # Streak calculations and cycle shield state machine
│   │   ├── demoStore.ts    # In-memory mock store with seed records
│   │   └── supabaseStore.ts# PostgreSQL data access layer
│   ├── types/              # TypeScript domain types and interfaces
│   └── utils/              # Cryptographic tokens, admin session verification, audio
├── supabase/
│   └── migrations/         # PostgreSQL database schema and RLS policies
└── tests/                  # 87 automated unit and domain test suites
```

---

## Getting Started

### Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/geedotrar/habiventure.git
   cd habiventure-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials and a pairing secret:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret
   TRUSTED_DEVICE_SECRET=your_random_secret_string_min_32_chars
   ```

4. **Initialize database schema**:
   Run the schema migration file in your Supabase SQL editor:
   ```
   supabase/migrations/20261025000000_fresh_schema.sql
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

### Device Pairing & Demo Mode
- **Guest / Demo Mode**: Opening `http://localhost:3000` or `http://localhost:3000/demo` directly without a pairing key runs the sandbox mode with sample data.
- **Pairing a Personal Device**: To connect a device to the live Supabase database, append your secret key once:
  ```
  http://localhost:3000/?pair_key=your_random_secret_string_min_32_chars
  ```
  The app strips the parameter from the URL immediately and sets an HTTP-only HMAC session cookie.

### Running with Docker

```bash
# Build and start container
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop container
docker compose down
```

---

## Testing

Run the test suite using Vitest:
```bash
npm test
```

Run TypeScript and linter checks:
```bash
npx tsc --noEmit
npm run lint
```

Validate production build:
```bash
npm run build
```

---

## License

MIT License. Created by [Stevan](https://stevanprb.com/).
