"""Bounded, deterministic package adapter. Never extracts archives to disk.

Trust boundary: uploaded files are untrusted data. They pass deterministic validation and
normalisation here and become typed records; nothing in them is ever an instruction. The
free-text fields below are carried as opaque values only: they are never echoed in validation
messages, never projected into a model prompt (agents/reasoning/projection.py refuses uploaded
sessions), and never interpreted as approvals, tool calls, URLs to fetch or workflow state.
"""

import csv
import hashlib
import io
import json
import re
import stat
import zipfile
import zlib
from datetime import date
from decimal import Decimal, InvalidOperation

from tools.validation.checks import ledger, money

VERSION = "controlled-package-v1"
MAX_FILE = 256 * 1024
MAX_TOTAL = 2 * 1024 * 1024
MAX_ROWS = 1000
MAX_FILES = 9
MAX_COLUMNS = 32
MAX_CELL = 8192
MAX_TEXT = 200
SCHEMAS = {
    "customers": ("id", "display_name"),
    "vendors": ("id", "display_name"),
    "accounts": ("id", "code", "name", "account_type", "opening_balance"),
    "products": ("id", "name", "item_type"),
    "invoices": ("id", "customer_id", "receivable_account_id", "document_number", "total"),
    "bills": ("id", "vendor_id", "payable_account_id", "document_number", "total"),
    "transactions": ("id", "transaction_date", "entries"),
}
OPTIONAL = {
    "customers": {"email"},
    "vendors": {"email"},
    "accounts": {"parent_id"},
    "products": {"income_account_id", "expense_account_id"},
    "invoices": {"paid", "product_id", "transaction_id"},
    "bills": {"paid", "product_id", "transaction_id"},
    "transactions": {"invoice_id", "bill_id", "customer_id", "vendor_id"},
}
NAMES = {f"{key}.csv" for key in SCHEMAS} | {"configuration.json", "metadata.json"}
REQUIRED = NAMES - {"metadata.json"}
ID = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}\Z")
# Free text a user controls. Evidence only: never instructions, policy or authority.
UNTRUSTED_TEXT = frozenset(
    {
        "display_name",
        "legal_name",
        "name",
        "code",
        "document_number",
        "email",
        "description",
        "jurisdiction",
    }
)
ACCOUNT_TYPES = {
    "bank",
    "accounts_receivable",
    "accounts_payable",
    "asset",
    "liability",
    "equity",
    "income",
    "expense",
    "cost_of_goods_sold",
}


SAMPLE = "using the Sample Package as a reference"
HEADER = re.compile(r"[a-z][a-z0-9_]{0,63}\Z")
SAFE_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}\Z")
# Leading bytes of formats that are sometimes renamed to .csv or .json. Text never starts so.
SIGNATURES = (
    (b"PK\x03\x04", "an Excel workbook or ZIP archive"),
    (b"%PDF-", "a PDF document"),
    (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1", "an older Excel or Office document"),
    (b"\x7fELF", "a program file"),
    (b"MZ", "a Windows program"),
    (b"\x1f\x8b", "a compressed archive"),
    (b"\x89PNG", "an image"),
    (b"\xff\xd8\xff", "an image"),
    (b"GIF8", "an image"),
    (b"{\\rtf", "a rich-text document"),
)
# C0/C1 controls (except tab and line breaks), DEL and bidirectional overrides can hide or
# reorder text on screen; accounting text never needs them.
HIDDEN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]")
HIDDEN_MESSAGE = "This file contains hidden or unsupported characters. Remove them and try again."
# JSON keys shown in finding paths; anything else is named "(key)" rather than echoed.
SAFE_KEY = re.compile(r"[A-Za-z0-9_-]{1,64}\Z")


def hidden_path(value, path=""):
    """Safe path of the first decoded string or key holding a hidden character, else None.

    JSON escapes such as \\u0000, \\u202e or \\u2066 only become characters when decoded, so
    the raw-text check cannot see them; decoded values and keys get the same rule.
    """
    if isinstance(value, str):
        return (path or "(value)") if HIDDEN.search(value) else None
    if isinstance(value, list):
        for index, item in enumerate(value):
            found = hidden_path(item, f"{path}[{index}]")
            if found:
                return found
    if isinstance(value, dict):
        for key, item in value.items():
            shown = key if isinstance(key, str) and SAFE_KEY.fullmatch(key) else "(key)"
            child = f"{path}.{shown}" if path else shown
            if isinstance(key, str) and HIDDEN.search(key):
                return child
            found = hidden_path(item, child)
            if found:
                return found
    return None


