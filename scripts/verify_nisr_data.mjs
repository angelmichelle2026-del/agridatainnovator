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
const administrativeAreas = JSON.parse(
  fs.readFileSync(
    new URL("artifacts/agri-lens-ai/src/data/rwanda-admin-areas.json", root),
    "utf8",
  ),
);
const provinceYields2026a = JSON.parse(
  fs.readFileSync(
    new URL("artifacts/agri-lens-ai/src/data/province-yields-2026a.json", root),
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
assert.equal(administrativeAreas.entities.length, 5);
const mappedDistricts = administrativeAreas.entities.flatMap(
  (entity) => entity.districts,
);
const observedDistricts = land2026a.observations
  .map((row) => row.district)
  .filter((district) => district !== "National")
  .sort();
assert.equal(mappedDistricts.length, 30);
assert.equal(new Set(mappedDistricts).size, 30);
assert.deepEqual(
  [...mappedDistricts].sort(),
  observedDistricts,
  "Every named district must map to exactly one official province/city entity",
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
assert.deepEqual(provinceYields2026a.source.table_numbers, [12, 13, 15]);
assert.equal(provinceYields2026a.provinces.length, 5);
assert.equal(provinceYields2026a.crops.length, 21);
assert.equal(provinceYields2026a.observations.length, 105);
const areaTable = sas2026a.tables.find((table) => table.number === 12);
const yieldTable = sas2026a.tables.find((table) => table.number === 13);
const productionTable = sas2026a.tables.find((table) => table.number === 15);
const normalizeCrop = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const provinceByName = new Map(
  administrativeAreas.entities.map((entity) => [entity.name, entity]),
);
const sourceRow = (table, district) =>
  table.rows.find((row) => String(row[0]).trim() === district);
for (const observation of provinceYields2026a.observations) {
  const entity = provinceByName.get(observation.province);
  assert(entity, `Unknown mapped province/city: ${observation.province}`);
  const cropIndex = (table) =>
    table.headers.findIndex(
      (header) => normalizeCrop(header) === normalizeCrop(observation.crop),
    );
  const areaIndex = cropIndex(areaTable);
  const productionIndex = cropIndex(productionTable);
  const areaRows = entity.districts.map((district) =>
    sourceRow(areaTable, district),
  );
  const productionRows = entity.districts.map((district) =>
    sourceRow(productionTable, district),
  );
  assert(areaIndex >= 0 && productionIndex >= 0);
  assert(areaRows.every((row) => typeof row?.[areaIndex] === "number"));
  assert(
    productionRows.every((row) => typeof row?.[productionIndex] === "number"),
  );
  const harvestedArea = areaRows.reduce((sum, row) => sum + row[areaIndex], 0);
  const productionMt = productionRows.reduce(
    (sum, row) => sum + row[productionIndex],
    0,
  );
  const expectedYield =
    harvestedArea > 0 ? (productionMt * 1000) / harvestedArea : null;
  assert.equal(observation.harvested_area_ha, harvestedArea);
  assert.equal(observation.production_mt, productionMt);
  if (expectedYield === null) {
    assert.equal(observation.yield_kg_ha, null);
  } else {
    assert(Math.abs(observation.yield_kg_ha - expectedYield) < 1e-8);
  }
}
for (const benchmark of provinceYields2026a.national_benchmark) {
  const yieldIndex = yieldTable.headers.findIndex(
    (header) => normalizeCrop(header) === normalizeCrop(benchmark.crop),
  );
  const reportedNational = yieldTable.rows.find(
    (row) => String(row[0]).trim() === "National",
  );
  const regionalRows = provinceYields2026a.observations.filter(
    (row) => row.crop === benchmark.crop,
  );
  assert(yieldIndex >= 0 && reportedNational);
  assert.equal(benchmark.yield_kg_ha, reportedNational[yieldIndex]);
  assert.equal(regionalRows.length, 5);
  assert.equal(
    regionalRows.reduce((sum, row) => sum + row.harvested_area_ha, 0),
    benchmark.harvested_area_ha,
  );
  assert.equal(
    regionalRows.reduce((sum, row) => sum + row.production_mt, 0),
    benchmark.production_mt,
  );
}
const easternMaizeYield = provinceYields2026a.observations.find(
  (row) => row.province === "Eastern Province" && row.crop === "Maize",
);
assert(Math.abs(easternMaizeYield.yield_kg_ha - 2227.6068434432976) < 1e-8);
const nationalMaizeYield = provinceYields2026a.national_benchmark.find(
  (row) => row.crop === "Maize",
);
assert.equal(nationalMaizeYield.yield_kg_ha, 1.9943650203946784 * 1000);
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
  `NISR data validation passed: ${land.observations.length + land2026a.observations.length} district-season records (including national totals), ${national.observations.length} national indicators, ${sas2026a.tables.length} workbook tables, and ${national.sources.length} cited sources. Administrative mapping: ${administrativeAreas.entities.length} regions, ${mappedDistricts.length} unique districts. Province yields: ${provinceYields2026a.crops.length} crops × ${provinceYields2026a.provinces.length} regions.`,
);
