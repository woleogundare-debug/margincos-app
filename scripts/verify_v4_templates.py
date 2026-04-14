"""
MarginCOS v4 Template Cross-Template Sanity Pass
=================================================
Regression test for all four v4 templates. Run after any script-level
change to the template build pipeline. All assertions must pass on all
four templates or the workstream is considered broken.

Usage:
    python3 scripts/verify_v4_templates.py [path/to/templates/dir]

Exits 0 on full pass, 1 on any failure.
"""

import sys
import os
import zipfile
import re
from pathlib import Path

TEMPLATES = [
    ("FMCG", "MarginCOS_Data_Template_v4_FMCG.xlsx", "SKU Data"),
    ("Manufacturing", "MarginCOS_Data_Template_v4_Manufacturing.xlsx", "SKU Data"),
    ("Retail", "MarginCOS_Data_Template_v4_Retail.xlsx", "SKU Data"),
    ("Logistics", "MarginCOS_Data_Template_v4_Logistics.xlsx", "Lane Data"),
]

# Per-sheet assertions on sheetProtection XML
REQUIRED_FLAGS = {
    "formatCells": "0",
    "formatColumns": "0",
    "formatRows": "0",
    "insertColumns": "0",
    "deleteColumns": "0",
    "insertRows": "0",
    "deleteRows": "0",
    "sort": "1",
    "autoFilter": "1",
}

# Excel stores sheet protection passwords as a 2-byte hash rendered as 4 hex chars,
# not cleartext. "CCD0" is the hash of "margincos2026" (the cleartext used by the
# build script). If the cleartext changes, the hash changes, and this assertion
# fires - which is the correct failure mode.
REQUIRED_PASSWORD = "CCD0"


class VerificationError(Exception):
    pass


def check_template(sector, path, data_sheet_name):
    """Run all assertions against one template file. Returns list of failures."""
    failures = []

    if not os.path.exists(path):
        return [f"{sector}: FILE NOT FOUND at {path}"]

    try:
        with zipfile.ZipFile(path, 'r') as z:
            sheet_files = sorted([
                n for n in z.namelist()
                if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')
            ])

            if len(sheet_files) != 4:
                failures.append(
                    f"{sector}: expected 4 worksheets, found {len(sheet_files)}"
                )

            for sheet_path in sheet_files:
                xml = z.read(sheet_path).decode('utf-8')

                # Find sheetProtection element
                match = re.search(r'<sheetProtection[^/]*/>', xml)
                if not match:
                    failures.append(
                        f"{sector} {sheet_path}: no sheetProtection element"
                    )
                    continue

                tag = match.group(0)

                # Assertion 1: all required flags present with correct values
                for flag, expected in REQUIRED_FLAGS.items():
                    flag_match = re.search(rf'{flag}="(\d)"', tag)
                    if not flag_match:
                        failures.append(
                            f"{sector} {sheet_path}: missing flag {flag}"
                        )
                    elif flag_match.group(1) != expected:
                        failures.append(
                            f"{sector} {sheet_path}: "
                            f"{flag}={flag_match.group(1)}, expected {expected}"
                        )

                # Assertion 2: password preserved
                pw_match = re.search(r'password="([^"]*)"', tag)
                if not pw_match:
                    failures.append(
                        f"{sector} {sheet_path}: no password attribute"
                    )
                elif pw_match.group(1) != REQUIRED_PASSWORD:
                    failures.append(
                        f"{sector} {sheet_path}: "
                        f"password={pw_match.group(1)}, expected {REQUIRED_PASSWORD}"
                    )

                # Assertion 3: sheet protection actually enabled
                sheet_match = re.search(r'sheet="(\d)"', tag)
                if not sheet_match or sheet_match.group(1) != "1":
                    failures.append(
                        f"{sector} {sheet_path}: sheet protection not enabled"
                    )

    except zipfile.BadZipFile:
        failures.append(f"{sector}: corrupted xlsx (not a valid zip)")
    except Exception as e:
        failures.append(f"{sector}: unexpected error - {type(e).__name__}: {e}")

    return failures


def main():
    templates_dir = sys.argv[1] if len(sys.argv) > 1 else "."

    print("=" * 70)
    print("MarginCOS v4 Template Cross-Template Sanity Pass")
    print("=" * 70)
    print(f"Templates directory: {os.path.abspath(templates_dir)}")
    print()

    all_failures = []

    for sector, filename, data_sheet_name in TEMPLATES:
        path = os.path.join(templates_dir, filename)
        print(f"Checking {sector}...", end=" ", flush=True)

        failures = check_template(sector, path, data_sheet_name)

        if failures:
            print("FAIL")
            all_failures.extend(failures)
        else:
            print("PASS")

    print()
    print("=" * 70)

    if all_failures:
        print(f"RESULT: FAIL ({len(all_failures)} assertion(s) failed)")
        print("=" * 70)
        for f in all_failures:
            print(f"  - {f}")
        sys.exit(1)
    else:
        print("RESULT: PASS - all 4 templates clean")
        print("=" * 70)
        sys.exit(0)


if __name__ == "__main__":
    main()
