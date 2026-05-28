# 🧠 Decisions & Ambiguities Resolved

Here are the key ambiguities resolved and architectural choices made during the implementation:

---

### 1. Ingestion Mechanism (Dynamic Heuristic Parser)
* **Choice:** File Upload (CSV/TSV/PSV) backed by a custom Dynamic Heuristic Parser.
* **Why:** While APIs exist for platforms like Concur and SAP OData, in enterprise environments analysts frequently receive messy data dumps via email from different departments. Instead of hardcoding strict parsers for perfect files, I built an engine that dynamically auto-detects delimiters (commas, semicolons, tabs, pipes), fuzzily searches for header rows to skip garbage metadata, and uses an alias dictionary to map columns. This makes the ingestion extremely robust to real-world edge cases.

### 2. Original Data Retention (JSONField)
* **Choice:** Store the entire raw ingested row in a `JSONField` (`original_data`).
* **Why:** Data mapping is never perfect on the first try. If an analyst spots an anomaly in the dashboard, they need to see exactly what the client provided. Furthermore, auditors require a clear lineage from the raw system export to the final emissions number. Dropping the raw data breaks the audit chain.

### 3. Date Handling for Utility Bills
* **Choice:** Use `period_start` and `period_end` rather than a single timestamp.
* **Why:** Utility bills rarely align with calendar months (e.g., a bill might cover Jan 15 to Feb 14). Storing the range allows for future prorating logic when calculating monthly or quarterly emissions totals.

### 4. Stack Selection
* **Choice:** Django REST Framework + React (Vite) + TailwindCSS.
* **Why:** Django provides a robust ORM and admin interface out of the box, perfect for rapidly building complex data models and audit trails. React with Tailwind ensures a premium, modern, and highly responsive user experience for the analyst dashboard, prioritizing analyst UX as requested.

---

## ❓ Questions for the Product Manager

If I had the opportunity, I would ask the PM these clarifying questions:

1. **Error Handling on Ingest:** 
   > If a file contains 10,000 rows and 5 are malformed, should we reject the entire file or ingest 9,995 and flag the 5? 
   *I chose to ingest everything and default malformed numeric rows to `0.0` with a `PENDING` status for review, but strict transaction rollback rejection might be preferred.*

2. **Emission Factors:** 
   > Should the system handle emission factor mapping (e.g., applying EPA kgCO2e conversion rates) immediately upon ingestion, or is that a separate downstream process after analyst approval?
   *I assumed it is a downstream process to keep ingestion fast and decoupled.*
