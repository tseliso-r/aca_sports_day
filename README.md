# aca_sports_day
Sports day tracker for my residence. Supports **multiple devices simultaneously** with real-time score sync via Firebase Firestore.

## Setup

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Add project**.
2. Inside the project, click **Build → Firestore Database → Create database**.
   - Choose **Start in test mode** (you can tighten the rules later).
   - Pick any region.
3. In the project overview, click the **`</>`** icon to register a **Web app**.
4. Copy the `firebaseConfig` values shown.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and paste in the values from your Firebase web app config:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open the same URL on any device on your network — all score updates appear in real time across every connected browser.

## Deploying to GitHub Pages

The repository includes a GitHub Actions workflow (`.github/workflows/gh-pages-deploy.yml`) that builds and deploys the site automatically on every push to `main`.

### Required: add Firebase credentials as GitHub Secrets

Because Firebase credentials are baked into the bundle at build time, you must store them as **GitHub Actions secrets** before the workflow can produce a working deployment.

1. In your GitHub repository, go to **Settings → Secrets and variables → Actions → New repository secret**.
2. Add one secret for each variable below (names must match exactly):

| Secret name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | your `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | your `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | your `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | your `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | your `appId` |

3. In your repository, go to **Settings → Pages** and set the source to **GitHub Actions**.
4. Push to `main` (or trigger the workflow manually via **Actions → Deploy static content to Pages → Run workflow**) — the site will be live at `https://<your-username>.github.io/aca_sports_day/`.

## Multi-device usage

| Device | Role |
|--------|------|
| Admin device | Login to Admin panel, register teams, start tournaments |
| Padel device | Open the Padel sport page and enter scores |
| Volleyball device | Open the Volleyball sport page and enter scores |
| Football device | Open the Football sport page and enter scores |

Any device can also view the leaderboard and tournament bracket live.
