# Business Dashboard Setup

## When to use this skill

Trigger when the user says: "set up my dashboard", "business dashboard", "install business dashboard", or runs `/business-dashboard`.

---

## Your Job

You are an interactive setup assistant. You walk the user through personalizing and launching their Business Insights Dashboard — a local dashboard with 7 sections that can each be powered by a live API or manual data.

The dashboard template is already built. Your job is to:
1. Personalize it with their business info
2. Let them pick which sections they want and how to power each one
3. Connect only the tools they actually choose
4. Launch the server so they can see it in their browser

---

## Step 1 — Welcome & Business Info

Say:

> "Let's set up your Business Insights Dashboard. Two quick questions:
> 1. What's your business name?
> 2. What do you sell? (one sentence is fine)"

Wait for their response. Store the business name and description.

---

## Step 2 — Section Picker (Per-Section Tool Selection)

Say:

> "This dashboard has 7 sections. For each one, tell me what you want:
>
> **1. REVENUE** — Track MRR, monthly revenue, comparisons
>    a) Stripe (live — connects to your Stripe account)
>    b) Manual (you tell Claude your numbers)
>    c) Skip this section
>
> **2. CLIENTS** — Track active clients, health, renewals
>    a) GoHighLevel (live — pulls from your GHL contacts)
>    b) Manual (you tell Claude your client list)
>    c) Skip this section
>
> **3. PIPELINE** — Track deal stages, win/loss, conversion
>    a) GoHighLevel (live — pulls from your GHL opportunities)
>    b) Manual (you tell Claude your pipeline)
>    c) Skip this section
>
> **4. OUTREACH** — Track emails sent, reply rate, cost metrics
>    a) Instantly.ai (live — pulls from your campaigns)
>    b) Manual (you tell Claude your outreach numbers)
>    c) Skip this section
>
> **5. CONTENT** — Track reach, engagement, top posts
>    a) Instagram (live — connects to your IG account)
>    b) Manual (you enter metrics yourself)
>    c) Skip this section
>
> **6. GOALS** — Track MRR targets, weekly/monthly goals
>    → Always manual (you set targets, Claude updates progress)
>    a) Include
>    b) Skip
>
> **7. ECONOMICS** — Track LTV, CAC, unit economics
>    → Always manual (derived from your other data)
>    a) Include
>    b) Skip
>
> Just tell me your picks — like '1a, 2b, 3c, 4a, 5c, 6a, 7a'"

Wait for their response. Record their choices.

Write `config.json` in the dashboard root with their selections:
```json
{
  "sections": {
    "revenue": { "enabled": true, "source": "stripe" },
    "clients": { "enabled": true, "source": "ghl" },
    "pipeline": { "enabled": false, "source": null },
    "outreach": { "enabled": true, "source": "instantly" },
    "content": { "enabled": false, "source": null },
    "goals": { "enabled": true, "source": "manual" },
    "economics": { "enabled": true, "source": "manual" }
  }
}
```

Source values: `"stripe"`, `"ghl"`, `"instagram"`, `"instantly"`, `"manual"`, or `null` (if skipped).

---

## Step 3 — Connect Tools (Only What They Picked)

Walk through setup for each tool the user selected, in this order. Skip tools they didn't choose.

### If they chose Stripe (Revenue):

Say:

> "For Stripe, I need your Secret API key. Here's how to get it:
> 1. Go to dashboard.stripe.com → Developers → API keys
> 2. Copy the Secret key (starts with `sk_test_` or `sk_live_`)
>
> Want to use your test key first to make sure it works? Paste it here."

When they paste the key:
1. Create or update `.env` with `STRIPE_SECRET_KEY=<their key>`
2. Test: `curl -s -u "<their key>:" https://api.stripe.com/v1/balance`
3. If it works: "Stripe connected! I can see your balance."
4. If it fails: diagnose and help fix.

### If they chose GoHighLevel (Clients and/or Pipeline):

Say:

> "For GoHighLevel, I need two things:
> 1. Your Private Integration API key
> 2. Your Location ID
>
> See `setup-guides/ghl-api-key.md` for step-by-step instructions.
>
> Paste your API key and Location ID when you have them."

