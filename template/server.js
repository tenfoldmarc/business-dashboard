// Business Dashboard — Local Server
// Run:  node server.js
// Open: http://localhost:3000

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = 3000;

// ── Load .env ────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const vars = {};
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([A-Z_]+)\s*=\s*(.+)/);
      if (m) vars[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    });
  }
  return vars;
}

const env = loadEnv();
const STRIPE_KEY    = env.STRIPE_SECRET_KEY    || process.env.STRIPE_SECRET_KEY    || '';
const IG_TOKEN      = env.IG_ACCESS_TOKEN      || process.env.IG_ACCESS_TOKEN      || '';
const IG_USER_ID    = env.IG_USER_ID           || process.env.IG_USER_ID           || '';
const GHL_API_KEY   = env.GHL_API_KEY          || process.env.GHL_API_KEY          || '';
const GHL_LOCATION  = env.GHL_LOCATION_ID      || process.env.GHL_LOCATION_ID      || '';
const GHL_CLIENT_TAG = env.GHL_CLIENT_TAG      || process.env.GHL_CLIENT_TAG       || 'client';
const GHL_MRR_FIELD  = env.GHL_MRR_FIELD       || process.env.GHL_MRR_FIELD        || 'mrr';
const GHL_PIPELINE_ID = env.GHL_PIPELINE_ID    || process.env.GHL_PIPELINE_ID      || '';
const INSTANTLY_KEY  = env.INSTANTLY_API_KEY    || process.env.INSTANTLY_API_KEY     || '';
const SLACK_TOKEN    = env.SLACK_BOT_TOKEN      || process.env.SLACK_BOT_TOKEN      || '';
const SLACK_CHANNELS = (() => {
  try { return JSON.parse(env.SLACK_CLIENT_CHANNELS || process.env.SLACK_CLIENT_CHANNELS || '{}'); }
  catch { return {}; }
})();

// Startup status
if (STRIPE_KEY)    console.log('  ✓ Stripe key loaded');
else               console.log('  ⚠ No Stripe key — revenue module will use manual data');
if (IG_TOKEN)      console.log('  ✓ Instagram token loaded');
else               console.log('  ⚠ No IG token — content module will use manual data');
if (GHL_API_KEY)   console.log('  ✓ GoHighLevel key loaded');
else               console.log('  ⚠ No GHL key — clients/pipeline will use manual data');
if (INSTANTLY_KEY) console.log('  ✓ Instantly key loaded');
else               console.log('  ⚠ No Instantly key — outreach will use manual data');
if (SLACK_TOKEN)   console.log('  ✓ Slack bot token loaded');
else               console.log('  ⚠ No Slack token — client contact tracking is manual');

// ── Cache ────────────────────────────────────────────────────────────────────

const CACHE = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = CACHE[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  CACHE[key] = { data, ts: Date.now() };
  return data;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function httpsGet(hostname, urlPath, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path: urlPath, method: 'GET', headers: headers || {} }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          resolve(parsed);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => resolve(body));
  });
}

// ── Config ───────────────────────────────────────────────────────────────────

function handleGetConfig(res) {
  const configPath = path.join(__dirname, '..', 'config.json');
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    sendJSON(res, 200, JSON.parse(content));
  } catch (e) {
    // Return default config if file doesn't exist
    sendJSON(res, 200, {
      sections: {
        revenue:   { enabled: true, source: 'manual' },
        clients:   { enabled: true, source: 'manual' },
        pipeline:  { enabled: true, source: 'manual' },
        outreach:  { enabled: true, source: 'manual' },
        content:   { enabled: false, source: null },
        goals:     { enabled: true, source: 'manual' },
        economics: { enabled: true, source: 'manual' },
      }
    });
  }
}

