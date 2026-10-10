# AgriLens AI

AgriLens AI is an independent Rwanda agriculture-planning prototype. The app includes source-linked NISR Seasonal Agricultural Survey (SAS) national observations through 2026 Season B, district land-use observations for 2025 Seasons A/B and 2026 Season A, a searchable browser for all 35 tables in the supplied 2026 Season A workbook, and interactive crop-production visuals comparing the same season and ranking districts.

## Run and operate

- `pnpm --filter @workspace/agri-lens-ai run dev` — run the AgriLens web app (`PORT` and `BASE_PATH` are required by Vite).
- `pnpm --filter @workspace/agri-lens-ai run typecheck` — check the frontend.
- `PORT=4173 BASE_PATH=/ pnpm --filter @workspace/agri-lens-ai run build` — build the frontend.
- `node scripts/verify_nisr_data.mjs` — verify source data, coverage, workbook tables, and downloads.
- `python3 scripts/import_nisr_sas.py` — rebuild 2025 district land use from the annual report (requires Poppler `pdftotext`).
- `python3 scripts/import_nisr_sas_2026a_workbook.py` — rebuild the 35-table dataset, compact crop-chart data and normalized 2026A district extract from the checked-in workbook (requires `openpyxl`).
- `pnpm --filter @workspace/api-server run dev` — run the optional Express API server (health-check only).
- `pnpm run typecheck` / `pnpm run build` — full workspace checks; frontend Vite needs `PORT` and `BASE_PATH`.

## Stack

- pnpm workspaces, TypeScript 5.9, React, Vite, Tailwind and Recharts
- Optional API: Express 5
- Database scaffold: PostgreSQL + Drizzle ORM
- The source lookup is deterministic; the app does not make runtime AI calls.

## Where things live

- Web app: `artifacts/agri-lens-ai/`
- National observations, metric definitions and sources: `artifacts/agri-lens-ai/src/data/national-indicators.json`
- District land use: `artifacts/agri-lens-ai/src/data/district-land-2025.json` and `district-land-2026a.json`
- All 35 Season A workbook tables: `artifacts/agri-lens-ai/src/data/nisr-sas-2026-season-a-tables.json`
- Compact Table 6/Table 15 chart input: `artifacts/agri-lens-ai/src/data/crop-visuals-2026a.json`
- Downloadable source workbook: `artifacts/agri-lens-ai/public/data/nisr-sas-2026-season-a-tables.xlsx`
- District CSVs: `artifacts/agri-lens-ai/public/data/district-land-2025.csv` and `district-land-2026-season-a.csv`
- Import and validation scripts: `scripts/import_nisr_sas.py`, `scripts/import_nisr_sas_2026a_workbook.py`, `scripts/verify_nisr_data.mjs`
- Source, methods and limits: `docs/nisr-data.md`

## Data and product guardrails

- The workbook supplied for this task has 35 worksheets; the worksheets attribute their contents to NISR SAS 2026. The linked NISR Season A release page is cited; a direct NISR URL for this exact workbook and its reuse terms were not confirmed. Consult the source and current NISR terms before redistribution.
- National indicators cover SAS 2025 Seasons A–C and SAS 2026 Seasons A–B. District land use covers 30 districts for 2025 Seasons A/B and 2026 Season A, with separate national totals.
- Areas are reported in thousand hectares. Source dashes remain missing values, not zero. The 2025 district figures retain report rounding; 2026 workbook values preserve greater precision. The interactive workbook view rounds long values for legibility; downloads retain full precision.
- The 2026 workbook also includes district crop-area, yield, production, input-use and agricultural-practice tables. Do not conflate those measures with the separate district land-use comparisons.
- The seasonal dashboard filter applies to headline cards and the practice/land charts. Seasons A and B compare matched 2025/2026 values; Season C shows the available 2025C values only. The detailed crop workbook contains Season A tables, and unavailable seasons are disclosed rather than filled with other-period data.
- Crop rankings and district comparisons can be narrowed by province and district using the official [Government of Rwanda local-government directory](https://www.gov.rw/government/directory/local-government). The geographic mapping is a filter only; it does not create aggregated statistics.
- Survey-season differences do not establish cause, statistical significance or annual averages. Separately reported area categories should not be assumed additive.
- AgriLens AI is independent and is not an official NISR service. The interface includes an initial Kinyarwanda translation; technical statistical language may remain in English pending review.
