import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const land = JSON.parse(
  fs.readFileSync(
    new URL("artifacts/agri-lens-ai/src/data/district-land-2025.json", root),
    "utf8",
  ),
);
const national = JSON.parse(
  fs.readFileSync(
    new URL("artifacts/agri-lens-ai/src/data/national-indicators.json", root),
    "utf8",
  ),
);
const land2026a = JSON.parse(
  fs.readFileSync(
    new URL("artifacts/agri-lens-ai/src/data/district-land-2026a.json", root),
    "utf8",
  ),
);
const sas2026a = JSON.parse(
  fs.readFileSync(
    new URL(
      "artifacts/agri-lens-ai/src/data/nisr-sas-2026-season-a-tables.json",
      root,
    ),
    "utf8",
  ),
);
const cropVisuals2026a = JSON.parse(
  fs.readFileSync(
    new URL("artifacts/agri-lens-ai/src/data/crop-visuals-2026a.json", root),
    "utf8",
  ),
);
const sas2026aCsv = fs
  .readFileSync(
    new URL(
      "artifacts/agri-lens-ai/public/data/district-land-2026-season-a.csv",
      root,
    ),
    "utf8",
  )
  .trim()
  .split(/\r?\n/);
const csv = fs
  .readFileSync(
    new URL("artifacts/agri-lens-ai/public/data/district-land-2025.csv", root),
    "utf8",
  )
  .trim()
  .split(/\r?\n/);

assert.equal(
  land.observations.length,
  62,
  "Expected 30 districts plus national row in Seasons A and B",
);
for (const season of ["A", "B"]) {
  const rows = land.observations.filter((row) => row.season === season);
  assert.equal(rows.length, 31, `Season ${season} should have 31 rows`);
  assert.equal(
    new Set(rows.map((row) => row.district)).size,
    31,
    `Season ${season} should have unique districts`,
  );
}
assert.equal(csv.length, 63, "CSV should contain header and 62 observations");
assert.equal(
  land.observations.find(
    (row) => row.season === "A" && row.district === "National",
  ).agricultural_land_000ha,
  1399,
);
assert.equal(
  land.observations.find(
    (row) => row.season === "B" && row.district === "National",
  ).agricultural_land_000ha,
  1423,
);
assert.equal(
  land.observations.find(
    (row) => row.season === "B" && row.district === "Nyagatare",
  ).agricultural_land_000ha,
  146.7,
);
assert.equal(national.observations.length, 53);
assert.equal(national.sources.length, 4);
assert.equal(land2026a.observations.length, 31);
assert.equal(
  new Set(land2026a.observations.map((row) => row.district)).size,
  31,
  "2026 Season A should include 30 unique districts plus National",
);
assert.equal(sas2026a.tables.length, 35);
assert.equal(sas2026a.source.worksheet_count, 35);
assert.equal(sas2026a.tables[34].headers[0], "District");
assert.equal(
  sas2026aCsv.length,
  32,
  "2026 A district CSV should contain header and 31 rows",
);
const land2026aNational = land2026a.observations.find(
  (row) => row.district === "National",
);
assert.equal(land2026aNational.agricultural_land_000ha, 1376.3527);
const cropProduction = sas2026a.tables.find((table) => table.number === 6);
const maize2026a = cropProduction.rows.find((row) => row[0] === "Maize");
const maizeProductionColumn = cropProduction.headers.findIndex((header) =>
  header.includes("Production (MT) · 2026 A"),
);
assert.equal(maize2026a[maizeProductionColumn], 488622.343227443);
assert.equal(cropVisuals2026a.national_production.number, 6);
assert.equal(cropVisuals2026a.district_production.number, 15);
const chartMaizeProductionColumn =
  cropVisuals2026a.national_production.headers.findIndex((header) =>
    header.includes("Production (MT) · 2026 A"),
  );
const chartMaize = cropVisuals2026a.national_production.rows.find(
  (row) => row[0] === "Maize",
);
assert.equal(
  chartMaize[chartMaizeProductionColumn],
  488622.343227443,
  "Chart extract must preserve the source's 2026 A maize production figure",
);
const districtMaizeColumn =
  cropVisuals2026a.district_production.headers.indexOf("Maize");
const districtMaize = cropVisuals2026a.district_production.rows.find(
  (row) => row[0] === "Nyarugenge",
);
assert.equal(districtMaize[districtMaizeColumn], 869.6914401781387);
assert(
  fs.statSync(
    new URL(
      "artifacts/agri-lens-ai/public/data/nisr-sas-2026-season-a-tables.xlsx",
      root,
    ),
  ).size > 100000,
  "The full supplied workbook should be available for download",
);
assert.equal(
  national.observations.find(
    (row) =>
      row.year === 2026 &&
      row.season === "B" &&
      row.metric === "improved_seed_use",
  ).value,
  20.9,
);
assert.equal(
  national.observations.find(
    (row) =>
      row.year === 2025 &&
      row.season === "C" &&
      row.metric === "irrigation_practice",
  ).value,
  58.9,
);
assert(
  national.observations.every((row) => Number.isFinite(row.value)),
  "All national observations should be numeric",
);
for (const row of national.observations.filter(
  (item) => item.metric.endsWith("_use") || item.metric.endsWith("_practice"),
)) {
  assert(
    row.value >= 0 && row.value <= 100,
    `${row.metric} should be a percentage`,
  );
}
assert(
  land.observations.some((row) => Object.values(row).includes(null)),
  "Source dashes should survive as null, not zero",
);
console.info(
  `NISR data validation passed: ${land.observations.length + land2026a.observations.length} district-season records (including national totals), ${national.observations.length} national indicators, ${sas2026a.tables.length} workbook tables, and ${national.sources.length} cited sources.`,
);
