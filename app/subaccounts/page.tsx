"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '../../components/page-header';

export default function SubaccountsPage() {
  const router = useRouter();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetLocationId, setTargetLocationId] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    const locRes = await fetch('/api/locations/list');
    const locData = await locRes.json();
    if (locData.locations) setLocations(locData.locations);

    const workRes = await fetch('/api/workers/list');
    const workData = await workRes.json();
    if (workData.profiles) setWorkers(workData.profiles);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (locId: string) => {
    setTargetLocationId(locId);
    setSelectedWorkerId('');
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedWorkerId || !targetLocationId) return;
    await fetch('/api/workers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId: selectedWorkerId, assignedLocationId: targetLocationId }),
    });
    setSelectedWorkerId('');
    setAssignModalOpen(false);
    fetchData();
  };

  const handleUnassign = async (workerId: string) => {
    await fetch('/api/workers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId, assignedLocationId: null }),
    });
    fetchData();
  };

  const targetLocation = locations.find((l) => l.locationId === targetLocationId) || {};
  const assignedWorkers = workers.filter((w) => w.assignedLocationId === targetLocationId);
  const unassignedWorkers = workers.filter((w) => !w.assignedLocationId);

  const filteredLocations = locations.filter((loc) => {
    if (!search) return true;
    const name = (loc.companyName || loc.locationId).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="flex-1 bg-[#F5F6FA] dark:bg-slate-950 overflow-y-auto">
      <PageHeader />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 font-semibold mb-2">
              Location Management
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Subaccounts</h2>
            <p className="text-sm text-slate-500 mt-1">Assign Mac workers to connected GoHighLevel locations</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Search subaccounts</p>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-3 text-sm focus:outline-none"
              />
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Subaccounts</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{locations.length}</p>
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500">Workers Assigned</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {workers.filter((w) => w.assignedLocationId).length}
                </p>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => router.push('/integration')}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-6 py-3 rounded-lg shadow-sm"
              >
                Connect GoHighLevel
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={() => router.push('/integration')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm"
            >
              Connect Locations
            </button>
            <button
              onClick={() => router.push('/workers')}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm"
            >
              Manage Mac Workers
            </button>
          </div>

          <div className="mt-8 border-t border-slate-100 dark:border-slate-800/50 pt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead>
                <tr className="text-xs font-bold text-slate-500 uppercase">
                  <th className="py-4 px-2">Subaccount</th>
                  <th className="py-4 px-2 text-center">Assigned Workers</th>
                  <th className="py-4 px-2 text-center">iMessage</th>
                  <th className="py-4 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      {locations.length === 0 ? (
                        <>
                          No subaccounts found.{' '}
                          <Link href="/integration" className="text-indigo-500 underline">
                            Connect GoHighLevel
                          </Link>{' '}
                          first.
                        </>
                      ) : (
                        'No subaccounts match your search.'
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((loc) => {
                    const locWorkers = workers.filter((w) => w.assignedLocationId === loc.locationId);
                    return (
                      <tr key={loc.locationId}>
                        <td className="py-4 px-2 font-medium text-slate-800 dark:text-slate-200">
                          <div>{loc.companyName || loc.locationId}</div>
                          <div className="text-xs font-mono text-slate-400">{loc.locationId}</div>
                        </td>
                        <td className="py-4 px-2 text-center">
                          {locWorkers.length === 0 ? (
                            <span className="text-slate-400 text-xs">None</span>
                          ) : (
                            <span className="text-xs font-mono">{locWorkers.map((w) => w.name || w.workerId).join(', ')}</span>
                          )}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center justify-center gap-2 text-xs border border-slate-200 rounded px-3 py-1.5 min-w-[200px] mx-auto">
                            {locWorkers.length} device{locWorkers.length !== 1 ? 's' : ''}
                            <button
                              onClick={() => openAssignModal(loc.locationId)}
                              className="ml-auto bg-indigo-500 hover:bg-indigo-600 text-white w-5 h-5 flex items-center justify-center rounded font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <button
                            onClick={() => openAssignModal(loc.locationId)}
                            className="text-indigo-500 hover:text-indigo-600 text-xs font-semibold"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {assignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Assign Mac Worker to {targetLocation.companyName || targetLocation.locationId}
              </h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                X
              </button>
            </div>
            <div className="p-8">
              {unassignedWorkers.length === 0 && assignedWorkers.length === 0 ? (
                <p className="text-sm text-slate-500 mb-4">
                  No Mac workers registered yet.{' '}
                  <Link href="/workers" className="text-indigo-500 underline">
                    Set up a worker
                  </Link>{' '}
                  first, then return here to assign it.
                </p>
              ) : (
                <div className="flex gap-2 mb-6">
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none text-sm"
                  >
                    <option value="">Select unassigned device</option>
                    {unassignedWorkers.map((w) => (
                      <option key={w.workerId} value={w.workerId}>
                        {w.name || w.workerId}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedWorkerId}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded"
                  >
                    Assign
                  </button>
                </div>
              )}

              {assignedWorkers.length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="pb-4">Device</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedWorkers.map((w) => (
                      <tr key={w.workerId} className="border-t border-slate-100 dark:border-slate-800/50">
                        <td className="py-4 font-mono text-xs">{w.name || w.workerId}</td>
                        <td className="py-4 capitalize text-xs">{w.status}</td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleUnassign(w.workerId)}
                            className="text-red-500 hover:text-red-600 text-xs font-semibold"
                          >
                            Unassign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => router.push('/workers')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-sm"
                >
                  Add New Mac Worker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
