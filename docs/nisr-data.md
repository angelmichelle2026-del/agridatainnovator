# NISR agriculture data in AgriLens AI

**Data checked:** 10 October 2026. AgriLens AI is an independent prototype, not an official NISR service.

## Sources and coverage

1. **NISR Seasonal Agricultural Survey (SAS) 2025 Annual Report** — the national SAS main-indicator summary plus district land-use Tables 9 and 10. The summary contributes national farmer-input/practice percentages for Seasons A, B and C and national land summaries for Seasons A and B. Tables 9–10 contribute land-use estimates for all 30 districts and the national total in Seasons A and B.
   - [Report PDF](https://statistics.gov.rw/sites/default/files/documents/2025-12/SAS%202025%20Final%20report.pdf)
   - [NISR report landing page](https://www.statistics.gov.rw/data-sources/surveys/Seasonal-Agricultural-Survey/Seasonal-Agricultural-Survey/seasonal-agricultural-survey-2025-)
2. **NISR SAS Season A 2026 release** — national land and input/practice observations from the release page; the supplied detailed workbook adds 35 tables, including national/district crop areas, production, yields, inputs and agricultural practices.
   - [NISR release page](https://www.statistics.gov.rw/statistical-publications/agriculture-environment/seasonal-agricultural-survey-season-2026)
   - `Tables_2026SeasonA.xlsx` was supplied for this task. Its worksheets attribute the tables to “NISR, SAS 2026”. The workbook is retained in the app for download. The linked NISR page is the release landing page; a direct public URL for this exact workbook was not established.
3. **NISR SAS Season B 2026** — national land and input/practice observations from the official release page. NISR reports coverage of all 30 districts, 1,200 segments and 505 large-scale farmers.
   - [NISR release](https://statistics.gov.rw/statistical-publications/agriculture-environment/seasonal-agricultural-survey-season-b-2026)
4. **Government of Rwanda local-government directory** — official membership of districts in City of Kigali and the four provinces, used only for the interface’s geographic filters.
   - [Local-government directory](https://www.gov.rw/government/directory/local-government)

## Files

- `artifacts/agri-lens-ai/src/data/district-land-2025.json` — district/season records for 2025 Seasons A and B, plus source and field metadata.
- `artifacts/agri-lens-ai/src/data/district-land-2026a.json` — normalized 2026 Season A district land-use estimates from workbook Table 9.
- `artifacts/agri-lens-ai/src/data/national-indicators.json` — 53 national observations, metric definitions and source metadata.
- `artifacts/agri-lens-ai/src/data/nisr-sas-2026-season-a-tables.json` — structured, searchable row and header data from all 35 supplied workbook sheets.
- `artifacts/agri-lens-ai/src/data/crop-visuals-2026a.json` — compact chart input from Table 6 and Table 15, lazy-loaded on the dashboard.
- `artifacts/agri-lens-ai/src/data/province-yields-2026a.json` — 105 derived crop-by-province/city yields, area-weighted from Tables 12 and 15 and checked against Table 13.
- `artifacts/agri-lens-ai/src/data/rwanda-admin-areas.json` — official province/city-to-district grouping used by the cascading location filters.
- `artifacts/agri-lens-ai/public/data/nisr-sas-2026-season-a-tables.xlsx` — preserved source workbook available from the app’s data explorer.
- `artifacts/agri-lens-ai/public/data/district-land-2026-season-a.csv` — CSV of the 30 district rows and National row from 2026 Table 9.
- `scripts/import_nisr_sas.py` — downloads the NISR 2025 report (or accepts `--pdf`) and recreates 2025 district JSON/CSV from Tables 9 and 10. Requires Poppler’s `pdftotext`.
- `scripts/import_nisr_sas_2026a_workbook.py` — imports the supplied workbook into the 35-table dataset, compact crop/yield chart files, and normalized 2026 Table 9 JSON/CSV. It validates that district production divided by harvested area reproduces Table 13 yields. Requires `openpyxl` (`python3 -m pip install openpyxl`).
- `scripts/verify_nisr_data.mjs` — checks source values, coverage, missing-value handling, exports, all 35 tables, the downloadable workbook, complete unique district-to-region mapping and each weighted province-yield calculation.

To rebuild the 2026A extract after replacing the source workbook, run `python3 scripts/import_nisr_sas_2026a_workbook.py`. To run all data integrity checks, use `node scripts/verify_nisr_data.mjs`.

## Definitions and processing

- The 2025 district land-use tables state areas in **thousand hectares**; their published rounding is retained. Source dashes are encoded as `null` in JSON and blank in CSV, never as zero.
- Workbook Table 9 also states areas in thousand hectares. Its district/national values retain the workbook’s precision in JSON and CSV. The UI rounds long numeric values for readability; download the workbook or CSV for exact imported values.
- The 35-sheet browser flattens multirow spreadsheet headings into readable column labels. It preserves non-empty rows and cell values, including summary rows, source zeros and missing cells. The original workbook is available for checking layout and full precision.
- National land-use values previously stated in millions of hectares are stored in thousand hectares (for example, 1.414 million ha becomes 1,414 thousand ha). Published percentages are retained as NISR states them.
- Farmer-use values are percentages of farmers. Dashboard comparisons show differences in **percentage points**, computed as the later published percentage minus the earlier one.
- The crop dashboard compares 2025 and 2026 Season A national production in metric tonnes from Table 6. It excludes summary rows (such as cereals, tubers, bananas, beans and total) so headline groups and their component crop rows are not counted twice.
- The district crop chart uses Table 15 and includes only the workbook’s 30 named districts. It excludes the `S/Total`, `2025A` and `Change` summary rows, and displays the ten highest reported district values for the selected crop. Production is not yield or productivity.
- The province yield charts cover 21 leaf crops in 2026 Season A. For each province/City of Kigali and crop, the importer sums district production from Table 15 and harvested area from Table 12, then calculates `sum(production in MT) × 1,000 / sum(harvested area in Ha)` to give an area-weighted yield in kg/ha. It cross-checks the result against district yields in Table 13. The national reference line uses Table 13’s reported National row. Regional yields are derived summaries, not separate NISR-published province estimates; the one-season comparison is a snapshot, not a multi-season trend. Missing area is not treated as zero.
- The dashboard season filter updates the headline cards and the farmer-practice/land-use charts. Seasons A and B compare matching 2025 and 2026 observations; Season C has 2025 values only, so no 2026C or prior-year comparison is implied. Land-use and detailed crop visuals show an explicit unavailable state when that season is not in their source data. “All available seasons” retains all periods in the national trend while detailed crop visuals remain clearly labeled Season A.
- Province and district filters follow the official Government of Rwanda directory. The crop-production ranking can be narrowed from all Rwanda to a province and then one district. The district comparator uses the same province scope while retaining its selected survey period. The mapping is an administrative lookup; it does not create or redistribute statistical observations.
- National and district values are separate geographic levels. The 2026 workbook provides district-level crop areas, average yields and production in its own tables, while Table 9 is the land-use table wired into district comparison. Do not treat unrelated measures as interchangeable.
- The published area components are displayed as separately reported categories. Users should not assume that component areas are mutually exclusive or add them to reproduce total agricultural land.
- The 2026 Season A workbook was supplied by the user, and its sheets identify NISR SAS 2026 as the source. The NISR release page is cited, but a direct source URL for the supplied file and licensing/reuse terms were not confirmed. Check the current NISR terms and source publication before redistribution beyond this prototype.
- The prototype does not claim significance testing or causal findings. Cross-season differences are not automatically annual changes, and land area is not a direct measure of productivity.
