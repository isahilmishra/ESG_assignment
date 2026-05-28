# Tradeoffs

Three things deliberately NOT built, and why:

### 1. Automated Emission Calculation (kgCO2e)
**Why:** The assignment focused on data ingestion, normalization, and review. Building a robust calculation engine requires managing a database of emission factors (EPA, DEFRA) which change yearly and vary by region. For a 4-day prototype, faking a calculation would add complexity without demonstrating the core ingestion/workflow requirements. 

### 2. Complex Authentication and Role-Based Access Control (RBAC)
**Why:** While the model supports a `User` foreign key for the audit log, I did not build a full login screen or strict permissions system (e.g., "Uploader" vs. "Approver"). Time was better spent polishing the analyst dashboard UX and ensuring the data models were sound. The prototype assumes the user is an authenticated analyst.

### 3. Asynchronous File Processing (Celery/Redis)
**Why:** Currently, file parsing happens synchronously in the Django view. If a client uploads a 500MB SAP export, the HTTP request will time out. In a real deployment, I would offload `handle_ingestion` to a Celery worker. However, setting up a message broker adds significant infrastructure overhead for a prototype designed to demonstrate judgment and data modeling.
