# Business Insights Dashboard

A real-time business dashboard you run locally — powered by Claude Code.

Track your MRR, clients, pipeline, outreach, content performance, and goals in one place. Connects to Stripe and Instagram for live data, with manual modules for everything else.

---

## What You Need Before Starting

1. **Claude Code** — Anthropic's AI coding tool that runs in your terminal. If you don't have it yet, install it first: [claude.ai/claude-code](https://claude.ai/claude-code)
2. **Node.js** (v18+) — The runtime that powers the dashboard server. Download from [nodejs.org](https://nodejs.org) if you don't have it.
3. **A Stripe account** (optional) — Only needed if you want live revenue data
4. **An Instagram Business account** (optional) — Only needed if you want content metrics

---

## Install — 2 Steps

### Step 1: Run this in your terminal

```bash
curl -sL https://raw.githubusercontent.com/tenfoldmarc/business-dashboard/main/install.sh | bash
```

This downloads the dashboard and installs it as a Claude Code skill on your machine. Nothing is sent anywhere — it's all local.

If you'd rather do it manually:
```bash
git clone https://github.com/tenfoldmarc/business-dashboard ~/.claude/skills/business-dashboard
```

### Step 2: Open Claude Code and say:

> "Set up my business dashboard"

That's it. Claude will walk you through everything from there:
- Ask your business name
- Let you pick which modules you want (revenue, clients, pipeline, etc.)
- Help you connect Stripe and/or Instagram if you chose those
- Fill in your starter data for manual modules
- Launch the dashboard in your browser

---

## What You Get

| Module | Data Source | What It Shows |
|--------|-----------|---------------|
| **Revenue** | Stripe (live) | MRR, monthly revenue, month-over-month comparisons |
| **Content** | Instagram (live) | Followers, reach, engagement, top posts |
| **Clients** | Manual (via Claude) | Active clients, health status, renewals |
| **Pipeline** | Manual (via Claude) | Deal stages, win/loss rate, conversion |
| **Outreach** | Manual (via Claude) | Emails sent, reply rate, cost per lead |
| **Goals** | Manual (via Claude) | MRR targets, weekly/monthly goals + progress |

Pick the modules you need. Skip the rest. Add them later.

---

## Updating Your Data

For Stripe and Instagram — data updates automatically every time you refresh.

For manual modules (clients, pipeline, outreach, goals) — just tell Claude in plain English:

- "Add a new client: Acme Corp, $2,500/mo, started today"
- "I booked 3 calls this week"
- "Move the Johnson deal from proposal to closed won, $2,400/mo"
- "Update my outreach numbers: 1,200 sent last week, 4.2% reply rate"

Claude updates your data and the dashboard reflects it on the next refresh.

---

## Security

- Your API keys stay in a `.env` file on your machine — never uploaded, never shared
- The `.env` file is gitignored — won't get committed even if you fork this repo
- The dashboard server runs on `localhost` only — not accessible from the internet
- Zero external dependencies — pure Node.js, no npm install needed

---

## File Structure

```
business-dashboard/
├── README.md              ← You're here
├── install.sh             ← The installer script
├── SKILL.md               ← Claude Code skill (the interactive setup)
├── .env.example           ← Shows what API keys are needed
├── data.json              ← Your manual data (clients, pipeline, etc.)
├── package.json           ← Zero external dependencies
├── template/
│   ├── dashboard.html     ← The dashboard UI
│   └── server.js          ← Local server that talks to Stripe + Instagram
└── setup-guides/
    ├── stripe-api-key.md  ← How to get your Stripe key
    └── instagram-token.md ← How to get your Instagram token
```

---

## Built by [@tenfoldmarc](https://instagram.com/tenfoldmarc)

This is what I teach — using Claude Code to build real tools for your business. Not theory. Not prompts. Actual systems that save you hours every week.

Follow me on [Instagram](https://instagram.com/tenfoldmarc) or [TikTok](https://tiktok.com/@tenfoldmarc).
