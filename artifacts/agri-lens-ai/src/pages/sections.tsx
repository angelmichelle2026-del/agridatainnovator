import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  ExternalLink,
  GitCompareArrows,
  Leaf,
  MapPinned,
  Search,
  ShieldCheck,
  Sprout,
  Wheat,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Language } from "@/components/app-shell";
import national from "@/data/national-indicators.json";
import districtLand from "@/data/district-land-2025.json";
import districtLand2026a from "@/data/district-land-2026a.json";
import administrativeAreas from "@/data/rwanda-admin-areas.json";

type Props = { language: Language };
type Season = "A" | "B" | "C";
type NationalObservation = {
  year: number;
  season: Season;
  metric: string;
  value: number;
  source_id: string;
};
type DistrictObservation = {
  district: string;
  year: number;
  season: "A" | "B";
  source_id: string;
  total_land_000ha: number | null;
  agricultural_land_000ha: number | null;
  agricultural_land_pct: number | null;
  arable_land_000ha: number | null;
  physical_cultivated_land_000ha: number | null;
  seasonal_crop_area_000ha: number | null;
  permanent_crop_area_000ha: number | null;
  temporary_fallow_area_000ha: number | null;
  temporary_meadow_pasture_000ha: number | null;
  permanent_pasture_000ha: number | null;
};
type MetricDefinition = { label: string; unit: string; category: string };
type WorkbookTable = {
  id: string;
  number: number;
  title: string;
  row_count: number;
  headers: string[];
  rows: Array<Array<string | number | null>>;
  source_id: string;
};
type AdministrativeEntity = {
  name: string;
  rw_name: string;
  districts: string[];
};
const observations = national.observations as NationalObservation[];
const districtRows = [
  ...(districtLand.observations as DistrictObservation[]),
  ...(districtLand2026a.observations as DistrictObservation[]),
];
const districtNames2026a = [
  ...new Set(
    (districtLand2026a.observations as DistrictObservation[])
      .map((row) => row.district)
      .filter((district) => district !== "National"),
  ),
].sort();
const metricDefinitions = national.metric_definitions as Record<
  string,
  MetricDefinition
>;
const sources = national.sources;
const administrativeEntities =
  administrativeAreas.entities as AdministrativeEntity[];
const isRw = (language: Language) => language === "rw";
const tx = (rw: boolean, en: string, rwText: string) => (rw ? rwText : en);
function provinceOptions(rw: boolean) {
  return [
    { value: "ALL", label: tx(rw, "All Rwanda", "U Rwanda rwose") },
    ...administrativeEntities.map((entity) => ({
      value: entity.name,
      label: rw ? entity.rw_name : entity.name,
    })),
  ];
}
function districtsInProvince(province: string, allDistricts: string[]) {
  if (province === "ALL") return [...allDistricts].sort();
  return (
    administrativeEntities
      .find((entity) => entity.name === province)
      ?.districts.filter((district) => allDistricts.includes(district)) ?? []
  ).sort();
}
function entityForDistrict(district: string) {
  return administrativeEntities.find((entity) =>
    entity.districts.includes(district),
  );
}

function latestObservation(metric: string) {
  return observations
    .filter((row) => row.metric === metric)
    .sort((a, b) => b.year - a.year || b.season.localeCompare(a.season))[0];
}
function getObservation(year: number, season: Season, metric: string) {
  return observations.find(
    (row) =>
      row.year === year && row.season === season && row.metric === metric,
  );
}
function seasonName(year: number, season: string) {
  return `${year} · ${season}`;
}
function displayValue(
  value: number | null | undefined,
  unit: string,
  digits = 1,
) {
  if (value == null) return "—";
  const formatted = new Intl.NumberFormat("en", {
    maximumFractionDigits: digits,
  }).format(value);
  if (unit.startsWith("%")) return `${formatted}%`;
  if (unit === "thousand hectares") return `${formatted}k ha`;
  return formatted;
}
function downloadCsv(
  filename: string,
  rows: Array<Record<string, string | number | null | undefined>>,
) {
  if (!rows.length) return;
  const cols = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const quote = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  const content = [
    cols.map(quote).join(","),
    ...rows.map((row) => cols.map((col) => quote(row[col])).join(",")),
  ].join("\r\n");
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
function SourceLink({ sourceId, label }: { sourceId: string; label?: string }) {
  const source = sources.find((item) => item.id === sourceId);
  if (!source) return null;
  return (
    <a
      href={source.source_url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
    >
      {label ?? source.title}
      <ExternalLink size={12} />
    </a>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
  index,
}: {
  eyebrow: string;
  title: string;
  description: string;
  index: string;
}) {
  return (
    <div className="page-enter mb-7 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
      <div className="max-w-[780px]">
        <div className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-primary">
          <span className="h-px w-5 bg-primary" />
          {eyebrow}
        </div>
        <h1 className="display-font text-[32px] font-extrabold leading-[1.1] tracking-[-.055em] text-foreground sm:text-[42px]">
          {title}
        </h1>
        <p className="mt-3 max-w-[720px] text-[14px] leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground md:block">
        NISR SAS · {index}
      </div>
    </div>
  );
}
function SourceNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#d6d1bf] bg-[#f2f0e7] px-4 py-3.5 text-[11px] leading-[1.7] text-[#625e4f]">
      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
      <p>{children}</p>
    </div>
  );
}
function AdministrativeSourceNote({ rw }: { rw: boolean }) {
  return (
    <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
      {tx(
        rw,
        "Province and district groupings follow the",
        "Imiterere y’intara n’uturere ikurikiza",
      )}{" "}
      <a
        href={administrativeAreas.source_url}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-primary hover:underline"
      >
        {tx(
          rw,
          "Government of Rwanda local-government directory",
          "urutonde rw’inzego z’ibanze rwa Leta y’u Rwanda",
        )}
      </a>
      .
    </p>
  );
}
function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Wheat;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf1e6] text-primary">
          <Icon size={16} />
        </span>
      </div>
      <p className="display-font mt-4 text-[27px] font-extrabold tracking-[-.05em] sm:text-[31px]">
        {value}
      </p>
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{note}</p>
    </article>
  );
}
function compareSeasonNote(current: number, previous: number, unit: string) {
  const difference = Number(
    (current - previous).toFixed(unit === "% of farmers" ? 1 : 0),
  );
  const sign = difference > 0 ? "+" : difference < 0 ? "−" : "";
  const amount =
    unit === "% of farmers"
      ? `${sign}${Math.abs(difference).toFixed(1)} percentage points`
      : `${sign}${Math.round(Math.abs(difference * 1000)).toLocaleString()} hectares`;
  return `${amount} vs the same season in 2025`;
}

