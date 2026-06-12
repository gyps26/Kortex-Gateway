"use client";
import React, { useState, useEffect } from 'react';

export default function WorkersPage() {
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [workerSecret, setWorkerSecret] = useState('');

  useEffect(() => {
    fetch('/api/workers/list')
      .then(res => res.json())
      .then(data => {
         if (data.profiles) setWorkers(data.profiles);
      });

    fetch('/api/settings/token')
      .then(res => res.json())
      .then(data => {
         if (data.token) setWorkerSecret(data.token);
      });
  }, []);

  const handleEditLimit = async (workerId: string, currentLimit: number) => {
    const newLimit = prompt('Enter new daily limit:', currentLimit.toString());
    if (newLimit && !isNaN(Number(newLimit))) {
      await fetch('/api/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, dailyLimit: Number(newLimit) })
      });
      setWorkers(workers.map(w => w.workerId === workerId ? { ...w, dailyLimit: Number(newLimit) } : w));
    }
  };

  return (
    <div className="flex-1 bg-[#F5F6FA] dark:bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8">
        <div className="flex items-center">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-sm">Back To Admin</button>
        </div>
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Gary Demo 👤
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Top Navigation Tabs */}
        <div className="flex mb-4 gap-2">
            <button className="px-6 py-2 rounded-t-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium text-sm">Android Devices</button>
            <button className="px-6 py-2 rounded-t-xl bg-indigo-600 text-white font-medium text-sm shadow">iMessage Devices</button>
            <button className="px-6 py-2 rounded-t-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium text-sm">WhatsApp Devices</button>
        </div>
        
        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Mac</h2>
             <div className="flex gap-4">
                 <div className="relative">
                    <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input type="text" placeholder="Search devices..." className="w-64 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none" />
                 </div>
                 <button onClick={() => setSetupModalOpen(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg text-sm shadow-sm transition-colors">Add Device</button>
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
                <tr><td colSpan={7} className="py-8 text-center">No workers found.</td></tr>
              ) : workers.map(worker => (
                <tr key={worker.workerId}>
                  <td className="py-4 text-indigo-500 font-medium">{worker.name || worker.workerId}</td>
                  <td className="py-4">{worker.assignedLocationId || 'Unassigned'}</td>
                  <td className="py-4 text-center"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono">{worker.dailyLimit || 50}</span></td>
                  <td className="py-4 text-center"><span className="text-indigo-400 text-xs font-mono">{worker.dailyCount || 0}</span></td>
                  <td className="py-4 text-center">
                     <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${worker.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {worker.status}
                     </span>
                  </td>
                  <td className="py-4 text-center text-xs font-mono bg-slate-50/50 dark:bg-slate-900/10 rounded">
                     {new Date(worker.lastPing).toLocaleString()}
                  </td>
                  <td className="py-4 flex gap-2 justify-end">
                     <button onClick={() => handleEditLimit(worker.workerId, worker.dailyLimit || 50)} className="border border-indigo-200 text-indigo-500 px-3 py-1 rounded text-xs font-semibold">Edit Limit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {setupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-[450px] rounded-2xl shadow-xl flex flex-col relative overflow-hidden">
             <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">iMessage Gateway Setup</h3>
               <button onClick={() => setSetupModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">X</button>
             </div>
             <div className="p-8 pb-10 space-y-4 text-sm text-slate-500">
                <p className="flex items-start gap-4">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Download and install the Mac app from <a href="#" className="flex-1 text-indigo-500 underline">this link</a></span>
                </p>
                <p className="flex items-start gap-4">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Launch the app and authenticate using the token below</span>
                </p>
                <p className="flex items-start gap-4">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Click the token field to copy it</span>
                </p>
                <p className="flex items-start gap-4">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">4</span>
                  <span>Paste it in the app to link your device</span>
                </p>
                <p className="flex items-start gap-4">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">5</span>
                  <span>Start the gateway service in the app menu</span>
                </p>
                <p className="flex items-start gap-4">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">6</span>
                  <span>Connect this gateway in your Dashboard</span>
                </p>

                 <div className="mt-8 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center relative">
                   <p className="text-xs font-bold text-slate-500 mb-2">Your iMessage Auth Token</p>
                   <div className="flex border-2 border-indigo-200 dark:border-indigo-900 rounded-lg overflow-hidden bg-white dark:bg-slate-900 mb-2">
                      <div className="px-4 py-3 font-mono text-indigo-500 text-sm truncate flex-1 select-all">{workerSecret || 'Loading...'}</div>
                      <button onClick={() => navigator.clipboard.writeText(workerSecret)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 transition-colors">Copy</button>
                   </div>
                   <p className="text-[10px] text-slate-400 font-mono">Do not share this token.</p>
                </div>

                <p className="text-center text-xs mt-6">Need help? Visit our <a href="#" className="text-indigo-500 underline">iMessage Support Portal</a>.</p>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
