const db = require('./db');

const schemaUpdate = `
-- =============================================
-- 8. SUBSCRIPTIONS HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    old_plan VARCHAR(20),
    new_plan VARCHAR(20),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO subscription_history (tenant_id, new_status, new_plan, change_reason)
        VALUES (NEW.tenant_id, NEW.status, NEW.plan_type, 'Initial Subscription');
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status OR OLD.plan_type IS DISTINCT FROM NEW.plan_type) THEN
            INSERT INTO subscription_history (tenant_id, old_status, new_status, old_plan, new_plan, change_reason)
            VALUES (NEW.tenant_id, OLD.status, NEW.status, OLD.plan_type, NEW.plan_type, 'Plan Update');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_sub_change ON subscriptions;
CREATE TRIGGER trigger_log_sub_change
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE PROCEDURE log_subscription_change();
`;

// Backfill Script
async function run() {
    try {
        console.log("Applying Schema Changes...");
        await db.query(schemaUpdate);
        console.log("Schema Updated.");

        console.log("Starting Backfill...");

        // Fetch all tenants
        const tenantsRes = await db.query('SELECT id, subscription_tier FROM tenants');
        const tenants = tenantsRes.rows;

        console.log(`Found ${tenants.length} tenants to process.`);

        for (const tenant of tenants) {
            // Check if subscription already exists
            const subRes = await db.query('SELECT id FROM subscriptions WHERE tenant_id = $1', [tenant.id]);

            if (subRes.rows.length === 0) {
                const plan = tenant.subscription_tier || 'free';
                let endDate = null;

                // If PRO, set 30 days validity from now
                if (plan === 'pro') {
                    endDate = new Date();
                    endDate.setDate(endDate.getDate() + 30);
                }

                await db.query(`
                    INSERT INTO subscriptions (tenant_id, plan_type, status, start_date, end_date)
                    VALUES ($1, $2, 'active', NOW(), $3)
                `, [tenant.id, plan, endDate]);

                console.log(`Backfilled Tenant ${tenant.id} as ${plan}`);
            } else {
                console.log(`Tenant ${tenant.id} already has a subscription.`);
            }
        }

        console.log("Backfill Complete.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

run();
