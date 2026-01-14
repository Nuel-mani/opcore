import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Users, FileCheck, Settings, Activity, LogOut } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

// Placeholder Pages
const UsersPage = () => <div className="p-8"><h2 className="text-2xl font-bold mb-4">User Management</h2><UsersTable /></div>;
const CompliancePage = () => <div className="p-8"><h2 className="text-2xl font-bold mb-4">Compliance Queue</h2><ComplianceList /></div>;
const ConfigPage = () => <div className="p-8"><h2 className="text-2xl font-bold mb-4">Tax Configuration</h2><ConfigForm /></div>;
const AuditPage = () => <div className="p-8"><h2 className="text-2xl font-bold mb-4">System Audit Logs</h2><div className="bg-white p-6 rounded-xl shadow">No recent audit activity.</div></div>;

// Sub-Components
const UsersTable = () => {
    const { users } = useAdmin();
    return (
        <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 font-semibold text-gray-600">Business Name</th>
                        <th className="p-4 font-semibold text-gray-600">Turnover</th>
                        <th className="p-4 font-semibold text-gray-600">Tier</th>
                        <th className="p-4 font-semibold text-gray-600">Status</th>
                        <th className="p-4 font-semibold text-gray-600">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                                <div className="font-bold">{user.business_name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                            </td>
                            <td className="p-4">{user.turnover_band}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${user.subscription_tier === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{user.subscription_tier.toUpperCase()}</span></td>
                            <td className="p-4">
                                {user.local_status === 'flagged' ? (
                                    <span className="text-red-600 font-bold flex items-center gap-1"><Activity size={14} /> Flagged</span>
                                ) : <span className="text-green-600">Active</span>}
                            </td>
                            <td className="p-4">
                                <button className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ComplianceList = () => {
    const { complianceQueue, approveRequest } = useAdmin();
    return (
        <div className="space-y-4">
            {complianceQueue.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-xl shadow flex justify-between items-center border-l-4 border-yellow-500">
                    <div>
                        <h3 className="font-bold text-lg">{item.user_name}</h3>
                        <p className="text-gray-500 text-sm">Request: <span className="font-mono text-gray-800">{item.request_type.replace('_', ' ').toUpperCase()}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => approveRequest(item.id, 'rejected')} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Reject</button>
                        <button onClick={() => approveRequest(item.id, 'approved')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ConfigForm = () => {
    const { taxConfig, updateConfig } = useAdmin();
    return (
        <div className="bg-white p-8 rounded-xl shadow max-w-lg">
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">VAT Rate (%)</label>
                <input
                    type="number"
                    value={taxConfig['vat_rate'] || 0}
                    onChange={(e) => updateConfig('vat_rate', parseFloat(e.target.value))}
                    className="w-full border p-2 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">Updates global calculation engine immediately.</p>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Small Co. Threshold</label>
                <input
                    type="number"
                    value={taxConfig['small_co_threshold'] || 0}
                    onChange={(e) => updateConfig('small_co_threshold', parseFloat(e.target.value))}
                    className="w-full border p-2 rounded"
                />
            </div>

            <div className="mt-6 border-t pt-6">
                <h3 className="font-bold text-gray-800 mb-4">Subscription Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pro Monthly (₦)</label>
                        <input
                            type="number"
                            value={taxConfig['pro_monthly_price'] || 2500}
                            onChange={(e) => updateConfig('pro_monthly_price', parseFloat(e.target.value))}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pro Yearly (₦)</label>
                        <input
                            type="number"
                            value={taxConfig['pro_yearly_price'] || 25000}
                            onChange={(e) => updateConfig('pro_yearly_price', parseFloat(e.target.value))}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                </div>
            </div>
        </div >
    );
};

const AdminLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
                        <Shield className="text-red-500" /> GOD MODE
                    </h1>
                    <p className="text-xs opacity-50 mt-1">OpCore Admin v1.0</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <NavLink to="/admin/users" icon={<Users size={18} />} label="User Management" />
                    <NavLink to="/admin/compliance" icon={<FileCheck size={18} />} label="Compliance Queue" />
                    <NavLink to="/admin/config" icon={<Settings size={18} />} label="Tax Brain" />
                    <NavLink to="/admin/audit" icon={<Activity size={18} />} label="Audit Logs" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link to="/dashboard" className="flex items-center gap-3 p-3 text-red-400 hover:bg-slate-800 rounded-lg transition">
                        <LogOut size={18} />
                        Exit God Mode
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white h-16 border-b flex items-center justify-between px-8">
                    <h2 className="font-bold text-gray-700">Overview</h2>
                    <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                </header>
                <Routes>
                    <Route path="users" element={<UsersPage />} />
                    <Route path="compliance" element={<CompliancePage />} />
                    <Route path="config" element={<ConfigPage />} />
                    <Route path="audit" element={<AuditPage />} />
                    <Route path="*" element={<UsersPage />} />
                </Routes>
            </main>
        </div>
    );
};

const NavLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname.includes(to);
    return (
        <Link to={to} className={`flex items-center gap-3 p-3 rounded-lg transition ${isActive ? 'bg-brand text-white' : 'hover:bg-slate-800'}`}>
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    );
};

export default AdminLayout;
