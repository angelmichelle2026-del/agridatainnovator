import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Source = {
  id: string;
  title: string;
  source_url: string;
  period?: string;
  note?: string;
};
type Observation = {
  year: number;
  season: string;
  metric: string;
  value: number;
  source_id: string;
};
type DistrictLandRow = Record<string, string | number | null> & {
  district: string;
  year: number;
  season: string;
  source_id: string;
};
type WorkbookTable = {
  id: string;
  number: number;
  title: string;
  headers: string[];
  rows: Array<Array<string | number | null>>;
};
type SearchDocument = {
  id: string;
  kind: string;
  title: string;
  body: string;
  period?: string;
  location?: string;
  sourceId: string;
};
export type SearchHit = {
  id: string;
  kind: string;
  title: string;
  excerpt: string;
  period?: string;
  location?: string;
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
};

type NationalFile = {
  sources: Source[];
  metric_definitions: Record<string, { label: string; unit: string }>;
  observations: Observation[];
};
type LandFile = {
  source: Source;
  fields: string[];
  observations: DistrictLandRow[];
};
type ProvinceYieldFile = {
  source: Source & {
    method?: string;
    interpretation_note?: string;
    period?: string;
  };
  crops: string[];
  provinces: Array<{ name: string; rw_name: string }>;
  observations: Array<{
    province: string;
    crop: string;
    harvested_area_ha: number;
    production_mt: number;
    yield_kg_ha: number | null;
  }>;
};
type WorkbookFile = { source: Source; tables: WorkbookTable[] };
type AdminFile = {
  entities: Array<{ name: string; rw_name: string; districts: string[] }>;
};

const configuredDataDirectory = process.env["AGRILENS_DATA_DIR"]?.trim();
const dataDirectory =
  configuredDataDirectory ||
  [
    resolve(import.meta.dirname, "../../agri-lens-ai/src/data"),
    resolve(import.meta.dirname, "../../../agri-lens-ai/src/data"),
  ].find((candidate) =>
    existsSync(resolve(candidate, "national-indicators.json")),
  ) ||
  resolve(import.meta.dirname, "../../../agri-lens-ai/src/data");

function loadJson<T>(filename: string): T {
  return JSON.parse(
    readFileSync(resolve(dataDirectory, filename), "utf8"),
  ) as T;
}

const national = loadJson<NationalFile>("national-indicators.json");
const land2025 = loadJson<LandFile>("district-land-2025.json");
const land2026a = loadJson<LandFile>("district-land-2026a.json");
const provinceYield = loadJson<ProvinceYieldFile>("province-yields-2026a.json");
const workbook = loadJson<WorkbookFile>("nisr-sas-2026-season-a-tables.json");
const admin = loadJson<AdminFile>("rwanda-admin-areas.json");

const sourceMap = new Map<string, Source>();
for (const source of [
  ...national.sources,
  land2025.source,
  land2026a.source,
  provinceYield.source,
  workbook.source,
]) {
  if (source?.id) sourceMap.set(source.id, source);
}

export const CHAT_SOURCES = [...sourceMap.values()];
const districts = [
  ...new Set(admin.entities.flatMap((entity) => entity.districts)),
];
const districtToProvince = new Map<string, string>();
for (const entity of admin.entities) {
  for (const district of entity.districts)
    districtToProvince.set(district, entity.name);
}

const bilingualAliases: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: "maize", aliases: ["maize", "corn", "ibigori"] },
  { canonical: "sorghum", aliases: ["sorghum", "amasaka"] },
  { canonical: "paddy rice", aliases: ["paddy rice", "rice", "umuceri"] },
  { canonical: "wheat", aliases: ["wheat", "ingano"] },
  { canonical: "bean", aliases: ["bean", "beans", "ibishyimbo"] },
  { canonical: "cassava", aliases: ["cassava", "imyumbati"] },
  {
    canonical: "sweet potato",
    aliases: ["sweet potato", "sweet potatoes", "ibijumba"],
  },
  {
    canonical: "irish potato",
    aliases: ["irish potato", "irish potatoes", "potato", "ibirayi"],
  },
  { canonical: "banana", aliases: ["banana", "bananas", "ibitoki", "igitoki"] },
  {
    canonical: "groundnuts",
    aliases: ["groundnut", "groundnuts", "peanuts", "ubunyobwa"],
  },
  {
    canonical: "improved seed use",
    aliases: [
      "improved seed use",
      "improved seed",
      "improved seeds",
      "imbuto zindobanure",
    ],
  },
  {
    canonical: "fertilizer",
    aliases: [
      "fertilizer",
      "organic fertilizer",
      "inorganic fertilizer",
      "ifumbire",
    ],
  },
  { canonical: "production", aliases: ["production", "umusaruro"] },
  { canonical: "yield", aliases: ["yield", "umusaruro kuri hegitari"] },
  {
    canonical: "agricultural land",
    aliases: ["agricultural land", "farmland", "ubutaka bwubuhinzi"],
  },
];

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "about",
  "can",
  "compare",
  "did",
  "does",
  "for",
  "from",
  "give",
  "how",
  "in",
  "is",
  "it",
  "me",
  "of",
  "on",
  "or",
  "please",
  "show",
  "tell",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "ni",
  "iki",
  "mu",
  "ku",
  "nka",
  "ese",
]);

export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’‘'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function words(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

function expandedQueryTerms(query: string): string[] {
  const normalized = normalizeText(query);
  const result = new Set(words(query));
  for (const group of bilingualAliases) {
    const matched = group.aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      return (
        normalized === normalizedAlias || normalized.includes(normalizedAlias)
      );
    });
    if (matched) {
      for (const word of words(group.canonical)) result.add(word);
      for (const alias of group.aliases) {
        for (const word of words(alias)) result.add(word);
      }
    }
  }
  return [...result];
}

function sourceFor(id: string): Source | undefined {
  return sourceMap.get(id);
}

function getTable(number: number): WorkbookTable | undefined {
  return workbook.tables.find((table) => table.number === number);
}

function rowAsText(
  table: WorkbookTable,
  row: Array<string | number | null>,
): string {
  return table.headers
    .map((header, index) => {
      const value = row[index];
      return value === null || value === undefined || value === ""
        ? ""
        : `${header}: ${String(value)}`;
    })
    .filter(Boolean)
    .join("; ");
}