SINGULAR = {
    "customer_id": "customer",
    "vendor_id": "vendor",
    "receivable_account_id": "account",
    "payable_account_id": "account",
    "income_account_id": "account",
    "expense_account_id": "account",
    "parent_id": "account",
    "product_id": "product",
    "invoice_id": "invoice",
    "bill_id": "bill",
    "transaction_id": "transaction",
}
REFERENCES = {
    "customer_id": "customers",
    "vendor_id": "vendors",
    "receivable_account_id": "accounts",
    "payable_account_id": "accounts",
    "income_account_id": "accounts",
    "expense_account_id": "accounts",
    "parent_id": "accounts",
    "product_id": "products",
    "invoice_id": "invoices",
    "bill_id": "bills",
    "transaction_id": "transactions",
}


class Finding(ValueError):
    """One specific, deterministic validation finding.

    Messages name only schema columns, schema keys and identifiers that already passed the ID
    pattern. Free-text values from uploaded files are never echoed: they are data, and a
    message must not become a channel for them.
    """

    def __init__(self, code, message, fix, *, column=None, key=None, row=None):
        super().__init__(message)
        self.code, self.message, self.fix = code, message, fix
        self.column, self.key, self.row = column, key, row


def strict_json(text):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("Duplicate JSON key")
            result[key] = value
        return result

    return json.loads(
        text,
        object_pairs_hook=pairs,
        parse_constant=lambda _: (_ for _ in ()).throw(ValueError("Nonfinite")),
    )


def unpack(files):
    if len(files) == 1 and files[0][0].lower().endswith(".zip"):
        name, content = files[0]
        if "/" in name or "\\" in name or len(content) > MAX_TOTAL:
            raise ValueError("Invalid archive name or size. Use one flat ZIP up to 2 MiB.")
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                entries = archive.infolist()
                if len(entries) > MAX_FILES or sum(e.file_size for e in entries) > MAX_TOTAL:
                    raise ValueError("Archive exceeds file-count or expanded-size limit.")
                result = []
                for entry in entries:
                    if (
                        entry.filename not in NAMES
                        or entry.is_dir()
                        or stat.S_ISLNK(entry.external_attr >> 16)
                        or entry.flag_bits & 1
                        or entry.file_size > MAX_FILE
                        or entry.file_size > max(entry.compress_size, 1) * 100
                        or entry.compress_type not in {zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED}
                    ):
                        raise ValueError(
                            "ZIP must contain only flat supported files; unsafe, "
                            "nested, encrypted or excessive compression rejected."
                        )
                    with archive.open(entry) as stream:
                        data = stream.read(MAX_FILE + 1)
                    if len(data) > MAX_FILE:
                        raise ValueError("Expanded file exceeds 256 KiB.")
                    result.append((entry.filename, data))
                return result
        except (zipfile.BadZipFile, RuntimeError, NotImplementedError, zlib.error) as error:
            raise ValueError("Malformed or unsupported ZIP. Re-export the package.") from error
    return files


def unsupported_name(name):
    """Plain guidance for a file outside the package; echoes the name only if it is inert."""
    lower = name.lower()
    shown = name if SAFE_NAME.fullmatch(name) else "This file"
    if lower in NAMES:
        return (
            f"{shown} has the wrong capitalisation; file names are case-sensitive.",
            f"Rename it to {lower}.",
        )
    if lower.endswith((".xlsx", ".xls", ".xlsm", ".ods", ".numbers")):
        return (
            f"{shown} is a spreadsheet workbook; MoveBooks reads CSV files.",
            "Save each sheet as a UTF-8 CSV with the exact file name from the Sample Package.",
        )
    if lower.endswith(".zip"):
        return (
            "A ZIP must be the only file you choose.",
            "Choose just the ZIP, or the individual CSV and JSON files.",
        )
    return (
        f"{shown} isn't part of the supported package.",
        "Remove it, and use only the file names listed in the expected format.",
    )


