"""Bounded, deterministic package adapter. Never extracts archives to disk."""

import csv
import hashlib
import io
import json
import re
import stat
import zipfile
import zlib
from datetime import date
from decimal import Decimal

from tools.validation.checks import ledger, money

VERSION = "controlled-package-v1"
MAX_FILE = 256 * 1024
MAX_TOTAL = 2 * 1024 * 1024
MAX_ROWS = 1000
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
                if len(entries) > 9 or sum(e.file_size for e in entries) > MAX_TOTAL:
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


def validate_package(files):
    """Return a safe report and private normalized source; no persistence or agent calls."""
    issues, detected, lineage = [], [], []

    def issue(file, row, code, message, warning=False):
        issues.append(
            {
                "file": file if file in NAMES else "unsupported file",
                "row": row,
                "code": code,
                "severity": "WARNING" if warning else "BLOCKER",
                "message": message,
                "why": "Accounting meaning and evidence must be preserved.",
                "action": "Review and replace the named file, then validate again."
                if file in NAMES
                else "Remove unsupported content and validate again.",
                "can_continue": warning,
            }
        )

    try:
        files = unpack(files)
    except (ValueError, OSError, EOFError) as error:
        issue("package", None, "UNSAFE_ARCHIVE", str(error))
        files = []
    if not 1 <= len(files) <= 9 or sum(len(data) for _, data in files) > MAX_TOTAL:
        issue(
            "package",
            None,
            "PACKAGE_LIMIT",
            "Use 8 required files, optional metadata, up to 2 MiB.",
        )
        files = []
    names = [name for name, _ in files]
    for missing in sorted(REQUIRED - set(names)):
        issue(missing, None, "MISSING_FILE", "Required package file is missing.")
    datasets, config = {}, None
    for name, data in files:
        if name not in NAMES:
            issue(
                name, None, "UNSUPPORTED_FILE", "Only the documented exact filenames are supported."
            )
            continue
        row_count = 0
        ignored = []
        before = len(issues)
        if names.count(name) > 1:
            issue(name, None, "DUPLICATE_FILENAME", "Each filename must occur exactly once.")
            continue
        try:
            if len(data) > MAX_FILE:
                raise ValueError("File exceeds 256 KiB.")
            text = data.decode("utf-8-sig", errors="strict")
            if any(ord(c) < 32 and c not in "\r\n\t" for c in text):
                raise ValueError("Binary/control content is not supported.")
            if name.endswith(".json"):
                value = strict_json(text)
                if name == "metadata.json":
                    if not isinstance(value, dict) or set(value) - {
                        "package_version",
                        "description",
                    }:
                        raise ValueError("Metadata permits package_version and description only.")
                    if value.get("package_version", VERSION) != VERSION:
                        raise ValueError("Unsupported package version.")
                    if any(not isinstance(v, str) or len(v) > 500 for v in value.values()):
                        raise ValueError("Metadata values must be bounded text.")
                    ignored = sorted(value)
                    issue(
                        name,
                        None,
                        "METADATA_ONLY",
                        "Metadata is evidence only, not workflow authority.",
                        True,
                    )
                else:
                    config = validate_config(value)
                row_count = 1
            else:
                entity = name[:-4]
                reader = csv.reader(io.StringIO(text, newline=""), strict=True)
                header = next(reader)
                if len(header) > 32 or len(set(header)) != len(header):
                    raise ValueError("Duplicate or excessive columns.")
                if set(SCHEMAS[entity]) - set(header):
                    raise ValueError("Missing required columns. Use the versioned template.")
                if any(not re.fullmatch(r"[a-z][a-z0-9_]{0,63}", h) for h in header):
                    raise ValueError("Column names must be lowercase schema identifiers.")
                ignored = sorted(set(header) - set(SCHEMAS[entity]) - OPTIONAL[entity])
                if ignored:
                    issue(
                        name,
                        1,
                        "IGNORED_FIELDS",
                        "Unsupported columns will not migrate: "
                        + ", ".join(ignored)
                        + ". Explicit review is required.",
                        True,
                    )
                rows, ids = [], set()
                for index, cells in enumerate(reader, 2):
                    row_count += 1
                    if row_count > MAX_ROWS:
                        raise ValueError("File exceeds 1,000 records.")
                    if len(cells) != len(header) or any(len(c) > 8192 for c in cells):
                        issue(
                            name, index, "MALFORMED_ROW", "Row width or field size violates schema."
                        )
                        continue
                    raw = dict(zip(header, cells, strict=True))
                    row = {k: v for k, v in raw.items() if k not in ignored and v != ""}
                    try:
                        validate_row(entity, row)
                        if row["id"] in ids:
                            raise ValueError("Duplicate identifier.")
                        ids.add(row["id"])
                        rows.append(row)
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
                    except (ValueError, TypeError, KeyError, ArithmeticError):
                        issue(
                            name,
                            index,
                            "INVALID_RECORD",
                            "Missing/duplicate identifier, invalid "
                            "type, amount, date, enum or unbalanced journal. Consult the schema.",
                        )
                datasets[entity] = rows
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
                "Invalid UTF-8, CSV/JSON structure, required columns, "
                "configuration schema, or size. Use the documented template.",
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
    for entity, rows in datasets.items():
        for row in rows:
            index = row_locations[(entity, row["id"])]
            references = {
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
            for field, target in references.items():
                if field in row and row[field] not in {r["id"] for r in datasets.get(target, [])}:
                    issue(
                        f"{entity}.csv",
                        index,
                        "BROKEN_REFERENCE",
                        f"{field} must resolve in {target}.csv.",
                    )
            for entry in row.get("entries", []):
                if entry["account_id"] not in {r["id"] for r in datasets.get("accounts", [])}:
                    issue(
                        "transactions.csv",
                        index,
                        "BROKEN_REFERENCE",
                        "Journal account must exist in accounts.csv.",
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
                        "Document control account "
                        "has an incompatible accounting type. Correct source evidence.",
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
                "Supply valid balanced opening "
                "balances, accounts and balanced journals; no automatic balancing is performed.",
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


def validate_row(entity, row):
    if any(not row.get(k) for k in SCHEMAS[entity]):
        raise ValueError("Missing field")
    for key, value in row.items():
        if key == "id" or key.endswith("_id"):
            if not ID.fullmatch(value):
                raise ValueError("Invalid identifier")
        elif key not in {"entries"} and len(value) > 200:
            raise ValueError("Text limit")
    if entity == "accounts":
        if row["account_type"] not in ACCOUNT_TYPES:
            raise ValueError("Account type")
        money(row["opening_balance"])
    if entity == "products" and row["item_type"] not in {"service", "inventory", "non_inventory"}:
        raise ValueError("Item type")
    if entity in {"invoices", "bills"}:
        if not 0 <= money(row.get("paid", "0")) <= money(row["total"]):
            raise ValueError("Total/payment")
    if entity == "transactions":
        date.fromisoformat(row["transaction_date"])
        entries = strict_json(row["entries"])
        if not isinstance(entries, list) or not 2 <= len(entries) <= 100:
            raise ValueError("Journal size")
        debit = credit = Decimal(0)
        for entry in entries:
            if not isinstance(entry, dict) or set(entry) != {"account_id", "debit", "credit"}:
                raise ValueError("Entry schema")
            if not isinstance(entry["account_id"], str) or not ID.fullmatch(entry["account_id"]):
                raise ValueError("Entry reference")
            if not isinstance(entry["debit"], str) or not isinstance(entry["credit"], str):
                raise ValueError("Journal money requires decimal text")
            d, c = money(entry["debit"]), money(entry["credit"])
            if min(d, c) < 0 or (d > 0) == (c > 0):
                raise ValueError("Entry sides")
            debit += d
            credit += c
        if debit != credit:
            raise ValueError("Unbalanced journal")
        row["entries"] = entries


def validate_config(value):
    from tools.configuration.controls import AREAS, validate_value

    if not isinstance(value, dict) or set(value) != {"company", "settings", "taxes"}:
        raise ValueError("Configuration shape")
    company, settings, taxes = value["company"], value["settings"], value["taxes"]
    if not isinstance(company, dict) or set(company) != {
        "id",
        "legal_name",
        "display_name",
        "base_currency",
        "fiscal_year_start_month",
    }:
        raise ValueError("Company schema")
    if (
        not isinstance(company["id"], str)
        or not ID.fullmatch(company["id"])
        or any(
            not isinstance(company[k], str) or not 1 <= len(company[k]) <= 200
            for k in ("legal_name", "display_name")
        )
        or type(company["fiscal_year_start_month"]) is not int
        or not 1 <= company["fiscal_year_start_month"] <= 12
    ):
        raise ValueError("Company types")
    if not isinstance(settings, dict) or set(settings) != set(AREAS):
        raise ValueError("Settings schema")
    if any(not isinstance(v, str) or not validate_value(k, v, v) for k, v in settings.items()):
        raise ValueError("Unsupported settings")
    if (
        company["base_currency"] != settings["base_currency"]
        or str(company["fiscal_year_start_month"]) != settings["fiscal_year"]
    ):
        raise ValueError("Inconsistent configuration")
    if not isinstance(taxes, list) or len(taxes) > 20:
        raise ValueError("Tax limit")
    ids = set()
    for tax in taxes:
        if not isinstance(tax, dict) or set(tax) != {"id", "code", "rate", "jurisdiction"}:
            raise ValueError("Tax schema")
        if (
            any(not isinstance(v, str) or not 1 <= len(v) <= 64 for v in tax.values())
            or not ID.fullmatch(tax["id"])
            or tax["id"] in ids
            or not Decimal(tax["rate"]).is_finite()
            or not 0 <= Decimal(tax["rate"]) <= 1
        ):
            raise ValueError("Tax value")
        ids.add(tax["id"])
    if (
        not (settings["tax_setup"] == "NONE" and not taxes)
        and sum(t["code"] == settings["tax_setup"] for t in taxes) != 1
    ):
        raise ValueError("Tax configuration reference")
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
