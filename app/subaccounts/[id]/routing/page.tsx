"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '../../../../components/page-header';

export default function RoutingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  
  const [defaultSmsWorkerId, setDefaultSmsWorkerId] = useState('');
  const [defaultWhatsappWorkerId, setDefaultWhatsappWorkerId] = useState('');
  
  // Array of mappings: { ghlUserId, channelType: 'SMS' | 'WHATSAPP', providerId }
  const [mappings, setMappings] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch devices (workers)
        const workRes = await fetch('/api/workers/list');
        const workData = await workRes.json();
        const allDevices = workData.profiles || [];
        const locationDevices = allDevices.filter((d: any) => d.assignedLocationId === id);
        setDevices(locationDevices);

        // Fetch GHL Users
        const usersRes = await fetch(`/api/locations/${id}/users`);
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);

        // Fetch current routing config
        const routingRes = await fetch(`/api/locations/${id}/routing`);
        const routingData = await routingRes.json();
        
        if (routingData.location) {
          setDefaultSmsWorkerId(routingData.location.defaultSmsWorkerId || '');
          setDefaultWhatsappWorkerId(routingData.location.defaultWhatsappWorkerId || '');
        }
        if (routingData.mappings) {
          setMappings(routingData.mappings);
        }
      } catch (err) {
        console.error('Failed to load routing data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/locations/${id}/routing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultSmsWorkerId,
          defaultWhatsappWorkerId,
          mappings,
        }),
      });
      alert('Routing settings saved successfully!');
    } catch (err) {
      alert('Failed to save routing settings');
    } finally {
      setSaving(false);
    }
  };

  const updateMapping = (ghlUserId: string, channelType: string, providerId: string) => {
    setMappings(prev => {
      // Remove existing mapping for this user + channel
      let newMappings = prev.filter(m => !(m.ghlUserId === ghlUserId && m.channelType === channelType));
      
      // Add the new one if a provider was selected
      if (providerId) {
        newMappings.push({
          ghlUserId,
          channelType,
          providerId,
        });
      }
      return newMappings;
    });
  };

  const getMappedProvider = (ghlUserId: string, channelType: string) => {
    return mappings.find(m => m.ghlUserId === ghlUserId && m.channelType === channelType)?.providerId || '';
  };

  const smsDevices = devices.filter(d => d.channel === 'SMS');
  const whatsappDevices = devices.filter(d => d.channel === 'WHATSAPP');

  if (loading) {
    return (
      <div className="flex-1 bg-[#F5F6FA] dark:bg-slate-950 p-8">
        <PageHeader />
        <div className="max-w-5xl mx-auto mt-8 text-slate-500">Loading routing configuration...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F5F6FA] dark:bg-slate-950 overflow-y-auto pb-12">
      <PageHeader />

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button 
              onClick={() => router.push('/subaccounts')}
              className="text-indigo-500 hover:text-indigo-600 text-sm font-semibold mb-2 flex items-center gap-1"
            >
              &larr; Back to Subaccounts
            </button>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Advanced Routing</h2>
            <p className="text-sm text-slate-500 mt-1">Configure default channels and map specific GHL users to dedicated devices.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Location Defaults</h3>
          <p className="text-sm text-slate-500 mb-6">
            When a workflow sends a message, or a user without a mapped device sends a message, these default devices will be used.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Default Android SMS Device
              </label>
              <select
                value={defaultSmsWorkerId}
                onChange={(e) => setDefaultSmsWorkerId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Load Balance (Auto-select)</option>
                {smsDevices.map(d => (
                  <option key={d.workerId} value={d.workerId}>{d.name || d.workerId}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Default WhatsApp Device
              </label>
              <select
                value={defaultWhatsappWorkerId}
                onChange={(e) => setDefaultWhatsappWorkerId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Load Balance (Auto-select)</option>
                {whatsappDevices.map(d => (
                  <option key={d.workerId} value={d.workerId}>{d.name || d.workerId}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">User-to-Device Mapping</h3>
            <p className="text-sm text-slate-500">
              Force messages sent by specific GoHighLevel users to route through their dedicated numbers.
            </p>
          </div>
          
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="py-4 px-6 border-b border-slate-200 dark:border-slate-800">GHL User</th>
                <th className="py-4 px-6 border-b border-slate-200 dark:border-slate-800">Mapped SMS Device</th>
                <th className="py-4 px-6 border-b border-slate-200 dark:border-slate-800">Mapped WhatsApp Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">No users found for this location.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">
                      {user.name}
                      <div className="text-xs font-mono text-slate-400 mt-1">{user.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={getMappedProvider(user.id, 'SMS')}
                        onChange={(e) => updateMapping(user.id, 'SMS', e.target.value)}
                        className="w-full max-w-[250px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none"
                      >
                        <option value="">Use Default/Load Balance</option>
                        {smsDevices.map(d => (
                          <option key={d.workerId} value={d.workerId}>{d.name || d.workerId}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={getMappedProvider(user.id, 'WHATSAPP')}
                        onChange={(e) => updateMapping(user.id, 'WHATSAPP', e.target.value)}
                        className="w-full max-w-[250px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none"
                      >
                        <option value="">Use Default/Load Balance</option>
                        {whatsappDevices.map(d => (
                          <option key={d.workerId} value={d.workerId}>{d.name || d.workerId}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