def text_of(name, data):
    """Decode one package file as UTF-8 text or explain exactly why it isn't."""
    kind = "JSON" if name.endswith(".json") else "CSV"
    if len(data) > MAX_FILE:
        raise Finding(
            "FILE_TOO_LARGE",
            f"{name} is larger than 256 KiB.",
            "Reduce the file to 256 KiB or less, for example by removing unused rows.",
        )
    for magic, what in SIGNATURES:
        if data.startswith(magic) and (magic != b"MZ" or b"\x00" in data[:256]):
            raise Finding(
                "BINARY_CONTENT",
                f"{name} is {what}, not {kind} text.",
                f"Export the data as UTF-8 {kind} and save it as {name}.",
            )
    try:
        text = data.decode("utf-8-sig", errors="strict")
    except UnicodeDecodeError as error:
        raise Finding(
            "INVALID_ENCODING",
            f"{name} isn't UTF-8 text (unreadable bytes at position {error.start}).",
            "Save the file with UTF-8 encoding (for example, CSV UTF-8 in a spreadsheet app).",
        ) from error
    if not text.strip():
        raise Finding(
            "EMPTY_FILE",
            f"{name} is empty.",
            f"Add at least the header row, {SAMPLE}.",
        )
    hidden = HIDDEN.search(text)
    if hidden:
        line = text.count("\n", 0, hidden.start()) + 1
        # Same rule as before (C0/C1 controls, DEL, bidirectional overrides); plain wording.
        raise Finding(
            "HIDDEN_CHARACTERS",
            HIDDEN_MESSAGE,
            f"Look at line {line} of {name}, or re-export the file as plain UTF-8 text.",
        )
    return text


def parse_json(name, text):
    try:
        return strict_json(text)
    except json.JSONDecodeError as error:
        raise Finding(
            "MALFORMED_JSON",
            f"{name} isn't valid JSON (line {error.lineno}, column {error.colno}).",
            f"Check for a missing comma, quote or bracket, {SAMPLE}.",
        ) from error
    except RecursionError as error:
        raise Finding(
            "MALFORMED_JSON",
            f"{name} is nested too deeply to read.",
            "Use the flat structure shown in the Sample Package.",
        ) from error
    except ValueError as error:
        duplicate = str(error) == "Duplicate JSON key"
        raise Finding(
            "MALFORMED_JSON",
            f"{name} has the same key twice." if duplicate else f"{name} uses NaN or Infinity.",
            "Keep each key once." if duplicate else "Use ordinary numbers or decimal text.",
        ) from error


def validate_metadata(value):
    if not isinstance(value, dict):
        raise Finding(
            "INVALID_TYPE", "metadata.json must be a JSON object.", f"Use an object {SAMPLE}."
        )
    extra = sorted(set(value) - {"package_version", "description"})
    if extra:
        raise Finding(
            "UNSUPPORTED_KEY",
            "metadata.json may contain only package_version and description.",
            "Remove the other keys.",
            key=extra[0] if HEADER.fullmatch(extra[0]) else None,
        )
    if value.get("package_version", VERSION) != VERSION:
        raise Finding(
            "INVALID_VALUE",
            f"package_version must be {VERSION}.",
            f"Set package_version to {VERSION} or remove it.",
            key="package_version",
        )
    for key, item in value.items():
        if not isinstance(item, str) or len(item) > 500:
            raise Finding(
                "INVALID_VALUE",
                f"{key} must be text of up to 500 characters.",
                f"Shorten or correct {key}.",
                key=key,
            )
    return sorted(value)


