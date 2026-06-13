"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/page-header';

const STATUS_OPTIONS = ['All Statuses', 'pending', 'queued', 'sent', 'delivered', 'failed'];
const DIRECTION_OPTIONS = ['All', 'inbound', 'outbound'];

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Subaccounts');

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetch('/api/locations/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.locations) setLocations(data.locations);
      });
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      if (search && !m.body?.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'All Statuses' && m.status !== statusFilter) return false;
      if (directionFilter !== 'All' && m.direction !== directionFilter) return false;
      if (phoneFilter && !m.phone?.includes(phoneFilter)) return false;
      if (locationFilter !== 'All Subaccounts' && m.locationId !== locationFilter) return false;
      return true;
    });
  }, [messages, search, statusFilter, directionFilter, phoneFilter, locationFilter]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
      case 'failed':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'queued':
      case 'pending':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-800';
    }
  };

  return (
    <div className="flex-1 bg-[#F5F6FA] dark:bg-slate-950 overflow-y-auto">
      <PageHeader />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Messages</h2>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Search</p>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Message body..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Status</p>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Direction</p>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {DIRECTION_OPTIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Subaccount</p>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option>All Subaccounts</option>
                {locations.map((loc) => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {loc.companyName || loc.locationId}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Mobile Number</p>
              <input
                type="text"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                placeholder="Filter by number"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden mt-6">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Direction</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No messages found.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{m.phone}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-sm">{m.body}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${statusColor(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize">{m.direction}</td>
                    <td className="px-6 py-4 font-mono text-xs">{m.locationId || '—'}</td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString()}{' '}
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
