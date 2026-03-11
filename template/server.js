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
const STRIPE_KEY = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
const IG_TOKEN   = env.IG_ACCESS_TOKEN   || process.env.IG_ACCESS_TOKEN   || '';
const IG_USER_ID = env.IG_USER_ID        || process.env.IG_USER_ID        || '';

if (STRIPE_KEY) console.log('  ✓ Stripe key loaded');
else console.log('  ⚠ No Stripe key — revenue module will use manual data');
if (IG_TOKEN) console.log('  ✓ Instagram token loaded');
else console.log('  ⚠ No IG token — content module disabled');

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
  try {
    const balance = await stripeGet('/v1/balance');
    sendJSON(res, 200, balance);
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

async function handleStripeBalanceTxns(res) {
  if (!STRIPE_KEY) return sendJSON(res, 200, { available: false, data: [] });
  try {
    const txns = await fetchAllStripePages('/v1/balance_transactions');
    sendJSON(res, 200, { data: txns });
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

async function handleStripeSubscriptions(res) {
  if (!STRIPE_KEY) return sendJSON(res, 200, { available: false, data: [] });
  try {
    const subs = await fetchAllStripePages('/v1/subscriptions?status=active');
    sendJSON(res, 200, { data: subs });
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

async function handleStripeDisputes(res) {
  if (!STRIPE_KEY) return sendJSON(res, 200, { available: false, data: [] });
  try {
    const disputes = await fetchAllStripePages('/v1/disputes');
    sendJSON(res, 200, { data: disputes });
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

// ── Instagram ────────────────────────────────────────────────────────────────

async function handleIGAccount(res) {
  if (!IG_TOKEN) return sendJSON(res, 200, { available: false });
  try {
    const fields = 'id,username,biography,followers_count,media_count,profile_picture_url,website,name';
    const data = await httpsGet('graph.instagram.com', `/me?fields=${fields}&access_token=${IG_TOKEN}`, {});
    sendJSON(res, 200, data);
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
}

async function handleIGMedia(res) {
  if (!IG_TOKEN) return sendJSON(res, 200, { available: false, data: [] });
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
    sendJSON(res, 200, { data: enriched });
  } catch (e) { sendJSON(res, 500, { error: e.message }); }
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

function handleSaveData(req, res) {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      const dataPath = path.join(__dirname, '..', 'data.json');
      fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
      sendJSON(res, 200, { ok: true });
    } catch (e) { sendJSON(res, 500, { error: e.message }); }
  });
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
    if (req.method === 'GET' && urlPath === '/api/stripe/balance')              return await handleStripeBalance(res);
    if (req.method === 'GET' && urlPath === '/api/stripe/balance-transactions') return await handleStripeBalanceTxns(res);
    if (req.method === 'GET' && urlPath === '/api/stripe/subscriptions')        return await handleStripeSubscriptions(res);
    if (req.method === 'GET' && urlPath === '/api/stripe/disputes')             return await handleStripeDisputes(res);
    if (req.method === 'GET' && urlPath === '/api/ig/account')                  return await handleIGAccount(res);
    if (req.method === 'GET' && urlPath === '/api/ig/media')                    return await handleIGMedia(res);
    if (req.method === 'GET' && urlPath === '/api/data')                        return handleGetData(res);
    if (req.method === 'POST' && urlPath === '/api/data')                       return handleSaveData(req, res);
  } catch (e) {
    return sendJSON(res, 500, { error: e.message });
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  ◆ Business Dashboard running`);
  console.log(`  → http://localhost:${PORT}\n`);
});