def read_csv(name, text, add):
    """Parse one CSV file, reporting header and row problems; returns rows or None."""
    entity = name[:-4]
    reader = csv.reader(io.StringIO(text, newline=""), strict=True)
    try:
        header = next(reader)
    except csv.Error as error:
        raise Finding(
            "MALFORMED_CSV",
            f"{name} can't be read as CSV on line 1.",
            "Check quotes and commas in the header row, or re-export the file as CSV.",
        ) from error
    if len(header) > MAX_COLUMNS:
        raise Finding(
            "TOO_MANY_COLUMNS",
            f"{name} has {len(header)} columns; the limit is {MAX_COLUMNS}.",
            "Remove columns that aren't in the expected format.",
        )
    for position, column in enumerate(header, 1):
        if not HEADER.fullmatch(column):
            raise Finding(
                "INVALID_HEADER",
                f"Column {position} of {name} isn't a valid column name.",
                "Use lowercase letters, digits and underscores, exactly as in the Sample Package.",
            )
    duplicates = sorted({column for column in header if header.count(column) > 1})
    for column in duplicates:
        add(
            Finding(
                "DUPLICATE_HEADER",
                f"Column {column} appears more than once.",
                f"Keep one {column} column and remove the others.",
                column=column,
            )
        )
    missing = [column for column in SCHEMAS[entity] if column not in header]
    for column in missing:
        add(
            Finding(
                "MISSING_COLUMN",
                f"Missing required column: {column}.",
                f"Add {column} {SAMPLE}.",
                column=column,
            )
        )
    if duplicates or missing:
        return None, []
    ignored = sorted(set(header) - set(SCHEMAS[entity]) - OPTIONAL[entity])
    rows, ids, raws = [], {}, []
    count = 0
    try:
        for index, cells in enumerate(reader, 2):
            count += 1
            if count > MAX_ROWS:
                raise Finding(
                    "ROW_LIMIT",
                    f"{name} has more than {MAX_ROWS:,} rows.",
                    f"Split the data so each file has {MAX_ROWS:,} rows or fewer.",
                )
            if len(cells) != len(header):
                add(
                    Finding(
                        "MALFORMED_ROW",
                        f"Row {index} has {len(cells)} values, but the header has "
                        f"{len(header)} columns.",
                        "Check for missing or extra commas, or an unquoted comma in a value.",
                        row=index,
                    )
                )
                continue
            long = next((h for h, c in zip(header, cells, strict=True) if len(c) > MAX_CELL), None)
            if long:
                add(
                    Finding(
                        "TEXT_TOO_LONG",
                        f"{long} is longer than {MAX_CELL:,} characters.",
                        "Shorten the value.",
                        column=long,
                        row=index,
                    )
                )
                continue
            raw = dict(zip(header, cells, strict=True))
            row = {k: v for k, v in raw.items() if k not in ignored and v != ""}
            try:
                validate_row(entity, row)
            except Finding as finding:
                finding.row = index
                add(finding)
                continue
            if row["id"] in ids:
                add(
                    Finding(
                        "DUPLICATE_ID",
                        f"Identifier {row['id']} appears more than once in {name} "
                        f"(first on row {ids[row['id']]}).",
                        "Give each record its own identifier, or remove the duplicate row.",
                        column="id",
                        row=index,
                    )
                )
                continue
            ids[row["id"]] = index
            rows.append(row)
            raws.append((index, raw))
    except csv.Error as error:
        raise Finding(
            "MALFORMED_CSV",
            f"{name} can't be read as CSV near line {reader.line_num}.",
            "Check for an unclosed quote, or re-export the file as CSV.",
        ) from error
    return (rows, raws, ignored, count), ignored


