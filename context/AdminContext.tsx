import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface AdminUser {
    id: string;
    business_name: string; // Changed to match DB column
    email: string;
    turnover_band: string; // Changed to match DB
    subscription_tier: 'free' | 'pro'; // Changed to match DB
    local_status: 'active' | 'flagged'; // Changed to match DB
    last_login: string;
}

export interface ComplianceRequest {
    id: string;
    user_id: string;
    user_name: string;
    request_type: 'rent_relief' | 'sme_status'; // Matches DB
    document_url: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface AdminContextType {
    users: AdminUser[];
    complianceQueue: ComplianceRequest[];
    taxConfig: { [key: string]: number };
    updateConfig: (key: string, value: number) => Promise<void>;
    approveRequest: (id: string, decision: 'approved' | 'rejected') => Promise<void>;
    auditLogs: any[];
    isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [complianceQueue, setQueue] = useState<ComplianceRequest[]>([]);
    const [taxConfig, setTaxConfig] = useState<{ [key: string]: number }>({});
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        const fetchAllData = async () => {
            const API_BASE = `http://${window.location.hostname}:3001`;
            console.log("Fetching Admin Data from:", API_BASE);

            try {
                // 1. Users
                const usersRes = await fetch(`${API_BASE}/api/admin/users`);
                const usersData = await usersRes.json();
                setUsers(usersData.users || []);

                // 2. Compliance
                const compRes = await fetch(`${API_BASE}/api/admin/compliance`);
                const compData = await compRes.json();
                setQueue(compData);

                // 3. Config
                const configRes = await fetch(`${API_BASE}/api/admin/config`);
                const configData = await configRes.json();
                setTaxConfig(configData);

            } catch (err) {
                console.error("Failed to load Admin Data", err);
                // @ts-ignore
                alert("Failed to connect to backend: " + err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const updateConfig = async (key: string, value: number) => {
        // Optimistic UI Update
        setTaxConfig(prev => ({ ...prev, [key]: value }));

        try {
            const API_BASE = `http://${window.location.hostname}:3001`;
            await fetch(`${API_BASE}/api/admin/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });

            setAuditLogs(prev => [{
                id: Date.now(),
                action: `UPDATED_${key.toUpperCase()}`,
                oldVal: '...',
                newVal: value,
                time: new Date().toLocaleTimeString()
            }, ...prev]);

        } catch (err) {
            console.error("Failed to save config", err);
            // Revert on failure would go here
        }
    };

    const approveRequest = async (id: string, decision: 'approved' | 'rejected') => {
        // Optimistic UI
        setQueue(prev => prev.map(q => q.id === id ? { ...q, status: decision } : q));

        try {
            const API_BASE = `http://${window.location.hostname}:3001`;
            await fetch(`${API_BASE}/api/admin/compliance/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: decision })
            });
        } catch (err) {
            console.error("Failed to decision request", err);
        }
    };

    return (
        <AdminContext.Provider value={{
            users,
            complianceQueue,
            taxConfig,
            updateConfig,
            approveRequest,
            auditLogs,
            isLoading
        }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) throw new Error("useAdmin must be used within AdminProvider");
    return context;
};
