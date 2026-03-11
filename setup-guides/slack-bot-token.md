# How to Create a Slack Bot for Client Channel Monitoring

## Step 1 — Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Name it "Business Dashboard" and pick your workspace

## Step 2 — Add Bot Scopes

1. Go to **OAuth & Permissions** in the sidebar
2. Under **Bot Token Scopes**, add:
   - `channels:history` — read messages in public channels
   - `channels:read` — list channels
   - `groups:history` — read messages in private channels
   - `groups:read` — list private channels

## Step 3 — Install to Workspace

1. Go to **Install App** in the sidebar
2. Click **Install to Workspace** and authorize
3. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

## Step 4 — Map Client Channels

Find the channel IDs for your client channels:
1. Open each client channel in Slack
2. Click the channel name at the top → scroll to the bottom of the modal
3. Copy the Channel ID

Create a JSON mapping like:
```json
{"C0ABC123":"Client Name","C0DEF456":"Another Client"}
```

## What It Does

The dashboard uses Slack to enhance the "Last Contact" field on client cards. Instead of tracking manually, it checks the most recent message in each client's channel.
