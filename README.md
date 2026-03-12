# Business Insights Dashboard

A real-time business dashboard you run locally — powered by Claude Code.

Track your MRR, clients, pipeline, outreach, content performance, and goals in one place. Pick which sections you want. For each one, choose whether to connect a live tool or enter data manually. Skip the rest.

---

## What You Need Before Starting

1. **Claude Code** — Anthropic's AI coding tool that runs in your terminal. If you don't have it yet, install it first: [claude.ai/claude-code](https://claude.ai/claude-code)
2. **Node.js** (v18+) — The runtime that powers the dashboard server. Download from [nodejs.org](https://nodejs.org) if you don't have it.

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
- Let you pick which sections you want and how to power each one
- Help you connect your chosen tools (Stripe, GHL, Instantly, Instagram)
- Fill in starter data for manual sections
- Launch the dashboard in your browser

---

## What You Get

| Section | Tool Options | What It Shows |
|---------|-------------|---------------|
| **Revenue** | Stripe (live) · Manual | MRR, monthly revenue, month-over-month comparisons |
| **Clients** | GoHighLevel (live) · Manual | Active clients, health status, renewals |
| **Pipeline** | GoHighLevel (live) · Manual | Deal stages, win/loss rate, conversion |
| **Outreach** | Instantly.ai (live) · Manual | Emails sent, reply rate, cost per lead |
| **Content** | Instagram (live) · Manual | Followers, reach, engagement, top posts |
| **Goals** | Manual | MRR targets, weekly/monthly goals + progress |
| **Economics** | Manual | LTV, CAC, unit economics |

Pick the sections you need. Skip the rest. Add them later. Switch between live and manual anytime.

---

## Updating Your Data

**Connect a tool and it's fully automatic.** When you hook up Stripe, GoHighLevel, Instantly, or Instagram — that section pulls fresh data from the API every time you refresh. No manual entry, no copy-pasting numbers. API data is cached for 5 minutes to avoid rate limits.

**Manual sections are conversational.** For any section you don't connect to a tool, just tell Claude what changed in plain English:

- "Add a new client: Acme Corp, $2,500/mo, started today"
- "I booked 3 calls this week"
- "Move the Johnson deal from proposal to closed won, $2,400/mo"
- "Update my outreach numbers: 1,200 sent last week, 4.2% reply rate"

Claude updates `data.json` and the dashboard reflects it on the next refresh.

**You can switch anytime.** Start manual, connect a tool later — or the other way around:

- "Switch my clients section to GoHighLevel"
- "Connect Stripe to my revenue section"
- "Switch pipeline back to manual"

Claude will walk you through connecting the API key and update your config.

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
├── config.json            ← Which sections are enabled and their data source
├── .env.example           ← Shows what API keys are available
├── data.json              ← Your manual data (clients, pipeline, etc.)
├── package.json           ← Zero external dependencies
├── template/
│   ├── dashboard.html     ← The dashboard UI
│   └── server.js          ← Local server (Stripe, GHL, Instantly, IG, Slack)
└── setup-guides/
    ├── stripe-api-key.md  ← How to get your Stripe key
    ├── instagram-token.md ← How to get your Instagram token
    ├── ghl-api-key.md     ← How to get your GHL key + Location ID
    ├── instantly-api-key.md ← How to get your Instantly key
    └── slack-bot-token.md ← How to set up Slack for client tracking
```

---

## Built by [@tenfoldmarc](https://instagram.com/tenfoldmarc)

This is what I teach — using Claude Code to build real tools for your business. Not theory. Not prompts. Actual systems that save you hours every week.

Follow me on [Instagram](https://instagram.com/tenfoldmarc) or [TikTok](https://tiktok.com/@tenfoldmarc).
