import { useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  ExternalLink,
  FileSearch,
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
const observations = national.observations as NationalObservation[];
const districtRows = districtLand.observations as DistrictObservation[];
const metricDefinitions = national.metric_definitions as Record<
  string,
  MetricDefinition
>;
const sources = national.sources;
const isRw = (language: Language) => language === "rw";
const tx = (rw: boolean, en: string, rwText: string) => (rw ? rwText : en);

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

export function HomePage({ language }: Props) {
  const rw = isRw(language);
  const seed = latestObservation("improved_seed_use");
  const organic = latestObservation("organic_fertilizer_use");
  const land = latestObservation("agricultural_land");
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
              "Official survey observations · Updated through Season B 2026",
              "Imibare y’ubushakashatsi · kugeza kuri Season B 2026",
            )}
          </div>
          <h1 className="display-font max-w-[740px] text-[37px] font-extrabold leading-[1.04] tracking-[-.065em] text-[#213b30] sm:text-[56px] lg:text-[64px]">
            {tx(
              rw,
              "See the evidence. Plan with clarity.",
              "Reba ibimenyetso. Fata ibyemezo usobanutse.",
            )}
          </h1>
          <p className="mt-5 max-w-[640px] text-[14px] leading-6 text-[#526456] sm:text-[16px] sm:leading-7">
            {tx(
              rw,
              "Explore Rwanda’s official Seasonal Agricultural Survey (SAS) statistics by season, district and indicator. Every displayed figure links back to its NISR source.",
              "Shakisha imibare ya NISR y’ubushakashatsi bw’ibihe by’ubuhinzi (SAS), uko ibihe n’uturere bitandukanye. Buri mubare ugaragaza inkomoko ya NISR.",
            )}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#244636] px-4 text-[12px] font-semibold text-white hover:bg-[#315943]"
              data-testid="link-home-dashboard"
            >
              {tx(rw, "Open dashboard", "Fungura imbonerahamwe")}
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/data"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#c5cdbd] bg-[#f6f6ef] px-4 text-[12px] font-semibold text-[#284837] hover:bg-white"
              data-testid="link-home-data"
            >
              {tx(rw, "Explore the data", "Shakisha amakuru")}
              <FileSearch size={15} />
            </Link>
          </div>
        </div>
        <div className="relative z-[1] mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#d1d7c8] pt-4 text-[10px] font-semibold text-[#637363]">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#638052]" />
            {tx(
              rw,
              `Latest observation: ${latestTag}`,
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
          note={`${latestTag} · NISR SAS`}
          icon={Sprout}
        />
        <StatCard
          label={metricDefinitions.organic_fertilizer_use.label}
          value={displayValue(organic.value, "% of farmers")}
          note={`${latestTag} · NISR SAS`}
          icon={Leaf}
        />
        <StatCard
          label={metricDefinitions.agricultural_land.label}
          value={`${(land.value / 1000).toFixed(3)}m ha`}
          note={`${latestTag} · national estimate`}
          icon={MapPinned}
        />
      </section>
      <section className="mt-7 grid gap-4 lg:grid-cols-[1fr_310px]">
        <article className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 text-primary">
            <Activity size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[.13em]">
              {tx(rw, "A useful first read", "Iby’ingenzi wabona mbere")}
            </span>
          </div>
          <h2 className="display-font mt-3 text-[19px] font-bold tracking-[-.035em]">
            {tx(
              rw,
              "Seasonal results are not annual averages",
              "Ibyavuye muri buri season si impuzandengo y’umwaka",
            )}
          </h2>
          <p className="mt-2 max-w-[740px] text-[12px] leading-6 text-muted-foreground">
            {tx(
              rw,
              "In Season B 2026, 20.9% of farmers used improved seeds and 81.3% applied organic fertilizer. These are survey-season estimates. They should not be read as district-specific values or as a causal explanation of production.",
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
            {tx(rw, "Evidence, with context", "Imibare hamwe n’ibisobanuro")}
          </h2>
          <p className="mt-2 text-[11px] leading-[1.75] text-white/70">
            {tx(
              rw,
              "Browse the published estimates, compare like-for-like seasons, and download the normalized district dataset.",
              "Reba imibare yatangajwe, gereranya seasons zimwe kandi ukurure amakuru y’uturere.",
            )}
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#d5e3bb] hover:text-white"
          >
            {tx(rw, "Sources & methods", "Inkomoko n’uburyo")}
            <ArrowRight size={13} />
          </Link>
        </aside>
      </section>
      <div className="mt-6">
        <SourceNote>
          {tx(
            rw,
            "AgriLens AI is an independent prototype and is not affiliated with NISR. The survey figures belong to NISR; values are reproduced with source links and original units.",
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
  const [dataset, setDataset] = useState<"national" | "district">("national");
  const [metric, setMetric] = useState("improved_seed_use");
  const [season, setSeason] = useState("A");
  const [query, setQuery] = useState("");
  const filteredNational = observations
    .filter((row) => row.metric === metric && row.season === season)
    .filter((row) =>
      `${row.year} ${row.season} ${metricDefinitions[row.metric]?.label}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => a.year - b.year);
  const filteredDistrict = districtRows
    .filter((row) => row.season === season && row.district !== "National")
    .filter((row) => row.district.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.district.localeCompare(b.district));
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
      "nisr-sas-2025-district-land-use.csv",
      filteredDistrict.map((row) => ({
        district: row.district,
        year: row.year,
        season: row.season,
        indicator: districtMetric.label,
        value: row[districtMetric.key],
        unit: districtMetric.unit,
        source_id: row.source_id,
        source_url: districtLand.source.source_url,
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
        eyebrow={tx(rw, "DISCOVER THE EVIDENCE", "SHAKISHA IMIBARE")}
        title={tx(rw, "Data explorer", "Shakisha amakuru")}
        description={tx(
          rw,
          "Browse official national seasonal estimates and district land-use observations. Search, choose a measure, and export the rows currently shown.",
          "Reba imibare y’igihugu kuri buri season n’ikoreshwa ry’ubutaka mu turere. Shakisha, hitamo igipimo, ukurure ibisubizo bigaragara.",
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
            setSeason("A");
            setQuery("");
          }}
          className={`rounded-lg px-4 py-2.5 text-[12px] font-semibold ${dataset === "national" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"}`}
        >
          {tx(rw, "National seasonal indicators", "Ibipimo by’igihugu")}
        </button>
        <button
          role="tab"
          aria-selected={dataset === "district"}
          onClick={() => {
            setDataset("district");
            setMetric(DISTRICT_METRICS[0].key);
            setSeason("A");
            setQuery("");
          }}
          className={`rounded-lg px-4 py-2.5 text-[12px] font-semibold ${dataset === "district" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"}`}
        >
          {tx(rw, "District land use · 2025", "Ubutaka mu turere · 2025")}
        </button>
      </div>
      <section
        className="rounded-2xl border border-border bg-card p-4 sm:p-6"
        data-testid="nisr-data-explorer"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px_auto] lg:items-end">
          <NativeSelect
            label={tx(rw, "Indicator", "Igipimo")}
            value={metric}
            onChange={setMetric}
            options={
              dataset === "national"
                ? nationalMetricOptions
                : districtMetricOptions
            }
            testId="select-data-metric"
          />
          <NativeSelect
            label={tx(rw, "Survey season", "Igihe")}
            value={season}
            onChange={setSeason}
            options={(dataset === "district"
              ? ["A", "B"]
              : ["A", "B", "C"]
            ).map((s) => ({ value: s, label: `Season ${s}` }))}
            testId="select-data-season"
          />
          <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
            {tx(
              rw,
              "Search district or year",
              "Shakisha akarere cyangwa umwaka",
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
                  dataset === "district" ? "e.g. Nyagatare" : "e.g. 2026"
                }
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[12px] font-medium normal-case tracking-normal text-foreground"
                data-testid="input-data-search"
              />
            </span>
          </label>
          <button
            onClick={dataset === "national" ? exportNational : exportDistrict}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-[11px] font-semibold hover:bg-muted"
            data-testid="button-export-csv"
          >
            <ArrowDownToLine size={14} />
            {tx(rw, "Export CSV", "Kurura CSV")}
          </button>
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
                No observations match this search.
              </p>
            )}
          </div>
        ) : (
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
                    key={`${row.district}-${row.season}`}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-3 font-semibold">{row.district}</td>
                    <td className="px-4 py-3">2025 · {row.season}</td>
                    <td className="px-4 py-3">{districtMetric.label}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {displayValue(
                        row[districtMetric.key] as number | null,
                        districtMetric.unit,
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        className="font-semibold text-primary hover:underline"
                        href={districtLand.source.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        NISR PDF
                        <ExternalLink size={12} className="ml-1 inline" />
                      </a>
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
        )}
        <p className="mt-3 text-[10px] text-muted-foreground">
          {dataset === "national"
            ? `${filteredNational.length} observations · national estimates`
            : `${filteredDistrict.length} districts · 2025 Season ${season} · district table`}
        </p>
      </section>
      <div className="mt-5">
        <SourceNote>
          {tx(
            rw,
            "A dash in the NISR district tables is represented as missing (—), not zero. Area measurements in the 2025 district tables are reported in thousand hectares; values retain NISR’s rounding.",
            "Utwo tudomo muri raporo ya NISR tugaragazwa nk’amakuru adahari (—), si zeru. Ubutaka bwo muri 2025 bupimwa mu bihumbi bya hegitari; imibare yakurikije uko NISR yayegeranyije.",
          )}
        </SourceNote>
      </div>
    </div>
  );
}

export function DashboardPage({ language }: Props) {
  const rw = isRw(language);
  // Explicit order avoids accidentally sorting agricultural seasons alphabetically.
  const trendRows = [
    ["2025 A", 2025, "A"],
    ["2025 B", 2025, "B"],
    ["2025 C", 2025, "C"],
    ["2026 A", 2026, "A"],
    ["2026 B", 2026, "B"],
  ].map(([period, year, season]) => {
    const row: Record<string, string | number> = { period: String(period) };
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
  const areaRows = [
    ["2025 A", 2025, "A"],
    ["2025 B", 2025, "B"],
    ["2026 A", 2026, "A"],
    ["2026 B", 2026, "B"],
  ].map(([period, year, season]) => ({
    period: String(period),
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
  const latest = getObservation(2026, "B", "improved_seed_use")!;
  const latestCards = [
    "improved_seed_use",
    "organic_fertilizer_use",
    "inorganic_fertilizer_use",
    "pesticide_use",
  ].map((metric) => ({ metric, value: getObservation(2026, "B", metric)! }));
  return (
    <div className="page-enter">
      <PageHeading
        index="02"
        eyebrow={tx(rw, "INDICATOR OVERVIEW", "INCAMAKE Y’IBIPIMO")}
        title={tx(rw, "Dashboard", "Imbonerahamwe")}
        description={tx(
          rw,
          "Read the latest published season, view how reported farmer practices differ by season, and inspect national land-use estimates.",
          "Reba imibare iheruka, uko ibikorwa by’abahinzi bihinduka kuri buri season, n’imikoreshereze y’ubutaka ku rwego rw’igihugu.",
        )}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#cfdbc5] bg-[#eff3e8] px-4 py-3">
        <span className="text-[11px] font-semibold text-[#38563c]">
          {tx(rw, "Latest published observation", "Imibare iheruka gutangazwa")}
          : 2026 · Season B
        </span>
        <span className="text-[10px] text-[#59705a]">
          March–June 2026 · all 30 districts surveyed
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {latestCards.map(({ metric, value }, index) => (
          <StatCard
            key={metric}
            label={metricDefinitions[metric].label}
            value={displayValue(value.value, metricDefinitions[metric].unit)}
            note={`${seasonName(latest.year, latest.season)} · national estimate`}
            icon={[Sprout, Leaf, Wheat, Activity][index]}
          />
        ))}
      </div>
      <section className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-primary">
              FARMER INPUT USE · %
            </p>
            <h2 className="display-font mt-1 text-[17px] font-bold">
              Reported use by agricultural season
            </h2>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendRows}
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
            2025 values: NISR SAS annual report summary. 2026 values: NISR
            season release pages. {latest.year} Season B: {latest.value}% used
            improved seeds.
          </p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-primary">
              LAND USE · THOUSAND HECTARES
            </p>
            <h2 className="display-font mt-1 text-[17px] font-bold">
              Agriculture area reported
            </h2>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={areaRows}
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
          </div>
          <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
            Use each area series as separately published. NISR area categories
            are not necessarily additive.
          </p>
        </article>
      </section>
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

export function ComparePage({ language }: Props) {
  const rw = isRw(language);
  const districts = [
    ...new Set(
      districtRows
        .map((row) => row.district)
        .filter((name) => name !== "National"),
    ),
  ].sort();
  const [left, setLeft] = useState("Nyagatare");
  const [right, setRight] = useState("Gisagara");
  const [season, setSeason] = useState<"A" | "B">("A");
  const [metric, setMetric] = useState<string>(String(DISTRICT_METRICS[0].key));
  const selectedMetric =
    DISTRICT_METRICS.find((item) => item.key === metric) ?? DISTRICT_METRICS[0];
  const rowFor = (district: string) =>
    districtRows.find(
      (row) => row.district === district && row.season === season,
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
        eyebrow={tx(rw, "READ ACROSS DISTRICTS", "GERERANYA UTURERE")}
        title={tx(rw, "District comparison", "Gereranya uturere")}
        description={tx(
          rw,
          "Compare land-use estimates for two districts in the same 2025 season. These tables contain land-use measures, not district input-use rates or productivity.",
          "Gereranya imibare y’ubutaka bw’uturere tubiri muri season imwe ya 2025. Iyi mibare ni iy’ikoreshwa ry’ubutaka, si iy’imikoreshereze y’ibikoresho cyangwa umusaruro.",
        )}
      />
      <section
        className="rounded-2xl border border-border bg-card p-4 sm:p-6"
        data-testid="district-comparison"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <NativeSelect
            label={label(rw, "District one", "Akarere ka mbere")}
            value={left}
            onChange={setLeft}
            options={districts.map((district) => ({
              value: district,
              label: district,
            }))}
            testId="select-district-one"
          />
          <NativeSelect
            label={label(rw, "District two", "Akarere ka kabiri")}
            value={right}
            onChange={setRight}
            options={districts.map((district) => ({
              value: district,
              label: district,
            }))}
            testId="select-district-two"
          />
          <NativeSelect
            label={label(rw, "Season", "Season")}
            value={season}
            onChange={(value) => setSeason(value as "A" | "B")}
            options={[
              { value: "A", label: "Season A · 2025" },
              { value: "B", label: "Season B · 2025" },
            ]}
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
                "Difference · district one minus district two",
                "Itandukaniro · aka mbere ukuyemo aka kabiri",
              )}
            </p>
            <p className="display-font mt-3 text-[28px] font-extrabold tracking-[-.05em]">
              {delta == null
                ? "—"
                : `${delta > 0 ? "+" : ""}${displayValue(delta, selectedMetric.unit)}`}
            </p>
            <p className="mt-2 text-[11px] leading-[1.7] text-muted-foreground">
              {seasonName(2025, season)} · {selectedMetric.label}. This is a
              comparison of reported estimates, not a performance ranking.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <SourceLink
            sourceId="nisr-sas-2025-annual-report"
            label="Source: NISR SAS 2025, Tables 9–10"
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
        eyebrow={tx(rw, "EVIDENCE, WITH CONTEXT", "IBIMENYETSO N’IBISOBANURO")}
        title={tx(rw, "What the figures show", "Ibyo imibare igaragaza")}
        description={tx(
          rw,
          "Simple, reproducible comparisons from NISR’s published values. Differences describe reported estimates; they do not explain why they changed.",
          "Igereranya rishingiye ku mibare NISR yatangaje. Itandukaniro risobanura imibare gusa; ntirisobanura impamvu yahindutse.",
        )}
      />
      <article className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <Activity size={16} />
          <span className="text-[10px] font-bold uppercase tracking-[.13em]">
            2025 B → 2026 B · PERCENTAGE-POINT CHANGE
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
                18 {item.prior}% → 2026 {item.current}%
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
            Seasonality matters
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
                What this does not establish
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
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{
    text: string;
    sourceId: string;
  } | null>(null);
  const prompts = [
    {
      id: "latest-seeds",
      label: "What share used improved seeds in the latest season?",
      metric: "improved_seed_use",
      year: 2026,
      season: "B" as Season,
    },
    {
      id: "latest-fertilizer",
      label: "How many farmers used organic fertilizer in 2026 B?",
      metric: "organic_fertilizer_use",
      year: 2026,
      season: "B" as Season,
    },
    {
      id: "latest-land",
      label: "How much land was used for agriculture in 2026 B?",
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
      text: `${definition.label}: ${displayValue(row.value, definition.unit)} in ${seasonName(year, season)}. This is a published national survey estimate, not a district-level figure.`,
      sourceId: row.source_id,
    });
  }
  return (
    <div className="page-enter">
      <PageHeading
        index="05"
        eyebrow={tx(rw, "ASK WITH EVIDENCE", "IBAZO RISHINGIYE KU BIMENYETSO")}
        title={tx(rw, "Source lookup", "Shakisha inkomoko")}
        description={tx(
          rw,
          "Get a factual response from the verified indicators already in this prototype. This is a deterministic data lookup, not a generative AI assistant.",
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
              AGRILENS · SOURCE LOOKUP
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Answers are computed directly from the cited dataset.
            </p>
          </div>
          <span className="ml-auto rounded-full border border-[#cfdbc5] bg-[#eff3e8] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#456749]">
            Data only
          </span>
        </div>
        <div className="mx-auto max-w-[840px] px-5 py-7 sm:px-8">
          <h2 className="display-font text-[20px] font-bold tracking-[-.035em]">
            Choose a question
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
          <form
            className="mt-5 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setAnswer(null);
              setQuestion("");
            }}
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Type a note or question (lookup is limited to examples above)"
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-[12px]"
              aria-label="Question"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 text-[11px] font-semibold text-primary-foreground"
            >
              Clear
            </button>
          </form>
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
          ) : (
            question && (
              <p className="mt-3 text-[10px] text-muted-foreground">
                This prototype answers only the published questions above. It
                does not send your text to a model or backend.
              </p>
            )
          )}
        </div>
      </section>
      <div className="mt-5">
        <SourceNote>
          For free-form analysis, check the source and indicator definition
          directly. This prototype does not generate answers beyond exact
          lookups from its data.
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
        eyebrow={tx(rw, "TRANSPARENCY FIRST", "UBWIZERWE N’IMBIBI")}
        title={tx(rw, "Data & methodology", "Amakuru n’uburyo")}
        description={tx(
          rw,
          "What was loaded, how to interpret it, and where every number came from.",
          "Ibyashyizwe muri sisitemu, uko wabisesengura n’aho buri mubare waturutse.",
        )}
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck size={17} />
            <span className="text-[10px] font-bold uppercase tracking-[.14em]">
              VERIFIED SOURCE DATA
            </span>
          </div>
          <h2 className="display-font mt-4 text-[21px] font-bold tracking-[-.04em]">
            {districtRows.filter((row) => row.district !== "National").length}{" "}
            district-season land-use rows plus national seasonal observations.
          </h2>
          <p className="mt-3 text-[12px] leading-[1.8] text-muted-foreground">
            District land-use observations cover Seasons A and B of 2025 (30
            districts). National input-use and practice indicators cover all
            three 2025 seasons and Seasons A and B of 2026. National area
            summaries are included for 2025 A/B and 2026 A/B. The 2026 releases
            report coverage across all 30 districts.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#cfdbc5] bg-[#eff3e8] px-2.5 py-1.5 text-[10px] font-semibold text-[#456749]">
              NISR SAS · 2025 annual report
            </span>
            <span className="rounded-full border border-[#cfdbc5] bg-[#eff3e8] px-2.5 py-1.5 text-[10px] font-semibold text-[#456749]">
              NISR SAS · 2026 A + B
            </span>
          </div>
        </article>
        <article className="rounded-xl bg-[#244636] p-5 text-[#f2f1e7] sm:p-7">
          <Sprout size={20} className="text-[#c3d79d]" />
          <h2 className="display-font mt-4 text-[19px] font-bold">
            Independent planning prototype
          </h2>
          <p className="mt-3 text-[11px] leading-[1.8] text-white/70">
            AgriLens AI is not a government site or official NISR service. NISR
            remains the publisher of the reported survey values linked here.
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
                <SourceLink sourceId={source.id} label="Open source" />
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
            Input-use values are published percentages of farmers. National
            land-area values are displayed in thousand hectares; district tables
            are labeled in 000 hectares. NISR’s rounded percentages and values
            are retained. Missing dashes remain null.
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
