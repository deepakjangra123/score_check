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
