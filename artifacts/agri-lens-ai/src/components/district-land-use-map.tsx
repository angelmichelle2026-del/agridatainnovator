import { useEffect, useMemo, useState } from "react";
import { MapPinned, MousePointer2 } from "lucide-react";
import type { Language } from "@/components/app-shell";

type Position = [number, number, ...number[]];
type DistrictGeometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] };
type DistrictFeature = {
  type: "Feature";
  properties: { shapeName: string };
  geometry: DistrictGeometry;
};
type DistrictFeatureCollection = {
  type: "FeatureCollection";
  features: DistrictFeature[];
};
type DistrictObservation = { district: string; value: number | null };
type DistrictMetric = { key: string; label: string; unit: string };
type DistrictLandUseMapProps = {
  language: Language;
  observations: DistrictObservation[];
  period: string;
  usesLatestPeriod: boolean;
  metric: DistrictMetric;
  searchQuery: string;
};
type Point = [number, number];
type ProjectedFeature = { name: string; path: string };

const MAP_WIDTH = 520;
const MAP_HEIGHT = 460;
const MAP_PADDING = 18;
const COLOR_STEPS = [
  "#e8f1eb",
  "#cfe1d5",
  "#a8c7b2",
  "#76a487",
  "#477b5c",
  "#24563d",
];
const NO_DATA_COLOR = "#e4e7e5";

const t = (rw: boolean, en: string, rwText: string) => (rw ? rwText : en);

function normalizeDistrictName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function formatValue(value: number, unit: string, rw: boolean) {
  const number = new Intl.NumberFormat(rw ? "rw" : "en", {
    maximumSignificantDigits: 10,
  }).format(value);
  if (unit === "%") return `${number}%`;
  const translatedUnit =
    unit === "thousand hectares"
      ? t(rw, "thousand hectares", "ibihumbi bya hegitari")
      : unit;
  return `${number} ${translatedUnit}`;
}

function getRings(geometry: DistrictGeometry): Position[][] {
  return geometry.type === "Polygon"
    ? geometry.coordinates
    : geometry.coordinates.flat();
}

function simplifyPoints(points: Point[], tolerance = 0.65): Point[] {
  if (points.length <= 4) return points;
  const simplified = [points[0]];
  let previous = points[0];
  const toleranceSquared = tolerance * tolerance;

  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const dx = point[0] - previous[0];
    const dy = point[1] - previous[1];
    if (dx * dx + dy * dy >= toleranceSquared) {
      simplified.push(point);
      previous = point;
    }
  }

  const last = points[points.length - 1];
  if (last[0] !== previous[0] || last[1] !== previous[1]) simplified.push(last);
  return simplified.length >= 4 ? simplified : points;
}

function featureCollectionFrom(value: unknown): DistrictFeatureCollection {
  if (!value || typeof value !== "object") {
    throw new Error("The Rwanda district boundary file is not valid GeoJSON.");
  }
  const collection = value as Partial<DistrictFeatureCollection>;
  if (
    collection.type !== "FeatureCollection" ||
    !Array.isArray(collection.features)
  ) {
    throw new Error(
      "The Rwanda district boundary file is not a feature collection.",
    );
  }

  const features = collection.features.filter(
    (feature): feature is DistrictFeature =>
      Boolean(feature) &&
      typeof feature.properties?.shapeName === "string" &&
      Boolean(feature.properties.shapeName.trim()) &&
      Boolean(feature.geometry) &&
      (feature.geometry.type === "Polygon" ||
        feature.geometry.type === "MultiPolygon"),
  );
  const names = features.map((feature) =>
    normalizeDistrictName(feature.properties.shapeName),
  );
  if (features.length !== 30 || new Set(names).size !== 30) {
    throw new Error(
      "The Rwanda district boundary file must contain 30 uniquely named districts.",
    );
  }
  return { type: "FeatureCollection", features };
}

