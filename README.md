# Business Insights Dashboard

A real-time business dashboard you run locally — powered by Claude Code.

Track your MRR, clients, pipeline, outreach, content performance, and goals in one place. Connects to Stripe and Instagram for live data, with manual modules for everything else.

---

## What You Get

| Module | Data Source | What It Shows |
|--------|-----------|---------------|
| **Revenue** | Stripe API | MRR, monthly revenue, month-over-month comparisons |
| **Content** | Instagram API | Followers, reach, engagement, top posts |
| **Clients** | Manual (via Claude) | Active clients, health status, renewals |
| **Pipeline** | Manual (via Claude) | Deal stages, win/loss rate, conversion |
| **Outreach** | Manual (via Claude) | Emails sent, reply rate, cost per lead |
| **Goals** | Manual (via Claude) | MRR targets, weekly/monthly goals + progress |

Pick the modules you need. Skip the rest. Add them later.

---

## Install (One Command)

```bash
curl -sL https://raw.githubusercontent.com/tenfoldmarc/business-dashboard/main/install.sh | bash
```

This installs the dashboard as a Claude Code skill. Then open Claude Code and say:

> "Set up my business dashboard"

The skill walks you through everything — business name, API keys, data entry.

---

## Manual Install

```bash
git clone https://github.com/tenfoldmarc/business-dashboard ~/.claude/skills/business-dashboard
```

Then in Claude Code: "Set up my business dashboard"

---

## Requirements

- **Node.js** (v18+) — [nodejs.org](https://nodejs.org)
- **Claude Code** — [claude.ai/claude-code](https://claude.ai/claude-code)
- **Stripe account** (optional, for Revenue module)
- **Instagram Business account** (optional, for Content module)

---

## How It Works

1. **Install** → Adds a Claude Code skill to your machine
2. **Setup** → Claude walks you through connecting your data (API keys, business info)
3. **Launch** → `node template/server.js` starts a local server
4. **View** → Open `http://localhost:3000` in your browser
5. **Update** → Tell Claude: "I closed a deal with Acme for $3K/mo" and it updates your data

---

## Updating Manual Data

Instead of editing JSON files, just talk to Claude:

- "Add a new client: Acme Corp, $2,500/mo, started today"
- "I booked 3 calls this week"
- "Move the Johnson deal from proposal to closed won, $2,400/mo"
- "Update my outreach numbers: 1,200 sent last week, 4.2% reply rate"

Claude updates `data.json` and your dashboard reflects it on the next refresh.

---

## File Structure

```
business-dashboard/
├── README.md              ← You're here
├── install.sh             ← One-liner installer
├── SKILL.md               ← Claude Code skill (interactive setup)
├── .env.example           ← Required environment variables
├── .gitignore             ← Keeps .env out of git
├── data.json              ← Manual module data (clients, pipeline, etc.)
├── package.json           ← Zero external dependencies
├── template/
│   ├── dashboard.html     ← The dashboard UI
│   └── server.js          ← Local proxy server (Stripe + IG APIs)
└── setup-guides/
    ├── stripe-api-key.md  ← How to get your Stripe key
    └── instagram-token.md ← How to get your IG token
```

---

## Security

- API keys stay in `.env` on your machine — never sent anywhere except directly to Stripe/Instagram
- `.env` is gitignored — won't get committed even if you fork this repo
- The server runs locally on `localhost` — not accessible from the internet
- No external dependencies — pure Node.js, no npm install needed

---

## Built by [@tenfoldmarc](https://instagram.com/tenfoldmarc)

This is what I teach — using Claude Code to build real tools for your business. Not theory. Not prompts. Actual systems that save you hours every week.

Want to learn more? Follow me on [Instagram](https://instagram.com/tenfoldmarc) or [TikTok](https://tiktok.com/@tenfoldmarc).
