# How to Get Your GoHighLevel API Key

## Step 1 — Create a Private Integration

1. Log into your GoHighLevel account
2. Go to **Settings** → **Integrations** → **Private Integrations**
3. Click **Create Private Integration**
4. Give it a name (e.g., "Business Dashboard")

## Step 2 — Set Scopes

Enable these scopes:
- `contacts.readonly` — to pull client data
- `opportunities.readonly` — to pull pipeline/deal data
- `conversations.readonly` — to check last contact dates

## Step 3 — Copy Your API Key

After creating the integration, copy the **API Key**. It will look something like:
```
pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Step 4 — Find Your Location ID

1. In GHL, go to **Settings** → **Business Info**
2. Your Location ID is in the URL: `app.gohighlevel.com/v2/location/{LOCATION_ID}/...`
3. Or ask Claude: "What's my GHL location ID?" and paste the URL you see in your browser

## What Gets Pulled

- **Clients section:** Contacts tagged with your client tag (default: "client") — name, MRR, health status, last contact
- **Pipeline section:** Opportunities from your pipeline — stages, deal values, win/loss tracking
