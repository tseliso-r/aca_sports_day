# aca_sports_day
Sports day tracker for my residence.

## Deployment

- GitHub Pages: keep the workflow in `.github/workflows/gh-pages-deploy.yml` and deploy the generated `dist/` folder.
- Cloudflare Workers: run `npm run build` and deploy with Wrangler using `wrangler.toml`.

## Realtime sync

- The app will run locally with `localStorage` when no sync backend is available.
- When deployed with the Cloudflare Worker, `/api/state` and `/api/live` provide shared state and live updates across connected devices.

## Cloudflare Worker notes

- A GitHub Action is added at `.github/workflows/deploy-cloudflare.yml` to publish the Worker on push to `main`.
- The action requires a repository secret `CF_API_TOKEN` with appropriate permissions (Workers Scripts: Edit, Durable Objects: Edit).
- Durable Objects require a `new_sqlite_classes` migration for the free plan; the `wrangler.toml` migration includes this for `SportsDayRoom`.
- Wrangler may warn if your Worker `name` differs from the CI-provided name; the config uses `acasportsday` to match typical CI expectations.

If you want me to wire automatic secrets or run `wrangler deploy` now, provide your Cloudflare API token (or add it to repo secrets) and I can proceed.
