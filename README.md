# BIOWISE AI – Turning Waste into Intelligent Energy

BIOWISE AI is a beginner-friendly full-stack student project prototype for estimating daily biogas production from organic waste and reviewing digester operating conditions.

## 1. Problem and objectives

Small biogas systems may rely on manual observations and operator experience. BIOWISE AI provides a simple place to enter feedstock and operating data, calculate an indicative production estimate, flag selected out-of-range conditions, and save results for review.

### Objectives
- Estimate indicative biogas production from feedstock quantity and type.
- Record temperature, pH, moisture, retention time and organic loading.
- Display basic condition warnings and recommendations.
- Save and review estimation history in PostgreSQL.

## 2. Target users and roles

The MVP is designed for a student demonstrator or a single local operator. It does not currently include user accounts or multi-user permissions. Do not expose this prototype publicly as-is.

## 3. Implemented features

- Responsive dashboard with recent estimates and summary statistics.
- Biogas estimation form.
- Rule-based operating-condition checks and recommendations.
- Supabase PostgreSQL storage and history.
- Delete saved estimation.
- Health-check endpoint and basic API rate limiting.

**Important model limitation:** Despite the product name, this MVP does not train or run machine learning. It uses an illustrative, transparent rule-based formula. Yield factors and adjustment rules are assumptions for demonstrating the software workflow, not validated scientific constants. Calibrate and validate with real plant data before operational use. A future version can replace the estimator with a trained regression model.

## 4. Technology stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: Supabase PostgreSQL
- Version control: Git and GitHub

## 5. Folder structure

```text
biowise-ai/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── routes/
│   │   └── estimations.js
│   ├── utils/
│   │   └── estimator.js
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## 6. Prerequisites

Install:
- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js LTS](https://nodejs.org/) (npm is included)
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) account

Check installations in a new VS Code terminal:

```powershell
node --version
npm --version
git --version
```

Each command should print a version number.

## 7. Supabase setup

1. Sign in to Supabase and create a new project.
2. Choose a project name and database password. Store the password safely.
3. Wait for the database to finish provisioning.
4. Open **SQL Editor** in the Supabase dashboard.
5. Open `database/schema.sql` in VS Code, copy all its contents, paste into SQL Editor and run it.
6. Open **Table Editor** and confirm that the `estimations` table exists.
7. In Supabase project settings, find the project URL and server-side service-role/secret key. The dashboard labels may vary by project/API-key generation.

The SQL enables Row Level Security and does not create public access policies. The backend uses its privileged key to access the table. Never place that key in frontend code, GitHub, screenshots, or public documentation.

## 8. Environment configuration

From the project root, create `backend/.env` by copying `backend/.env.example`.

Fill it with your own values:

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SIDE_SERVICE_ROLE_KEY
```

- `PORT`: local Express port.
- `NODE_ENV`: use `development` locally.
- `SUPABASE_URL`: URL of your Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY`: privileged server-only key.

`.env` contains your real private values and is ignored by Git. `.env.example` contains placeholders and should be committed. Never commit `.env`.

## 9. Install and run

Open the `biowise-ai` root folder in VS Code. Open **Terminal → New Terminal**.

```powershell
cd backend
npm install
npm run dev
```

Expected terminal message:

```text
BIOWISE AI running at http://localhost:3000
```

Open `http://localhost:3000` in your browser. The Express server serves the frontend and API from the same origin.

For a normal start without file watching:

```powershell
npm start
```

Check the backend health endpoint at `http://localhost:3000/api/health`. It should return JSON with `"status":"ok"`.

## 10. Architecture and workflow

1. User enters feedstock and digester information in the browser.
2. `frontend/app.js` sends JSON to `POST /api/estimations`.
3. Express validates the values.
4. `backend/utils/estimator.js` calculates the illustrative estimate and warnings.
5. Express stores the input and result in Supabase PostgreSQL.
6. The browser displays the result and refreshes the dashboard/history.

## 11. API endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/api/health` | Check server status | Public |
| GET | `/api/estimations` | List up to 100 recent estimates | Local demo only |
| POST | `/api/estimations` | Validate, estimate and save a record | Local demo only |
| DELETE | `/api/estimations/:id` | Delete a saved record | Local demo only |

POST body example:

```json
{
  "feedstockType": "cattle_dung",
  "feedstockQuantityKg": 100,
  "moisturePercent": 85,
  "retentionDays": 30,
  "temperatureC": 35,
  "ph": 7,
  "organicLoad": 2,
  "gasPressureKpa": 5
}
```

The API returns an estimation record containing the input values, estimated gas output, condition status and recommendations. Invalid inputs return HTTP 400. Missing records on deletion return HTTP 404. Unexpected backend/database failures return a generic HTTP 500 message; details remain in the server terminal.

## 12. Testing checklist

| Test | Expected result |
|---|---|
| Open `/api/health` | JSON status is `ok` |
| Save a valid cattle-dung estimate | Result appears and record is saved |
| Refresh the browser | Saved record remains visible |
| Enter quantity `0` | Form/API rejects it |
| Enter pH above `14` | API returns HTTP 400 |
| Enter temperature outside `0–100` | API returns HTTP 400 |
| Enter a low pH value such as `5.5` | Warning or critical condition is shown |
| Delete a history record | Record disappears after refresh |
| Disconnect or misconfigure Supabase | Friendly error appears; backend terminal contains diagnostic detail |
| Resize to mobile width | Navigation, forms and tables remain usable |

## 13. Troubleshooting

- **`node` is not recognized:** Install Node.js LTS and reopen VS Code.
- **`npm install` fails:** Check internet connection and run it from the `backend` directory.
- **Missing environment variable:** Confirm `backend/.env` exists and the variable names match `.env.example`.
- **Invalid API key / database error:** Recheck the project URL and server-side key in Supabase. Never paste the key into chat or source code.
- **Table not found:** Run `database/schema.sql` in the correct Supabase project's SQL Editor.
- **Port already in use:** Change `PORT` in `backend/.env`, then restart the server.
- **Browser cannot connect:** Confirm the backend is running at the URL shown in the terminal.

## 14. Git and GitHub

Create an empty repository on GitHub. From the project root:

```bash
git init
git status
git add .
git status
git commit -m "Build BIOWISE AI project"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository URL. Before committing, confirm:
- `backend/.env` is not staged.
- `node_modules/` is not staged.
- `.env.example` is included.
- No service-role key, database password, or private data appears in the code.

If a secret was ever committed, removing it from the latest file is not enough: rotate the exposed key immediately and clean repository history as appropriate.

## 15. Security and limitations

This is a local educational MVP, not a production-ready multi-user service. The API has no login or ownership controls. The server-side Supabase key is privileged, so anyone who can reach an exposed deployment's API could potentially read, insert or delete records. Run locally for demonstration. Before deployment, implement Supabase Auth or another verified authentication system, authorize every record operation, add suitable RLS policies, configure CORS and rate limits for the deployment, and review security settings.

The current estimator is not a trained AI/ML model and does not diagnose digester failure. It does not calculate methane percentage, energy value, savings, digestate quality or 48-hour failure risk. These should be added only with reliable data, validated calculations and domain review.

## 16. Future improvements

- Train and validate a prediction model using measured digester data.
- Compare estimated and actual gas output and report MAE/RMSE.
- Add authenticated plant/operator accounts.
- Add sensor integration and time-series monitoring.
- Add methane concentration, gas-flow and pressure trend analysis.
- Add validated early-warning and intervention logic.
