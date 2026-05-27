# MF Tracker

A Next.js mutual fund portfolio tracker with real-time NAV data, analytics, and portfolio management.

## Features

- **Dashboard** — Portfolio overview with total invested, current value, P&L, XIRR
- **Portfolio** — Add, edit, delete holdings with typeahead fund search
- **Analytics** — NAV chart with period buttons, CAGR, volatility, Sharpe ratio, max drawdown
- **History** — Portfolio growth visualization over time
- **Look-Through** — Aggregate stock/sector exposure across all funds
- **Redemptions** — Track exits with P&L and scenario analysis
- **Import** — Bulk CSV import with 4-step wizard
- **AMFI Data** — Browse schemes and NAV data from AMFI

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL)
- Recharts
- Lucide React icons

## Setup

### 1. Supabase Project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `supabase/schema.sql`
3. Copy your Project URL and anon key from Settings → API

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import repository at [vercel.com/new](https://vercel.com/new)
3. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click Deploy

## CSV Import Format

```
scheme_code,scheme_name,units,buy_nav,buy_date,notes
119598,Parag Parikh Flexi Cap Fund,100.5,45.23,2023-01-15,SIP
120503,Mirae Asset Large Cap Fund,50.0,82.10,2023-03-01,
```
