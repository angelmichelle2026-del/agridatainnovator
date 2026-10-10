#!/usr/bin/env python3
"""Extract NISR SAS 2025 district land-use tables into the app's public data files.

Requires Python 3 and Poppler's pdftotext. The source report is downloaded from NISR
unless --pdf is supplied. Every output row is transcribed from report Tables 9 and 10.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = "https://statistics.gov.rw/sites/default/files/documents/2025-12/SAS%202025%20Final%20report.pdf"
SOURCE_ID = "nisr-sas-2025-annual-report"
DISTRICTS = {
    "Nyarugenge", "Gasabo", "Kicukiro", "Nyanza", "Gisagara", "Nyaruguru",
    "Huye", "Nyamagabe", "Ruhango", "Muhanga", "Kamonyi", "Karongi",
    "Rutsiro", "Rubavu", "Nyabihu", "Ngororero", "Rusizi", "Nyamasheke",
    "Rulindo", "Gakenke", "Musanze", "Burera", "Gicumbi", "Rwamagana",
    "Nyagatare", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Bugesera",
    "National",
}
FIELDS = [
    "total_land_000ha", "agricultural_land_000ha", "agricultural_land_pct",
    "arable_land_000ha", "physical_cultivated_land_000ha",
    "seasonal_crop_area_000ha", "permanent_crop_area_000ha",
    "temporary_fallow_area_000ha", "temporary_meadow_pasture_000ha",
    "permanent_pasture_000ha",
]
TOKEN = re.compile(r"^(?:\d[\d,]*(?:\.\d+)?|-)$")


def read_pdf(pdf_path: Path) -> str:
    result = subprocess.run(
        ["pdftotext", "-layout", str(pdf_path), "-"],
        check=True, capture_output=True, text=True,
    )
    return result.stdout


def parse_table(text: str, title: str, season: str) -> list[dict[str, object]]:
    start = text.rfind(title)
    if start < 0:
        raise ValueError(f"Could not find NISR report table: {title}")
    end = text.find("Source: NISR, SAS 2025", start)
    if end < 0:
        raise ValueError(f"Could not find the end/source label for: {title}")
    lines = text[start:end].splitlines()
    observations: list[dict[str, object]] = []
    for line in lines:
        parts = line.strip().split()
        if not parts or parts[0] not in DISTRICTS:
            continue
        district = parts[0]
        values = parts[1:]
        if len(values) != len(FIELDS) or not all(TOKEN.fullmatch(v) for v in values):
            raise ValueError(f"Unexpected row in {title}: {line!r} ({len(values)} values)")
        record: dict[str, object] = {
            "district": district,
            "year": 2025,
            "season": season,
            "source_id": SOURCE_ID,
        }
        for field, raw in zip(FIELDS, values):
            record[field] = None if raw == "-" else float(raw.replace(",", ""))
        observations.append(record)
    expected = DISTRICTS
    actual = {str(row["district"]) for row in observations}
    if actual != expected or len(observations) != len(expected):
        raise ValueError(f"District coverage mismatch in {title}: got {len(observations)} rows")
    return observations


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, help="Use an already downloaded NISR PDF")
    args = parser.parse_args()
    if args.pdf:
        pdf_path = args.pdf
        owned_tmp = None
    else:
        owned_tmp = tempfile.TemporaryDirectory(prefix="nisr-sas-")
        pdf_path = Path(owned_tmp.name) / "nisr-sas-2025.pdf"
        request = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "AgriLens-data-import/1.0"})
        with urllib.request.urlopen(request, timeout=90) as response, pdf_path.open("wb") as output:
            output.write(response.read())
    try:
        text = read_pdf(pdf_path)
        rows = []
        rows.extend(parse_table(text, "Table 9 : 2025 Season A_Agricultural land use per district", "A"))
        rows.extend(parse_table(text, "Table 10 : 2025 Season B_Agricultural land use per district", "B"))
        src = {
            "id": SOURCE_ID,
            "publisher": "National Institute of Statistics of Rwanda (NISR)",
            "title": "Seasonal Agricultural Survey (SAS) 2025 Annual Report",
            "period": "Agricultural year 2024/2025; Seasons A and B district land-use tables",
            "tables": ["Table 9 (Season A)", "Table 10 (Season B)"],
            "source_url": SOURCE_URL,
            "unit_note": "Areas are thousand hectares (000 ha); national report totals are rounded.",
            "geography_note": "30 districts plus the report's National total row.",
            "limitations": "Season C district land-use values are not included here. Dashes in the source are preserved as null, not treated as zero.",
        }
        json_path = ROOT / "artifacts/agri-lens-ai/src/data/district-land-2025.json"
        csv_path = ROOT / "artifacts/agri-lens-ai/public/data/district-land-2025.csv"
        json_path.parent.mkdir(parents=True, exist_ok=True)
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(json.dumps({"source": src, "fields": FIELDS, "observations": rows}, indent=2) + "\n")
        with csv_path.open("w", newline="", encoding="utf-8") as output:
            writer = csv.DictWriter(output, fieldnames=["district", "year", "season", *FIELDS, "source_id"])
            writer.writeheader()
            writer.writerows(rows)
        print(f"Wrote {len(rows)} district-season observations to {json_path} and {csv_path}")
    finally:
        if owned_tmp is not None:
            owned_tmp.cleanup()


if __name__ == "__main__":
    main()
