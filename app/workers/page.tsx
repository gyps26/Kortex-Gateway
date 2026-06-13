"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '../../components/page-header';

export default function WorkersPage() {
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [workerToken, setWorkerToken] = useState('');
  const [installerUrl, setInstallerUrl] = useState('/api/installer');
  const [copied, setCopied] = useState(false);

  const loadWorkers = () => {
    fetch('/api/workers/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles) setWorkers(data.profiles);
      });
  };

  useEffect(() => {
    loadWorkers();
    const interval = setInterval(loadWorkers, 10000);

    fetch('/api/settings/token')
      .then((res) => res.json())
      .then((data) => {
        if (data.token) setWorkerToken(data.token);
        if (data.installerUrl) setInstallerUrl(data.installerUrl);
      });

    return () => clearInterval(interval);
  }, []);

  const handleEditLimit = async (workerId: string, currentLimit: number) => {
    const newLimit = prompt('Enter new daily limit:', currentLimit.toString());
    if (newLimit && !isNaN(Number(newLimit))) {
      await fetch('/api/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, dailyLimit: Number(newLimit) }),
      });
      loadWorkers();
    }
  };

  const handleRemoveWorker = async (workerId: string) => {
    if (confirm('Are you sure you want to remove this device?')) {
      await fetch(`/api/workers?workerId=${encodeURIComponent(workerId)}`, {
        method: 'DELETE',
      });
      loadWorkers();
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(workerToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOnline = (lastPing: string) => Date.now() - new Date(lastPing).getTime() < 30_000;

  return (
    <div className="flex-1 bg-[#F5F6FA] dark:bg-slate-950 overflow-y-auto">
      <PageHeader />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex mb-4 gap-2">
          <span className="px-6 py-2 rounded-t-xl bg-indigo-600 text-white font-medium text-sm shadow">iMessage Devices</span>
          <span className="px-6 py-2 rounded-t-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium text-sm">Android (coming soon)</span>
          <span className="px-6 py-2 rounded-t-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium text-sm">WhatsApp (coming soon)</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Mac Workers</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setSetupModalOpen(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg text-sm shadow-sm transition-colors"
              >
                Add Device
              </button>
            </div>
          </div>

          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead>
              <tr className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800 tracking-wider">
                <th className="pb-4">Device Name</th>
                <th className="pb-4">Assigned Location</th>
                <th className="pb-4 text-center">Daily Limit</th>
                <th className="pb-4 text-center">Daily Sent</th>
                <th className="pb-4 text-center">Status</th>
                <th className="pb-4 text-center">Last Ping</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    No workers found.{' '}
                    <button onClick={() => setSetupModalOpen(true)} className="text-indigo-500 underline">
                      Set up your first Mac worker
                    </button>
                  </td>
                </tr>
              ) : (
                workers.map((worker) => {
                  const online = isOnline(worker.lastPing);
                  return (
                    <tr key={worker.workerId}>
                      <td className="py-4 text-indigo-500 font-medium">{worker.name || worker.workerId}</td>
                      <td className="py-4 font-mono text-xs">{worker.assignedLocationId || 'Unassigned'}</td>
                      <td className="py-4 text-center">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono">{worker.dailyLimit || 50}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-indigo-400 text-xs font-mono">{worker.dailyCount || 0}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            online && worker.status === 'active'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {online && worker.status === 'active' ? 'online' : worker.status}
                        </span>
                      </td>
                      <td className="py-4 text-center text-xs font-mono">{new Date(worker.lastPing).toLocaleString()}</td>
                      <td className="py-4 flex gap-2 justify-end">
                        <button
                          onClick={() => handleEditLimit(worker.workerId, worker.dailyLimit || 50)}
                          className="border border-indigo-200 text-indigo-500 hover:bg-indigo-50 px-3 py-1 rounded text-xs font-semibold transition-colors"
                        >
                          Edit Limit
                        </button>
                        <button
                          onClick={() => handleRemoveWorker(worker.workerId)}
                          className="border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1 rounded text-xs font-semibold transition-colors"
                        >
                          Remove
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

      {setupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[450px] rounded-2xl shadow-xl flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">iMessage Gateway Setup</h3>
              <button onClick={() => setSetupModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                X
              </button>
            </div>
            <div className="p-8 pb-10 space-y-4 text-sm text-slate-500">
              <p className="flex items-start gap-4">
                <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
                <span>
                  Download the{' '}
                  <a href={installerUrl} className="text-indigo-500 underline" download>
                    CLI installer script
                  </a>{' '}
                  or use the Electron Mac app
                </span>
              </p>
              <p className="flex items-start gap-4">
                <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
                <span>Launch the app and paste the connection token below</span>
              </p>
              <p className="flex items-start gap-4">
                <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
                <span>
                  Assign the worker to a GHL location on{' '}
                  <Link href="/subaccounts" className="text-indigo-500 underline">
                    Subaccounts
                  </Link>
                </span>
              </p>

              <div className="mt-8 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center relative">
                <p className="text-xs font-bold text-slate-500 mb-2">Connection Token (URL|SECRET)</p>
                <div className="flex border-2 border-indigo-200 dark:border-indigo-900 rounded-lg overflow-hidden bg-white dark:bg-slate-900 mb-2">
                  <div className="px-4 py-3 font-mono text-indigo-500 text-xs truncate flex-1 select-all">{workerToken || 'Loading...'}</div>
                  <button
                    onClick={copyToken}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 transition-colors shrink-0"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Do not share this token.</p>
              </div>

              <p className="text-center text-xs mt-6">
                Need help? See <Link href="/settings" className="text-indigo-500 underline">Settings</Link> for webhook URLs and env vars.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
