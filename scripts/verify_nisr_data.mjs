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
assert.equal(national.sources.length, 3);
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
  `NISR data validation passed: ${land.observations.length} district-season rows, ${national.observations.length} national observations, ${national.sources.length} cited sources.`,
);
