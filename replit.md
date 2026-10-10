# AgriLens AI

AgriLens AI is an independent Rwanda agriculture-planning prototype. Its web app now includes verified, source-linked observations from NISR’s Seasonal Agricultural Survey (SAS): national seasonal indicators through 2026 Season B and 2025 district land-use tables.

## Run & operate

- `pnpm --filter @workspace/agri-lens-ai run dev` — run the AgriLens web app (`PORT` and `BASE_PATH` are required by Vite).
- `pnpm --filter @workspace/agri-lens-ai run typecheck` — check the frontend.
- `PORT=4173 BASE_PATH=/ pnpm --filter @workspace/agri-lens-ai run build` — build the frontend.
- `node scripts/verify_nisr_data.mjs` — verify data coverage and selected NISR figures.
- `python3 scripts/import_nisr_sas.py` — re-download the NISR 2025 report and rebuild the 2025 district land-use JSON/CSV (requires Poppler `pdftotext`).
- `pnpm --filter @workspace/api-server run dev` — run the optional Express API server (port 5000; currently health-check only).
- `pnpm run typecheck` — full typecheck across workspace packages.
- `pnpm run build` — workspace build (the frontend Vite config needs `PORT` and `BASE_PATH`).

## Stack

- pnpm workspaces, TypeScript 5.9, React, Vite, Tailwind, Recharts
- Optional API: Express 5
- Database scaffold: PostgreSQL + Drizzle ORM
- No runtime AI call is made by the source lookup. The dashboard and comparisons are deterministic lookups and calculations over the checked-in NISR observations.

## Where things live

- Web app: `artifacts/agri-lens-ai/`
- NISR national observations and definitions: `artifacts/agri-lens-ai/src/data/national-indicators.json`
- NISR district observations: `artifacts/agri-lens-ai/src/data/district-land-2025.json`
- Downloadable district CSV: `artifacts/agri-lens-ai/public/data/district-land-2025.csv`
- Import and validation scripts: `scripts/import_nisr_sas.py`, `scripts/verify_nisr_data.mjs`
- Source, methods and limits: `docs/nisr-data.md`
- Optional API: `artifacts/api-server/`
- API contract: `lib/api-spec/openapi.yaml`
- Database schema: `lib/db/src/schema/`

## Data and product guardrails

- Source: NISR Seasonal Agricultural Survey. Data is linked at the observation/source level; source URLs, periods and definitions are included in the app data.
- Geographic coverage: national indicator observations cover SAS 2025 Seasons A–C and SAS 2026 Seasons A–B. District land-use tables cover 30 districts for SAS 2025 Seasons A and B, plus NISR’s national total rows.
- District land area is reported in thousand hectares. NISR dashes are preserved as missing values, not interpreted as zero. Published rounding is retained.
- The 2025 district extract measures land use, not district-level input adoption, yields or productivity. Do not imply otherwise.
- Survey-season differences describe the reported estimates; they do not establish cause, statistical significance or annual averages.
- Area categories are reproduced separately as reported; do not assume they are additive.
- AgriLens AI is independent and is not an official NISR service. Licensing and reuse terms have not been independently assessed.
- The interface includes an initial Kinyarwanda translation. Technical statistical language may remain in English pending review.
