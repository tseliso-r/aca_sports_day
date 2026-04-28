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

## Multi-device usage

| Device | Role |
|--------|------|
| Admin device | Login to Admin panel, register teams, start tournaments |
| Padel device | Open the Padel sport page and enter scores |
| Volleyball device | Open the Volleyball sport page and enter scores |
| Football device | Open the Football sport page and enter scores |

Any device can also view the leaderboard and tournament bracket live.
