# NISR agriculture data in AgriLens AI

**Data checked:** 10 October 2026. AgriLens AI is an independent prototype, not an official NISR service.

## Sources and coverage

1. **NISR Seasonal Agricultural Survey (SAS) 2025 Annual Report** — the national SAS main-indicator summary plus district land-use Tables 9 and 10. The summary contributes national farmer-input/practice percentages for Seasons A, B and C and national land summaries for Seasons A and B. Tables 9–10 contribute land-use estimates for all 30 districts and the national total in Seasons A and B.
   - [Report PDF](https://statistics.gov.rw/sites/default/files/documents/2025-12/SAS%202025%20Final%20report.pdf)
   - [NISR report landing page](https://www.statistics.gov.rw/data-sources/surveys/Seasonal-Agricultural-Survey/Seasonal-Agricultural-Survey/seasonal-agricultural-survey-2025-)
2. **NISR SAS Season A 2026** — national land and input/practice figures from the official release page. NISR reports coverage of all 30 districts, 1,200 segments and 554 large-scale farmers.
   - [NISR release](https://www.statistics.gov.rw/statistical-publications/agriculture-environment/seasonal-agricultural-survey-season-2026)
3. **NISR SAS Season B 2026** — national land and input/practice figures from the official release page. NISR reports coverage of all 30 districts, 1,200 segments and 505 large-scale farmers.
   - [NISR release](https://statistics.gov.rw/statistical-publications/agriculture-environment/seasonal-agricultural-survey-season-b-2026)

## Files

- `artifacts/agri-lens-ai/src/data/district-land-2025.json` — structured district/season records plus source and field metadata.
- `artifacts/agri-lens-ai/public/data/district-land-2025.csv` — CSV copy of the 62 rows (30 districts plus National for A and B).
- `artifacts/agri-lens-ai/src/data/national-indicators.json` — 53 national observations with metric definitions and source metadata.
- `scripts/import_nisr_sas.py` — downloads the NISR 2025 report (or accepts `--pdf`) and recreates the district JSON and CSV from Tables 9 and 10. Requires `pdftotext` from Poppler.
- `scripts/verify_nisr_data.mjs` — checks row counts, representative source values, percentages, missing-value handling and CSV size.

To refresh the 2025 district extraction, run `python3 scripts/import_nisr_sas.py`. The annual and seasonal national summaries in `national-indicators.json` are source-transcribed observations; check the cited NISR releases and update the source metadata and verification checks when refreshing those values.

## Definitions and processing

- The 2025 district land-use report tables label their areas in **thousand hectares**. The source's rounding is retained. Values shown as a dash in the report are encoded as `null` in JSON and blank in CSV, never as zero.
- National land-use values originally stated in millions of hectares on the 2026 NISR release pages are stored in thousand hectares (for example, 1.414 million ha becomes 1,414 thousand ha). The published percentages are retained as NISR states them.
- Farmer-use values are percentages of farmers. In this product, the dashboard comparisons show differences in **percentage points**, computed as the later published percentage minus the earlier one.
- National and district values are separate geographic levels. The available 2025 district table measures land use; this extract does not provide district-level adoption rates, production or yields.
- The prototype does not claim to conduct significance testing or identify causes. Cross-season differences are not automatically annual changes, and a land area is not a direct measure of productivity.
- The published area components are displayed as separately reported categories. Users should not assume that the component areas are mutually exclusive or add them to reproduce the reported agricultural-land total.
- Licensing and reuse terms were not assessed as part of the data extraction. Consult NISR’s current terms before redistributing beyond this prototype.