function NativeSelect({
  label,
  value,
  onChange,
  options,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  testId: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
      {label}
      <select
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-[12px] font-medium normal-case tracking-normal text-foreground focus-visible:outline-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function compactWorkbookTitle(title: string) {
  return title
    .replace(/^Table\s*\d+\s*:\s*/i, "")
    .replace(/^2026\s*Season\s*A[_\s]*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function displayWorkbookCell(value: string | number | null) {
  if (value == null) return "—";
  if (typeof value === "number") {
    return new Intl.NumberFormat("en", { maximumFractionDigits: 4 }).format(
      value,
    );
  }
  return value;
}

export function HomePage({ language }: Props) {
  const rw = isRw(language);
  const seed = latestObservation("improved_seed_use");
  const organic = latestObservation("organic_fertilizer_use");
  const land = latestObservation("agricultural_land");
  const priorSeed = getObservation(
    seed.year - 1,
    seed.season,
    "improved_seed_use",
  )!;
  const priorOrganic = getObservation(
    organic.year - 1,
    organic.season,
    "organic_fertilizer_use",
  )!;
  const priorLand = getObservation(
    land.year - 1,
    land.season,
    "agricultural_land",
  )!;
  const latestTag = seasonName(seed.year, seed.season);
  return (
    <div className="page-enter">
      <section className="shell-grid relative overflow-hidden rounded-[22px] border border-[#d8d5c6] bg-[#ecefe4] px-5 py-7 sm:px-9 sm:py-9 lg:px-11">
        <div className="pointer-events-none absolute -right-16 -top-28 h-[330px] w-[330px] rounded-full border border-[#d4dbc8] sm:right-12 sm:top-[-180px] sm:h-[480px] sm:w-[480px]" />
        <div className="relative z-[1] max-w-[790px]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#cad4bf] bg-[#f6f6ef] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#426348]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#638052]" />
            {tx(
              rw,
              "NISR survey snapshot · checked 10 Oct 2026",
              "Imibare ya NISR · igenzuwe ku wa 10 Ukwakira 2026",
            )}
          </div>
          <h1 className="display-font max-w-[740px] text-[37px] font-extrabold leading-[1.04] tracking-[-.065em] text-[#213b30] sm:text-[56px] lg:text-[64px]">
            {tx(
              rw,
              "Start with what the survey says.",
              "Tangira ku byo ubushakashatsi buvuga.",
            )}
          </h1>
          <p className="mt-5 max-w-[640px] text-[14px] leading-6 text-[#526456] sm:text-[16px] sm:leading-7">
            {tx(
              rw,
              "A practical starting point for Rwanda’s agriculture planners: explore NISR survey results, compare like-for-like seasons, see crop production across districts, and trace every number to its source.",
              "Intangiriro ifasha igenamigambi ry’ubuhinzi mu Rwanda: reba ibyatangajwe na NISR, gereranya ibihe bihwanye, urebe umusaruro w’imyaka mu turere, kandi ukurikirane inkomoko ya buri mubare.",
            )}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#244636] px-4 text-[12px] font-semibold text-white hover:bg-[#315943]"
              data-testid="link-home-dashboard"
            >
              {tx(
                rw,
                "See seasons & crop visuals",
                "Reba ibihe n’umusaruro w’imyaka",
              )}
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/compare"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#c5cdbd] bg-[#f6f6ef] px-4 text-[12px] font-semibold text-[#284837] hover:bg-white"
              data-testid="link-home-compare"
            >
              {tx(rw, "Compare two districts", "Gereranya uturere tubiri")}
              <GitCompareArrows size={15} />
            </Link>
          </div>
        </div>
        <div className="relative z-[1] mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#d1d7c8] pt-4 text-[10px] font-semibold text-[#637363]">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#638052]" />
            {tx(
              rw,
              `Latest season in this snapshot: ${latestTag}`,
              `Imibare iheruka: ${latestTag}`,
            )}
          </span>
          <span>
            {tx(
              rw,
              "Independent prototype · not an NISR service",
              "Prototype yigenga · si serivisi ya NISR",
            )}
          </span>
        </div>
      </section>
      <section
        className="mt-7 grid gap-3 sm:grid-cols-3"
        aria-label="Latest NISR statistics"
      >
        <StatCard
          label={metricDefinitions.improved_seed_use.label}
          value={displayValue(seed.value, "% of farmers")}
          note={`${latestTag} · ${compareSeasonNote(seed.value, priorSeed.value, metricDefinitions.improved_seed_use.unit)}`}
          icon={Sprout}
        />
        <StatCard
          label={metricDefinitions.organic_fertilizer_use.label}
          value={displayValue(organic.value, "% of farmers")}
          note={`${latestTag} · ${compareSeasonNote(organic.value, priorOrganic.value, metricDefinitions.organic_fertilizer_use.unit)}`}
          icon={Leaf}
        />
        <StatCard
          label={metricDefinitions.agricultural_land.label}
          value={`${(land.value / 1000).toFixed(3)}m ha`}
          note={`${latestTag} · ${compareSeasonNote(land.value, priorLand.value, metricDefinitions.agricultural_land.unit)}`}
          icon={MapPinned}
        />
      </section>
      <section className="mt-7 grid gap-4 lg:grid-cols-[1fr_310px]">
        <article className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 text-primary">
            <Activity size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[.13em]">
              {tx(rw, "In one sentence", "Mu nteruro imwe")}
            </span>
          </div>
          <h2 className="display-font mt-3 text-[19px] font-bold tracking-[-.035em]">
            {tx(
              rw,
              "A useful first read: compare like with like",
              "Banza ugereranye ibihe bihwanye",
            )}
          </h2>
          <p className="mt-2 max-w-[740px] text-[12px] leading-6 text-muted-foreground">
            {tx(
              rw,
              `In ${latestTag}, ${displayValue(seed.value, "% of farmers")} of farmers reported using improved seeds and ${displayValue(organic.value, "% of farmers")} reported using organic fertilizer. These are national estimates for one season—not a score for any district. The cards compare each figure with the same season in 2025.`,
              "Muri Season B 2026, 20.9% y’abahinzi bakoresheje imbuto z’indobanure naho 81.3% bakoresha ifumbire y’imborera. Iyi ni mibare y’ubushakashatsi bw’igihe runaka; si iy’akarere ku giti cyako kandi ntisobanura impamvu z’umusaruro.",
            )}
          </p>
          <p className="mt-4 text-[10px] text-muted-foreground">
            <SourceLink sourceId="nisr-sas-2026-season-b" />
          </p>
        </article>
        <aside className="rounded-xl bg-[#244636] p-5 text-[#f2f1e7]">
          <BookOpenCheck size={18} className="text-[#c3d79d]" />
          <h2 className="display-font mt-4 text-[18px] font-bold">
            {tx(rw, "Where to go next", "Aho wakomereza")}
          </h2>
          <p className="mt-2 text-[11px] leading-[1.75] text-white/70">
            {tx(
              rw,
              "Check the full table, compare two districts, or open the NISR sources before you use a figure in a brief.",
              "Reba imbonerahamwe yose, gereranya uturere tubiri, cyangwa ufungure inkomoko mbere yo gusubiramo umubare.",
            )}
          </p>
          <Link
            href="/data"
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#d5e3bb] hover:text-white"
          >
            {tx(rw, "Explore all data", "Shakisha amakuru yose")}
            <ArrowRight size={13} />
          </Link>
        </aside>
      </section>
      <div className="mt-6">
        <SourceNote>
          {tx(
            rw,
            "Planning aid, not an official verdict: this is a checked snapshot, not a live NISR feed. National figures describe Rwanda as a whole; district data here covers land use only. Always open the source before quoting a number.",
            "AgriLens AI ni prototype yigenga kandi ntifitanye isano na NISR. Imibare y’ubushakashatsi ni iya NISR; yagaragajwe n’inkomoko n’ibipimo byayo.",
          )}
        </SourceNote>
      </div>
    </div>
  );
}

const DISTRICT_METRICS: Array<{
  key: keyof DistrictObservation;
  label: string;
  unit: string;
}> = [
  {
    key: "agricultural_land_000ha",
    label: "Agricultural land",
    unit: "thousand hectares",
  },
  { key: "agricultural_land_pct", label: "Agricultural land share", unit: "%" },
  {
    key: "seasonal_crop_area_000ha",
    label: "Seasonal crop area",
    unit: "thousand hectares",
  },
  {
    key: "permanent_crop_area_000ha",
    label: "Permanent crop area",
    unit: "thousand hectares",
  },
  {
    key: "permanent_pasture_000ha",
    label: "Permanent pasture area",
    unit: "thousand hectares",
  },
  {
    key: "physical_cultivated_land_000ha",
    label: "Physical cultivated land",
    unit: "thousand hectares",
  },
];

export function DataPage({ language }: Props) {
  const rw = isRw(language);
  const [dataset, setDataset] = useState<"national" | "district" | "workbook">(
    "national",
  );
  const [metric, setMetric] = useState("improved_seed_use");
  const [season, setSeason] = useState("ALL");
  const [query, setQuery] = useState("");
  const [workbookTableId, setWorkbookTableId] = useState("table-06");
  const [workbookTables, setWorkbookTables] = useState<WorkbookTable[]>([]);
  const [workbookLoadStatus, setWorkbookLoadStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const loadWorkbookTables = () => {
    if (workbookLoadStatus === "loading" || workbookLoadStatus === "ready")
      return;
    setWorkbookLoadStatus("loading");
    void import("@/data/nisr-sas-2026-season-a-tables.json")
      .then((module) => {
        setWorkbookTables(module.default.tables as WorkbookTable[]);
        setWorkbookLoadStatus("ready");
      })
      .catch(() => setWorkbookLoadStatus("error"));
  };
  const selectedWorkbookTable =
    workbookTables.find((table) => table.id === workbookTableId) ??
    workbookTables[5];
  const workbookHeaders = (selectedWorkbookTable?.headers ?? []).map(
    (header, index) =>
      selectedWorkbookTable.number === 35 &&
      index === 0 &&
      header.startsWith("Column ")
        ? "District"
        : header,
  );
  const filteredWorkbookRows = (selectedWorkbookTable?.rows ?? []).filter(
    (row) =>
      !query ||
      row.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
  );
  const availableSeasons =
    dataset === "district"
      ? [
          ...new Set(districtRows.map((row) => `${row.year} · ${row.season}`)),
        ].sort()
      : dataset === "workbook"
        ? []
        : [
            ...new Set(
              observations
                .filter((row) => row.metric === metric)
                .map((row) => row.season),
            ),
          ].sort();
  const selectedSeason =
    season === "ALL" || availableSeasons.includes(season) ? season : "ALL";
  const filteredNational = observations
    .filter(
      (row) =>
        row.metric === metric &&
        (selectedSeason === "ALL" || row.season === selectedSeason),
    )
    .filter((row) =>
      `${row.year} ${row.season} ${metricDefinitions[row.metric]?.label}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => a.year - b.year);
  const filteredDistrict = districtRows
    .filter(
      (row) =>
        (selectedSeason === "ALL" ||
          `${row.year} · ${row.season}` === selectedSeason) &&
        row.district !== "National",
    )
    .filter((row) =>
      `${row.district} ${row.year} ${row.season}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        a.year - b.year ||
        a.season.localeCompare(b.season) ||
        a.district.localeCompare(b.district),
    );
  const districtMetric =
    DISTRICT_METRICS.find((item) => item.key === metric) ?? DISTRICT_METRICS[0];
  const exportNational = () =>
    downloadCsv(
      "nisr-sas-national-observations.csv",
      filteredNational.map((row) => ({
        year: row.year,
        season: row.season,
        indicator: metricDefinitions[row.metric]?.label,
        value: row.value,
        unit: metricDefinitions[row.metric]?.unit,
        source_id: row.source_id,
        source_url: sources.find((source) => source.id === row.source_id)
          ?.source_url,
      })),
    );
  const exportDistrict = () =>
    downloadCsv(
      "nisr-sas-district-land-use.csv",
      filteredDistrict.map((row) => ({
        district: row.district,
        year: row.year,
        season: row.season,
        indicator: districtMetric.label,
        value: row[districtMetric.key],
        unit: districtMetric.unit,
        source_id: row.source_id,
        source_url: sources.find((source) => source.id === row.source_id)
          ?.source_url,
      })),
    );
  const exportWorkbook = () =>
    selectedWorkbookTable &&
    downloadCsv(
      `nisr-sas-2026-season-a-table-${String(selectedWorkbookTable.number).padStart(2, "0")}.csv`,
      filteredWorkbookRows.map((row) => ({
        ...Object.fromEntries(
          workbookHeaders.map((header, index) => [header, row[index]]),
        ),
        source_id: selectedWorkbookTable.source_id,
        source_url: sources.find(
          (source) => source.id === selectedWorkbookTable.source_id,
        )?.source_url,
      })),
    );
  const nationalMetricOptions = Object.entries(metricDefinitions).map(
    ([value, definition]) => ({ value, label: definition.label }),
  );
  const districtMetricOptions = DISTRICT_METRICS.map((item) => ({
    value: item.key,
    label: item.label,
  }));
  return (
    <div className="page-enter">
      <PageHeading
        index="01"
        eyebrow={tx(rw, "BROWSE THE NUMBERS", "SHAKISHA IMIBARE")}
        title={tx(rw, "Explore the data", "Shakisha amakuru")}
        description={tx(
          rw,
          "Choose a measure and see every season available in the NISR snapshot. Search by year or district, then download exactly the rows on screen.",
          "Hitamo igipimo urebe seasons zose ziri muri iyi mibare ya NISR. Shakisha umwaka cyangwa akarere, hanyuma ukurure ibisubizo bigaragara.",
        )}
      />
      <div
        className="mb-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Dataset type"
      >
        <button
          role="tab"
          aria-selected={dataset === "national"}
          onClick={() => {
            setDataset("national");
            setMetric("improved_seed_use");
            setSeason("ALL");
            setQuery("");
          }}
          className={`rounded-lg px-4 py-2.5 text-[12px] font-semibold ${dataset === "national" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"}`}
        >
          {tx(rw, "National estimates", "Ibipimo by’igihugu")}
        </button>
        <button
          role="tab"
          aria-selected={dataset === "district"}
          onClick={() => {
            setDataset("district");
            setMetric(DISTRICT_METRICS[0].key);
            setSeason("ALL");
            setQuery("");
          }}
          className={`rounded-lg px-4 py-2.5 text-[12px] font-semibold ${dataset === "district" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"}`}
        >
          {tx(rw, "District land use · 2025–26", "Ubutaka mu turere · 2025–26")}
        </button>
        <button
          role="tab"
          aria-selected={dataset === "workbook"}
          onClick={() => {
            setDataset("workbook");
            setWorkbookTableId("table-06");
            setSeason("ALL");
            setQuery("");
            loadWorkbookTables();
          }}
          className={`rounded-lg px-4 py-2.5 text-[12px] font-semibold ${dataset === "workbook" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"}`}
        >
          {tx(rw, "All 35 tables · 2026 A", "Imbonerahamwe 35 · 2026 A")}
        </button>
      </div>
      <section
        className="rounded-2xl border border-border bg-card p-4 sm:p-6"
        data-testid="nisr-data-explorer"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px_auto] lg:items-end">
          <NativeSelect
            label={
              dataset === "workbook"
                ? tx(rw, "NISR table", "Imbonerahamwe ya NISR")
                : tx(rw, "Indicator", "Igipimo")
            }
            value={dataset === "workbook" ? workbookTableId : metric}
            onChange={(value) => {
              if (dataset === "workbook") {
                setWorkbookTableId(value);
                loadWorkbookTables();
              } else {
                setMetric(value);
                setSeason("ALL");
              }
            }}
            options={
              dataset === "national"
                ? nationalMetricOptions
                : dataset === "district"
                  ? districtMetricOptions
                  : workbookTables.length
                    ? workbookTables.map((table) => ({
                        value: table.id,
                        label: `${table.number}. ${compactWorkbookTitle(table.title)}`,
                      }))
                    : [
                        {
                          value: "table-06",
                          label:
                            workbookLoadStatus === "error"
                              ? "Unable to load tables — select to retry"
                              : "Loading 35 tables…",
                        },
                      ]
            }
            testId="select-data-metric"
          />
          {dataset !== "workbook" && (
            <NativeSelect
              label={tx(rw, "Time period", "Igihe")}
              value={selectedSeason}
              onChange={setSeason}
              options={[
                {
                  value: "ALL",
                  label:
                    dataset === "district"
                      ? "All available periods"
                      : "All available seasons",
                },
                ...availableSeasons.map((s) => ({
                  value: s,
                  label:
                    dataset === "district"
                      ? `Season ${s.split(" · ")[1]} · ${s.split(" · ")[0]}`
                      : `Season ${s}`,
                })),
              ]}
              testId="select-data-season"
            />
          )}
          <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
            {tx(
              rw,
              dataset === "workbook"
                ? "Search table rows"
                : "Search district or year",
              dataset === "workbook"
                ? "Shakisha mu mbonerahamwe"
                : "Shakisha akarere cyangwa umwaka",
            )}
            <span className="relative">
              <Search
                size={14}
                className="absolute left-3 top-3 text-muted-foreground"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  dataset === "workbook"
                    ? "e.g. maize or Nyagatare"
                    : dataset === "district"
                      ? "e.g. Nyagatare"
                      : "e.g. 2026"
                }
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[12px] font-medium normal-case tracking-normal text-foreground"
                data-testid="input-data-search"
              />
            </span>
          </label>
          <button
            onClick={
              dataset === "national"
                ? exportNational
                : dataset === "district"
                  ? exportDistrict
                  : exportWorkbook
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-[11px] font-semibold hover:bg-muted"
            data-testid="button-export-csv"
          >
            <ArrowDownToLine size={14} />
            {tx(rw, "Export CSV", "Kurura CSV")}
          </button>
          {dataset === "workbook" && (
            <a
              href="/data/nisr-sas-2026-season-a-tables.xlsx"
              download
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ArrowDownToLine size={14} />
              Download full workbook
            </a>
          )}
        </div>
        {dataset === "national" ? (
          <div className="mt-5 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[620px] text-left text-[12px]">
              <thead className="bg-muted/70 text-[10px] uppercase tracking-[.1em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Season</th>
                  <th className="px-4 py-3">Indicator</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredNational.map((row) => (
                  <tr
                    key={`${row.year}-${row.season}-${row.metric}`}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-3 font-mono">{row.year}</td>
                    <td className="px-4 py-3">{row.season}</td>
                    <td className="px-4 py-3">
                      {metricDefinitions[row.metric]?.label}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {displayValue(
                        row.value,
                        metricDefinitions[row.metric]?.unit ?? "",
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SourceLink sourceId={row.source_id} label="NISR" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredNational.length === 0 && (
              <p className="p-5 text-center text-[12px] text-muted-foreground">
                No rows match those filters. Try another period or clear your
                search.
              </p>
            )}
          </div>
        ) : dataset === "district" ? (
          <div className="mt-5 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[620px] text-left text-[12px]">
              <thead className="bg-muted/70 text-[10px] uppercase tracking-[.1em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Season</th>
                  <th className="px-4 py-3">Indicator</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredDistrict.map((row) => (
                  <tr
                    key={`${row.district}-${row.year}-${row.season}`}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-3 font-semibold">{row.district}</td>
                    <td className="px-4 py-3">
                      {row.year} · {row.season}
                    </td>
                    <td className="px-4 py-3">{districtMetric.label}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {displayValue(
                        row[districtMetric.key] as number | null,
                        districtMetric.unit,
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SourceLink
                        sourceId={row.source_id}
                        label="NISR source"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDistrict.length === 0 && (
              <p className="p-5 text-center text-[12px] text-muted-foreground">
                No districts match this search.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-[#f4f2e9] px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[.13em] text-primary">
                  {selectedWorkbookTable
                    ? `TABLE ${selectedWorkbookTable.number} · NISR SAS 2026 SEASON A`
                    : "NISR SAS 2026 SEASON A TABLES"}
                </p>
                <h2 className="mt-1 text-[13px] font-bold leading-5 text-foreground">
                  {selectedWorkbookTable
                    ? compactWorkbookTitle(selectedWorkbookTable.title)
                    : workbookLoadStatus === "error"
                      ? "Could not load the table data"
                      : "Loading the 35-table catalogue…"}
                </h2>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {filteredWorkbookRows.length} of{" "}
                  {selectedWorkbookTable?.row_count ?? 0} rows · workbook
                  precision available in the download
                </p>
              </div>
              {selectedWorkbookTable && (
                <SourceLink
                  sourceId={selectedWorkbookTable.source_id}
                  label="NISR release page"
                />
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[11px]">
                <thead className="bg-muted/70 text-[9px] uppercase tracking-[.08em] text-muted-foreground">
                  <tr>
                    {workbookHeaders.map((header, index) => (
                      <th
                        key={`${header}-${index}`}
                        className={`whitespace-nowrap px-3 py-2.5 ${index === 0 ? "sticky left-0 z-[1] min-w-[130px] bg-muted/90" : "text-right"}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkbookRows.map((row, rowIndex) => (
                    <tr
                      key={`${selectedWorkbookTable.id}-${rowIndex}`}
                      className="border-t border-border"
                    >
                      {workbookHeaders.map((header, cellIndex) => (
                        <td
                          key={`${header}-${cellIndex}`}
                          className={`whitespace-nowrap px-3 py-2.5 tabular-nums ${cellIndex === 0 ? "sticky left-0 z-[1] bg-card font-semibold" : "text-right"}`}
                        >
                          {displayWorkbookCell(row[cellIndex])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredWorkbookRows.length === 0 && (
                <p className="p-5 text-center text-[12px] text-muted-foreground">
                  {selectedWorkbookTable
                    ? "No rows match this search. Try a crop, district or clear your search."
                    : workbookLoadStatus === "error"
                      ? "Table data could not be loaded. Select this tab again to retry."
                      : "Loading the NISR tables. This only happens the first time you open this tab."}
                </p>
              )}
            </div>
          </div>
        )}
        <p className="mt-3 text-[10px] text-muted-foreground">
          {dataset === "national"
            ? `${filteredNational.length} published rows · national estimates${selectedSeason === "ALL" ? " · all available seasons" : ` · Season ${selectedSeason}`}`
            : dataset === "district"
              ? `${filteredDistrict.length} district rows${selectedSeason === "ALL" ? " · all available periods" : ` · ${selectedSeason}`}`
              : `${filteredWorkbookRows.length} displayed rows · Table ${selectedWorkbookTable?.number ?? "—"} of 35`}
        </p>
      </section>
      <div className="mt-5">
        <SourceNote>
          {tx(
            rw,
            "A dash in the NISR district tables is represented as missing (—), not zero. District land areas use thousand hectares; the 2025 report is rounded, while the supplied 2026 workbook retains greater precision. All 35 workbook tables are available below.",
            "Utwo tudomo muri raporo ya NISR tugaragazwa nk’amakuru adahari (—), si zeru. Ubutaka bwo muri 2025 na 2026 bupimwa mu bihumbi bya hegitari. Imbonerahamwe 35 ya 2026 iri mu bubiko.",
          )}
        </SourceNote>
      </div>
    </div>
  );
}

export function DashboardPage({ language }: Props) {
  const rw = isRw(language);
  const [seasonFilter, setSeasonFilter] = useState<"ALL" | Season>("ALL");
  const selectedSeason: Season = seasonFilter === "ALL" ? "B" : seasonFilter;
  const cardYear = selectedSeason === "C" ? 2025 : 2026;
  // Explicit order avoids accidentally sorting agricultural seasons alphabetically.
  const trendRows = [
    ["2025 A", 2025, "A"],
    ["2025 B", 2025, "B"],
    ["2025 C", 2025, "C"],
    ["2026 A", 2026, "A"],
    ["2026 B", 2026, "B"],
  ].map(([period, year, season]) => {
    const row: Record<string, string | number> = {
      period: String(period),
      season: String(season),
    };
    for (const metric of [
      "improved_seed_use",
      "organic_fertilizer_use",
      "inorganic_fertilizer_use",
      "pesticide_use",
    ]) {
      const item = getObservation(
        Number(year),
        String(season) as Season,
        metric,
      );
      if (item) row[metric] = item.value;
    }
    return row;
  });
  const filteredTrendRows = trendRows.filter(
    (row) => seasonFilter === "ALL" || row.season === seasonFilter,
  );
  const areaRows = [
    ["2025 A", 2025, "A"],
    ["2025 B", 2025, "B"],
    ["2026 A", 2026, "A"],
    ["2026 B", 2026, "B"],
  ].map(([period, year, season]) => ({
    period: String(period),
    season: String(season),
    agriculture: getObservation(
      Number(year),
      String(season) as Season,
      "agricultural_land",
    )?.value,
    seasonalCrops: getObservation(
      Number(year),
      String(season) as Season,
      "seasonal_crop_area",
    )?.value,
  }));
  const filteredAreaRows = areaRows.filter(
    (row) => seasonFilter === "ALL" || row.season === seasonFilter,
  );
  const latest = getObservation(cardYear, selectedSeason, "improved_seed_use")!;
  const latestCards = [
    "improved_seed_use",
    "organic_fertilizer_use",
    "inorganic_fertilizer_use",
    "pesticide_use",
  ].map((metric) => ({
    metric,
    value: getObservation(cardYear, selectedSeason, metric)!,
    prior: getObservation(cardYear - 1, selectedSeason, metric),
  }));
  return (
    <div className="page-enter">
      <PageHeading
        index="02"
        eyebrow={tx(rw, "THE LATEST SURVEY", "INCAMAKE Y’IBIPIMO")}
        title={tx(rw, "Seasonal picture", "Ishusho y’ibihe")}
        description={tx(
          rw,
          "Choose a survey season to filter matching farmer-practice and land-use estimates, then explore detailed crop output where tables are available.",
          "Hitamo igihe cy’ubushakashatsi kugira ngo urebe imibare ihwanye y’ibikorwa by’abahinzi n’imikoreshereze y’ubutaka, unarebe umusaruro w’ibihingwa aho imbonerahamwe ziboneka.",
        )}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#cfdbc5] bg-[#eff3e8] px-4 py-3">
        <span className="text-[11px] font-semibold text-[#38563c]">
          {tx(
            rw,
            seasonFilter === "ALL"
              ? "Latest NISR season in this snapshot"
              : "Most recent data for the selected season",
            seasonFilter === "ALL"
              ? "Imibare iheruka gutangazwa"
              : "Imibare iheruka y’igihe wahisemo",
          )}
          : {cardYear} · Season {selectedSeason}
        </span>
        <span className="text-[10px] text-[#59705a]">
          {seasonFilter === "ALL" || selectedSeason === "B"
            ? "March–June 2026 · all 30 districts surveyed"
            : selectedSeason === "A"
              ? "September 2025–February 2026 · Season A"
              : "2026 Season C is not included in this snapshot"}
        </span>
      </div>
      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
        <p className="text-[11px] leading-5 text-muted-foreground">
          {tx(
            rw,
            "Choose a survey season to filter the cards and charts. Detailed crop-production tables are available for Season A only.",
            "Hitamo igihe cy’ubushakashatsi kugira ngo uhindure imibare n’amashusho. Imbonerahamwe irambuye y’umusaruro iraboneka kuri Season A gusa.",
          )}
        </p>
        <NativeSelect
          label={tx(rw, "Filter by season", "Shungura hakurikijwe igihe")}
          value={seasonFilter}
          onChange={(value) => setSeasonFilter(value as "ALL" | Season)}
          options={[
            {
              value: "ALL",
              label: tx(rw, "All available seasons", "Ibihe byose bihari"),
            },
            { value: "A", label: "Season A" },
            { value: "B", label: "Season B" },
            { value: "C", label: "Season C" },
          ]}
          testId="select-dashboard-season"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {latestCards.map(({ metric, value, prior }, index) => (
          <StatCard
            key={metric}
            label={metricDefinitions[metric].label}
            value={displayValue(value.value, metricDefinitions[metric].unit)}
            note={`${seasonName(value.year, value.season)} · ${prior ? compareSeasonNote(value.value, prior.value, metricDefinitions[metric].unit) : "No matched earlier season is included in this snapshot"}`}
            icon={[Sprout, Leaf, Wheat, Activity][index]}
          />
        ))}
      </div>
      <section className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-primary">
              FARMER PRACTICES · SHARE OF FARMERS
            </p>
            <h2 className="display-font mt-1 text-[17px] font-bold">
              What farmers reported using, by season
            </h2>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredTrendRows}
                margin={{ top: 10, right: 8, bottom: 4, left: -14 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e4d8" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #dedbcc",
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="improved_seed_use"
                  name="Improved seeds"
                  stroke="#6b8c4e"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="organic_fertilizer_use"
                  name="Organic fertilizer"
                  stroke="#bd8b46"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="inorganic_fertilizer_use"
                  name="Inorganic fertilizer"
                  stroke="#477c81"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="pesticide_use"
                  name="Pesticides"
                  stroke="#a36f64"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
            {seasonFilter === "ALL"
              ? `2025 values: NISR SAS annual report summary. 2026 values: NISR season release pages. Latest snapshot: ${latest.year} Season ${latest.season}, ${latest.value}% used improved seeds.`
              : selectedSeason === "C"
                ? "Only 2025 Season C figures are included in this snapshot; 2026 Season C is not available here."
                : `Showing matched Season ${selectedSeason} observations for 2025 and 2026. ${latest.year} Season ${latest.season}: ${latest.value}% used improved seeds.`}
          </p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-primary">
              LAND REPORTED · THOUSAND HECTARES
            </p>
            <h2 className="display-font mt-1 text-[17px] font-bold">
              How much land was reported in agriculture?
            </h2>
          </div>
          <div className="relative h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredAreaRows}
                margin={{ top: 10, right: 5, bottom: 4, left: -14 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e4d8" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toLocaleString()} thousand ha`,
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #dedbcc",
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar
                  dataKey="agriculture"
                  name="Agricultural land"
                  fill="#315f47"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="seasonalCrops"
                  name="Seasonal crop area"
                  fill="#9ab978"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            {!filteredAreaRows.length && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/90 px-6 text-center text-[11px] text-muted-foreground">
                No land-use estimates for Season C are included in this
                snapshot.
              </div>
            )}
          </div>
          <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
            Use each area series as separately published. NISR area categories
            are not necessarily additive.
          </p>
        </article>
      </section>
      <CropProductionVisuals seasonFilter={seasonFilter} language={language} />
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <SourceNote>
          {tx(
            rw,
            "These are survey estimates and reported areas—not causal evidence. Season C 2025 was reported in the annual report; the 2026 figures link to separate NISR releases. Compare the same season across years with care.",
            "Iyi ni imibare y’ubushakashatsi n’ubutaka bwatangajwe, si gihamya y’impamvu n’ingaruka. Season C 2025 iri muri raporo y’umwaka; iya 2026 iri muri raporo za buri gihe.",
          )}
        </SourceNote>
        <div className="flex flex-wrap gap-3 text-[10px]">
          <SourceLink
            sourceId="nisr-sas-2025-annual-report"
            label="NISR SAS 2025"
          />
          <SourceLink sourceId="nisr-sas-2026-season-a" label="2026 Season A" />
          <SourceLink sourceId="nisr-sas-2026-season-b" label="2026 Season B" />
        </div>
      </div>
    </div>
  );
}

function CropProductionVisuals({
  seasonFilter,
  language,
}: {
  seasonFilter: "ALL" | Season;
  language: Language;
}) {
  const rw = isRw(language);
  const [tables, setTables] = useState<{
    national_production: WorkbookTable;
    district_production: WorkbookTable;
  } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [crop, setCrop] = useState("Maize");
  const [provinceFilter, setProvinceFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const provinceDistricts = districtsInProvince(
    provinceFilter,
    districtNames2026a,
  );
  const handleProvinceChange = (value: string) => {
    const nextDistricts = districtsInProvince(value, districtNames2026a);
    if (districtFilter !== "ALL" && !nextDistricts.includes(districtFilter)) {
      setDistrictFilter("ALL");
    }
    setProvinceFilter(value);
  };

  useEffect(() => {
    if (seasonFilter !== "ALL" && seasonFilter !== "A") return;
    let active = true;
    setLoadError(false);
    import("@/data/crop-visuals-2026a.json")
      .then((module) => {
        if (active) {
          setTables({
            national_production: module.default
              .national_production as WorkbookTable,
            district_production: module.default
              .district_production as WorkbookTable,
          });
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [seasonFilter]);

  const summaryRows = new Set([
    "cereals",
    "tubers and roots",
    "banana",
    "legumes and pulses",
    "bean",
    "vegetables and fruits",
    "total",
  ]);
  const nationalTable = tables?.national_production;
  const currentProductionIndex =
    nationalTable?.headers.findIndex((header) =>
      header.includes("Production (MT) · 2026 A"),
    ) ?? -1;
  const priorProductionIndex =
    nationalTable?.headers.findIndex((header) =>
      header.includes("Production (MT) · 2025 A"),
    ) ?? -1;
  const cropRows =
    nationalTable && currentProductionIndex >= 0 && priorProductionIndex >= 0
      ? nationalTable.rows
          .filter(
            (row) =>
              !summaryRows.has(String(row[0]).toLowerCase()) &&
              typeof row[currentProductionIndex] === "number" &&
              typeof row[priorProductionIndex] === "number",
          )
          .map((row) => ({
            crop: String(row[0]),
            current: row[currentProductionIndex] as number,
            prior: row[priorProductionIndex] as number,
          }))
      : [];
  const leadingCrops = [...cropRows]
    .sort((a, b) => b.current - a.current)
    .slice(0, 8)
    .reverse();
  const selectedCrop = cropRows.find((row) => row.crop === crop) ?? cropRows[0];
  const districtTable = tables?.district_production;
  const cropColumnAliases: Record<string, string> = {
    "Taro &Yams": "Yams & Taro",
    Groundnut: "Groundnuts",
  };
  const normalizeHeader = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const districtCropColumn = selectedCrop
    ? (cropColumnAliases[selectedCrop.crop] ?? selectedCrop.crop)
    : "";
  const districtCropColumnIndex =
    districtTable?.headers.findIndex(
      (header) =>
        normalizeHeader(header) === normalizeHeader(districtCropColumn),
    ) ?? -1;
  const includedDistricts = new Set(districtNames2026a);
  const visibleDistricts =
    districtFilter === "ALL"
      ? provinceDistricts
      : provinceDistricts.filter((district) => district === districtFilter);
  const districtValues: Array<{ district: string; production: number }> =
    districtTable && districtCropColumnIndex >= 0
      ? districtTable.rows
          .filter((row) => visibleDistricts.includes(String(row[0])))
          .map((row) => ({
            district: String(row[0]),
            production: row[districtCropColumnIndex],
          }))
          .filter(
            (row): row is { district: string; production: number } =>
              typeof row.production === "number",
          )
          .sort((a, b) => a.production - b.production)
      : [];
  const leadingDistricts =
    districtFilter === "ALL" ? districtValues.slice(-10) : districtValues;
  const topDistrict = districtValues[districtValues.length - 1];
  const percentageChange =
    selectedCrop && selectedCrop.prior !== 0
      ? ((selectedCrop.current - selectedCrop.prior) / selectedCrop.prior) * 100
      : null;
  const compactTonnes = (value: number) =>
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)}m`
      : `${Math.round(value / 1_000)}k`;
  const formatTonnes = (value: number) =>
    `${value.toLocaleString("en", { maximumFractionDigits: 0 })} MT`;

  return (
    <section className="mt-7" aria-labelledby="crop-visuals-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">
            2026 SEASON A · DETAILED NISR TABLES
          </p>
          <h2
            id="crop-visuals-heading"
            className="display-font mt-1 text-[20px] font-bold tracking-[-.035em]"
          >
            Crop production, down to the district
          </h2>
          <p className="mt-1 max-w-[760px] text-[11px] leading-5 text-muted-foreground">
            Compare like-for-like national crop output with Season A 2025, then
            explore which districts report the most of a selected crop.
          </p>
        </div>
        <Link
          href="/data"
          className="text-[10px] font-semibold text-primary hover:underline"
        >
          Browse all 35 source tables{" "}
          <ArrowRight size={12} className="ml-1 inline" />
        </Link>
      </div>

      {seasonFilter !== "ALL" && seasonFilter !== "A" ? (
        <div className="rounded-xl border border-border bg-card p-5 text-[12px] leading-5 text-muted-foreground">
          Detailed crop-production tables in the supplied workbook cover Season
          A only. Choose Season A or all available seasons to view the crop
          charts; this avoids showing Season A results under another season.
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-border bg-card p-5 text-[12px] text-muted-foreground">
          Crop charts could not load. Open the data explorer to browse the
          source tables.
        </div>
      ) : !tables ? (
        <div
          className="rounded-xl border border-border bg-card p-5 text-[12px] text-muted-foreground"
          role="status"
        >
          Loading the 2026 Season A crop tables…
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-2">
              <p className="text-[9px] font-bold uppercase tracking-[.13em] text-primary">
                NATIONAL PRODUCTION · METRIC TONNES
              </p>
              <h3 className="display-font mt-1 text-[16px] font-bold">
                Crops with the highest reported output
              </h3>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Same season, two years: 2025 A and 2026 A.
              </p>
            </div>
            <div className="h-[330px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={leadingCrops}
                  layout="vertical"
                  margin={{ top: 8, right: 14, bottom: 2, left: 2 }}
                  barCategoryGap={8}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e7e4d8"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={compactTonnes}
                  />
                  <YAxis
                    type="category"
                    dataKey="crop"
                    width={112}
                    tick={{ fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatTonnes(value)]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #dedbcc",
                      fontSize: 10,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar
                    dataKey="prior"
                    name="2025 Season A"
                    fill="#aabd91"
                    radius={[0, 3, 3, 0]}
                  />
                  <Bar
                    dataKey="current"
                    name="2026 Season A"
                    fill="#315f47"
                    radius={[0, 3, 3, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              Headline group totals are excluded so cereals, tubers and
              constituent crops are not counted twice.
            </p>
            <div className="mt-3">
              <SourceLink
                sourceId={tables.national_production.source_id}
                label="Source: NISR SAS 2026 Season A, Table 6"
              />
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-2">
              <p className="text-[9px] font-bold uppercase tracking-[.13em] text-primary">
                DISTRICT RANKING · METRIC TONNES
              </p>
              <h3 className="display-font mt-1 text-[16px] font-bold">
                Where is this crop produced?
              </h3>
            </div>
            <div className="mb-2 grid gap-2 sm:grid-cols-3">
              <NativeSelect
                label={tx(rw, "Province", "Intara")}
                value={provinceFilter}
                onChange={handleProvinceChange}
                options={provinceOptions(rw)}
                testId="select-dashboard-province"
              />
              <NativeSelect
                label={tx(rw, "District", "Akarere")}
                value={districtFilter}
                onChange={setDistrictFilter}
                options={[
                  {
                    value: "ALL",
                    label: tx(rw, "All districts", "Uturere twose"),
                  },
                  ...provinceDistricts.map((name) => ({
                    value: name,
                    label: name,
                  })),
                ]}
                testId="select-dashboard-district"
              />
              <NativeSelect
                label={tx(rw, "Crop", "Igihingwa")}
                value={selectedCrop?.crop ?? ""}
                onChange={setCrop}
                options={cropRows.map((row) => ({
                  value: row.crop,
                  label: row.crop,
                }))}
                testId="select-dashboard-crop"
              />
            </div>
            <p className="mb-2 text-[10px] text-muted-foreground">
              {districtFilter === "ALL"
                ? provinceFilter === "ALL"
                  ? `Top ${leadingDistricts.length} of ${includedDistricts.size} districts · All Rwanda`
                  : `Showing ${districtValues.length} districts in ${provinceFilter}`
                : `Selected district: ${districtFilter} · ${entityForDistrict(districtFilter)?.name ?? provinceFilter} · 2026 Season A`}
            </p>
            <AdministrativeSourceNote rw={rw} />
            <div className="h-[330px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={leadingDistricts}
                  layout="vertical"
                  margin={{ top: 3, right: 16, bottom: 2, left: 3 }}
                  barCategoryGap={7}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e7e4d8"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={compactTonnes}
                  />
                  <YAxis
                    type="category"
                    dataKey="district"
                    width={90}
                    tick={{ fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatTonnes(value),
                      selectedCrop?.crop,
                    ]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #dedbcc",
                      fontSize: 10,
                    }}
                  />
                  <Bar
                    dataKey="production"
                    name={selectedCrop?.crop ?? "Production"}
                    fill="#64874e"
                    barSize={24}
                    radius={[0, 3, 3, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              {topDistrict ? (
                <>
                  {districtFilter === "ALL"
                    ? "Highest shown: "
                    : "Reported output in "}
                  <strong>{topDistrict.district}</strong> at{" "}
                  {formatTonnes(topDistrict.production)}. Production is not a
                  measure of yield or productivity.
                </>
              ) : (
                "No district values are available for this crop."
              )}
            </p>
            <div className="mt-3">
              <SourceLink
                sourceId={tables.district_production.source_id}
                label="Source: NISR SAS 2026 Season A, Table 15"
              />
            </div>
          </article>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
        {seasonFilter !== "ALL" && seasonFilter !== "A"
          ? "No detailed crop-production values for this selected season are included in the supplied workbook."
          : selectedCrop
            ? `${selectedCrop.crop}: ${formatTonnes(selectedCrop.current)} in 2026 Season A versus ${formatTonnes(selectedCrop.prior)} in 2025 Season A (${percentageChange === null ? "change unavailable" : `${percentageChange >= 0 ? "+" : ""}${percentageChange.toFixed(1)}%`}). This is an arithmetic difference between published estimates, not a test of statistical significance.`
            : "Crop production and district rankings are drawn from the 2026 Season A workbook."}
      </p>
    </section>
  );
}

export function ComparePage({ language }: Props) {
  const rw = isRw(language);
  const availableDistrictPeriods = [
    ...new Set(districtRows.map((row) => `${row.year} · ${row.season}`)),
  ].sort();
  const districts = [
    ...new Set(
      districtRows
        .map((row) => row.district)
        .filter((name) => name !== "National"),
    ),
  ].sort();
  const [province, setProvince] = useState("ALL");
  const [left, setLeft] = useState("Nyagatare");
  const [right, setRight] = useState("Gisagara");
  const [period, setPeriod] = useState("2025 · A");
  const [metric, setMetric] = useState<string>(String(DISTRICT_METRICS[0].key));
  const scopedDistricts = districtsInProvince(province, districts);
  const handleProvinceChange = (value: string) => {
    const nextDistricts = districtsInProvince(value, districts);
    const nextLeft = nextDistricts.includes(left) ? left : nextDistricts[0];
    const nextRight =
      nextDistricts.includes(right) && right !== nextLeft
        ? right
        : (nextDistricts.find((district) => district !== nextLeft) ?? nextLeft);
    setProvince(value);
    setLeft(nextLeft);
    setRight(nextRight);
  };
  const handleLeftChange = (value: string) => {
    setLeft(value);
    if (value === right) {
      setRight(scopedDistricts.find((district) => district !== value) ?? value);
    }
  };
  const handleRightChange = (value: string) => {
    setRight(value);
    if (value === left) {
      setLeft(scopedDistricts.find((district) => district !== value) ?? value);
    }
  };
  const selectedMetric =
    DISTRICT_METRICS.find((item) => item.key === metric) ?? DISTRICT_METRICS[0];
  const rowFor = (district: string) =>
    districtRows.find(
      (row) =>
        row.district === district && `${row.year} · ${row.season}` === period,
    );
  const a = rowFor(left);
  const b = rowFor(right);
  const valueA = a?.[selectedMetric.key] as number | null | undefined;
  const valueB = b?.[selectedMetric.key] as number | null | undefined;
  const chart = [
    { district: left, value: valueA ?? 0 },
    { district: right, value: valueB ?? 0 },
  ];
  const delta = valueA != null && valueB != null ? valueA - valueB : null;
  const label = (rw: boolean, english: string, kinyarwanda: string) =>
    tx(rw, english, kinyarwanda);
  return (
    <div className="page-enter">
      <PageHeading
        index="03"
        eyebrow={tx(rw, "SIDE BY SIDE", "GERERANYA UTURERE")}
        title={tx(rw, "Compare districts", "Gereranya uturere")}
        description={tx(
          rw,
          "Choose a province to narrow the district choices, then compare two districts for the same survey period. This is land use—not input use or crop yields.",
          "Hitamo intara kugira ngo uhitemo uturere tuyirimo, hanyuma ugereranye uturere tubiri muri season imwe. Iyi mibare ni iy’imikoreshereze y’ubutaka, si iy’ibikoresho cyangwa umusaruro.",
        )}
      />
      <section
        className="rounded-2xl border border-border bg-card p-4 sm:p-6"
        data-testid="district-comparison"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <NativeSelect
            label={label(rw, "Province", "Intara")}
            value={province}
            onChange={handleProvinceChange}
            options={provinceOptions(rw)}
            testId="select-compare-province"
          />
          <NativeSelect
            label={label(rw, "First district", "Akarere ka mbere")}
            value={left}
            onChange={handleLeftChange}
            options={scopedDistricts.map((district) => ({
              value: district,
              label: district,
            }))}
            testId="select-district-one"
          />
          <NativeSelect
            label={label(rw, "Second district", "Akarere ka kabiri")}
            value={right}
            onChange={handleRightChange}
            options={scopedDistricts.map((district) => ({
              value: district,
              label: district,
            }))}
            testId="select-district-two"
          />
          <NativeSelect
            label={label(rw, "Survey period", "Igihe cy’ubushakashatsi")}
            value={period}
            onChange={setPeriod}
            options={availableDistrictPeriods.map((value) => ({
              value,
              label: `Season ${value.split(" · ")[1]} · ${value.split(" · ")[0]}`,
            }))}
            testId="select-compare-season"
          />
          <NativeSelect
            label={label(rw, "Measure", "Igipimo")}
            value={metric}
            onChange={setMetric}
            options={districtMetricOptions()}
            testId="select-compare-metric"
          />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px] lg:items-center">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chart}
                layout="vertical"
                margin={{ top: 8, right: 20, bottom: 8, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e7e4d8"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="district"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    displayValue(value, selectedMetric.unit),
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #dedbcc",
                    fontSize: 11,
                  }}
                />
                <Bar
                  dataKey="value"
                  name={selectedMetric.label}
                  fill="#47764f"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl bg-[#f2f0e7] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-primary">
              {tx(
                rw,
                "Gap · first district minus second",
                "Itandukaniro · aka mbere ukuyemo aka kabiri",
              )}
            </p>
            <p className="display-font mt-3 text-[28px] font-extrabold tracking-[-.05em]">
              {delta == null
                ? "—"
                : `${delta > 0 ? "+" : ""}${displayValue(delta, selectedMetric.unit)}`}
            </p>
            <p className="mt-2 text-[11px] leading-[1.7] text-muted-foreground">
              {period.replace(" · ", " · Season ")} · {selectedMetric.label}.
              This is a comparison of reported estimates, not a performance
              ranking.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <SourceLink
            sourceId={a?.source_id ?? "nisr-sas-2025-annual-report"}
            label={
              period.startsWith("2026")
                ? "Source: NISR SAS 2026 Season A, Table 9"
                : "Source: NISR SAS 2025, Tables 9–10"
            }
          />
        </div>
      </section>
      <div className="mt-5">
        <SourceNote>
          {tx(
            rw,
            "NISR reports land areas in thousand hectares. The national row is excluded from district choices. District estimates may be rounded; the interface does not treat missing dashes as zero.",
            "NISR itanga ubutaka mu bihumbi bya hegitari. Umubare w’igihugu nturi mu mahitamo y’uturere. Imibare ishobora kuba yarazengurutswe; utudomo dufatwa nk’amakuru adahari, si zeru.",
          )}
        </SourceNote>
        <AdministrativeSourceNote rw={rw} />
      </div>
    </div>
  );
}
function districtMetricOptions() {
  return DISTRICT_METRICS.map((item) => ({
    value: String(item.key),
    label: item.label,
  }));
}

export function InsightsPage({ language }: Props) {
  const rw = isRw(language);
  const matches = [
    "improved_seed_use",
    "organic_fertilizer_use",
    "inorganic_fertilizer_use",
    "pesticide_use",
    "irrigation_practice",
  ]
    .map((metric) => {
      const prior = getObservation(2025, "B", metric);
      const current = getObservation(2026, "B", metric);
      return prior && current
        ? {
            metric,
            prior: prior.value,
            current: current.value,
            delta: Number((current.value - prior.value).toFixed(1)),
          }
        : null;
    })
    .filter(
      (
        item,
      ): item is {
        metric: string;
        prior: number;
        current: number;
        delta: number;
      } => item !== null,
    );
  const irrigationB = getObservation(2025, "B", "irrigation_practice")!.value;
  const irrigationC = getObservation(2025, "C", "irrigation_practice")!.value;
  return (
    <div className="page-enter">
      <PageHeading
        index="04"
        eyebrow={tx(rw, "WHAT CHANGED", "IBIMENYETSO N’IBISOBANURO")}
        title={tx(
          rw,
          "What changed—and what didn’t?",
          "Ibyo imibare igaragaza",
        )}
        description={tx(
          rw,
          "A quick, like-for-like read of NISR’s published estimates. The numbers show what changed—not why.",
          "Igereranya rishingiye ku mibare NISR yatangaje. Itandukaniro risobanura imibare gusa; ntirisobanura impamvu yahindutse.",
        )}
      />
      <article className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <Activity size={16} />
          <span className="text-[10px] font-bold uppercase tracking-[.13em]">
            Same season · 2025 B to 2026 B · percentage-point change
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {matches.map((item) => (
            <div key={item.metric} className="rounded-lg bg-background p-4">
              <p className="text-[10px] font-semibold leading-4 text-muted-foreground">
                {metricDefinitions[item.metric].label}
              </p>
              <p className="display-font mt-3 text-[22px] font-extrabold">
                {item.delta > 0 ? "+" : ""}
                {item.delta.toFixed(1)}
                <span className="ml-1 text-[11px] font-semibold">pp</span>
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                2025 {item.prior}% → 2026 {item.current}%
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
          Each difference is the 2026 Season B published percentage minus the
          2025 Season B published percentage. It is measured in percentage
          points (pp), not percent growth.
        </p>
      </article>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#f2eadc] text-[#8b6a35]">
            <Wheat size={17} />
          </span>
          <h2 className="display-font mt-4 text-[17px] font-bold">
            Different seasons, different snapshots
          </h2>
          <p className="mt-2 text-[12px] leading-[1.75] text-muted-foreground">
            NISR reports irrigation practice at {irrigationB}% of farmers in
            Season B 2025 and {irrigationC}% in Season C 2025, a{" "}
            {(irrigationC - irrigationB).toFixed(1)} percentage-point
            difference. These are different survey seasons, not evidence of a
            year-round change.
          </p>
          <p className="mt-4 text-[10px]">
            <SourceLink
              sourceId="nisr-sas-2025-annual-report"
              label="NISR SAS 2025 annual report"
            />
          </p>
        </article>
        <article className="rounded-xl border border-[#e3d8bf] bg-[#f8f3e9] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <CircleAlert size={17} className="mt-0.5 shrink-0 text-[#896a32]" />
            <div>
              <h2 className="display-font text-[17px] font-bold">
                What these numbers can’t tell us
              </h2>
              <p className="mt-2 text-[12px] leading-[1.75] text-[#65583d]">
                A change in reported input use does not, by itself, establish a
                change in yield, food security, farm income or the effect of a
                particular policy. This view makes no causal or productivity
                claims.
              </p>
            </div>
          </div>
        </article>
      </div>
      <div className="mt-5">
        <SourceNote>
          {tx(
            rw,
            "Comparisons require the same indicator definition, unit and season. Changes here are arithmetic differences between published percentages, without significance tests or adjustments for survey design.",
            "Igereranya risaba igipimo, unit na season bimwe. Itandukaniro ni imibare yoroshye hagati y’imibare yatangajwe, nta bipimo by’icyizere cy’ubushakashatsi byongeweho.",
          )}
        </SourceNote>
      </div>
    </div>
  );
}

export function AssistantPage({ language }: Props) {
  const rw = isRw(language);
  const [answer, setAnswer] = useState<{
    text: string;
    sourceId: string;
  } | null>(null);
  const prompts = [
    {
      id: "latest-seeds",
      label: "How common was improved-seed use in the latest season?",
      metric: "improved_seed_use",
      year: 2026,
      season: "B" as Season,
    },
    {
      id: "latest-fertilizer",
      label: "How many farmers reported using organic fertilizer?",
      metric: "organic_fertilizer_use",
      year: 2026,
      season: "B" as Season,
    },
    {
      id: "latest-land",
      label: "How much land was reported in agriculture in 2026 Season B?",
      metric: "agricultural_land",
      year: 2026,
      season: "B" as Season,
    },
  ];
  function answerPrompt(metric: string, year: number, season: Season) {
    const row = getObservation(year, season, metric);
    if (!row) return;
    const definition = metricDefinitions[metric];
    setAnswer({
      text: `NISR reports ${displayValue(row.value, definition.unit)} for ${seasonName(year, season)}. This is a national survey estimate—not a figure for one district.`,
      sourceId: row.source_id,
    });
  }
  return (
    <div className="page-enter">
      <PageHeading
        index="05"
        eyebrow={tx(rw, "QUICK ANSWERS", "IBAZO RISHINGIYE KU BIMENYETSO")}
        title={tx(rw, "Quick answers", "Shakisha inkomoko")}
        description={tx(
          rw,
          "Choose a common question to get a short answer from this NISR snapshot, with a link to the source. This is not an open-ended AI chat.",
          "Bona igisubizo gishingiye ku bipimo byemejwe biri muri iyi prototype. Ni ugushakisha amakuru, si umufasha ukoresha AI.",
        )}
      />
      <section
        className="overflow-hidden rounded-2xl border border-border bg-card"
        data-testid="assistant-source-lookup"
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#244636] text-[#d8e3c6]">
            <BookOpenCheck size={18} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">
              AGRILENS · QUICK ANSWERS
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Every answer below links to its NISR source.
            </p>
          </div>
          <span className="ml-auto rounded-full border border-[#cfdbc5] bg-[#eff3e8] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#456749]">
            NISR data
          </span>
        </div>
        <div className="mx-auto max-w-[840px] px-5 py-7 sm:px-8">
          <h2 className="display-font text-[20px] font-bold tracking-[-.035em]">
            What would you like to know?
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {prompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() =>
                  answerPrompt(prompt.metric, prompt.year, prompt.season)
                }
                className="min-h-[76px] rounded-xl border border-border bg-background p-3 text-left text-[11px] font-medium leading-5 hover:border-primary/40 hover:bg-[#f4f5ed]"
              >
                {prompt.label}
                <ArrowRight size={13} className="mt-1 block text-primary" />
              </button>
            ))}
          </div>
          {answer ? (
            <div
              className="mt-5 rounded-xl border border-[#cfdbc5] bg-[#eff3e8] p-4"
              role="status"
            >
              <p className="text-[12px] leading-6 text-[#334c37]">
                {answer.text}
              </p>
              <p className="mt-3 text-[10px]">
                <SourceLink sourceId={answer.sourceId} />
              </p>
            </div>
          ) : null}
        </div>
      </section>
      <div className="mt-5">
        <SourceNote>
          Need a broader interpretation? Open the NISR report and check the
          indicator definition before drawing a conclusion.
        </SourceNote>
      </div>
    </div>
  );
}

export function AboutPage({ language }: Props) {
  const rw = isRw(language);
  return (
    <div className="page-enter">
      <PageHeading
        index="06"
        eyebrow={tx(rw, "DATA SOURCES & LIMITS", "UBWIZERWE N’IMBIBI")}
        title={tx(rw, "Sources & how to read", "Amakuru n’uburyo")}
        description={tx(
          rw,
          "See what is in this snapshot, how to read the figures, and where each number came from.",
          "Ibyashyizwe muri sisitemu, uko wabisesengura n’aho buri mubare waturutse.",
        )}
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck size={17} />
            <span className="text-[10px] font-bold uppercase tracking-[.14em]">
              WHAT’S IN THIS SNAPSHOT
            </span>
          </div>
          <h2 className="display-font mt-4 text-[21px] font-bold tracking-[-.04em]">
            {districtRows.filter((row) => row.district !== "National").length}{" "}
            district-season land-use rows, {observations.length} national
            observations and 35 full Season A tables.
          </h2>
          <p className="mt-3 text-[12px] leading-[1.8] text-muted-foreground">
            District land-use observations cover Seasons A and B of 2025 plus
            Season A of 2026 (30 districts each). The supplied 2026 Season A
            workbook adds all 35 tables, including national and district crop
            area, production, yield, input-use and farming-practice measures.
            National input-use and practice indicators cover all three 2025
            seasons and Seasons A and B of 2026.
          </p>
          <div className="mt-4 rounded-lg bg-[#f4f2e9] px-3.5 py-3 text-[11px] leading-5 text-[#625e4f]">
            <strong>Snapshot checked 10 Oct 2026.</strong> New NISR releases do
            not flow in automatically; this dataset must be refreshed and
            checked before using a newer season.
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#cfdbc5] bg-[#eff3e8] px-2.5 py-1.5 text-[10px] font-semibold text-[#456749]">
              NISR SAS · 2025 annual report
            </span>
            <span className="rounded-full border border-[#cfdbc5] bg-[#eff3e8] px-2.5 py-1.5 text-[10px] font-semibold text-[#456749]">
              NISR SAS · 2026 A + B
            </span>
            <span className="rounded-full border border-[#cfdbc5] bg-[#eff3e8] px-2.5 py-1.5 text-[10px] font-semibold text-[#456749]">
              Season A · 35 workbook tables
            </span>
          </div>
        </article>
        <article className="rounded-xl bg-[#244636] p-5 text-[#f2f1e7] sm:p-7">
          <Sprout size={20} className="text-[#c3d79d]" />
          <h2 className="display-font mt-4 text-[19px] font-bold">
            A first read, not the last word
          </h2>
          <p className="mt-3 text-[11px] leading-[1.8] text-white/70">
            Use this as a quick orientation before a planning conversation. It
            is an independent prototype, not an official NISR service; NISR
            remains the source of truth for every linked figure.
          </p>
        </article>
      </div>
      <section className="mt-5 rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="display-font text-[18px] font-bold">Sources</h2>
        <div className="mt-4 space-y-4">
          {sources.map((source, i) => (
            <article key={source.id} className="border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[12px] font-bold">
                  [{i + 1}] {source.title}
                </h3>
                <div className="flex flex-wrap gap-3 text-[10px]">
                  <SourceLink sourceId={source.id} label="Open source" />
                  {source.id === "nisr-sas-2026-season-a-workbook" && (
                    <a
                      href="/data/nisr-sas-2026-season-a-tables.xlsx"
                      download
                      className="font-semibold text-primary hover:underline"
                    >
                      Download supplied workbook
                      <ArrowDownToLine size={12} className="ml-1 inline" />
                    </a>
                  )}
                </div>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {source.publisher} · {source.period}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                {source.note}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-[13px] font-bold">Definitions & units</h2>
          <p className="mt-2 text-[11px] leading-[1.75] text-muted-foreground">
            Input-use values are published percentages of farmers. National and
            district land areas are measured in thousand hectares. NISR’s
            rounded values are retained; a missing dash is not counted as zero.
          </p>
        </article>
        <article className="rounded-xl border border-[#e3d8bf] bg-[#f8f3e9] p-5">
          <h2 className="text-[13px] font-bold text-[#65583d]">
            Interpretation limits
          </h2>
          <p className="mt-2 text-[11px] leading-[1.75] text-[#65583d]">
            Seasonal estimates should not be treated as annual averages. The
            loaded district table measures land use, not input adoption or crop
            yield. Differences alone do not identify causes, statistical
            significance or productivity performance.
          </p>
        </article>
      </section>
      <div className="mt-5 flex flex-wrap gap-4 rounded-xl border border-border bg-background p-4 text-[11px]">
        <a
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          href="/data/district-land-2025.csv"
          download
        >
          <ArrowDownToLine size={14} />
          Download district CSV
        </a>
        <Link
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          href="/data"
        >
          Explore the tables
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

export function NotFoundPage({ language }: Props) {
  const rw = isRw(language);
  return (
    <div
      className="page-enter flex min-h-[54vh] flex-col items-center justify-center text-center"
      data-testid="empty-page-not-found"
    >
      <span className="font-mono text-[12px] font-bold tracking-[.2em] text-primary">
        404
      </span>
      <h1 className="display-font mt-4 text-4xl font-extrabold tracking-[-.06em]">
        {tx(rw, "This page is not here.", "Iyi paji ntihari.")}
      </h1>
      <p className="mt-3 max-w-[400px] text-[13px] leading-6 text-muted-foreground">
        {tx(
          rw,
          "The address does not match a section in this prototype.",
          "Ihuza ntabwo rihuye n’igice kiri muri iyi prototype.",
        )}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-[12px] font-semibold text-primary-foreground"
      >
        {tx(rw, "Return to overview", "Subira ku ncamake")}
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
