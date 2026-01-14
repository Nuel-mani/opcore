// hooks/useAuth.ts
import { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { database } from '../db';
import { Q } from '@nozbe/watermelondb';

export const useAuth = () => {
    const { login, logout } = useTenant();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const performLogin = async (email: string, password?: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Check Local DB First (Offline Support)
            try {
                const existingUsers = await database.collections.get('tenants').query(
                    Q.where('email', email)
                ).fetch();

                if (existingUsers.length > 0) {
                    const user = existingUsers[0] as any; // Cast to access custom props
                    console.log("[AUTH] Found existing local user:", user);
                    login({
                        id: user.id,
                        businessName: user.businessName,
                        email: user.email,
                        subscriptionTier: user.subscriptionTier,
                        turnoverBand: user.turnoverBand,
                        accountType: user.accountType,
                        brandColor: user.brandColor,
                        themeColor: user.brandColor,
                        isOnboarded: true
                    });
                    return true;
                }
            } catch (e) {
                console.warn("[AUTH] Failed to query local DB:", e);
            }

            // 2. API Login (If not found locally or forced online)
            const API_BASE = `http://${window.location.hostname}:3001`; // Dynamic Host
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Login failed or User not found locally.');
            }

            const { data } = await res.json();
            login({
                id: data.id,
                businessName: data.businessName || data.business_name,
                email: data.email,
                subscriptionTier: data.subscription_tier,
                turnoverBand: data.turnover_band,
                accountType: data.account_type,
                brandColor: data.brandColor || data.brand_color, // FIXED: API sends camelCase
                themeColor: data.brandColor || data.brand_color,
                // Missing fields fixed:
                businessAddress: data.businessAddress || data.business_address,
                phoneNumber: data.phoneNumber || data.phone_number,
                taxIdentityNumber: data.taxIdentityNumber || data.tax_identity_number,
                logoUrl: data.logoUrl || data.logo_url
            });

            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const performRegister = async (data: any) => {
        setLoading(true);
        setError(null);
        try {
            const API_BASE = `http://${window.location.hostname}:3001`;
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Registration failed');
            }

            const { data: userData } = await res.json();

            // Auto Login
            login({
                id: userData.id,
                businessName: userData.businessName || userData.business_name,
                email: userData.email,
                subscriptionTier: userData.subscription_tier,
                turnoverBand: userData.turnover_band,
                accountType: userData.account_type,
                brandColor: userData.brand_color,
                themeColor: userData.brand_color, // Sync theme
                sector: userData.sector,
                taxIdentityNumber: userData.tax_identity_number,
                residenceState: userData.residence_state,
                paysRent: userData.pays_rent,
                rentAmount: userData.rent_amount ? parseFloat(userData.rent_amount) : 0,
                annualIncome: userData.annual_income ? parseFloat(userData.annual_income) : 0,
                businessStructure: userData.business_structure,
                // Missing fields fixed:
                businessAddress: userData.businessAddress || userData.business_address,
                phoneNumber: userData.phoneNumber || userData.phone_number,
                logoUrl: userData.logoUrl || userData.logo_url
            });

            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { login: performLogin, register: performRegister, logout, loading, error };
};