def validate_package(files):
    """Return a safe report and private normalized source; no persistence or agent calls."""
    issues, detected, lineage = [], [], []

    def issue(file, row, code, message, warning=False, *, fix=None, column=None, key=None):
        fix = fix or (
            "Review and replace the named file, then validate again."
            if file in NAMES
            else "Remove unsupported content and validate again."
        )
        issues.append(
            {
                "file": file if file in NAMES else "unsupported file",
                "row": row,
                "column": column,
                "key": key,
                "code": code,
                "severity": "WARNING" if warning else "BLOCKER",
                "message": message,
                "fix": fix,
                "why": "Accounting meaning and evidence must be preserved.",
                "action": fix,
                "can_continue": warning,
            }
        )

    def found(file, finding):
        issue(
            file,
            finding.row,
            finding.code,
            finding.message,
            fix=finding.fix,
            column=finding.column,
            key=finding.key,
        )

    package_ok = True
    try:
        files = unpack(files)
    except (ValueError, OSError, EOFError) as error:
        issue(
            "package",
            None,
            "UNSAFE_ARCHIVE",
            str(error),
            fix="Use one ZIP that contains only the package files, with no folders.",
        )
        files, package_ok = [], False
    if package_ok and not 1 <= len(files) <= MAX_FILES:
        issue(
            "package",
            None,
            "PACKAGE_LIMIT",
            f"This package has {len(files)} files; the limit is {MAX_FILES}.",
            fix="Use the 8 required files and, optionally, metadata.json.",
        )
        files, package_ok = [], False
    if package_ok and sum(len(data) for _, data in files) > MAX_TOTAL:
        issue(
            "package",
            None,
            "PACKAGE_LIMIT",
            "This package is larger than 2 MiB in total.",
            fix="Reduce the files to 2 MiB in total.",
        )
        files, package_ok = [], False
    names = [name for name, _ in files]
    if package_ok:
        for missing in sorted(REQUIRED - set(names)):
            issue(
                missing,
                None,
                "MISSING_FILE",
                f"Required file {missing} is missing.",
                fix=f"Add {missing} {SAMPLE}.",
            )
    datasets, config = {}, None
    for name, data in files:
        if name not in NAMES:
            message, fix = unsupported_name(name)
            issue(name, None, "UNSUPPORTED_FILE", message, fix=fix)
            continue
        row_count = 0
        ignored = []
        before = len(issues)
        if names.count(name) > 1:
            issue(
                name,
                None,
                "DUPLICATE_FILENAME",
                f"{name} was included more than once.",
                fix="Keep one copy of the file.",
            )
            continue
        try:
            text = text_of(name, data)
            if name.endswith(".json"):
                value = parse_json(name, text)
                where = hidden_path(value)
                if where:
                    raise Finding(
                        "HIDDEN_CHARACTERS",
                        HIDDEN_MESSAGE,
                        f"Look at {where} in {name}, including escaped characters such as \\u202e.",
                        key=where,
                    )
                if name == "metadata.json":
                    ignored = validate_metadata(value)
                    issue(
                        name,
                        None,
                        "METADATA_ONLY",
                        "Metadata is kept as evidence only; it can't change the migration.",
                        True,
                        fix="No change needed.",
                    )
                else:
                    config = validate_config(value)
                row_count = 1
            else:
                entity = name[:-4]
                parsed, ignored = read_csv(name, text, lambda f, n=name: found(n, f))
                if ignored:
                    issue(
                        name,
                        1,
                        "IGNORED_FIELDS",
                        "Unsupported columns will not migrate: "
                        + ", ".join(ignored)
                        + ". Explicit review is required.",
                        True,
                        fix="Remove these columns, or continue knowing they won't migrate.",
                    )
                if parsed is not None:
                    rows, raws, ignored, row_count = parsed
                    for row, (index, raw) in zip(rows, raws, strict=True):
                        lineage.append(
                            {
                                "entity": entity,
                                "id": row["id"],
                                "file": name,
                                "row": index,
                                "source_hash": hashlib.sha256(
                                    json.dumps(raw, sort_keys=True).encode()
                                ).hexdigest(),
                                "transformations": [
                                    "UTF-8/BOM decode",
                                    "CSV structural parse",
                                    "entries JSON parse",
                                ]
                                if entity == "transactions"
                                else ["UTF-8/BOM decode", "CSV structural parse"],
                                "ignored_fields": ignored,
                            }
                        )
                    datasets[entity] = rows
        except Finding as finding:
            found(name, finding)
        except (
            ValueError,
            UnicodeError,
            csv.Error,
            StopIteration,
            RecursionError,
            TypeError,
            ArithmeticError,
            AttributeError,
        ):
            issue(
                name,
                None,
                "INVALID_SCHEMA",
                f"{name} doesn't match the expected format.",
                fix="Compare the file with the Sample Package and validate again.",
            )
        detected.append(
            {
                "name": name,
                "type": name.rsplit(".", 1)[-1],
                "rows": row_count,
                "schema_status": "BLOCKED"
                if any(i["severity"] == "BLOCKER" for i in issues[before:])
                else "READY",
                "ignored_fields": ignored,
                "sha256": hashlib.sha256(data).hexdigest(),
            }
        )
    row_locations = {(item["entity"], item["id"]): item["row"] for item in lineage}
    known = {entity: {r["id"] for r in rows} for entity, rows in datasets.items()}
    for entity, rows in datasets.items():
        for row in rows:
            index = row_locations[(entity, row["id"])]
            for field, target in REFERENCES.items():
                # Referenced values passed the identifier pattern in validate_row. A target file
                # that is missing or unreadable is already reported once; checking references
                # against it would only repeat that problem for every row that points to it.
                if field in row and target in known and row[field] not in known[target]:
                    value = row[field]
                    issue(
                        f"{entity}.csv",
                        index,
                        "BROKEN_REFERENCE",
                        f"Row {index} references {SINGULAR[field]} {value}, but {value} "
                        f"does not exist in {target}.csv.",
                        fix=f"Add {value} to {target}.csv or correct the reference.",
                        column=field,
                    )
            for entry in row.get("entries", []):
                if "accounts" in known and entry["account_id"] not in known["accounts"]:
                    value = entry["account_id"]
                    issue(
                        "transactions.csv",
                        index,
                        "BROKEN_REFERENCE",
                        f"Row {index} posts to account {value}, but {value} does not exist "
                        "in accounts.csv.",
                        fix=f"Add {value} to accounts.csv or correct the journal line.",
                        column="entries",
                    )
            for field, expected in (
                ("receivable_account_id", "accounts_receivable"),
                ("payable_account_id", "accounts_payable"),
            ):
                account = next(
                    (a for a in datasets.get("accounts", []) if a["id"] == row.get(field)), None
                )
                if account and account["account_type"] != expected:
                    issue(
                        f"{entity}.csv",
                        index,
                        "ACCOUNT_ROLE",
                        f"Row {index} uses account {account['id']} as its "
                        f"{field.removesuffix('_id').replace('_', ' ')}, but that account's type "
                        f"isn't {expected}.",
                        fix=f"Use an account whose account_type is {expected}.",
                        column=field,
                    )
    source = None
    if config and REQUIRED <= set(names) and not any(i["severity"] == "BLOCKER" for i in issues):
        try:
            balances = ledger(datasets)
            if sum(balances.values()) != 0:
                raise ValueError("Trial balance must balance.")
        except (ValueError, KeyError, ArithmeticError):
            issue(
                "transactions.csv",
                None,
                "ACCOUNTING_EVIDENCE",
                "Opening balances and journals don't balance to zero; MoveBooks never balances "
                "books automatically.",
                fix="Correct opening_balance values in accounts.csv or the journals in "
                "transactions.csv so that the books balance.",
            )
        source = {
            "fixture_version": VERSION,
            "sample_company_id": "user-upload",
            "synthetic": False,
            "company": config["company"],
            "configuration_profile": config["settings"],
            "datasets": {
                **datasets,
                "configuration": config["configuration"],
                "taxes": config["taxes"],
            },
            "source_lineage": lineage,
        }
    blocked = any(i["severity"] == "BLOCKER" for i in issues)
    status = "BLOCKED" if blocked else "NEEDS ATTENTION" if issues else "READY"
    return {
        "version": VERSION,
        "status": status,
        "files": detected,
        "issues": issues,
        "activity": [
            "Package received",
            "Files validated",
            "Schema checks completed",
            "Integrity checks completed",
            "Blocker detected" if blocked else "Ready for human review",
        ],
    }, None if blocked else source


