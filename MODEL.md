# Data Model

The data model is built in Django (`backend/api/models.py`) and is designed to handle multi-tenancy, multiple diverse sources, normalization, and auditing.

## Core Entities

### 1. `Company` (Multi-Tenancy)
Represents a client company. All data is scoped to a specific company using a `company_id` foreign key.

### 2. `DataSource` (Source Tracking)
Represents a specific integration or upload stream for a company (e.g., "SAP ERP US Region").
- Stores the `source_type` (SAP, UTILITY, CONCUR).
- Allows us to group records by where they came from.

### 3. `ESGRecord` (The Core Model)
This model acts as the unified, normalized data store. It handles data from any source by mapping it into a common schema.

Key Fields:
- **`company` & `source`**: The owner and origin of the record.
- **`original_data` (JSONField)**: We store the *exact* raw row that was ingested. This is critical for auditability—if the normalization logic changes, we can always refer back to the original source data without re-ingesting.
- **`scope` & `category`**: Categorizes the emission source (Scope 1, 2, 3) and the specific activity (e.g., "Purchased Electricity").
- **`normalized_value` & `normalized_unit`**: The core activity metric mapped to standard types (e.g., converting all electricity inputs to `kWh`).
- **`period_start` & `period_end`**: Essential for Utility bills which don't align with calendar months. SAP data usually has a single `period_start` (posting date).
- **`status`**: The workflow state (`PENDING`, `APPROVED`, `FLAGGED`).

### 4. `AuditLog` (Audit Trail)
Tracks every state change to an `ESGRecord`.
- Captures the user, timestamp, action performed, and a diff (`previous_state` / `new_state`).
- Essential for the final auditor sign-off.
