import { database } from '../db';

export const nuclearReset = async () => {
    console.warn("⚠️ INITIATING NUCLEAR RESET ⚠️");

    // 1. Wipe Local Storage
    localStorage.clear();
    console.log("✅ Local Storage Wiped");

    // 2. Destroy Database
    try {
        await database.unsafeResetDatabase();
        console.log("✅ Database Destroyed & Recreated");
    } catch (e) {
        console.error("❌ Database Reset Failed:", e);
    }

    // 3. Reload Page
    console.log("🔄 Reloading App...");
    window.location.reload();
};

// Expose to window for manual trigger if needed
// @ts-ignore
window.resetApp = nuclearReset;