def amount(value, column):
    try:
        return money(value)
    except (ValueError, ArithmeticError) as error:
        raise Finding(
            "INVALID_NUMBER",
            f"{column} must be a decimal amount such as 1250.00, with at most two decimal places.",
            f"Correct the {column} value.",
            column=column,
        ) from error


def validate_row(entity, row):
    for column in SCHEMAS[entity]:
        if not row.get(column):
            raise Finding(
                "MISSING_VALUE",
                f"{column} is required but empty.",
                f"Add a {column} value.",
                column=column,
            )
    for key, value in row.items():
        if key == "id" or key.endswith("_id"):
            if not ID.fullmatch(value):
                raise Finding(
                    "INVALID_IDENTIFIER",
                    f"{key} must use letters, digits, hyphens or underscores "
                    "(up to 64 characters).",
                    f"Correct the {key} value.",
                    column=key,
                )
        elif key not in {"entries"} and len(value) > MAX_TEXT:
            raise Finding(
                "TEXT_TOO_LONG",
                f"{key} is longer than {MAX_TEXT} characters.",
                f"Shorten {key} to {MAX_TEXT} characters or fewer.",
                column=key,
            )
    if entity == "accounts":
        if row["account_type"] not in ACCOUNT_TYPES:
            raise Finding(
                "INVALID_TYPE",
                "account_type must be one of: " + ", ".join(sorted(ACCOUNT_TYPES)) + ".",
                "Use one of the listed account types.",
                column="account_type",
            )
        amount(row["opening_balance"], "opening_balance")
    if entity == "products" and row["item_type"] not in {"service", "inventory", "non_inventory"}:
        raise Finding(
            "INVALID_TYPE",
            "item_type must be one of: inventory, non_inventory, service.",
            "Use one of the listed item types.",
            column="item_type",
        )
    if entity in {"invoices", "bills"}:
        total = amount(row["total"], "total")
        paid = amount(row.get("paid", "0"), "paid")
        if not 0 <= paid <= total:
            raise Finding(
                "INVALID_VALUE",
                "paid must be between 0 and the document total.",
                "Correct paid or total.",
                column="paid",
            )
    if entity == "transactions":
        try:
            date.fromisoformat(row["transaction_date"])
        except ValueError as error:
            raise Finding(
                "INVALID_DATE",
                "transaction_date must be a date in YYYY-MM-DD format.",
                "Correct the date, for example 2026-01-31.",
                column="transaction_date",
            ) from error
        try:
            entries = strict_json(row["entries"])
        except (ValueError, RecursionError) as error:
            raise Finding(
                "INVALID_TYPE",
                "entries must be a JSON list of journal lines.",
                f"Write entries {SAMPLE}.",
                column="entries",
            ) from error
        if hidden_path(entries):
            raise Finding(
                "HIDDEN_CHARACTERS",
                HIDDEN_MESSAGE,
                "Remove hidden or escaped control characters from the entries value.",
                column="entries",
            )
        if not isinstance(entries, list) or not 2 <= len(entries) <= 100:
            raise Finding(
                "INVALID_VALUE",
                "entries must be a list of 2 to 100 journal lines.",
                "Give each journal between 2 and 100 lines.",
                column="entries",
            )
        debit = credit = Decimal(0)
        for entry in entries:
            if not isinstance(entry, dict) or set(entry) != {"account_id", "debit", "credit"}:
                raise Finding(
                    "INVALID_TYPE",
                    "Each journal line needs exactly account_id, debit and credit.",
                    f"Write each journal line {SAMPLE}.",
                    column="entries",
                )
            if not isinstance(entry["account_id"], str) or not ID.fullmatch(entry["account_id"]):
                raise Finding(
                    "INVALID_IDENTIFIER",
                    "Each journal line's account_id must be a valid identifier.",
                    "Correct the account_id in the journal line.",
                    column="entries",
                )
            if not isinstance(entry["debit"], str) or not isinstance(entry["credit"], str):
                raise Finding(
                    "INVALID_TYPE",
                    'Journal debit and credit must be decimal text, such as "125.00".',
                    "Put each debit and credit amount in quotes.",
                    column="entries",
                )
            d, c = amount(entry["debit"], "entries"), amount(entry["credit"], "entries")
            if min(d, c) < 0 or (d > 0) == (c > 0):
                raise Finding(
                    "INVALID_VALUE",
                    "Each journal line needs either a debit or a credit, not both or neither.",
                    "Set one side of each line to 0.00.",
                    column="entries",
                )
            debit += d
            credit += c
        if debit != credit:
            raise Finding(
                "UNBALANCED_JOURNAL",
                "This journal's debits and credits don't balance.",
                "Make total debits equal total credits.",
                column="entries",
            )
        row["entries"] = entries