function metricName(metric: DistrictMetric, rw: boolean) {
  if (!rw) return metric.label;
  const labels: Record<string, string> = {
    agricultural_land_000ha: "Ubutaka bw’ubuhinzi",
    agricultural_land_pct: "Igipimo cy’ubutaka bw’ubuhinzi",
    seasonal_crop_area_000ha: "Ubuso bw’ibihingwa by’igihembwe",
    permanent_crop_area_000ha: "Ubuso bw’ibihingwa bihoraho",
    permanent_pasture_000ha: "Ubuso bw’inzuri zihoraho",
    physical_cultivated_land_000ha: "Ubuso bwahinzwe",
  };
  return labels[metric.key] ?? metric.label;
}

export function DistrictLandUseMap({
  language,
  observations,
  period,
  usesLatestPeriod,
  metric,
  searchQuery,
}: DistrictLandUseMapProps) {
  const rw = language === "rw";
  const [features, setFeatures] = useState<DistrictFeature[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [hoveredDistrict, setHoveredDistrict] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/rwanda-districts.geojson`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(
            "The Rwanda district boundary file could not be loaded.",
          );
        return response.json() as Promise<unknown>;
      })
      .then((value) => {
        setFeatures(featureCollectionFrom(value).features);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error && error.message
            ? error.message
            : "The Rwanda district boundary file could not be loaded.",
        );
        setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const valuesByDistrict = useMemo(
    () =>
      new Map(
        observations.map((row) => [
          normalizeDistrictName(row.district),
          row.value,
        ]),
      ),
    [observations],
  );
  const normalizedGeoNames = useMemo(
    () =>
      new Set(
        features.map((feature) =>
          normalizeDistrictName(feature.properties.shapeName),
        ),
      ),
    [features],
  );
  const hasReliableMatch =
    features.length === 30 &&
    observations.length === 30 &&
    valuesByDistrict.size === 30 &&
    features.every((feature) =>
      valuesByDistrict.has(normalizeDistrictName(feature.properties.shapeName)),
    ) &&
    observations.every((row) =>
      normalizedGeoNames.has(normalizeDistrictName(row.district)),
    );

  const projectedFeatures = useMemo<ProjectedFeature[]>(() => {
    if (!features.length) return [];
    const positions = features.flatMap((feature) =>
      getRings(feature.geometry).flat(),
    );
    if (!positions.length) return [];

    let minLongitude = Infinity;
    let maxLongitude = -Infinity;
    let minLatitude = Infinity;
    let maxLatitude = -Infinity;
    for (const [longitude, latitude] of positions) {
      minLongitude = Math.min(minLongitude, longitude);
      maxLongitude = Math.max(maxLongitude, longitude);
      minLatitude = Math.min(minLatitude, latitude);
      maxLatitude = Math.max(maxLatitude, latitude);
    }
    const innerWidth = MAP_WIDTH - MAP_PADDING * 2;
    const innerHeight = MAP_HEIGHT - MAP_PADDING * 2;
    const project = (position: Position): Point => [
      MAP_PADDING +
        ((position[0] - minLongitude) / (maxLongitude - minLongitude)) *
          innerWidth,
      MAP_PADDING +
        ((maxLatitude - position[1]) / (maxLatitude - minLatitude)) *
          innerHeight,
    ];

    return features.map((feature) => {
      const path = getRings(feature.geometry)
        .map((ring) => {
          const projected = simplifyPoints(ring.map(project));
          return `${projected
            .map(
              ([x, y], index) =>
                `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`,
            )
            .join(" ")} Z`;
        })
        .join(" ");
      return { name: feature.properties.shapeName, path };
    });
  }, [features]);

  const numericValues = observations
    .map((row) => row.value)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  const minValue = numericValues.length ? Math.min(...numericValues) : 0;
  const maxValue = numericValues.length ? Math.max(...numericValues) : 0;
  const query = normalizeDistrictName(searchQuery.trim());
  const matchingNames =
    query.length >= 3
      ? new Set(
          features
            .filter((feature) => {
              const name = normalizeDistrictName(feature.properties.shapeName);
              return name.includes(query) || query.includes(name);
            })
            .map((feature) =>
              normalizeDistrictName(feature.properties.shapeName),
            ),
        )
      : new Set<string>();
  const hasDistrictSearch = matchingNames.size > 0;
  const inspectedDistrict = hoveredDistrict || selectedDistrict;
  const inspectedValue = inspectedDistrict
    ? valuesByDistrict.get(normalizeDistrictName(inspectedDistrict))
    : undefined;
  const sortedDistrictNames = features
    .map((feature) => feature.properties.shapeName)
    .sort((left, right) => left.localeCompare(right));

  function colorFor(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value))
      return NO_DATA_COLOR;
    const ratio =
      maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);
    const step = Math.min(
      COLOR_STEPS.length - 1,
      Math.floor(ratio * COLOR_STEPS.length),
    );
    return COLOR_STEPS[Math.max(0, step)];
  }

  if (loadError || (features.length > 0 && !hasReliableMatch)) {
    return (
      <section
        className="my-5 rounded-2xl border border-border bg-card p-4 text-[12px] text-muted-foreground sm:p-5"
        role="alert"
        data-testid="district-land-use-map-error"
      >
        {t(
          rw,
          "The map is unavailable because the district boundaries could not be reliably matched to the selected NISR records. The data table remains available.",
          "Ikarita ntibonetse kuko imipaka y’uturere itahuye neza n’imibare ya NISR wahisemo. Imbonerahamwe y’amakuru iracyaboneka.",
        )}
      </section>
    );
  }

  return (
    <section
      className="my-5 overflow-hidden rounded-2xl border border-border bg-card"
      aria-labelledby="district-land-use-map-title"
      data-testid="district-land-use-map"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <MapPinned size={18} />
          </span>
          <div className="min-w-0">
            <h2
              id="district-land-use-map-title"
              className="display-font text-[15px] font-bold text-foreground"
            >
              {t(
                rw,
                "Rwanda district land-use map",
                "Ikarita y’imikoreshereze y’ubutaka mu turere",
              )}
            </h2>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              {usesLatestPeriod
                ? t(
                    rw,
                    "All periods are selected above; the map shows the latest available district period.",
                    "Ibihe byose byatoranyijwe haruguru; ikarita igaragaza igihe giheruka kiboneka ku turere.",
                  )
                : t(
                    rw,
                    "The map follows the selected period and measure above.",
                    "Ikarita ikurikiza igihe n’igipimo byatoranyijwe haruguru.",
                  )}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-semibold text-foreground">
          {period.replace(" · ", " · Season ")}
        </span>
      </div>

      {isLoading ? (
        <p className="p-5 text-[12px] text-muted-foreground" role="status">
          {t(
            rw,
            "Loading district boundaries…",
            "Imipaka y’uturere iri gutegurwa…",
          )}
        </p>
      ) : (
        <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_250px]">
          <div className="min-w-0 rounded-xl bg-[#f4f7f3] p-2 sm:p-3">
            <svg
              className="h-[320px] w-full sm:h-[430px]"
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-label={t(
                rw,
                "Interactive map of Rwanda’s 30 districts",
                "Ikarita y’uturere 30 tw’u Rwanda",
              )}
              data-testid="rwanda-district-map-svg"
            >
              {projectedFeatures.map(({ name, path }) => {
                const normalizedName = normalizeDistrictName(name);
                const value = valuesByDistrict.get(normalizedName);
                const selected = selectedDistrict === name;
                const dimmed =
                  hasDistrictSearch && !matchingNames.has(normalizedName);
                const accessibleValue =
                  typeof value === "number"
                    ? formatValue(value, metric.unit, rw)
                    : t(rw, "No data", "Nta makuru");
                return (
                  <path
                    key={name}
                    d={path}
                    fill={colorFor(value)}
                    fillRule="evenodd"
                    stroke={
                      selected || hoveredDistrict === name
                        ? "#173f2b"
                        : "#ffffff"
                    }
                    strokeWidth={
                      selected || hoveredDistrict === name ? 2.4 : 1.25
                    }
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    opacity={dimmed ? 0.28 : 1}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-label={`${name}, ${metricName(metric, rw)}: ${accessibleValue}`}
                    data-district={name}
                    data-testid={`map-district-${normalizedName}`}
                    onPointerEnter={() => setHoveredDistrict(name)}
                    onPointerLeave={() => setHoveredDistrict("")}
                    onFocus={() => setHoveredDistrict(name)}
                    onBlur={() => setHoveredDistrict("")}
                    onClick={() => setSelectedDistrict(name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedDistrict(name);
                      }
                    }}
                  >
                    <title>{`${name} · ${metricName(metric, rw)} · ${accessibleValue}`}</title>
                  </path>
                );
              })}
            </svg>
          </div>

          <aside className="flex min-w-0 flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
              {t(rw, "District", "Akarere")}
              <select
                value={selectedDistrict}
                onChange={(event) => setSelectedDistrict(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[12px] font-medium normal-case tracking-normal text-foreground"
                aria-label={t(rw, "Choose a district", "Hitamo akarere")}
                data-testid="select-map-district"
              >
                <option value="">
                  {t(rw, "Select a district", "Hitamo akarere")}
                </option>
                {sortedDistrictNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <div
              className="rounded-xl border border-border bg-background p-3"
              aria-live="polite"
            >
              <p className="text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                {metricName(metric, rw)} · {period.replace(" · ", " · Season ")}
              </p>
              <p className="display-font mt-2 text-[16px] font-bold text-foreground">
                {inspectedDistrict ||
                  t(rw, "Select a district", "Hitamo akarere")}
              </p>
              {inspectedDistrict && (
                <p className="mt-1 text-[14px] font-semibold tabular-nums text-primary">
                  {typeof inspectedValue === "number"
                    ? formatValue(inspectedValue, metric.unit, rw)
                    : t(rw, "No data reported", "Nta makuru yatangajwe")}
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold text-foreground">
                {t(
                  rw,
                  "Relative values in this period",
                  "Ugereranya muri iki gihe",
                )}
              </p>
              <div
                className="mt-2 h-2.5 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${COLOR_STEPS.join(", ")})`,
                }}
                role="img"
                aria-label={`${t(rw, "Map color scale", "Urwego rw’amabara y’ikarita")}: ${formatValue(minValue, metric.unit, rw)} – ${formatValue(maxValue, metric.unit, rw)}`}
              />
              <div className="mt-1 flex justify-between gap-2 text-[9px] tabular-nums text-muted-foreground">
                <span>{formatValue(minValue, metric.unit, rw)}</span>
                <span>{formatValue(maxValue, metric.unit, rw)}</span>
              </div>
              {observations.some((row) => row.value === null) && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[9px] text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-sm border border-border"
                    style={{ backgroundColor: NO_DATA_COLOR }}
                  />
                  {t(rw, "No data (not zero)", "Nta makuru (si zeru)")}
                </p>
              )}
            </div>

            <p className="text-[9px] leading-4 text-muted-foreground">
              {t(
                rw,
                "Colors span the values for this period; select or focus a district to inspect its reported value. Matching district searches are highlighted.",
                "Amabara agereranya ibipimo byo muri iki gihe; hitamo akarere cyangwa ugakandeho kugira ngo urebe umubare watangajwe. Uturere duhuye n’ishakisha turagaragazwa.",
              )}
            </p>
            <span className="inline-flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <MousePointer2 size={12} />
              {t(
                rw,
                "Select a district on the map or in the list.",
                "Hitamo akarere ku ikarita cyangwa mu rutonde.",
              )}
            </span>
          </aside>
        </div>
      )}
    </section>
  );
}
