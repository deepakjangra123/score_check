# Exam Score Checker

A small web app: paste an exam result link (or upload/paste the HTML), and it
scores it against an answer key. Includes a server-side proxy so pasting a
URL works without hitting browser CORS restrictions.

## Project structure

```
exam-score-checker/
├── index.html      # the app (static page, served as-is)
├── api/
│   └── fetch.js     # Vercel serverless function — fetches URLs server-side
├── package.json
└── README.md
```

## Test locally before deploying

1. Install the Vercel CLI if you haven't already:
   ```
   npm install -g vercel
   ```
2. From inside this folder, run:
   ```
   cd exam-score-checker
   vercel dev
   ```
3. First run will ask a few setup questions — accept the defaults (link to
   a new project, no framework detected, etc). It doesn't deploy anything,
   it just sets up local config.
4. It'll start a local server, usually at:
   ```
   http://localhost:3000
   ```
5. Open that URL in your browser. `index.html` loads as the homepage, and
   the "Fetch URL" tab calls `/api/fetch` exactly as it would in production
   — `vercel dev` runs the serverless function locally for you.

Note: plain `node index.html` or `node api/fetch.js` won't work — `api/fetch.js`
is written in Vercel's serverless-function format (`export default function
handler(req, res)`), which only `vercel dev` (or an actual Vercel deployment)
knows how to run. `vercel dev` is the correct local equivalent.

To stop the local server, press `Ctrl+C` in the terminal.

Once it works locally, deploy with `vercel --prod` as described below.

## Link logging (optional but on by default)

Every time you click "Analyze & Score" with something in the URL field, the
app logs `{ link, score }` to a small JSON store — skipping it if that exact
link is already logged, so re-running the same link never duplicates it.

Since Vercel functions have no persistent disk, that store is actually a
GitHub Gist (a small free hosted text file with an API) holding a JSON
array. Set it up once:

1. Go to https://gist.github.com/ → create a new **secret** gist.
   - Filename: `results.json`
   - Content: `[]`
   - Click "Create secret gist".
2. Copy the gist's ID from its URL — e.g. in
   `https://gist.github.com/yourname/abc123def456`, the ID is `abc123def456`.
3. Create a GitHub personal access token with **gist** scope:
   https://github.com/settings/tokens → Generate new token (classic) →
   check the `gist` box → generate → copy the token (starts with `ghp_`).
4. In your Vercel project: **Settings → Environment Variables**, add:
   - `GITHUB_TOKEN` = the token from step 3
   - `GIST_ID` = the ID from step 2
5. Redeploy (Deployments tab → ⋯ → Redeploy).

Once set up, the "View link log →" link that appears above your results
table opens `/api/log`, which returns the JSON array directly, e.g.:
```json
[
  { "link": "https://cdn3.digialm.com/...", "score": 24 }
]
```

If you skip this setup, the app still works fine for scoring — you'll just
see a small "Log: ..." note under your results saying logging isn't
configured, and nothing breaks.

## Deploy to Vercel (free)

You have two options — pick whichever is easier for you.

### Option 1: Vercel CLI (fastest)

1. Install Node.js if you don't have it: https://nodejs.org
2. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```
3. From inside this folder, log in and deploy:
   ```
   cd exam-score-checker
   vercel login
   vercel --prod
   ```
4. Answer the prompts (accept the defaults — no build settings needed, it's
   a static site + one API route). Vercel will print a live URL like:
   ```
   https://exam-score-checker-yourname.vercel.app
   ```
5. Open that URL — the "Fetch URL" tab will now work through your own proxy.

### Option 2: GitHub + Vercel dashboard (no CLI)

1. Create a new GitHub repo and push this folder to it.
2. Go to https://vercel.com → Sign up / log in (free Hobby plan) → **Add New Project**.
3. Import the GitHub repo. Leave all settings as default — Vercel
   auto-detects the `api/` folder as serverless functions and serves
   `index.html` as the static homepage.
4. Click **Deploy**. You'll get a live URL in about a minute.

## Notes

- No dependencies or build step needed — `api/fetch.js` uses the `fetch()`
  function that's built into Node 18+, which is what Vercel runs by default.
- The free Hobby plan is enough for this — one lightweight function, low
  traffic.
- If a result link requires you to be logged in to see it (session cookie),
  the proxy can't use your browser's login session, since it runs on
  Vercel's servers, not your machine. In that case, use the "Upload file" or
  "Paste HTML" tab instead — those always work regardless of login walls.
- Running `index.html` by double-clicking it (opening as a local `file://`
  page) will NOT make the proxy work, since there's no server running. You
  need it deployed for the "Fetch URL" tab specifically — "Upload file" and
  "Paste HTML" always work locally too.
