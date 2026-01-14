# Backend Migration Plan for OpCore

## Phase 1: Preparation & Validation
1.  **Dependency Audit**: Ensure `multer` (for uploads) and `express-rate-limit` (security) are installed.
2.  **Schema Alignment**: Verify `server/schema.sql` matches WatermelonDB `schema.ts`.
    *   *Action*: Confirmed matching fields, specifically NTA 2025 additions (`is_professional_service`, `turnover_band` logic).

## Phase 2: Core Server Implementation
1.  **Refactor `index.js`**:
    *   Remove duplicate route definitions (MVP stubs were overriding real logic).
    *   Implement `express-rate-limit` middleware on all `/api/` routes.
    *   Ensure `cors` is configured for `localhost:3000`.
    *   Serve static files from `public/uploads` correctly.

2.  **Database Hardening**:
    *   Apply `server/schema.sql` to the PostgreSQL instance.
    *   Verify the "Triple Constraint" trigger (`turnover_watch`) is active.

## Phase 3: Documentation & Handoff
1.  **API Style Guide**: Establish standards for JSON responses and Error handling.
2.  **Deployment Guide**: `README_BACKEND.md` for deploying to a VPS/Supabase.
3.  **Agent Logic**: `EDGE_FUNCTIONS.ts` to document the Tax Engine logic in a format accessible to future AI agents.

## Phase 4: Sync Testing (Post-Handoff)
*   **Pull Sync**: Verify `GET /api/sync/transactions?lastSync=...` returns only new/modified records.
*   **Push Sync**: Verify `POST /api/sync/transactions` correctly inserts/updates and handles the `on conflict` clause.
