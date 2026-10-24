#!/usr/bin/env python3
"""Verify imported AHS 2024 table values against the original workbook."""
from __future__ import annotations

import json
import re
import warnings
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / "artifacts/agri-lens-ai/public/data/AHS_2024Tables.xlsx"
CATALOG = ROOT / "artifacts/agri-lens-ai/src/data/ahs-2024-tables.json"
EXPECTED_TABLES = 56


def main() -> None:
    if not WORKBOOK.is_file() or not CATALOG.is_file():
        raise SystemExit("AHS workbook or normalized catalog is missing")
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    tables = data.get("tables")
    if not isinstance(tables, list) or len(tables) != EXPECTED_TABLES:
        raise SystemExit(f"Expected {EXPECTED_TABLES} AHS tables")
    if data.get("source", {}).get("id") != "nisr-ahs-2024-workbook":
        raise SystemExit("AHS source ID is missing or incorrect")
    if not data["source"].get("citation", "").endswith("August 2025."):
        raise SystemExit("Workbook's recommended NISR citation is missing")

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        value_wb = load_workbook(WORKBOOK, data_only=True, read_only=False)
        formula_wb = load_workbook(WORKBOOK, data_only=False, read_only=False)

    formula_count = 0
    checked_rows = 0
    for expected_number, table in enumerate(tables, start=1):
        if table.get("number") != expected_number:
            raise SystemExit(f"Unexpected table number at index {expected_number}")
        if table.get("id") != f"ahs-2024-table-{expected_number:02d}":
            raise SystemExit(f"Unexpected AHS table ID for table {expected_number}")
        if table.get("source_id") != data["source"]["id"]:
            raise SystemExit(f"Incorrect source ID for table {expected_number}")
        sheet_name = table.get("sheet_name")
        if sheet_name not in value_wb.sheetnames or sheet_name not in formula_wb.sheetnames:
            raise SystemExit(f"Missing source worksheet: {sheet_name}")
        value_ws = value_wb[sheet_name]
        formula_ws = formula_wb[sheet_name]
        columns = table.get("columns")
        rows = table.get("rows")
        if not isinstance(columns, list) or not columns or not isinstance(rows, list):
            raise SystemExit(f"Missing source grid for table {expected_number}")
        if table.get("row_count") != len(rows):
            raise SystemExit(f"Row-count mismatch for table {expected_number}")
        col_nums = []
        for column in columns:
            # Workbook columns in this source are A-Z; keep the verifier strict.
            if not re.fullmatch(r"[A-Z]+", column):
                raise SystemExit(f"Invalid Excel column {column!r}")
            from openpyxl.utils.cell import column_index_from_string
            col_nums.append(column_index_from_string(column))
        for row in rows:
            excel_row = row.get("excel_row")
            cells = row.get("cells")
            if not isinstance(excel_row, int) or not isinstance(cells, list) or len(cells) != len(columns):
                raise SystemExit(f"Invalid row payload in table {expected_number}")
            if not any(value is not None for value in cells):
                raise SystemExit(f"Empty row should not be indexed: table {expected_number}, row {excel_row}")
            for index, column_number in enumerate(col_nums):
                original = formula_ws.cell(excel_row, column_number)
                expected = value_ws.cell(excel_row, column_number).value
                actual = cells[index]
                if original.data_type == "f":
                    formula_count += 1
                    if expected is None:
                        raise SystemExit(f"Uncached source formula: {sheet_name}!{original.coordinate}")
                if expected != actual:
                    raise SystemExit(
                        f"Source mismatch at {sheet_name}!{original.coordinate}: "
                        f"workbook={expected!r}, catalog={actual!r}"
                    )
            checked_rows += 1

    if formula_count != 28:
        raise SystemExit(f"Expected the 28 cached formulas in Table 56; found {formula_count}")
    print(
        f"AHS 2024 integrity OK: {len(tables)} tables, {checked_rows} source rows, "
        f"{formula_count} cached formulas verified against the original workbook."
    )


if __name__ == "__main__":
    main()
