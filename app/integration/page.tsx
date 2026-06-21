"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '../../components/page-header';

function IntegrationContent() {
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<any[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  
  const [ghlClientId, setGhlClientId] = useState('');
  const [ghlClientSecret, setGhlClientSecret] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');

  const fetchLocations = () => {
    fetch('/api/locations/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.locations) setLocations(data.locations);
      });
  };

  const fetchSettings = () => {
    fetch('/api/settings/ghl')
      .then((res) => res.json())
      .then((data) => {
        if (data.ghlClientId) setGhlClientId(data.ghlClientId);
        if (data.appUrl) setAppOrigin(data.appUrl);
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
  };


  const handleConnectGhl = () => {
    if (!ghlClientId) {
      alert('Please save your GoHighLevel Client ID first.');
      return;
    }
    
    const redirectUri = process.env.NEXT_PUBLIC_GHL_REDIRECT_URI || `${window.location.origin}/api/oauth/callback`;

    const scopes = [
      'conversations.readonly',
      'conversations.write',
      'conversations/message.readonly',
      'conversations/message.write',
      'contacts.readonly',
      'locations.readonly',
      'users.readonly',
    ].join(' ');

    const cleanClientId = ghlClientId.trim();
    window.location.href = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${cleanClientId}&scope=${encodeURIComponent(scopes)}`;
  };

  const saveGhlSettings = async () => {
    setIsSavingSettings(true);
    try {
      const payload: any = { ghlClientId: ghlClientId.trim() };
      // Only send clientSecret if the user actually typed a new one
      if (ghlClientSecret.trim()) {
        payload.ghlClientSecret = ghlClientSecret.trim();
      }
      const res = await fetch('/api/settings/ghl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to save: ${data.error || res.statusText}`);
      } else {
        alert('GoHighLevel settings saved!');
      }
    } catch (e) {
      alert('Failed to save settings.');
    }
    setIsSavingSettings(false);
  };

  const handleDisconnect = async (locationId: string) => {
    if (!confirm(`Disconnect location ${locationId}? Assigned Mac workers will be unassigned.`)) return;
    setDisconnecting(locationId);
    await fetch(`/api/locations?locationId=${encodeURIComponent(locationId)}`, { method: 'DELETE' });
    setDisconnecting(null);
    fetchLocations();
  };

  const [appOrigin, setAppOrigin] = useState('');

  useEffect(() => {
    fetchLocations();
    fetchSettings();
    setAppOrigin(window.location.origin); // fallback, overridden by fetchSettings if APP_URL exists
  }, []);

  return (
    <div className="flex-1 bg-[#F5F6FA] dark:bg-slate-950 overflow-y-auto">
      <PageHeader />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Integrations</h2>
            <p className="text-sm text-slate-500 mt-1">Connect GoHighLevel locations and configure outbound webhooks</p>
          </div>
          <button
            onClick={handleConnectGhl}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg text-sm shadow-sm transition-colors"
          >
            Connect GoHighLevel
          </button>
        </div>

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl p-4 text-sm">
            Location connected. Assign a Mac worker on the{' '}
            <Link href="/subaccounts" className="underline font-semibold">Subaccounts</Link> page, then configure your webhook URL in{' '}
            <Link href="/settings" className="underline font-semibold">Settings</Link>.
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm">
            OAuth failed ({error}). Check GHL Client ID, GHL Client Secret, and redirect URI configuration.
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">GoHighLevel App Configuration</h3>
          <p className="text-sm text-slate-500 mb-4">Create a Private App in the GoHighLevel Developer Portal with the scopes: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">conversations.readonly</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">conversations.write</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">conversations/message.readonly</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">conversations/message.write</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">contacts.readonly</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">locations.readonly</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">users.readonly</code>. Set the redirect URI to <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{appOrigin}/api/oauth/callback</code>.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Client ID</label>
              <input 
                type="text" 
                value={ghlClientId} 
                onChange={(e) => setGhlClientId(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="Paste Client ID" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Client Secret (only needed when updating)</label>
              <input 
                type="password" 
                value={ghlClientSecret} 
                onChange={(e) => setGhlClientSecret(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder={settingsLoaded && ghlClientId && !ghlClientSecret ? "••••••••••••••••" : "Paste Client Secret"} 
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={saveGhlSettings} 
              disabled={isSavingSettings}
              className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {isSavingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Connected Subaccounts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800 tracking-wider">
                  <th className="pb-4">Location ID</th>
                  <th className="pb-4">Name</th>
                  <th className="pb-4">Connected Since</th>
                  <th className="pb-4">Token Expires</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No subaccounts connected yet. Click &quot;Connect GoHighLevel&quot; to get started.
                    </td>
                  </tr>
                ) : (
                  locations.map((loc) => (
                    <tr key={loc._id}>
                      <td className="py-4 font-mono text-indigo-500 text-xs">{loc.locationId}</td>
                      <td className="py-4">{loc.companyName || 'Unknown'}</td>
                      <td className="py-4">{new Date(loc.updatedAt).toLocaleDateString()}</td>
                      <td className="py-4">{new Date(loc.expiresAt).toLocaleDateString()}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleDisconnect(loc.locationId)}
                          disabled={disconnecting === loc.locationId}
                          className="text-red-500 hover:text-red-600 text-xs font-semibold disabled:opacity-50"
                        >
                          {disconnecting === loc.locationId ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Setup Checklist</h3>
          <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
            <li>Connect a GHL location using the button above</li>
            <li>
              Install a Mac worker from the <Link href="/workers" className="text-indigo-500 underline">Devices</Link> page
            </li>
            <li>
              Assign the worker to the location on <Link href="/subaccounts" className="text-indigo-500 underline">Subaccounts</Link>
            </li>
            <li>
              Configure webhook URL <code className="font-mono text-xs">{appOrigin}/api/outbound/webhook</code> in GHL Custom SMS Provider
            </li>
            <li>Ensure payload includes <code className="font-mono text-xs">locationId</code>, <code className="font-mono text-xs">phone</code>, and <code className="font-mono text-xs">body</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading integrations...</div>}>
      <IntegrationContent />
    </Suspense>
  );
}
