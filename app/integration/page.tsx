"use client";
import React, { useEffect, useState } from 'react';

export default function IntegrationPage() {
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/locations/list')
      .then(res => res.json())
      .then(data => {
        if (data.locations) setLocations(data.locations);
      });
  }, []);

  const handleConnectGhl = () => {
    const clientId = process.env.NEXT_PUBLIC_GHL_CLIENT_ID || 'MISSING_CLIENT_ID';
    const redirectUri = process.env.NEXT_PUBLIC_GHL_REDIRECT_URI || 'http://localhost:3000/api/ghl/oauth';
    
    window.location.href = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${redirectUri}&client_id=${clientId}&scope=messages.readonly messages.write`;
  };

  return (
    <div className="flex-1 bg-[#F5F6FA] dark:bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8">
        <div className="flex items-center">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-sm">Back To Admin</button>
        </div>
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Admin 👤
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Integrations</h2>
            <p className="text-sm text-slate-500 mt-1">Manage your 3rd-party connections and webhooks</p>
          </div>
          <button onClick={handleConnectGhl} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg text-sm shadow-sm transition-colors">
            Connect GoHighLevel
          </button>
        </div>

        {/* Connected Integrations */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Connected Subaccounts</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead>
                    <tr className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800 tracking-wider">
                    <th className="pb-4">Location ID</th>
                    <th className="pb-4">Company Name</th>
                    <th className="pb-4">Connected Since</th>
                    <th className="pb-4">Expires</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {locations.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-500">No subaccounts connected yet. Click "Connect GoHighLevel" to get started.</td></tr>
                    ) : locations.map(loc => (
                    <tr key={loc._id}>
                        <td className="py-4 font-mono text-indigo-500">{loc.locationId}</td>
                        <td className="py-4">{loc.companyName || 'Unknown'}</td>
                        <td className="py-4">{new Date(loc.updatedAt).toLocaleDateString()}</td>
                        <td className="py-4">{new Date(loc.expiresAt).toLocaleDateString()}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
