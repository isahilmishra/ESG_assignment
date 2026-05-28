# Sources

### 1. SAP ERP (Fuel and Procurement)
**Research:** SAP data is notoriously complex. Standard exports can be IDocs (XML-based, highly nested), OData services (RESTful), or simple Flat File exports (CSV).
**Format Chosen:** Flat File (CSV) export via a standard SAP report.
**Why:** It is the most common format a sustainability manager can extract without needing SAP Basis admin privileges.
**Sample Data Details:** The sample data `sap_export.csv` mimics realistic messy SAP exports. It features German column headers (`Materialbezeichnung`, `Menge`, `Buchungsdatum`), inconsistent numeric formats with commas (`"45,000"`), and internal plant codes (`W001`, `W002`) that require a lookup table to translate into meaningful locations (e.g. "Berlin Logistics Hub"). It categorizes Scope 1 and Scope 2 based on the unit of measure.
**Failure Modes:** In a real deployment, a client might have a totally different localization setting, exporting dates in yet another format, or using custom Z-tables that break standard mapping. The ingestion script handles many date formats, but would need a robust dynamic mapping layer in production.

### 2. Utility Data (Electricity)
**Research:** Utility data arrives either via manual PDF bills, EDI 810 (electronic data interchange for invoices), or portal CSV exports (like from PG&E or ConEdison).
**Format Chosen:** Portal Export with Garbage Metadata.
**Why:** Parsing PDFs via OCR is brittle. EDI is complex. Most modern utilities allow downloading billing history, but they often attach unparseable metadata to the top of the file.
**Sample Data Details:** The sample `utility_bill.csv` uses **tabs** as delimiters instead of commas, includes completely unstructured metadata ("CONFIDENTIAL UTILITY BILL EXTRACT") at the top, and uses European number formatting. The dynamic parser successfully scans past the metadata, detects the tabs, and ingests the data.
**Failure Modes:** Real utility data often contains estimated readings vs. actual readings. If a bill is later corrected, our system would currently ingest the correction as a duplicate rather than an update to the original record.

### 3. Corporate Travel (Concur)
**Research:** Concur provides an API (Expense API / Itinerary API), but many companies just run standard reporting extracts. Travel data usually contains segments (Origin, Destination), distances, and service classes.
**Format Chosen:** Pipe-Separated Values (PSV) Report Export.
**Why:** Similar to SAP, an API integration requires OAuth credentials. A text export from Concur is universally accessible, but often uses weird delimiters to avoid clashing with commas inside addresses.
**Sample Data Details:** The sample `concur_travel.csv` uses **pipes (`|`)** as delimiters, includes metadata at the top, and reports distances in **Miles**. The parser dynamically detects the pipes, finds the headers, and automatically converts the "Miles" into normalized "km" for the dashboard.
**Failure Modes:** Often, flight data only provides airport codes (e.g., SFO to JFK) and omits the distance. A real deployment would need an airport lookup table and a Haversine formula calculator to compute the missing distances.
