# How to Get Your Instagram Access Token

## Overview
Instagram requires an access token to pull your content metrics. This is the most complex setup step — the skill will walk you through it interactively, but here's the full manual process.

## Option A — Use the Skill (Recommended)
When running the dashboard setup skill in Claude Code, say "connect Instagram" and it will guide you through the OAuth flow step by step.

## Option B — Manual Setup

### Prerequisites
- A Facebook Developer account ([developers.facebook.com](https://developers.facebook.com))
- An Instagram Business or Creator account
- A Facebook Page connected to your Instagram account

### Step 1 — Create a Facebook App
1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Click **Create App** → choose **Business** type
3. Name it anything (e.g., "My Dashboard")
4. Add the **Instagram Graph API** product

### Step 2 — Generate a Short-Lived Token
1. Go to **Tools** → **Graph API Explorer**
2. Select your app from the dropdown
3. Click **Generate Access Token**
4. Grant permissions: `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`
5. Copy the token — this expires in 1 hour

### Step 3 — Exchange for a Long-Lived Token
Run this in your terminal (replace YOUR_TOKEN, APP_ID, and APP_SECRET):
```bash
curl "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
```
The response contains an `access_token` that lasts 60 days.

### Step 4 — Get Your Instagram User ID
```bash
curl "https://graph.instagram.com/me?fields=id,username&access_token=YOUR_LONG_TOKEN"
```
Copy the `id` value.

### Step 5 — Add to Your .env File
```
IG_ACCESS_TOKEN=your_long_lived_token_here
IG_USER_ID=your_instagram_user_id_here
```

## Token Refresh
Long-lived tokens expire after 60 days. Refresh before they expire:
```bash
curl "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=YOUR_CURRENT_TOKEN"
```

## Skip It
Instagram is optional. Your dashboard works fine without it — you just won't see the Content section.
