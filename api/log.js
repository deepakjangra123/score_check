// Logs tested links + scores to a GitHub Gist (used as a plain .txt file).
// Why a Gist and not a local file: Vercel serverless functions have no
// persistent disk — each request can run in a fresh container, so anything
// written to the filesystem disappears immediately. A Gist is a small,
// free, persistent text store reachable over HTTP, which is exactly what's
// needed here.
//
// Setup required (see README):
//   GITHUB_TOKEN  - a GitHub personal access token with "gist" scope
//   GIST_ID       - the id of a gist you created containing a file named links.txt

const GIST_FILENAME = 'links.txt';

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
      const content = data.files?.[GIST_FILENAME]?.content || '';
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(content);
    }

    if (req.method === 'POST') {
      const { url, total, correct, wrong, unattempted, score } = req.body || {};
      if (!url) return res.status(400).json({ error: 'Missing "url" in request body.' });

      const r = await githubFetch('/gists/' + gistId);
      if (!r.ok) throw new Error('Could not read gist (HTTP ' + r.status + ')');
      const data = await r.json();
      const content = data.files?.[GIST_FILENAME]?.content || '';

      if (content.includes(url)) {
        return res.status(200).json({ status: 'duplicate', message: 'This link is already logged — skipped.' });
      }

      const line =
        new Date().toISOString() +
        ' | score:' + score +
        ' correct:' + correct +
        ' wrong:' + wrong +
        ' unattempted:' + unattempted +
        ' total:' + total +
        ' | ' + url + '\n';

      const updated = content + line;

      const patchRes = await githubFetch('/gists/' + gistId, {
        method: 'PATCH',
        body: JSON.stringify({ files: { [GIST_FILENAME]: { content: updated } } }),
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
