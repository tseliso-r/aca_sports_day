# aca_sports_day
Sports day tracker for my residence.

## Deployment

- GitHub Pages: keep the workflow in `.github/workflows/gh-pages-deploy.yml` and deploy the generated `dist/` folder.
- Cloudflare Workers: run `npm run build` and deploy with Wrangler using `wrangler.toml`.

## Realtime sync

- The app will run locally with `localStorage` when no sync backend is available.
- When deployed with the Cloudflare Worker, `/api/state` and `/api/live` provide shared state and live updates across connected devices.
