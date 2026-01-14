# OpCore API Style Guide

## 1. Naming Conventions

### 1.1 URL Structure
- **Resources**: Use plural nouns (e.g., `/api/invoices`, `/api/tenants`).
- **Hierarchy**: Use nesting for dependent resources (e.g., `/api/tenants/:id/transactions`).
- **Separators**: Use hyphens (`-`) for URL segments (e.g., `/api/compliance-requests`), but underscores (`_`) for query parameters if mapping directly to DB columns.

### 1.2 JSON Response Format
All responses must follow a strict envelope structure:

**Success:**
```json
{
  "status": "success",
  "data": { ... } // Or direct object/array if listing
}
```

**Error:**
```json
{
  "status": "error",
  "error": "Short readable message",
  "code": "ERROR_CODE_UPPERCASE" // Optional, for client logic
}
```

### 1.3 Database Columns
- **Format**: `snake_case` (e.g., `business_name`, `turnover_band`).
- **Boolean**: Prefix with `is_` or `has_` (e.g., `is_tax_exempt`, `has_vat_evidence`).

## 2. Error Handling
- **400 Bad Request**: Validation failures (missing fields, invalid types).
- **401 Unauthorized**: Authentication failure (invalid password/token).
- **403 Forbidden**: Authorization failure (valid user, insufficient permission).
- **404 Not Found**: Resource doesn't exist.
- **500 Internal Server Error**: Uncaught exceptions (DB connection lost).

## 3. WatermelonDB Sync Protocol
- **Push**: `POST /api/sync/push`
    - Must handle `created`, `updated`, `deleted` lists (per WatermelonDB spec).
    - Returns `{ status: 'success' }` only after DB transaction commits.
- **Pull**: `GET /api/sync/pull`
    - Input: `last_pulled_at` (Timestamp or Integer).
    - Output: `{ changes: { ... }, timestamp: <new_server_time> }`.

## 4. Security
- **Rate Limiting**: Applied globally via `express-rate-limit`.
- **Input Validation**: Use minimal validation on simple endpoints, but strict type checking on Tax Logic inputs.
- **CORS**: Restricted to `localhost:3000` (Dev) and Production Domains.
