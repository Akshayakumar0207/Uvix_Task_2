# Task 2 — Intern Performance Dashboard

A Next.js + Chart.js dashboard showing daily/weekly/monthly performance trends
from the Intern Daily Report sheet, plus a small ML layer: a linear-regression
trend score per intern, and k-means clustering that buckets interns into
performance tiers.

## Folder structure

```
uvix-task2/
├── app/
│   ├── layout.js
│   ├── globals.css
│   ├── page.js                    # dashboard UI (client component)
│   ├── team-lead/
│   │   └── page.js                 # Team Lead admin: add/edit/delete any record
│   └── api/
│       ├── dashboard-data/
│       │   └── route.js            # aggregates data + runs the ML layer
│       └── team-members/
│           ├── route.js             # GET all records, POST a new one
│           └── [id]/route.js         # PUT (edit) / DELETE a record by id
├── components/
│   ├── TrendChart.js                # line chart (daily/weekly/monthly)
│   ├── PerformanceBarChart.js        # bar chart per intern
│   └── TierTable.js                  # tier + trend table
├── lib/
│   ├── store.js                      # file-based CRUD for the admin panel
│   ├── aggregate.js                  # scoring formula, day/week/month grouping
│   ├── regression.js                 # least-squares linear regression (from scratch)
│   ├── kmeans.js                     # k-means clustering (from scratch)
│   └── tiers.js                      # labels clusters as tiers
├── data/
│   └── dailyReports.json             # sample dummy data (30 days, 5 interns)
├── scripts/
│   ├── generateSampleData.js         # regenerates the dummy dataset
│   ├── convertExcelToJson.js         # converts the REAL Excel sheet -> data/dailyReports.json
│   └── exportJsonToExcel.js          # exports data/dailyReports.json -> a real filled Excel file
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Team Lead admin panel

At `/team-lead`, the Team Lead can add, edit, or delete any intern's daily
report record (name, date, tasks assigned/completed, quality score, hours
worked, and an optional free-text "pending task" note). Changes are picked
up immediately on the main dashboard — the score, trend, and tier all
recompute live from whatever's currently in `data/dailyReports.json`.

**Password protection:** set `TEAM_LEAD_PASSWORD` in your env to gate the
add/edit/delete actions (the dashboard itself stays public/read-only either
way). Leave it unset and the panel is open — fine for local-only use, not
recommended if you deploy this publicly without setting it.

**Known limitation, stated plainly:** this uses file-based storage
(`lib/store.js` reads/writes `data/dailyReports.json` directly), which works
fully when running locally. On Vercel, the serverless filesystem is
ephemeral — edits made through the deployed admin panel are not guaranteed
to persist across requests or survive a redeploy. For the interview demo,
run this locally to show the add/edit/delete flow working end-to-end; the
honest next step for real production use would be swapping `lib/store.js`
for an actual database while keeping the same function signatures.


## The ML layer, explained

**Performance score (0-100)** — computed per daily report, not hidden in a model:
- 40% task completion rate (`tasksCompleted / tasksAssigned`)
- 40% quality score (`qualityScore` out of 10)
- 20% hours worked (capped at a full 8-hour day)

See `lib/aggregate.js` → `computeScore()`. Deliberately a transparent formula,
not a black box, so it's easy to justify in review.

**Linear regression (trend)** — for each intern, fits a least-squares line
(`lib/regression.js`) through their performance scores over time (day index on
x, score on y). The slope tells you the direction:
- slope > 0.3 → "Improving"
- slope < -0.3 → "Declining"
- otherwise → "Steady"

**K-means clustering (tiers)** — `lib/kmeans.js` is a from-scratch k-means
(k=3, deterministic init — no randomness, so results are reproducible) run on
each intern's `[avgScore, avgHours]`. The 3 clusters are then labeled by their
centroid's average score: highest → "High Performer", middle → "Steady
Performer", lowest → "Needs Support" (`lib/tiers.js`).

## Run it in VS Code

1. Open the folder, open a terminal.

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set a Team Lead password:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set `TEAM_LEAD_PASSWORD` to whatever you want. Leave
   it blank to leave the admin panel open (fine for local demoing).

4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` for the dashboard, or `http://localhost:3000/team-lead`
   for the admin panel.

5. **Swap in the real Excel data** once you have the filled-in Intern Daily
   Report sheet:
   ```bash
   npm run convert-excel -- /path/to/Intern_Daily_Report.xlsx
   ```
   This reads the first sheet, maps its columns (Date, Employee Name, Tasks
   Assigned, Tasks Completed, Quality Score, Hours Worked — case-insensitive,
   a few header variations supported), and overwrites `data/dailyReports.json`.
   If it can't find a column, it tells you which headers it saw so you can
   adjust the `columnMap` at the top of `scripts/convertExcelToJson.js`.

6. Restart `npm run dev` (or just refresh — the API route reads the JSON file
   fresh) to see the dashboard update with real data.

## Deploy to Vercel

No cron, no OAuth needed here. One optional environment variable
(`TEAM_LEAD_PASSWORD`) if you want the admin panel gated on the live link:

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Task 2: performance dashboard"
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.

3. (Optional) Under **Project → Settings → Environment Variables**, add
   `TEAM_LEAD_PASSWORD` with whatever password you want to gate `/team-lead`
   with. Skip this if you're fine leaving it open.

4. Vercel auto-detects Next.js — no other config needed. Click **Deploy**.

5. Once live, visit `https://<your-project>.vercel.app` to confirm the
   dashboard renders, and `https://<your-project>.vercel.app/team-lead` for
   the admin panel. Remember: admin edits on the live Vercel link aren't
   guaranteed to persist (see the Known limitation note above) — that's
   expected, not a bug to chase down.

6. Submit the GitHub repo link and the Vercel link.

## My process

- Chose to compute the performance score from the sheet's own fields with a
  stated formula, rather than feeding raw fields into a model — easier to
  defend and explain than an opaque prediction.
- Implemented regression and k-means myself instead of pulling in an ML
  library, since the dataset and the ask are both small enough that a
  library would add a dependency without adding real capability.
- Used AI assistance to scaffold the Next.js/Chart.js wiring and the Excel
  column-mapping script, and to write this README.
- Tested with generated dummy data first (`scripts/generateSampleData.js`) to
  confirm trends and tiers looked sane, before wiring up the real-sheet path.
