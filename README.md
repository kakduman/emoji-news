# Schizo News

## Frontend
Frontend lives in `frontend/` (Vite + React + TypeScript with Tailwind). From that folder:

- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`

## Backend
News to Emojipasta converter lives in `backend/` (Python). From that folder:

- Install deps: `pip install -r requirements.txt`
- Set environment variables in `.env`:
  - `XAI_API_KEY`: Your XAI API key for Grok
- Run: `python main.py`

The script fetches top news articles from BBC RSS, converts them to emojipasta format using Grok, and saves JSON files to `frontend/public/news/`.

## GitHub Pages

- Deploy workflow: `.github/workflows/deploy-pages.yml` builds `frontend/` with pnpm and publishes `frontend/dist` to GitHub Pages on pushes to `master`.
- Vite `base` is set to the repo name automatically when running in GitHub Actions so assets load correctly under `/REPO/`.
