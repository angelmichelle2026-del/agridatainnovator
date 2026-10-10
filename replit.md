# AgriLens AI

An independent prototype that will make verified Rwanda agricultural statistics easier to discover and use for district planners.

## Run & Operate

- `pnpm --filter @workspace/agri-lens-ai run dev` — run the AgriLens web app
- `pnpm --filter @workspace/agri-lens-ai run typecheck` — check the AgriLens frontend
- `pnpm --filter @workspace/agri-lens-ai run test:smoke` — check the running app's entry page
- `pnpm --filter @workspace/agri-lens-ai run build` — build the AgriLens frontend
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- AgriLens web app: `artifacts/agri-lens-ai/`
- Shared API: `artifacts/api-server/`
- API contract: `lib/api-spec/openapi.yaml`
- Database schema: `lib/db/src/schema/`

## Architecture decisions

- Build the MVP in small, verifiable phases; preserve working parts.
- Use deterministic, source-grounded data queries before considering optional AI phrasing.
- Only use verified source data; never invent figures, datasets, citations, download status, or licenses.
- Treat productivity signals as prompts to investigate, not proof of a cause or problem.

## Product

The intended primary users are Rwanda district agricultural planners. The planned MVP includes a data access hub, dashboard and valid comparisons, transparent productivity signals, and constrained source-cited Q&A. The Phase 1 shell contains no agricultural observations. This is an independent hackathon prototype, not an official NISR service.

## User preferences

- Keep implementation staged and focused on practical value from verified NISR data.
- Do not present fabricated or unverified agricultural statistics as real.
- Support English and Kinyarwanda for core interface text without overstating translation coverage.

## Gotchas

- The attached research is an executive summary, not a verified source catalog or actual NISR workbook. Verify source files, schemas, URLs, and licensing before ingestion or attribution.
- There are no agricultural workbooks or processed observations in this project yet. Keep data pages explicit until real data has been supplied and validated.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