def keys(value, required, path, label):
    """Exact key set for a configuration object, reported by key path."""
    if not isinstance(value, dict):
        raise Finding(
            "INVALID_TYPE",
            f"{label} must be a JSON object.",
            f"Write {label} {SAMPLE}.",
            key=path or None,
        )
    prefix = f"{path}." if path else ""
    for key in required:
        if key not in value:
            raise Finding(
                "MISSING_KEY",
                f"Missing required key: {prefix}{key}.",
                f"Add {prefix}{key} {SAMPLE}.",
                key=f"{prefix}{key}",
            )
    for key in value:
        if key not in required:
            shown = f"{prefix}{key}" if isinstance(key, str) and HEADER.fullmatch(key) else None
            raise Finding(
                "UNSUPPORTED_KEY",
                f"Unsupported key{': ' + shown if shown else ''}. Configuration can't set "
                "workflow, approval or other product state.",
                f"Remove {shown or 'the key'}.",
                key=shown,
            )


def validate_config(value):
    from tools.configuration.controls import AREAS, validate_value

    keys(value, ("company", "settings", "taxes"), "", "configuration.json")
    company, settings, taxes = value["company"], value["settings"], value["taxes"]
    keys(
        company,
        ("id", "legal_name", "display_name", "base_currency", "fiscal_year_start_month"),
        "company",
        "company",
    )
    if not isinstance(company["id"], str) or not ID.fullmatch(company["id"]):
        raise Finding(
            "INVALID_IDENTIFIER",
            "company.id must use letters, digits, hyphens or underscores.",
            "Correct company.id.",
            key="company.id",
        )
    for key in ("legal_name", "display_name"):
        if not isinstance(company[key], str) or not 1 <= len(company[key]) <= MAX_TEXT:
            raise Finding(
                "INVALID_VALUE",
                f"company.{key} must be text of 1 to {MAX_TEXT} characters.",
                f"Correct company.{key}.",
                key=f"company.{key}",
            )
    month = company["fiscal_year_start_month"]
    if type(month) is not int or not 1 <= month <= 12:
        raise Finding(
            "INVALID_TYPE",
            "company.fiscal_year_start_month must be a whole number from 1 to 12.",
            "Use a number such as 1 for January, without quotes.",
            key="company.fiscal_year_start_month",
        )
    keys(settings, tuple(AREAS), "settings", "settings")
    for key, item in settings.items():
        if not isinstance(item, str) or not validate_value(key, item, item):
            raise Finding(
                "INVALID_VALUE",
                f"settings.{key} must be one of: " + ", ".join(AREAS[key][1]) + ".",
                f"Use one of the listed values for settings.{key}.",
                key=f"settings.{key}",
            )
    if company["base_currency"] != settings["base_currency"]:
        raise Finding(
            "INVALID_VALUE",
            "company.base_currency must match settings.base_currency.",
            "Use the same currency in both places.",
            key="company.base_currency",
        )
    if str(month) != settings["fiscal_year"]:
        raise Finding(
            "INVALID_VALUE",
            "company.fiscal_year_start_month must match settings.fiscal_year.",
            "Use the same month in both places.",
            key="company.fiscal_year_start_month",
        )
    if not isinstance(taxes, list) or len(taxes) > 20:
        raise Finding(
            "INVALID_TYPE",
            "taxes must be a list of up to 20 tax entries.",
            f"Write taxes {SAMPLE}.",
            key="taxes",
        )
    ids = set()
    for position, tax in enumerate(taxes):
        path = f"taxes[{position}]"
        keys(tax, ("id", "code", "rate", "jurisdiction"), path, path)
        for key, item in tax.items():
            if not isinstance(item, str) or not 1 <= len(item) <= 64:
                raise Finding(
                    "INVALID_VALUE",
                    f"{path}.{key} must be text of 1 to 64 characters.",
                    f"Correct {path}.{key}.",
                    key=f"{path}.{key}",
                )
        if not ID.fullmatch(tax["id"]):
            raise Finding(
                "INVALID_IDENTIFIER",
                f"{path}.id must use letters, digits, hyphens or underscores.",
                f"Correct {path}.id.",
                key=f"{path}.id",
            )
        if tax["id"] in ids:
            raise Finding(
                "DUPLICATE_ID",
                f"Tax identifier {tax['id']} appears more than once.",
                "Give each tax its own id.",
                key=f"{path}.id",
            )
        try:
            rate = Decimal(tax["rate"])
            valid = rate.is_finite() and 0 <= rate <= 1
        except InvalidOperation:
            valid = False
        if not valid:
            raise Finding(
                "INVALID_NUMBER",
                f"{path}.rate must be a decimal between 0 and 1, such as 0.0725.",
                f"Correct {path}.rate.",
                key=f"{path}.rate",
            )
        ids.add(tax["id"])
    if (
        not (settings["tax_setup"] == "NONE" and not taxes)
        and sum(t["code"] == settings["tax_setup"] for t in taxes) != 1
    ):
        raise Finding(
            "INVALID_VALUE",
            "settings.tax_setup must match exactly one tax code, or be NONE with no taxes.",
            "Make settings.tax_setup match one entry's code in taxes.",
            key="settings.tax_setup",
        )
    return {
        **value,
        "configuration": [
            {
                "id": "configuration-currency",
                "key": "base_currency",
                "value": settings["base_currency"],
            },
            {
                "id": "configuration-calendar",
                "key": "fiscal_calendar",
                "value": "calendar_year" if settings["fiscal_year"] == "1" else "custom_year",
            },
        ],
    }
