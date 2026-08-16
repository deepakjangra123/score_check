// Vercel serverless function — runs on Node 18+, which has global fetch built in.
// This fetches the target URL SERVER-SIDE, so the browser's CORS restriction
// never applies (CORS only governs browser -> server requests, not server -> server).

export default async function handler(req, res) {
  // Allow this endpoint to be called from the browser page it's served with.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" query parameter.' });
  }

  let target;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).json({ error: 'That is not a valid URL.' });
  }

  // Basic safety: only allow http/https targets.
  if (!['http:', 'https:'].includes(target.protocol)) {
    return res.status(400).json({ error: 'Only http/https URLs are allowed.' });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        // Some exam portals check for a browser-like User-Agent.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    const html = await upstream.text();

    return res.status(200).json({
      status: upstream.status,
      ok: upstream.ok,
      html,
    });
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed: ' + err.message });
  }
}