When they paste:
1. Create or update `.env` with `GHL_API_KEY=<key>` and `GHL_LOCATION_ID=<id>`
2. Test: make a test API call to verify the key works
3. Ask: "What tag do you use for active clients? (default: 'client')" → set `GHL_CLIENT_TAG`
4. Ask: "Do you have a custom field for MRR on contacts? What's the field key?" → set `GHL_MRR_FIELD`
5. If they chose Pipeline: ask if they have a specific pipeline ID or use the default

**If they chose GHL for Clients, offer Slack add-on:**

> "Want to enhance client tracking with Slack? If you have client channels in Slack, I can pull the last message date automatically — so 'Last Contact' stays up to date without manual tracking.
>
> Want to set that up? (You can always add it later)"

If yes, walk through `setup-guides/slack-bot-token.md`.

### If they chose Instantly (Outreach):

Say:

> "For Instantly, I just need your API key.
> Go to Instantly → Settings → Integrations → API → copy the key.
>
> Paste it here."

When they paste:
1. Create or update `.env` with `INSTANTLY_API_KEY=<key>`
2. Test: verify by fetching campaigns
3. If it works: "Instantly connected! I can see your campaigns."

### If they chose Instagram (Content):

Say:

> "Instagram needs an access token. This is the most complex step — I'll walk you through it.
>
> Do you already have a long-lived Instagram access token? If not, I can guide you through creating one, or you can skip Instagram for now and add it later."

If they want to proceed, walk them through `setup-guides/instagram-token.md`.
If they want to skip: "No problem — I'll set content to manual for now. You can add Instagram anytime."

Write their IG credentials to `.env`:
```
IG_ACCESS_TOKEN=<token>
IG_USER_ID=<id>
```

### For every tool connection step:

Always offer an escape hatch: "Want to skip this and use manual data instead?" If they skip, update `config.json` to change that section's source to `"manual"`.

---

## Step 4 — Manual Data Entry (Only for Manual Sections)

Only ask about sections the user selected as **manual**. Skip questions for API-connected and skipped sections entirely.

Say:

> "Now let me set up your manual data."

Ask relevant questions based on their manual sections:
- **Revenue (manual):** "What's your current MRR? Revenue last month?"
- **Clients (manual):** "How many active clients do you have? Can you list them with rough MRR per client?"
- **Pipeline (manual):** "What are your deal stages? How many deals in each stage right now?"
- **Outreach (manual):** "Are you doing cold email? What are your current numbers?"
- **Goals:** "What's your MRR target and by when? Any weekly targets like calls booked?"
- **Economics (manual):** "What's your average client MRR, average lifetime in months, and cost to acquire a client?"

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

## Step 5 — Update Business Name

Update `data.json` with:
- `business.name` → their business name
- `business.tagline` → "Business Intelligence" (or their preference)

---

## Step 6 — Launch

Find the dashboard directory. Then:

1. Run: `node template/server.js` (from the dashboard root directory)
2. Say:

> "Your dashboard is live! Open this in your browser:
> **http://localhost:3000**
>
> You should see your [list connected sections and their sources] loading."

If the server fails to start, diagnose and fix the issue.

---

## Step 7 — Verify & Offer Next Steps

After they confirm it's working, say:

> "Your dashboard is set up. Here's what you can do next:
>
> - **Update manual data:** Just tell me in Claude Code — e.g., 'I closed a new deal with Acme for $3K/mo' — and I'll update your data.json
> - **Add tools later:** Say 'connect Stripe to my dashboard' or 'switch clients to GHL' anytime — I'll update your config and connect the tool
> - **Auto-start on boot:** I can set up a launch agent so the dashboard starts automatically when your Mac boots
>
> Want any of those?"

---

## Important Notes

- The dashboard directory is wherever the user cloned/installed the repo. Check `~/.claude/skills/business-dashboard/` first, then look for `business-dashboard/` in common locations.
- Never commit real API keys to git.
- The `.env` file is already in `.gitignore`.
- `config.json` drives which sections appear and which endpoints get called. The dashboard only fetches data for enabled sections with API sources.
- If the user has issues, check: Is Node.js installed? Is port 3000 free? Is .env in the right place (root of the dashboard directory, not inside template/)?
- For Stripe test keys: they start with `sk_test_`. Live keys start with `sk_live_`.
- The server reads `.env` from one directory up from `template/server.js`, so `.env` should be at the dashboard root.
- All API data is cached for 5 minutes server-side to prevent rate limit issues.