async function handleSaveConfig(req, res) {
  const body = await readBody(req);
  try {
    const parsed = JSON.parse(body);
    const configPath = path.join(__dirname, '..', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf8');
    sendJSON(res, 200, { ok: true });
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

// ── Stripe ───────────────────────────────────────────────────────────────────

async function stripeGet(stripePath) {
  return httpsGet('api.stripe.com', stripePath, { 'Authorization': `Bearer ${STRIPE_KEY}` });
}

async function fetchAllStripePages(basePath) {
  let all = [], startingAfter = null, hasMore = true;
  while (hasMore) {
    const sep = basePath.includes('?') ? '&' : '?';
    const url = startingAfter
      ? `${basePath}${sep}limit=100&starting_after=${startingAfter}`
      : `${basePath}${sep}limit=100`;
    const page = await stripeGet(url);
    all = all.concat(page.data || []);
    hasMore = page.has_more;
    if (hasMore && page.data?.length) startingAfter = page.data[page.data.length - 1].id;
  }
  return all;
}

async function handleStripeBalance(res) {
  if (!STRIPE_KEY) return sendJSON(res, 200, { available: false });
  const cached = getCached('stripe:balance');
  if (cached) return sendJSON(res, 200, cached);
  try {
    const balance = await stripeGet('/v1/balance');
    sendJSON(res, 200, setCache('stripe:balance', balance));
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

async function handleStripeBalanceTxns(res) {
  if (!STRIPE_KEY) return sendJSON(res, 200, { available: false, data: [] });
  const cached = getCached('stripe:txns');
  if (cached) return sendJSON(res, 200, cached);
  try {
    const txns = await fetchAllStripePages('/v1/balance_transactions');
    const result = { data: txns };
    sendJSON(res, 200, setCache('stripe:txns', result));
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

async function handleStripeSubscriptions(res) {
  if (!STRIPE_KEY) return sendJSON(res, 200, { available: false, data: [] });
  const cached = getCached('stripe:subs');
  if (cached) return sendJSON(res, 200, cached);
  try {
    const subs = await fetchAllStripePages('/v1/subscriptions?status=active');
    const result = { data: subs };
    sendJSON(res, 200, setCache('stripe:subs', result));
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

async function handleStripeDisputes(res) {
  if (!STRIPE_KEY) return sendJSON(res, 200, { available: false, data: [] });
  const cached = getCached('stripe:disputes');
  if (cached) return sendJSON(res, 200, cached);
  try {
    const disputes = await fetchAllStripePages('/v1/disputes');
    const result = { data: disputes };
    sendJSON(res, 200, setCache('stripe:disputes', result));
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

// ── Instagram ────────────────────────────────────────────────────────────────

async function handleIGAccount(res) {
  if (!IG_TOKEN) return sendJSON(res, 200, { available: false });
  const cached = getCached('ig:account');
  if (cached) return sendJSON(res, 200, cached);
  try {
    const fields = 'id,username,biography,followers_count,media_count,profile_picture_url,website,name';
    const data = await httpsGet('graph.instagram.com', `/me?fields=${fields}&access_token=${IG_TOKEN}`, {});
    sendJSON(res, 200, setCache('ig:account', data));
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

async function handleIGMedia(res) {
  if (!IG_TOKEN) return sendJSON(res, 200, { available: false, data: [] });
  const cached = getCached('ig:media');
  if (cached) return sendJSON(res, 200, cached);
  try {
    const fields = 'id,caption,media_type,timestamp,like_count,comments_count,media_url,thumbnail_url,permalink';
    const data = await httpsGet('graph.instagram.com', `/me/media?fields=${fields}&limit=50&access_token=${IG_TOKEN}`, {});
    const posts = data.data || [];
    const enriched = await Promise.all(posts.map(async post => {
      try {
        const metrics = post.media_type === 'VIDEO'
          ? 'reach,saved,views,shares,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time'
          : 'impressions,reach,saved,shares,total_interactions';
        const ins = await httpsGet('graph.instagram.com', `/${post.id}/insights?metric=${metrics}&access_token=${IG_TOKEN}`, {});
        const insMap = {};
        (ins.data || []).forEach(m => insMap[m.name] = m.values?.[0]?.value ?? m.value ?? 0);
        return { ...post, insights: insMap };
      } catch { return { ...post, insights: {} }; }
    }));
    const result = { data: enriched };
    sendJSON(res, 200, setCache('ig:media', result));
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

// ── GoHighLevel ──────────────────────────────────────────────────────────────

const GHL_HEADERS = {
  'Authorization': `Bearer ${GHL_API_KEY}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
};

async function getSlackLastMessage(channelId) {
  if (!SLACK_TOKEN || !channelId) return null;
  try {
    const data = await httpsGet('slack.com',
      `/api/conversations.history?channel=${channelId}&limit=1`,
      { 'Authorization': `Bearer ${SLACK_TOKEN}` }
    );
    if (data.ok && data.messages?.length > 0) {
      const ts = parseFloat(data.messages[0].ts) * 1000;
      return Math.floor((Date.now() - ts) / 86400000); // days ago
    }
  } catch { /* ignore */ }
  return null;
}

async function handleGHLClients(res) {
  if (!GHL_API_KEY || !GHL_LOCATION) return sendJSON(res, 200, { available: false });
  const cached = getCached('ghl:clients');
  if (cached) return sendJSON(res, 200, cached);
  try {
    // Fetch contacts with client tag
    const tagFilter = encodeURIComponent(GHL_CLIENT_TAG);
    const data = await httpsGet('services.leadconnectorhq.com',
      `/contacts/?locationId=${GHL_LOCATION}&limit=100&query=&tags=${tagFilter}`,
      GHL_HEADERS
    );
    const contacts = data.contacts || [];

    const list = await Promise.all(contacts.map(async (c) => {
      const customFields = c.customFields || [];
      const mrrField = customFields.find(f =>
        f.key === GHL_MRR_FIELD || f.id === GHL_MRR_FIELD ||
        (f.fieldKey || '').toLowerCase().includes('mrr')
      );
      const mrr = mrrField ? parseFloat(mrrField.value) || 0 : 0;

      // Determine health from tags
      let health = 'green';
      if ((c.tags || []).some(t => t.toLowerCase().includes('at-risk') || t.toLowerCase().includes('at risk'))) health = 'red';
      else if ((c.tags || []).some(t => t.toLowerCase().includes('watch') || t.toLowerCase().includes('amber'))) health = 'amber';

      // Last contact — try Slack first, fall back to GHL dateUpdated
      let lastContact = 0;
      const clientName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Unknown';

      // Check Slack for this client
      const slackChannelId = Object.entries(SLACK_CHANNELS).find(
        ([, name]) => name.toLowerCase() === clientName.toLowerCase()
      )?.[0];
      if (slackChannelId) {
        const slackDays = await getSlackLastMessage(slackChannelId);
        if (slackDays !== null) lastContact = slackDays;
      }

      if (lastContact === 0 && c.dateUpdated) {
        lastContact = Math.floor((Date.now() - new Date(c.dateUpdated).getTime()) / 86400000);
      }

      return {
        name: clientName,
        since: c.dateAdded || c.createdAt || new Date().toISOString(),
        health,
        lastContact,
        renewsIn: 0,
        deliverables: null,
        mrr,
      };
    }));

    const result = { available: true, list };
    sendJSON(res, 200, setCache('ghl:clients', result));
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

async function handleGHLPipeline(res) {
  if (!GHL_API_KEY || !GHL_LOCATION) return sendJSON(res, 200, { available: false });
  const cached = getCached('ghl:pipeline');
  if (cached) return sendJSON(res, 200, cached);
  try {
    // Get pipelines
    const pipelinesData = await httpsGet('services.leadconnectorhq.com',
      `/opportunities/pipelines?locationId=${GHL_LOCATION}`,
      GHL_HEADERS
    );
    const pipelines = pipelinesData.pipelines || [];
    const pipeline = GHL_PIPELINE_ID
      ? pipelines.find(p => p.id === GHL_PIPELINE_ID) || pipelines[0]
      : pipelines[0];

    if (!pipeline) return sendJSON(res, 200, { available: false });

    // Get opportunities for this pipeline
    const oppsData = await httpsGet('services.leadconnectorhq.com',
      `/opportunities/search?locationId=${GHL_LOCATION}&pipelineId=${pipeline.id}&limit=100`,
      GHL_HEADERS
    );
    const opportunities = oppsData.opportunities || [];

    // Build stages from pipeline definition
    const pipelineStages = pipeline.stages || [];
    const stageMap = {};
    pipelineStages.forEach(s => { stageMap[s.id] = { name: s.name, count: 0, value: 0 }; });

    // Aggregate opportunities per stage
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    let wonThisMonth = 0, wonValue = 0, lostThisMonth = 0, lostValue = 0;
    let totalWon = 0, totalDeals = opportunities.length;
    let totalDaysToClose = 0, closedCount = 0;

    opportunities.forEach(opp => {
      const stageId = opp.pipelineStageId || opp.stageId;
      if (stageMap[stageId]) {
        stageMap[stageId].count++;
        stageMap[stageId].value += opp.monetaryValue || 0;
      }

      const status = (opp.status || '').toLowerCase();
      const updated = new Date(opp.dateUpdated || opp.updatedAt || 0);
      const created = new Date(opp.dateAdded || opp.createdAt || 0);

      if (status === 'won') {
        totalWon++;
        if (updated.getMonth() === thisMonth && updated.getFullYear() === thisYear) {
          wonThisMonth++;
          wonValue += opp.monetaryValue || 0;
        }
        const daysToClose = Math.floor((updated - created) / 86400000);
        if (daysToClose > 0) { totalDaysToClose += daysToClose; closedCount++; }
      } else if (status === 'lost') {
        if (updated.getMonth() === thisMonth && updated.getFullYear() === thisYear) {
          lostThisMonth++;
          lostValue += opp.monetaryValue || 0;
        }
      }
    });

    const stages = pipelineStages.map(s => stageMap[s.id] || { name: s.name, count: 0, value: 0 });
    const conversionRate = totalDeals > 0 ? Math.round((totalWon / totalDeals) * 100) : 0;
    const avgDaysToClose = closedCount > 0 ? Math.round(totalDaysToClose / closedCount) : 0;

    const result = {
      available: true,
      stages,
      wonThisMonth,
      wonValue,
      lostThisMonth,
      lostValue,
      conversionRate,
      avgDaysToClose,
    };
    sendJSON(res, 200, setCache('ghl:pipeline', result));
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

// ── Instantly ────────────────────────────────────────────────────────────────

async function handleInstantlyOutreach(res) {
  if (!INSTANTLY_KEY) return sendJSON(res, 200, { available: false });
  const cached = getCached('instantly:outreach');
  if (cached) return sendJSON(res, 200, cached);
  try {
    // Get campaigns
    const campaignsData = await httpsGet('api.instantly.ai',
      '/api/v2/campaigns?limit=100',
      { 'Authorization': `Bearer ${INSTANTLY_KEY}` }
    );
    const campaigns = campaignsData.items || campaignsData.data || campaignsData || [];

    let totalSent = 0, totalOpened = 0, totalReplied = 0;
    let sent7 = 0, sent30 = 0;
    const now = Date.now();
    const day7 = 7 * 86400000;
    const day30 = 30 * 86400000;

    // Get analytics for each campaign
    for (const campaign of (Array.isArray(campaigns) ? campaigns : [])) {
      const cId = campaign.id;
      if (!cId) continue;
      try {
        const analytics = await httpsGet('api.instantly.ai',
          `/api/v2/campaigns/${cId}/analytics`,
          { 'Authorization': `Bearer ${INSTANTLY_KEY}` }
        );

        const sent = analytics.emails_sent || analytics.sent || 0;
        const opened = analytics.emails_opened || analytics.opened || 0;
        const replied = analytics.emails_replied || analytics.replied || 0;

        totalSent += sent;
        totalOpened += opened;
        totalReplied += replied;

        // Estimate 7d/30d split from campaign dates
        const startDate = new Date(campaign.start_date || campaign.created_at || 0).getTime();
        const campaignAge = now - startDate;
        if (campaignAge <= day7) { sent7 += sent; }
        else if (campaignAge <= day30) { sent30 += sent; sent7 += Math.round(sent * (day7 / campaignAge)); }
        else { sent30 += Math.round(sent * (day30 / campaignAge)); sent7 += Math.round(sent * (day7 / campaignAge)); }
      } catch { /* skip failed campaign */ }
    }

    if (sent30 === 0) sent30 = totalSent; // fallback
    if (sent7 === 0 && totalSent > 0) sent7 = Math.round(totalSent / 4); // rough estimate

    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0;
    const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0;

    const result = {
      available: true,
      sentLast7: sent7,
      sentLast30: sent30,
      openRate,
      replyRate,
      positiveReplyRate: 0, // Instantly doesn't differentiate positive/negative
      costPerLead: 0,
      costPerCall: 0,
    };
    sendJSON(res, 200, setCache('instantly:outreach', result));
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

// ── Slack Status ─────────────────────────────────────────────────────────────

async function handleSlackStatus(res) {
  if (!SLACK_TOKEN) return sendJSON(res, 200, { available: false });
  try {
    const data = await httpsGet('slack.com', '/api/auth.test',
      { 'Authorization': `Bearer ${SLACK_TOKEN}` }
    );
    sendJSON(res, 200, {
      available: data.ok === true,
      team: data.team || null,
      channels: Object.keys(SLACK_CHANNELS).length,
    });
  } catch (e) { sendJSON(res, 200, { available: false, error: e.message }); }
}

// ── Data.json ────────────────────────────────────────────────────────────────

function handleGetData(res) {
  const dataPath = path.join(__dirname, '..', 'data.json');
  try {
    const content = fs.readFileSync(dataPath, 'utf8');
    sendJSON(res, 200, JSON.parse(content));
  } catch (e) {
    sendJSON(res, 500, { error: 'Could not read data.json: ' + e.message });
  }
}

async function handleSaveData(req, res) {
  const body = await readBody(req);
  try {
    const parsed = JSON.parse(body);
    const dataPath = path.join(__dirname, '..', 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
    sendJSON(res, 200, { ok: true });
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

// ── Static File Server ───────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(__dirname, urlPath === '/' ? '/dashboard.html' : urlPath);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }

  const urlPath = req.url.split('?')[0];

  try {
    // Config
    if (req.method === 'GET'  && urlPath === '/api/config')                   return handleGetConfig(res);
    if (req.method === 'POST' && urlPath === '/api/config')                   return await handleSaveConfig(req, res);

    // Stripe
    if (req.method === 'GET' && urlPath === '/api/stripe/balance')              return await handleStripeBalance(res);
    if (req.method === 'GET' && urlPath === '/api/stripe/balance-transactions') return await handleStripeBalanceTxns(res);
    if (req.method === 'GET' && urlPath === '/api/stripe/subscriptions')        return await handleStripeSubscriptions(res);
    if (req.method === 'GET' && urlPath === '/api/stripe/disputes')             return await handleStripeDisputes(res);

    // Instagram
    if (req.method === 'GET' && urlPath === '/api/ig/account')                  return await handleIGAccount(res);
    if (req.method === 'GET' && urlPath === '/api/ig/media')                    return await handleIGMedia(res);

    // GoHighLevel
    if (req.method === 'GET' && urlPath === '/api/ghl/clients')                 return await handleGHLClients(res);
    if (req.method === 'GET' && urlPath === '/api/ghl/pipeline')                return await handleGHLPipeline(res);

    // Instantly
    if (req.method === 'GET' && urlPath === '/api/instantly/outreach')           return await handleInstantlyOutreach(res);

    // Slack
    if (req.method === 'GET' && urlPath === '/api/slack/status')                return await handleSlackStatus(res);

    // Data
    if (req.method === 'GET'  && urlPath === '/api/data')                       return handleGetData(res);
    if (req.method === 'POST' && urlPath === '/api/data')                       return await handleSaveData(req, res);
  } catch (e) {
    return sendJSON(res, 500, { error: e.message });
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  ◆ Business Dashboard running`);
  console.log(`  → http://localhost:${PORT}\n`);
});
