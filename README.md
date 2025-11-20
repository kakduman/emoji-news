# Hoglin Monorepo

Frontend lives in `frontend/` (Vite + React + TypeScript with Tailwind). From that folder:

- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`

## GitHub Pages

- Deploy workflow: `.github/workflows/deploy-pages.yml` builds `frontend/` with pnpm and publishes `frontend/dist` to GitHub Pages on pushes to `master`.
- Vite `base` is set to the repo name automatically when running in GitHub Actions so assets load correctly under `/REPO/`.
