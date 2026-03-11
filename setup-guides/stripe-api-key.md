# How to Get Your Stripe API Key

## Step 1 — Log into Stripe
Go to [dashboard.stripe.com](https://dashboard.stripe.com) and log in.

## Step 2 — Go to API Keys
Click **Developers** in the top-right corner, then click **API keys** in the left sidebar.

## Step 3 — Copy Your Secret Key
You'll see two keys:
- **Publishable key** (starts with `pk_`) — you do NOT need this one
- **Secret key** (starts with `sk_`) — this is the one you need

Click **Reveal test key** to see your test key, or **Reveal live key** for production data.

> **Test vs Live:** Use `sk_test_...` while setting up to make sure everything works without touching real data. Switch to `sk_live_...` when you're ready for real numbers.

## Step 4 — Add to Your .env File
Open the `.env` file in your dashboard folder and paste:
```
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
```

## Security
- Never share your secret key publicly
- Never commit `.env` to git (it's already in `.gitignore`)
- If you accidentally expose it, rotate it immediately in Stripe Dashboard → API Keys → Roll Key
