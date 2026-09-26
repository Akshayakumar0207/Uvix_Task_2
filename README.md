# Task 2 — Intern Performance Dashboard

A Next.js + Chart.js dashboard showing daily/weekly/monthly performance trends
from the **real** Intern Daily Report template, plus a small ML layer: a
linear-regression trend score per intern, and k-means clustering that buckets
interns into performance tiers. Also includes a Team Lead admin panel to add,
edit, or delete any record.

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
│   ├── convertExcelToJson.js         # imports a REAL filled template -> data/dailyReports.json
│   └── exportJsonToExcel.js          # exports data/dailyReports.json -> real filled templates (one per employee)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## The real template's shape (important)

The actual `Intern_Daily_Report.xlsx` HR sent is **one file per employee**,
not one shared sheet with an "Employee Name" column. On the `Daily Report`
tab: the employee's Name/Role/Month-Year/Email sit in header cells (row 2),
and their daily entries start at row 5 — one row per working day, columns:

`Date | Day No. | Today's Goal | Task Description | Task Category | Tasks
Completed | Task Outcome/Result | Evidence Link | Planned Hrs | Actual Hrs |
Quality Rating (1-5) | Self-Assessed Progress % | Challenges/Blockers |
Blocker Severity | Tomorrow's Tasks | Tomorrow's Goal | Employee Self-Rating (1-5)`

Since each intern fills their own copy, `scripts/convertExcelToJson.js`
**merges** each file's rows into `data/dailyReports.json` rather than
overwriting it — run it once per employee's filled file, and everyone
else's existing rows are kept.

## Team Lead admin panel

At `/team-lead`, the Team Lead can add, edit, or delete any intern's daily
report record — all 17 real fields (Today's Goal, Task Category dropdown,
Tasks Completed, Planned/Actual Hrs, Quality Rating, Self-Assessed Progress %,
Challenges/Blockers, Blocker Severity dropdown, tomorrow's plan, Self-Rating).
Changes are picked up immediately on the main dashboard — score, trend, and
tier all recompute live from whatever's currently in `data/dailyReports.json`.

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

**Performance score (0-100)** — computed per daily report, from the real
fields, not hidden in a model:
- 35% Self-Assessed Progress % (already 0-100, as the intern reported it)
- 25% Quality Rating (1-5, scaled to 0-100)
- 20% Employee Self-Rating (1-5, scaled to 0-100)
- 20% Hours efficiency (`actualHours` vs `plannedHours` — finishing at or
  under planned time scores full credit; going over caps at 100 rather
  than penalizing further, since "took longer" isn't always bad)
- Then a flat penalty is subtracted based on that day's Blocker Severity:
  None: 0, Low: 2, Medium: 5, High: 10, Critical: 20

See `lib/aggregate.js` → `computeScore()`. Deliberately transparent, not a
black box. **Honest limitation worth saying out loud in review:** Quality
Rating, Self-Assessed Progress, and Self-Rating are all self-reported by the
same person on the same day — they're correlated by construction, not three
independent signals. Hours efficiency is the only semi-objective input here.
A manager sign-off field would make this meaningfully stronger.

**Linear regression (trend)** — for each intern, fits a least-squares line
(`lib/regression.js`) through their performance scores over time (day index
on x, score on y). The slope tells you the direction:
- slope > 0.3 → "Improving"
- slope < -0.3 → "Declining"
- otherwise → "Steady"

**K-means clustering (tiers)** — `lib/kmeans.js` is a from-scratch k-means
(k=3, deterministic init — no randomness, so results are reproducible) run on
each intern's `[avgScore, avgActualHours]`. The 3 clusters are then labeled
by their centroid's average score: highest → "High Performer", middle →
"Steady Performer", lowest → "Needs Support" (`lib/tiers.js`).

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
   for the admin panel. It'll already show the included sample data (30 days,
   5 interns).

5. **Import real filled templates**, once you (or actual interns) have filled
   in copies of the real `Intern_Daily_Report.xlsx`:
   ```bash
   npm run convert-excel -- /path/to/Akshaya_Daily_Report.xlsx
   npm run convert-excel -- /path/to/Ravi_Daily_Report.xlsx
   ```
   Run it once per employee's file — each run merges that employee's rows in,
   keeping everyone else's. It reads the Name/Role/Email from the header
   cells and the daily rows from row 5 onward, exactly matching the real
   template's layout.

6. **Or generate real-shaped dummy files yourself**, if you don't have actual
   filled sheets yet:
   ```bash
   npm run export-excel
   ```
   Writes one filled `.xlsx` per employee (in the real template's exact
   column layout) into `filled-templates/`, built from the same dummy data
   already powering the dashboard — this is your "cloned the template and
   filled it with dummy data" deliverable, per employee, as HR described.

7. Restart `npm run dev` (or just refresh) to see the dashboard update after
   an import.

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

- Read the actual template's structure (per-employee header + daily rows,
  17 real columns) before building the scoring/converter, rather than
  guessing a generic schema — the two are meaningfully different, and the
  first version of this project was built on the wrong assumption.
- Chose to compute the performance score from the sheet's own fields with a
  stated formula, rather than feeding raw fields into a model — easier to
  defend and explain than an opaque prediction.
- Implemented regression and k-means myself instead of pulling in an ML
  library, since the dataset and the ask are both small enough that a
  library would add a dependency without adding real capability.
- Used AI assistance to scaffold the Next.js/Chart.js wiring and the Excel
  parsing script, and to write this README.
- Tested the converter against an actually-filled copy of the real template
  (not just generated dummy data) to confirm every column parses correctly.