function buildSearchDocuments(): SearchDocument[] {
  const docs: SearchDocument[] = [];
  for (const [metric, definition] of Object.entries(
    national.metric_definitions,
  )) {
    docs.push({
      id: `metric:${metric}`,
      kind: "indicator_definition",
      title: definition.label,
      body: `${metric} ${definition.label} ${definition.unit}`,
      sourceId: national.sources[0]?.id ?? "",
    });
  }
  for (const row of national.observations) {
    const definition = national.metric_definitions[row.metric];
    const period = `${row.year} Season ${row.season}`;
    docs.push({
      id: `national:${row.metric}:${row.year}:${row.season}`,
      kind: "national_indicator",
      title: `${definition?.label ?? row.metric} — Rwanda, ${period}`,
      body: `${row.metric} ${definition?.label ?? ""} ${row.value} ${definition?.unit ?? ""} Rwanda national ${period}`,
      period,
      location: "Rwanda",
      sourceId: row.source_id,
    });
  }
  for (const row of [...land2025.observations, ...land2026a.observations]) {
    const period = `${row.year} Season ${row.season}`;
    const province = districtToProvince.get(row.district);
    const values = Object.entries(row)
      .filter(
        ([key, value]) =>
          !["district", "year", "season", "source_id"].includes(key) &&
          value !== null,
      )
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`)
      .join("; ");
    docs.push({
      id: `district-land:${row.district}:${row.year}:${row.season}`,
      kind: "district_land",
      title: `District land — ${row.district}, ${period}`,
      body: `${row.district} ${province ?? ""} ${admin.entities.find((item) => item.name === province)?.rw_name ?? ""} ${period} agricultural land area ${values}`,
      period,
      location: row.district,
      sourceId: row.source_id,
    });
  }
  for (const row of provinceYield.observations) {
    const rwProvince =
      provinceYield.provinces.find((item) => item.name === row.province)
        ?.rw_name ?? "";
    docs.push({
      id: `province-yield:${row.crop}:${row.province}:2026:A`,
      kind: "province_yield",
      title: `${row.crop} yield — ${row.province}, 2026 Season A`,
      body: `${row.crop} ${row.province} ${rwProvince} 2026 Season A yield ${row.yield_kg_ha ?? "missing"} kg/ha production ${row.production_mt} MT harvested area ${row.harvested_area_ha} ha`,
      period: "2026 Season A",
      location: row.province,
      sourceId: provinceYield.source.id,
    });
  }
  for (const table of workbook.tables) {
    const tableTerms = `${table.title} ${table.headers.join(" ")}`;
    docs.push({
      id: `workbook-table:${table.number}`,
      kind: "workbook_table",
      title: table.title,
      body: tableTerms,
      period: workbook.source.period,
      sourceId: workbook.source.id,
    });
    table.rows.forEach((row, index) => {
      const label = String(row[0] ?? `row ${index + 1}`);
      docs.push({
        id: `workbook-row:${table.number}:${index}`,
        kind: "workbook_row",
        title: `${table.title} — ${label}`,
        body: `${tableTerms} ${label} ${rowAsText(table, row)}`,
        period: workbook.source.period,
        location: label,
        sourceId: workbook.source.id,
      });
    });

    if (table.number === 6) {
      table.rows.forEach((row, rowIndex) => {
        const crop = String(row[0] ?? "").trim();
        for (let column = 1; column < table.headers.length; column += 1) {
          const value = row[column];
          const header = table.headers[column] ?? "";
          const period = /(2025|2026)\s+([ABC])/i.exec(header);
          if (typeof value !== "number" || !period) continue;
          const normalizedHeader = normalizeText(header);
          const metric = normalizedHeader.includes("cultivated crop area")
            ? { label: "cultivated area", unit: "ha" }
            : normalizedHeader.includes("harvested crop area")
              ? { label: "harvested area", unit: "ha" }
              : normalizedHeader.includes("production")
                ? { label: "production", unit: "MT" }
                : normalizedHeader.includes("yield")
                  ? { label: "yield", unit: "MT/ha" }
                  : null;
          if (!metric) continue;
          const year = Number(period[1]);
          const season = period[2].toUpperCase();
          const surveyPeriod = `${year} Season ${season}`;
          docs.push({
            id: `workbook-value:6:${rowIndex}:${column}`,
            kind: "workbook_value",
            title: `Table 6: ${crop} ${metric.label} — Rwanda, ${surveyPeriod}`,
            body: `${crop} ${metric.label} in Rwanda for ${surveyPeriod}: ${value} ${metric.unit}. Published national crop summary from ${workbook.source.title}.`,
            period: surveyPeriod,
            location: "Rwanda",
            sourceId: workbook.source.id,
          });
        }
      });
    }

    const districtMetric = {
      11: { label: "cultivated area", unit: "ha" },
      12: { label: "harvested area", unit: "ha" },
      13: { label: "yield", unit: "kg/ha" },
      14: { label: "large-scale farmer yield", unit: "kg/ha" },
      15: { label: "production", unit: "MT" },
    }[table.number as 11 | 12 | 13 | 14 | 15];
    if (districtMetric) {
      table.rows.forEach((row) => {
        const location = String(row[0] ?? "");
        if (!districts.includes(location)) return;
        const province = districtToProvince.get(location) ?? "";
        const provinceRw =
          admin.entities.find((entity) => entity.name === province)?.rw_name ??
          "";
        for (let column = 1; column < table.headers.length; column += 1) {
          const value = row[column];
          if (typeof value !== "number") continue;
          const crop = String(table.headers[column] ?? "").trim();
          if (!crop) continue;
          docs.push({
            id: `workbook-value:${table.number}:${crop}:${location}`,
            kind: "workbook_value",
            title: `Table ${table.number}: ${crop} ${districtMetric.label} — ${location}, 2026 Season A`,
            body: `${crop} ${districtMetric.label} in ${location}, ${province} ${provinceRw}, Rwanda, 2026 Season A: ${value} ${districtMetric.unit}.`,
            period: "2026 Season A",
            location,
            sourceId: workbook.source.id,
          });
        }
      });
    }
  }
  return docs;
}

const searchDocuments = buildSearchDocuments();

export function searchAgriData(
  query: string,
  limit = 6,
): { query: string; count: number; results: SearchHit[] } {
  const cleanQuery = query.trim().slice(0, 240);
  const normalized = normalizeText(cleanQuery);
  const terms = expandedQueryTerms(cleanQuery);
  if (!normalized || terms.length === 0)
    return { query: cleanQuery, count: 0, results: [] };
  const cropAliasGroups = bilingualAliases.filter(
    (group) =>
      ![
        "improved seed use",
        "fertilizer",
        "production",
        "yield",
        "agricultural land",
      ].includes(group.canonical),
  );
  const matchedCropGroup = cropAliasGroups
    .filter((group) =>
      group.aliases.some((alias) => {
        const normalizedAlias = normalizeText(alias);
        return (
          normalized === normalizedAlias || normalized.includes(normalizedAlias)
        );
      }),
    )
    .sort((a, b) => b.canonical.length - a.canonical.length)[0];
  const matchedCrop = Boolean(matchedCropGroup);
  const explicitProvince = admin.entities.find((entity) =>
    [entity.name, entity.rw_name].some((name) =>
      normalized.includes(normalizeText(name)),
    ),
  );
  const explicitDistrict = districts.find((district) =>
    normalized.includes(normalizeText(district)),
  );
  const asksForYield = terms.includes("yield");
  const asksForProduction = terms.includes("production");
  const asksForArea = terms.includes("area") || terms.includes("land");
  const ranked = searchDocuments
    .map((doc) => {
      const title = normalizeText(doc.title);
      const body = normalizeText(doc.body);
      const location = normalizeText(doc.location ?? "");
      const genericWorkbookRow = /^workbook-row:(\d+):/.exec(doc.id);
      if (matchedCropGroup && genericWorkbookRow) {
        const tableNumber = Number(genericWorkbookRow[1]);
        if ([11, 12, 13, 14, 15].includes(tableNumber)) return null;
        if (
          tableNumber === 6 &&
          ![matchedCropGroup.canonical, ...matchedCropGroup.aliases].some(
            (alias) => normalizeText(alias) === location,
          )
        )
          return null;
      }
      if (
        matchedCropGroup &&
        doc.kind === "workbook_value" &&
        ![matchedCropGroup.canonical, ...matchedCropGroup.aliases].some(
          (alias) => title.includes(normalizeText(alias)),
        )
      )
        return null;
      let score = 0;
      if (title === normalized) score += 20;
      if (title.includes(normalized)) score += 12;
      if (body.includes(normalized)) score += 7;
      if (explicitProvince && doc.location === explicitProvince.name)
        score += 16;
      if (explicitDistrict && doc.location === explicitDistrict) score += 16;
      for (const term of terms) {
        if (title.includes(term)) score += 5;
        if (location.includes(term)) score += 4;
        if (body.includes(term)) score += 1;
      }
      const workbookValue = /^workbook-value:(\d+):/.exec(doc.id);
      if (workbookValue) {
        const tableNumber = Number(workbookValue[1]);
        if (matchedCrop) {
          score +=
            (
              { 6: 18, 11: 10, 12: 12, 13: 16, 14: 10, 15: 16 } as Record<
                number,
                number
              >
            )[tableNumber] ?? 0;
        }
        if (asksForYield && [13, 14].includes(tableNumber)) score += 12;
        if (asksForProduction && [6, 15].includes(tableNumber)) score += 12;
        if (asksForArea && [11, 12].includes(tableNumber)) score += 12;
        if (tableNumber === 6 && doc.period === "2026 Season A") score += 6;
        if (
          matchedCrop &&
          !asksForYield &&
          !asksForProduction &&
          !asksForArea &&
          tableNumber === 6 &&
          doc.period === "2026 Season A"
        ) {
          if (title.includes(" production ")) score += 6;
          if (title.includes(" yield ")) score += 5;
        }
      }
      if (score === 0) return null;
      const source = sourceFor(doc.sourceId);
      return {
        score,
        hit: {
          id: doc.id,
          kind: doc.kind,
          title: doc.title,
          excerpt: doc.body.replace(/\s+/g, " ").slice(0, 320),
          ...(doc.period ? { period: doc.period } : {}),
          ...(doc.location ? { location: doc.location } : {}),
          sourceId: doc.sourceId,
          sourceTitle: source?.title ?? "NISR source",
          sourceUrl: source?.source_url ?? "",
        } satisfies SearchHit,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort(
      (a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title),
    );
  const take = Math.max(1, Math.min(10, Number.isInteger(limit) ? limit : 6));
  const tableResultCounts = new Map<number, number>();
  const selectedHits: SearchHit[] = [];
  for (const { hit } of ranked) {
    const row = /^workbook-(?:row|value):(\d+):/.exec(hit.id);
    if (row) {
      const tableNumber = Number(row[1]);
      const count = tableResultCounts.get(tableNumber) ?? 0;
      if (count >= 2) continue;
      tableResultCounts.set(tableNumber, count + 1);
    }
    selectedHits.push(hit);
    if (selectedHits.length >= take) break;
  }
  return {
    query: cleanQuery,
    count: ranked.length,
    results: selectedHits,
  };
}

function matchExactName(query: string, candidates: string[]): string | null {
  const normalized = normalizeText(query);
  return (
    candidates.find((candidate) => normalizeText(candidate) === normalized) ??
    null
  );
}

function resolveDistrict(query: string): string | null {
  const normalized = normalizeText(query);
  if (!normalized) return null;
  return (
    districts.find((district) => normalizeText(district) === normalized) ?? null
  );
}

function resolveProvince(query: string): string | null {
  const normalized = normalizeText(query);
  if (!normalized) return null;
  const entity = admin.entities.find(
    (item) =>
      normalizeText(item.name) === normalized ||
      normalizeText(item.rw_name) === normalized,
  );
  if (entity) return entity.name;
  if (normalized === "kigali" || normalized === "kigali city")
    return "City of Kigali";
  return null;
}

function aliasMatch(query: string, canonical: string): boolean {
  const normalized = normalizeText(query);
  const group = bilingualAliases.find(
    (item) => item.canonical === normalizeText(canonical),
  );
  if (!group) return normalized === normalizeText(canonical);
  return (
    group.aliases.some((alias) => normalizeText(alias) === normalized) ||
    normalizeText(canonical) === normalized
  );
}

function resolveCrop(query: string, candidates: string[]): string | null {
  const normalized = normalizeText(query);
  const exact = candidates.find((crop) => normalizeText(crop) === normalized);
  if (exact) return exact;
  for (const crop of candidates) {
    if (aliasMatch(query, crop)) return crop;
  }
  return null;
}

const landMetricLabels: Record<
  string,
  { label: string; unit: string; aliases: string[] }
> = {
  total_land_000ha: {
    label: "Total land area",
    unit: "thousand hectares",
    aliases: ["total land"],
  },
  agricultural_land_000ha: {
    label: "Agricultural land area",
    unit: "thousand hectares",
    aliases: ["agricultural land", "farmland", "ubutaka bwubuhinzi"],
  },
  agricultural_land_pct: {
    label: "Agricultural land share",
    unit: "%",
    aliases: ["agricultural land share", "percent agricultural land"],
  },
  arable_land_000ha: {
    label: "Arable land area",
    unit: "thousand hectares",
    aliases: ["arable land"],
  },
  physical_cultivated_land_000ha: {
    label: "Physical cultivated land area",
    unit: "thousand hectares",
    aliases: ["cultivated land"],
  },
  seasonal_crop_area_000ha: {
    label: "Seasonal crop area",
    unit: "thousand hectares",
    aliases: ["seasonal crop area"],
  },
  permanent_crop_area_000ha: {
    label: "Permanent crop area",
    unit: "thousand hectares",
    aliases: ["permanent crop area"],
  },
  temporary_fallow_area_000ha: {
    label: "Temporary fallow area",
    unit: "thousand hectares",
    aliases: ["fallow land"],
  },
  temporary_meadow_pasture_000ha: {
    label: "Temporary meadow and pasture area",
    unit: "thousand hectares",
    aliases: ["temporary pasture"],
  },
  permanent_pasture_000ha: {
    label: "Permanent pasture area",
    unit: "thousand hectares",
    aliases: ["permanent pasture"],
  },
};

function resolveLandMetric(query: string): string | null {
  const normalized = normalizeText(query);
  const matches = Object.entries(landMetricLabels).filter(([key, value]) =>
    [key, value.label, ...value.aliases].some(
      (candidate) => normalizeText(candidate) === normalized,
    ),
  );
  return matches.length === 1 ? matches[0][0] : null;
}

function sourcePayload(
  sourceId: string,
): Pick<SearchHit, "sourceId" | "sourceTitle" | "sourceUrl"> {
  const source = sourceFor(sourceId);
  return {
    sourceId,
    sourceTitle: source?.title ?? "NISR source",
    sourceUrl: source?.source_url ?? "",
  };
}

function unavailable(
  reason: string,
  nextStep?: string,
  extra: Record<string, unknown> = {},
) {
  return {
    available: false,
    reason,
    ...(nextStep ? { next_step: nextStep } : {}),
    ...extra,
  };
}

function getSnapshotData(args: Record<string, unknown>) {
  const dataset = typeof args.dataset === "string" ? args.dataset : "";
  const limitRaw = typeof args.limit === "number" ? args.limit : 10;
  const limit = Math.max(1, Math.min(20, Math.trunc(limitRaw)));
  const year = typeof args.year === "number" ? args.year : undefined;
  const season =
    typeof args.season === "string" ? args.season.toUpperCase() : undefined;
  if (season && !["A", "B", "C"].includes(season))
    return unavailable("Season must be A, B, or C.");
  if (year && ![2025, 2026].includes(year))
    return unavailable(
      "The snapshot has records for 2025 and 2026 only.",
      "Search the catalog for the available reporting periods.",
    );

  if (dataset === "national_indicators") {
    const metricQuery = typeof args.metric === "string" ? args.metric : "";
    const metric = metricQuery
      ? Object.keys(national.metric_definitions).find((key) => {
          const definition = national.metric_definitions[key];
          return (
            [key, definition.label].some(
              (candidate) =>
                normalizeText(candidate) === normalizeText(metricQuery),
            ) || aliasMatch(metricQuery, key.replace(/_/g, " "))
          );
        })
      : null;
    if (metricQuery && !metric) {
      return unavailable(
        "That indicator name did not exactly match the catalog.",
        "Call search_agri_data to discover the valid indicator names.",
        {
          available_indicators: Object.entries(national.metric_definitions).map(
            ([id, item]) => ({ id, ...item }),
          ),
        },
      );
    }
    const rows = national.observations.filter(
      (row) =>
        (!metric || row.metric === metric) &&
        (!year || row.year === year) &&
        (!season || row.season === season),
    );
    if (rows.length === 0)
      return unavailable(
        "No national indicator records match those filters.",
        "Check the metric, year, and season against the catalog.",
      );
    return {
      available: true,
      dataset,
      records: rows.slice(0, limit).map((row) => ({
        indicator_id: row.metric,
        indicator: national.metric_definitions[row.metric]?.label ?? row.metric,
        value: row.value,
        unit: national.metric_definitions[row.metric]?.unit ?? "",
        geography: "Rwanda",
        year: row.year,
        season: row.season,
        ...sourcePayload(row.source_id),
      })),
      total_matches: rows.length,
    };
  }

  if (dataset === "district_land") {
    const districtQuery =
      typeof args.district === "string" ? args.district : "";
    const provinceQuery =
      typeof args.province === "string" ? args.province : "";
    const district = districtQuery ? resolveDistrict(districtQuery) : null;
    const province = provinceQuery ? resolveProvince(provinceQuery) : null;
    if (districtQuery && !district)
      return unavailable(
        "District name did not match an official district in the snapshot.",
        "Search the catalog or use one of the 30 district names.",
        { district_names: districts },
      );
    if (provinceQuery && !province)
      return unavailable(
        "Province name did not match the official administrative directory.",
        "Use the Government of Rwanda province or City of Kigali name.",
      );
    const metricQuery = typeof args.metric === "string" ? args.metric : "";
    const metric = metricQuery ? resolveLandMetric(metricQuery) : null;
    if (metricQuery && !metric)
      return unavailable(
        "Land metric is ambiguous or unavailable.",
        "Choose a metric ID or an exact label.",
        {
          available_metrics: Object.entries(landMetricLabels).map(
            ([id, item]) => ({ id, label: item.label, unit: item.unit }),
          ),
        },
      );
    const allowedDistricts = province
      ? new Set(
          admin.entities.find((item) => item.name === province)?.districts ??
            [],
        )
      : null;
    const records = [
      ...land2025.observations,
      ...land2026a.observations,
    ].filter(
      (row) =>
        (!district || row.district === district) &&
        (!allowedDistricts || allowedDistricts.has(row.district)) &&
        (!year || row.year === year) &&
        (!season || row.season === season),
    );
    if (records.length === 0)
      return unavailable(
        "No district land records match those geography and period filters.",
        "The district land extract covers 2025 Seasons A/B and 2026 Season A only.",
      );
    return {
      available: true,
      dataset,
      records: records.slice(0, limit).map((row) => {
        const entry: Record<string, unknown> = {
          district: row.district,
          province: districtToProvince.get(row.district) ?? null,
          year: row.year,
          season: row.season,
          ...sourcePayload(row.source_id),
        };
        if (metric) {
          const definition = landMetricLabels[metric];
          entry.indicator_id = metric;
          entry.indicator = definition.label;
          entry.value = row[metric];
          entry.unit = definition.unit;
        } else {
          entry.values = Object.fromEntries(
            land2025.fields.map((field) => [field, row[field] ?? null]),
          );
          entry.unit_note =
            "Field names ending in _000ha are thousand hectares; fields ending in _pct are percentages.";
        }
        return entry;
      }),
      total_matches: records.length,
    };
  }

  if (dataset === "province_yields") {
    if ((year && year !== 2026) || (season && season !== "A")) {
      return unavailable(
        "Province yield data in this snapshot covers 2026 Season A only.",
        "Ask for the 2026 Season A comparison or search another available dataset.",
      );
    }
    const cropQuery = typeof args.crop === "string" ? args.crop : "";
    const crop = cropQuery ? resolveCrop(cropQuery, provinceYield.crops) : null;
    if (cropQuery && !crop)
      return unavailable(
        "Crop did not exactly match the province-yield catalog.",
        "Call search_agri_data for available crops.",
        { available_crops: provinceYield.crops },
      );
    const provinceQuery =
      typeof args.province === "string" ? args.province : "";
    const province = provinceQuery ? resolveProvince(provinceQuery) : null;
    if (provinceQuery && !province)
      return unavailable(
        "Province name did not match the administrative directory.",
      );
    const records = provinceYield.observations.filter(
      (row) =>
        (!crop || normalizeText(row.crop) === normalizeText(crop)) &&
        (!province || row.province === province),
    );
    if (records.length === 0)
      return unavailable("No province yield records match those filters.");
    return {
      available: true,
      dataset,
      period: "2026 Season A",
      method: provinceYield.source.method,
      interpretation_note: provinceYield.source.interpretation_note,
      records: records.slice(0, limit).map((row) => ({
        ...row,
        unit: "kg/ha",
        ...sourcePayload(provinceYield.source.id),
      })),
      total_matches: records.length,
    };
  }

  if (dataset === "workbook_table") {
    const tableNumber =
      typeof args.table_number === "number" ? Math.trunc(args.table_number) : 0;
    const table = getTable(tableNumber);
    if (!table)
      return unavailable(
        "Workbook table number must be one of the 35 imported tables.",
        "Search the data catalog to find the relevant table.",
        {
          available_tables: workbook.tables.map(({ number, title }) => ({
            number,
            title,
          })),
        },
      );
    const rowQuery =
      typeof args.row_query === "string" ? normalizeText(args.row_query) : "";
    const matchingRows = rowQuery
      ? table.rows.filter((row) =>
          normalizeText(
            `${String(row[0] ?? "")} ${rowAsText(table, row)}`,
          ).includes(rowQuery),
        )
      : table.rows;
    if (matchingRows.length === 0)
      return unavailable(
        `Table ${tableNumber} exists, but no rows match the requested row filter.`,
        "Check the row label or search for the crop/district name.",
      );
    return {
      available: true,
      dataset,
      table_number: table.number,
      title: table.title,
      headers: table.headers,
      rows: matchingRows.slice(0, limit),
      total_matches: matchingRows.length,
      truncated: matchingRows.length > limit,
      ...sourcePayload(workbook.source.id),
    };
  }

  return unavailable(
    "Dataset is not on the read-only allowlist.",
    "Use one of: national_indicators, district_land, province_yields, workbook_table.",
  );
}

function calculateChange(previous: number | null, current: number | null) {
  if (previous === null || current === null)
    return {
      absolute_change: null,
      percent_change: null,
      calculation_note:
        "A required value is missing; no change was calculated.",
    };
  return {
    absolute_change: current - previous,
    percent_change:
      previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100,
    calculation_note:
      previous === 0
        ? "Percentage change is undefined because the baseline is zero."
        : "Percentage change = (current − previous) ÷ |previous| × 100.",
  };
}

function analyzeNisrData(args: Record<string, unknown>) {
  const analysis = typeof args.analysis === "string" ? args.analysis : "";
  const limit = Math.max(
    1,
    Math.min(10, Math.trunc(typeof args.limit === "number" ? args.limit : 10)),
  );
  const year = (key: string, fallback: number) =>
    typeof args[key] === "number" ? Math.trunc(args[key] as number) : fallback;
  const season = (key: string, fallback: string) =>
    typeof args[key] === "string" ? String(args[key]).toUpperCase() : fallback;

  if (analysis === "rank_district_crop_production") {
    if (
      (args.year !== undefined && args.year !== 2026) ||
      (args.season !== undefined && String(args.season).toUpperCase() !== "A")
    )
      return unavailable(
        "District crop-production ranking is available for 2026 Season A only.",
      );
    const cropQuery = typeof args.crop === "string" ? args.crop : "";
    const table = getTable(15)!;
    const crop = cropQuery
      ? resolveCrop(cropQuery, table.headers.slice(1))
      : null;
    if (!crop)
      return unavailable(
        "A supported crop or crop group is required for the ranking.",
        "Use search_agri_data to inspect the Table 15 crop columns.",
        { crops: table.headers.slice(1) },
      );
    const column = table.headers.findIndex(
      (header) => normalizeText(header) === normalizeText(crop),
    );
    const districtQuery =
      typeof args.district === "string" ? args.district : "";
    const district = districtQuery ? resolveDistrict(districtQuery) : null;
    if (districtQuery && !district)
      return unavailable(
        "District is not one of Rwanda’s 30 official districts in the imported snapshot.",
      );
    const provinceQuery =
      typeof args.province === "string" ? args.province : "";
    const province = provinceQuery ? resolveProvince(provinceQuery) : null;
    if (provinceQuery && !province)
      return unavailable(
        "Province does not match the administrative directory.",
      );
    const allowed = province
      ? new Set(
          admin.entities.find((item) => item.name === province)?.districts ??
            [],
        )
      : null;
    const rows = table.rows
      .filter(
        (row) =>
          districts.includes(String(row[0])) &&
          (!allowed || allowed.has(String(row[0]))) &&
          (!district || String(row[0]) === district),
      )
      .map((row) => ({
        district: String(row[0]),
        value: typeof row[column] === "number" ? (row[column] as number) : null,
      }))
      .filter(
        (row): row is { district: string; value: number } => row.value !== null,
      )
      .sort(
        (a, b) => b.value - a.value || a.district.localeCompare(b.district),
      );
    if (rows.length === 0)
      return unavailable(
        "No reported values were found for that crop and geography.",
      );
    const ranked = rows.map((row, index) => ({
      rank: index + 1,
      ...row,
      unit: "MT",
    }));
    return {
      available: true,
      analysis,
      crop,
      geography: province ?? "Rwanda districts",
      period: "2026 Season A",
      method:
        "Values are read from Table 15 and ranked over named districts only; summary rows such as S/Total, 2025A, and Change are excluded.",
      records: district
        ? ranked.filter((row) => row.district === district)
        : ranked.slice(0, limit),
      total_districts_with_values: rows.length,
      ...sourcePayload(workbook.source.id),
    };
  }

  if (analysis === "compare_national_crop_production") {
    if (
      (args.year !== undefined && args.year !== 2026) ||
      (args.season !== undefined && String(args.season).toUpperCase() !== "A")
    )
      return unavailable(
        "National crop-production comparison in Table 6 covers 2025 and 2026 Season A only.",
      );
    const cropQuery = typeof args.crop === "string" ? args.crop : "";
    const table = getTable(6)!;
    const crop = cropQuery
      ? resolveCrop(
          cropQuery,
          table.rows.map((row) => String(row[0] ?? "")),
        )
      : null;
    if (!crop)
      return unavailable(
        "A crop name present in Table 6 is required.",
        "Search the catalog for the crop rows.",
        { available_crops: table.rows.map((row) => String(row[0] ?? "")) },
      );
    const row = table.rows.find(
      (item) => normalizeText(String(item[0] ?? "")) === normalizeText(crop),
    );
    const currentIndex = table.headers.findIndex((header) =>
      normalizeText(header).includes("production mt 2026 a"),
    );
    const previousIndex = table.headers.findIndex((header) =>
      normalizeText(header).includes("production mt 2025 a"),
    );
    if (!row || currentIndex < 0 || previousIndex < 0)
      return unavailable(
        "The requested production comparison is not available in Table 6.",
      );
    const current =
      typeof row[currentIndex] === "number"
        ? (row[currentIndex] as number)
        : null;
    const previous =
      typeof row[previousIndex] === "number"
        ? (row[previousIndex] as number)
        : null;
    return {
      available: true,
      analysis,
      crop,
      geography: "Rwanda",
      unit: "MT",
      previous: { year: 2025, season: "A", value: previous },
      current: { year: 2026, season: "A", value: current },
      ...calculateChange(previous, current),
      method:
        "Absolute change is 2026A production minus 2025A production; percentage change uses 2025A as the baseline. These are published table values, not a causal analysis.",
      ...sourcePayload(workbook.source.id),
    };
  }

  if (analysis === "rank_province_crop_yield") {
    if (
      (args.year !== undefined && args.year !== 2026) ||
      (args.season !== undefined && String(args.season).toUpperCase() !== "A")
    )
      return unavailable(
        "Province yield summaries are available for 2026 Season A only.",
      );
    const cropQuery = typeof args.crop === "string" ? args.crop : "";
    const crop = cropQuery ? resolveCrop(cropQuery, provinceYield.crops) : null;
    if (!crop)
      return unavailable(
        "A supported crop is required.",
        "Search the catalog for the 21 available province-yield crops.",
        { crops: provinceYield.crops },
      );
    const provinceQuery =
      typeof args.province === "string" ? args.province : "";
    const province = provinceQuery ? resolveProvince(provinceQuery) : null;
    if (provinceQuery && !province)
      return unavailable(
        "Province does not match the administrative directory.",
      );
    const rows = provinceYield.observations
      .filter(
        (row) =>
          normalizeText(row.crop) === normalizeText(crop) &&
          (!province || row.province === province) &&
          row.yield_kg_ha !== null,
      )
      .sort(
        (a, b) =>
          (b.yield_kg_ha ?? -Infinity) - (a.yield_kg_ha ?? -Infinity) ||
          a.province.localeCompare(b.province),
      );
    if (!rows.length)
      return unavailable("No province yield values were found for that crop.");
    return {
      available: true,
      analysis,
      crop,
      period: "2026 Season A",
      unit: "kg/ha",
      method: provinceYield.source.method,
      caveat: provinceYield.source.interpretation_note,
      records: rows.map((row, index) => ({
        rank: index + 1,
        province: row.province,
        yield_kg_ha: row.yield_kg_ha,
        production_mt: row.production_mt,
        harvested_area_ha: row.harvested_area_ha,
      })),
      ...sourcePayload(provinceYield.source.id),
    };
  }

  if (analysis === "compare_district_land") {
    const districtQuery =
      typeof args.district === "string" ? args.district : "";
    const district = districtQuery ? resolveDistrict(districtQuery) : null;
    if (!district)
      return unavailable(
        "A valid district name is required for this comparison.",
        "Use one of the 30 district names in the official administrative directory.",
      );
    const metricQuery = typeof args.metric === "string" ? args.metric : "";
    const metric = metricQuery ? resolveLandMetric(metricQuery) : null;
    if (!metric)
      return unavailable(
        "An exact land metric is required; do not mix area and percentage indicators.",
        "Choose a metric ID from the district land catalog.",
        {
          metrics: Object.entries(landMetricLabels).map(([id, value]) => ({
            id,
            label: value.label,
            unit: value.unit,
          })),
        },
      );
    const yearA = year("year_a", 2025);
    const seasonA = season("season_a", "A");
    const yearB = year("year_b", 2026);
    const seasonB = season("season_b", "A");
    const rows = [...land2025.observations, ...land2026a.observations];
    const first = rows.find(
      (row) =>
        row.district === district &&
        row.year === yearA &&
        row.season === seasonA,
    );
    const second = rows.find(
      (row) =>
        row.district === district &&
        row.year === yearB &&
        row.season === seasonB,
    );
    if (!first || !second)
      return unavailable(
        `The snapshot does not contain both requested ${yearA}${seasonA} and ${yearB}${seasonB} land records for ${district}.`,
        "Choose periods available for the district land tables: 2025A, 2025B, and 2026A.",
      );
    const previous =
      typeof first[metric] === "number" ? (first[metric] as number) : null;
    const current =
      typeof second[metric] === "number" ? (second[metric] as number) : null;
    return {
      available: true,
      analysis,
      district,
      indicator_id: metric,
      indicator: landMetricLabels[metric].label,
      unit: landMetricLabels[metric].unit,
      previous: {
        year: yearA,
        season: seasonA,
        value: previous,
        source_id: first.source_id,
      },
      current: {
        year: yearB,
        season: seasonB,
        value: current,
        source_id: second.source_id,
      },
      ...calculateChange(previous, current),
      method:
        "Difference between published district values for the requested periods; this does not explain why the figure changed.",
      source_ids: [first.source_id, second.source_id],
    };
  }

  if (analysis === "compare_national_indicator") {
    const metricQuery = typeof args.metric === "string" ? args.metric : "";
    const metric = Object.keys(national.metric_definitions).find((key) => {
      const definition = national.metric_definitions[key];
      return (
        [key, definition.label].some(
          (candidate) =>
            normalizeText(candidate) === normalizeText(metricQuery),
        ) || aliasMatch(metricQuery, key.replace(/_/g, " "))
      );
    });
    if (!metric)
      return unavailable(
        "A national indicator present in the catalog is required.",
        "Search for an exact indicator label or ID.",
        {
          indicators: Object.entries(national.metric_definitions).map(
            ([id, item]) => ({ id, ...item }),
          ),
        },
      );
    const yearA = year("year_a", 2025);
    const seasonA = season("season_a", "A");
    const yearB = year("year_b", 2026);
    const seasonB = season("season_b", "A");
    const first = national.observations.find(
      (row) =>
        row.metric === metric && row.year === yearA && row.season === seasonA,
    );
    const second = national.observations.find(
      (row) =>
        row.metric === metric && row.year === yearB && row.season === seasonB,
    );
    if (!first || !second)
      return unavailable(
        `The snapshot does not contain both requested periods for ${national.metric_definitions[metric].label}.`,
        "Search the catalog for available periods and select matching seasons.",
      );
    return {
      available: true,
      analysis,
      indicator_id: metric,
      indicator: national.metric_definitions[metric].label,
      unit: national.metric_definitions[metric].unit,
      previous: {
        year: yearA,
        season: seasonA,
        value: first.value,
        source_id: first.source_id,
      },
      current: {
        year: yearB,
        season: seasonB,
        value: second.value,
        source_id: second.source_id,
      },
      ...calculateChange(first.value, second.value),
      method:
        "For percentage indicators, absolute change is in percentage points; percent change is a relative change from the earlier value. No survey-design significance test is applied.",
      source_ids: [...new Set([first.source_id, second.source_id])],
    };
  }

  return unavailable(
    "Analysis is not on the read-only allowlist.",
    "Use search_agri_data, query_nisr_snapshot, or one of the documented analysis options.",
  );
}

function getCatalog(query?: string) {
  const metrics = Object.entries(national.metric_definitions).map(
    ([id, item]) => ({ id, ...item }),
  );
  const tables = workbook.tables.map(({ number, title, headers }) => ({
    number,
    title,
    headers,
  }));
  const catalog = {
    datasets: [
      {
        id: "national_indicators",
        periods: "2025 A/B/C and 2026 A/B",
        records: national.observations.length,
      },
      {
        id: "district_land",
        periods: "2025 A/B and 2026 A",
        records: land2025.observations.length + land2026a.observations.length,
      },
      {
        id: "province_yields",
        periods: "2026 A only; area-weighted derived summaries",
        records: provinceYield.observations.length,
      },
      {
        id: "workbook_table",
        periods: "NISR SAS 2026 Season A workbook",
        tables: tables.length,
      },
    ],
    indicators: metrics,
    sources: CHAT_SOURCES.map(({ id, title, source_url, period, note }) => ({
      id,
      title,
      source_url,
      period,
      note,
    })),
    tables,
    limitations: [
      "District crop production and yield are available from selected 2026 Season A workbook tables; not every indicator is available at district level.",
      "Province yield records are derived area-weighted summaries for 2026 Season A, not separate NISR-published province estimates.",
      "The snapshot does not provide causal evidence, statistical significance tests, or current-period forecasts.",
    ],
  };
  if (!query?.trim()) return catalog;
  return {
    ...catalog,
    matching_search_results: searchAgriData(query, 6).results,
  };
}

export const AGRI_TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "search_agri_data",
      description:
        "Search the read-only AgriLens catalog across indicator definitions, NISR observations, district land records, derived province yields, and all 35 workbook tables. Use before answering when the matching dataset or measure is unclear.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            minLength: 1,
            maxLength: 240,
            description:
              "Search terms in English or Kinyarwanda, including a crop, indicator, location, or period.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "Maximum search results (1-10).",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_agri_data_catalog",
      description:
        "List the actual dataset coverage, indicator definitions, sources, workbook tables, and known limitations. Use to explain what the snapshot does and does not contain.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            maxLength: 240,
            description: "Optional topic to include relevant search results.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_nisr_snapshot",
      description:
        "Retrieve exact records from an allowlisted read-only dataset with exact period, location and measure filters. Do not use this as free-form SQL.",
      parameters: {
        type: "object",
        properties: {
          dataset: {
            type: "string",
            enum: [
              "national_indicators",
              "district_land",
              "province_yields",
              "workbook_table",
            ],
          },
          metric: {
            type: "string",
            description:
              "Exact metric key/label or land field; only used where supported.",
          },
          crop: {
            type: "string",
            description: "Crop name or recognized alias.",
          },
          district: { type: "string", description: "Exact district name." },
          province: {
            type: "string",
            description: "Exact province or City of Kigali name.",
          },
          year: { type: "integer", enum: [2025, 2026] },
          season: { type: "string", enum: ["A", "B", "C"] },
          table_number: { type: "integer", minimum: 1, maximum: 35 },
          row_query: {
            type: "string",
            description: "Optional exact phrase to filter workbook rows.",
          },
          limit: { type: "integer", minimum: 1, maximum: 20 },
        },
        required: ["dataset"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_nisr_data",
      description:
        "Run a reproducible, deterministic, allowlisted agricultural analysis. Use for crop rankings and comparisons; the tool calculates values and reports the method and source.",
      parameters: {
        type: "object",
        properties: {
          analysis: {
            type: "string",
            enum: [
              "rank_district_crop_production",
              "compare_national_crop_production",
              "rank_province_crop_yield",
              "compare_district_land",
              "compare_national_indicator",
            ],
          },
          crop: { type: "string" },
          metric: { type: "string" },
          district: { type: "string" },
          province: { type: "string" },
          year: { type: "integer", enum: [2025, 2026] },
          season: { type: "string", enum: ["A", "B", "C"] },
          year_a: { type: "integer", enum: [2025, 2026] },
          season_a: { type: "string", enum: ["A", "B", "C"] },
          year_b: { type: "integer", enum: [2025, 2026] },
          season_b: { type: "string", enum: ["A", "B", "C"] },
          limit: { type: "integer", minimum: 1, maximum: 10 },
        },
        required: ["analysis"],
        additionalProperties: false,
      },
    },
  },
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function validateToolArguments(
  name: string,
  args: Record<string, unknown>,
): string | null {
  const definition = AGRI_TOOL_DEFINITIONS.find(
    (tool) => tool.function.name === name,
  );
  if (!definition) return "Tool name is not on the server-side allowlist.";
  const schema = definition.function.parameters as unknown as {
    properties: Record<
      string,
      {
        type?: string;
        enum?: readonly unknown[];
        minimum?: number;
        maximum?: number;
        minLength?: number;
        maxLength?: number;
      }
    >;
    required?: readonly string[];
    additionalProperties?: boolean;
  };
  for (const required of schema.required ?? []) {
    if (!(required in args))
      return `Required argument "${required}" is missing.`;
  }
  for (const [key, value] of Object.entries(args)) {
    const property = schema.properties[key];
    if (!property && schema.additionalProperties === false)
      return `Argument "${key}" is not allowed for this tool.`;
    if (!property) continue;
    const correctType =
      property.type === "string"
        ? typeof value === "string"
        : property.type === "integer"
          ? typeof value === "number" && Number.isInteger(value)
          : property.type === "number"
            ? typeof value === "number" && Number.isFinite(value)
            : property.type === "boolean"
              ? typeof value === "boolean"
              : true;
    if (!correctType)
      return `Argument "${key}" must be ${property.type ?? "valid"}.`;
    if (
      typeof value === "number" &&
      ((property.minimum !== undefined && value < property.minimum) ||
        (property.maximum !== undefined && value > property.maximum))
    )
      return `Argument "${key}" is outside its allowed range.`;
    if (
      typeof value === "string" &&
      ((property.minLength !== undefined &&
        value.length < property.minLength) ||
        (property.maxLength !== undefined && value.length > property.maxLength))
    )
      return `Argument "${key}" is outside its allowed length.`;
    if (property.enum && !property.enum.includes(value))
      return `Argument "${key}" is not an allowed value.`;
  }
  return null;
}

export function executeAgriTool(name: string, rawArguments: unknown): unknown {
  let parsed = rawArguments;
  if (typeof rawArguments === "string") {
    try {
      parsed = JSON.parse(rawArguments) as unknown;
    } catch {
      return unavailable("Tool arguments were not valid JSON.");
    }
  }
  const args = asRecord(parsed);
  if (!args) return unavailable("Tool arguments must be a JSON object.");
  const validationError = validateToolArguments(name, args);
  if (validationError) return unavailable(validationError);
  if (name === "search_agri_data") {
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query || query.length > 240)
      return unavailable("Search query must contain 1-240 characters.");
    const limit =
      typeof args.limit === "number"
        ? Math.max(1, Math.min(10, Math.trunc(args.limit)))
        : 6;
    return searchAgriData(query, limit);
  }
  if (name === "get_agri_data_catalog") {
    const query =
      typeof args.query === "string" ? args.query.slice(0, 240) : undefined;
    return getCatalog(query);
  }
  if (name === "query_nisr_snapshot") return getSnapshotData(args);
  if (name === "analyze_nisr_data") return analyzeNisrData(args);
  return unavailable("Tool name is not on the server-side allowlist.");
}

export function getAssistantDataSummary() {
  return {
    datasets: [
      "national_indicators",
      "district_land",
      "province_yields",
      "workbook_table",
    ],
    tools: AGRI_TOOL_DEFINITIONS.map((tool) => tool.function.name),
    sources: CHAT_SOURCES.map(({ id, title, source_url }) => ({
      id,
      title,
      source_url,
    })),
  };
}
