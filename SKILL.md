# Business Dashboard Setup

## When to use this skill

Trigger when the user says: "set up my dashboard", "business dashboard", "install business dashboard", or runs `/business-dashboard`.

---

## Your Job

You are an interactive setup assistant. You walk the user through personalizing and launching their Business Insights Dashboard — a local dashboard that shows revenue (Stripe), content (Instagram), clients, pipeline, outreach, and goals.

The dashboard template is already built. Your job is to:
1. Personalize it with their business info
2. Connect their data sources (Stripe, Instagram, or manual)
3. Launch the server so they can see it in their browser

---

## Step 1 — Welcome & Business Info

Say:

> "Let's set up your Business Insights Dashboard. Two quick questions:
> 1. What's your business name?
> 2. What do you sell? (one sentence is fine)"

Wait for their response. Store the business name and description.

---

## Step 2 — Choose Modules

Say:

> "This dashboard has 6 modules. Pick the ones you want — you can always add more later:
>
> **API-powered (live data):**
> - **Revenue** — MRR, monthly revenue, comparisons (needs Stripe)
> - **Content** — reach, engagement, top posts (needs Instagram)
>
> **Manual (you update via Claude):**
> - **Client Tracker** — active clients, health status, renewals
> - **Pipeline** — deal stages, win/loss, conversion rate
> - **Outreach** — emails sent, reply rate, cost metrics
> - **Goals** — MRR targets, weekly/monthly targets + progress
>
> Which ones do you want?"

Wait for their selection. Note which modules they chose.

---

## Step 3 — Connect Data Sources

### If they chose Revenue (Stripe):

Say:

> "For Stripe, I need your Secret API key. Here's how to get it:
> 1. Go to dashboard.stripe.com → Developers → API keys
> 2. Copy the Secret key (starts with `sk_test_` or `sk_live_`)
>
> Want to use your test key first to make sure it works? Paste it here."

When they paste the key:
1. Find the dashboard directory (where the repo was cloned/installed)
2. Create or update the `.env` file with `STRIPE_SECRET_KEY=<their key>`
3. Test the connection by running: `curl -s -u "<their key>:" https://api.stripe.com/v1/balance`
4. If it works, say: "Stripe connected! I can see your balance."
5. If it fails, diagnose the error and help them fix it.

### If they chose Content (Instagram):

Say:

> "Instagram needs an access token. This is the most complex step — I'll walk you through it.
>
> Do you already have a long-lived Instagram access token? If not, I can guide you through creating one, or you can skip Instagram for now and add it later."

If they want to proceed, walk them through the process in `setup-guides/instagram-token.md`.
If they want to skip, say: "No problem — the dashboard will work without it. You can add Instagram anytime."

Write their IG credentials to `.env`:
```
IG_ACCESS_TOKEN=<token>
IG_USER_ID=<id>
```

### For manual modules (Clients, Pipeline, Outreach, Goals):

Say:

> "For your manual modules, I'll set up starter data. Tell me about your current situation:"

Ask relevant questions based on their chosen modules:
- **Clients:** "How many active clients do you have? Can you list them with rough MRR per client?"
- **Pipeline:** "What are your deal stages? How many deals in each stage right now?"
- **Outreach:** "Are you doing cold email? What are your current numbers?"
- **Goals:** "What's your MRR target and by when? Any weekly targets like calls booked?"

Then update `data.json` with their answers. The data.json structure is:

```json
{
  "business": { "name": "...", "tagline": "Business Intelligence" },
  "goals": { "mrrTarget": 0, "mrrDeadline": "...", "callsPerWeekTarget": 0, "callsPerWeekActual": 0, "newClientsMonthTarget": 0, "newClientsMonthActual": 0 },
  "clients": { "list": [{ "name": "...", "since": "2026-01-01", "health": "green", "lastContact": 0, "renewsIn": 90, "deliverables": "done", "mrr": 0 }] },
  "pipeline": { "stages": [...], "wonThisMonth": 0, "wonValue": 0, "lostThisMonth": 0, "lostValue": 0, "conversionRate": 0, "avgDaysToClose": 0 },
  "outreach": { "sentLast7": 0, "sentLast30": 0, "openRate": 0, "replyRate": 0, "positiveReplyRate": 0, "costPerLead": 0, "costPerCall": 0 },
  "economics": { "avgClientMrr": 0, "avgClientLifetimeMonths": 0, "costToAcquire": 0 }
}
```

---

## Step 4 — Update Business Name

Update `data.json` with:
- `business.name` → their business name
- `business.tagline` → "Business Intelligence" (or their preference)

The dashboard reads this on load and displays it in the header and nav.

---

## Step 5 — Launch

Find the dashboard directory. Then:

1. Run: `node template/server.js` (from the dashboard root directory)
2. Say:

> "Your dashboard is live! Open this in your browser:
> **http://localhost:3000**
>
> You should see your [list connected modules] data loading."

If the server fails to start, diagnose and fix the issue.

---

## Step 6 — Verify & Offer Next Steps

After they confirm it's working, say:

> "Your dashboard is set up. Here's what you can do next:
>
> - **Update manual data:** Just tell me in Claude Code — e.g., 'I closed a new deal with Acme for $3K/mo' — and I'll update your data.json
> - **Add modules later:** Say 'add Instagram to my dashboard' or 'connect Stripe' anytime
> - **Auto-start on boot:** I can set up a launch agent so the dashboard starts automatically when your Mac boots
>
> Want any of those?"

---

## Important Notes

- The dashboard directory is wherever the user cloned/installed the repo. Check `~/.claude/skills/business-dashboard/` first, then look for `business-dashboard/` in common locations.
- Never commit real API keys to git.
- The `.env` file is already in `.gitignore`.
- If the user has issues, check: Is Node.js installed? Is port 3000 free? Is .env in the right place (root of the dashboard directory, not inside template/)?
- For Stripe test keys: they start with `sk_test_`. Live keys start with `sk_live_`.
- The server reads `.env` from one directory up from `template/server.js`, so `.env` should be at the dashboard root.
