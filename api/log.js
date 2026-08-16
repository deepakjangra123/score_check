// Logs tested links + scores to a GitHub Gist, used as a persistent JSON
// store: a JSON array of { link, score } objects, deduped by link.
//
// Why a Gist and not a local file: Vercel serverless functions have no
// persistent disk — each request can run in a fresh container, so anything
// written to the filesystem disappears immediately. A Gist is a small,
// free, persistent text store reachable over HTTP, which is exactly what's
// needed here.
//
// Setup required (see README):
//   GITHUB_TOKEN  - a GitHub personal access token with "gist" scope
//   GIST_ID       - the id of a gist you created containing a file named results.json

const GIST_FILENAME = 'results.json';

async function githubFetch(path, opts = {}) {
  const token = process.env.GITHUB_TOKEN;
  return fetch('https://api.github.com' + path, {
    ...opts,
    headers: {
      Authorization: 'token ' + token,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'exam-score-checker',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}

function parseEntries(content) {
  if (!content || !content.trim()) return [];
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const gistId = process.env.GIST_ID;
  const token = process.env.GITHUB_TOKEN;
  if (!gistId || !token) {
    return res.status(500).json({
      error:
        'Logging not configured. Add GITHUB_TOKEN and GIST_ID as environment variables in the Vercel project settings, then redeploy.',
    });
  }

  try {
    if (req.method === 'GET') {
      const r = await githubFetch('/gists/' + gistId);
      if (!r.ok) throw new Error('Could not read gist (HTTP ' + r.status + ')');
      const data = await r.json();
      const content = data.files?.[GIST_FILENAME]?.content || '[]';
      const entries = parseEntries(content);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).json(entries);
    }

    if (req.method === 'POST') {
      const { link, score } = req.body || {};
      if (!link) return res.status(400).json({ error: 'Missing "link" in request body.' });

      const r = await githubFetch('/gists/' + gistId);
      if (!r.ok) throw new Error('Could not read gist (HTTP ' + r.status + ')');
      const data = await r.json();
      const content = data.files?.[GIST_FILENAME]?.content || '[]';
      const entries = parseEntries(content);

      if (entries.some((e) => e.link === link)) {
        return res.status(200).json({ status: 'duplicate', message: 'This link is already logged — skipped.' });
      }

      entries.push({ link, score });

      const patchRes = await githubFetch('/gists/' + gistId, {
        method: 'PATCH',
        body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(entries, null, 2) } } }),
      });

      if (!patchRes.ok) {
        const errBody = await patchRes.text();
        throw new Error('GitHub API error ' + patchRes.status + ': ' + errBody);
      }

      return res.status(200).json({ status: 'logged' });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

