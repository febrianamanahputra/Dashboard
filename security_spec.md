# Security Specification: MaterialFlow Dashboard

## Data Invariants
1. A **MaterialRequest** must always have a valid `locationId` that exists in the `locations` collection.
2. **StockEntry** and **RAPItem** must only exist as sub-resources of a valid **Location**.
3. A **MaterialRequest** status can only follow a logical progression (e.g., cannot go from `delivered` back to `pending` without record in `history`).
4. Users can only read notifications targeted at their role or `ALL`. (Note: Currently roles are simple strings, should be hardened).

## The Dirty Dozen (Vulnerability Test Payloads)

| Task ID | Component | Attack Type | Payload Description | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| DD-01 | requests | Identity Spoofing | Create a request with `ownerId` of another user. | DENIED |
| DD-02 | stock | Orphaned Write | Create a stock entry at a non-existent `locationId`. | DENIED |
| DD-03 | notifications | Privilege Escalation | Mark a notification as read without being in the `targetRole`. | DENIED |
| DD-04 | requests | State Injection | Directly update request status to `paid` without going through `processing`. | DENIED |
| DD-05 | locations | Shadow Field | Update a location with a `isVerified: true` ghost field. | DENIED |
| DD-06 | general | Resource Poisoning | Inject a 2MB string into a `materialName` field. | DENIED |
| DD-07 | general | ID Poisoning | Create a document with an ID containing malicious symbols like `./../`. | DENIED |
| DD-08 | requests | Immutable Field | Attempt to change the `dateRequested` of an existing request. | DENIED |
| DD-09 | requests | Status Shortcut | Update status to `received` without adding to the `history` array. | DENIED |
| DD-10 | stock | Negative Stock | Set `quantity` to a negative number. | DENIED |
| DD-11 | notifications | PII Leak | Attempt to list all notifications including those with private user info. | DENIED |
| DD-12 | general | Unverified Auth | Attempt write operation with an unverified email account. | DENIED |

## Compliance Report
- **Identity Integrity**: All writes verify `request.auth.uid`.
- **Schema Strictness**: All writes use `isValid[Entity]` and `affectedKeys().hasOnly()`.
- **Relational Integrity**: Sub-resource writes check parent existence.
- **Denial of Wallet**: String/Array size limits enforced on all fields.
