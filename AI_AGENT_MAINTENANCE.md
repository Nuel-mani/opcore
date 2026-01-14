# AI Agent Maintenance Guide (OpCore)

## Core Directive
**"Preserve the Tax Logic Integrity."**

This system calculates real tax liabilities for Nigerian businesses. A bug here is not just a display error; it's a financial liability.

## The Triple Constraint logic
Detailed in `server/schema.sql` (Trigger: `check_turnover_threshold`).
**Rule**: If a tenant meets ANY of these conditions, they become `turnover_band='large'` (or 'medium') and lose tax exemptions:
1.  **Turnover** > ₦100,000,000 (Sum of Invoices + Income Transactions)
2.  **Total Assets** > ₦250,000,000 (Sum of Capital Asset Transactions)
3.  **Sector** == 'Professional Services' (The "Trap" - Accountants/Lawyers have no Small Co exemption).

**BE CAREFUL WHEN:**
- Modifying `transactions` table structure.
- Changing `turnover_band` enum values.
- Creating mock data (Always set `is_professional_service=false` unless testing this specific trap).

## Database Schema vs. Frontend
- **Frontend**: WatermelonDB (`db/schema.ts`). Uses camelCase (mostly) but mapped manually to snake_case in `db/index.ts` models (if using decorators like `@field('snake_case_name')`).
- **Backend**: PostgreSQL (`server/schema.sql`). strictly `snake_case`.
- **Sync**: The `server/index.js` sync endpoints manually map these.
    - *Example*: Frontend `categoryId` -> Backend `category_id`.
    - **Crucial**: If you add a field to the Frontend, you MUST add it to:
        1.  `db/schema.ts` (Frontend)
        2.  `server/schema.sql` (Backend)
        3.  `server/index.js` (Sync mapping logic in BOTH GET and POST routes)

## Deployment Safety
- **Migrations**: Do not modify existing SQL migrations. Create new `ALTER TABLE` scripts for changes.
- **Backups**: Always assume production data exists.

## Future Upgrades
- **Sync**: Move from "Endpoint-per-resource" to true WatermelonDB JSON sync buffer if traffic scales.
- **Auth**: Currently custom JWT/Bcrypt. Supabase Auth integration is planned for V2.
