"use client";
import React, { useState, useEffect } from 'react';

export default function SubaccountsPage() {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetLocationId, setTargetLocationId] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

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
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedWorkerId || !targetLocationId) return;
    await fetch('/api/workers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId: selectedWorkerId, assignedLocationId: targetLocationId })
    });
    setSelectedWorkerId('');
    fetchData();
  };

  const handleUnassign = async (workerId: string) => {
    await fetch('/api/workers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId, assignedLocationId: null })
    });
    fetchData();
  };

  const targetLocation = locations.find(l => l.locationId === targetLocationId) || {};
  const assignedWorkers = workers.filter(w => w.assignedLocationId === targetLocationId);
  const unassignedWorkers = workers.filter(w => !w.assignedLocationId);

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
            <div className="flex items-center gap-2 text-indigo-500 font-semibold mb-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v2m4-2v2m4-2v2M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
               Location Management
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Subaccounts</h2>
            <p className="text-sm text-slate-500 mt-1">Manage your connected subaccounts and services</p>
          </div>
          <button className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-4 py-2 rounded shadow-sm text-sm font-semibold hover:bg-slate-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Card View
          </button>
        </div>

        {/* Stats & Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Search subaccounts</p>
              <input type="text" placeholder="Search by name..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-3 text-sm focus:outline-none" />
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div>
                 <p className="text-xs font-semibold text-slate-500">Total Subaccounts</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{locations.length}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-center justify-between shadow-sm">
               <div>
                 <p className="text-xs font-semibold text-slate-500">SIM Connected</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{workers.filter(w => w.assignedLocationId).length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold font-mono">SIM</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Filter subaccounts</p>
              <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-3 text-sm focus:outline-none text-slate-500">
                <option>All Subaccounts</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg> Connect Locations
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Manage SIM
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512"><path d="M256 0c-141.4 0-256 114.6-256 256s114.6 256 256 256c38 0 74.3-8.3 107.5-23.7C442.2 466.8 512 478 512 478l-44.4-89c28.3-40.4 44.4-89.2 44.4-141C512 114.6 397.4 0 256 0zm103.8 359l-22.9-6.3c-23.8-6.6-47.5-26.6-67.6-46.7s-40.1-43.8-46.7-67.6l-6.3-22.9 22.9-22.9c12.2-12.2 12.2-32.3 0-44.5l-22.9-22.9c-12.2-12.2-32.3-12.2-44.5 0l-22.9 22.9c-18.7 18.7-27.4 45.4-23.5 71.5 5 33.3 22.5 63.8 51.5 89.4s56.1 46.5 89.4 51.5c26.1 3.9 52.8-4.8 71.5-23.5l22.9-22.9c12.2-12.2 12.2-32.3 0-44.5l-22.9-22.9c-12.2-12.2-32.3-12.2-44.5 0L359.8 359z"/></svg> iMessage Subscription
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2">
               WhatsApp Subscription
            </button>
          </div>

          <div className="mt-8 border-t border-slate-100 dark:border-slate-800/50 pt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead>
                <tr className="text-xs font-bold text-slate-500 uppercase">
                  <th className="py-4 px-2">Subaccount</th>
                  <th className="py-4 px-2 text-center">SIM Card</th>
                  <th className="py-4 px-2 text-center">Message</th>
                  <th className="py-4 px-2 text-center">WhatsApp</th>
                  <th className="py-4 px-2 text-center">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                 {locations.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="py-8 text-center text-slate-500">No subaccounts found. Connect GoHighLevel first.</td>
                   </tr>
                 ) : locations.map((loc) => {
                   const locWorkers = workers.filter(w => w.assignedLocationId === loc.locationId);
                   return (
                   <tr key={loc.locationId}>
                     <td className="py-4 px-2 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                         </div>
                         {loc.companyName || loc.locationId}
                     </td>
                     <td className="py-4 px-2">
                       <select className="w-full max-w-[150px] mx-auto block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none">
                          <option>No SIM</option>
                       </select>
                     </td>
                     <td className="py-4 px-2">
                        <div className="flex items-center justify-center gap-2 text-xs border border-slate-200 rounded px-3 py-1.5 min-w-[200px]">
                           Connected iMessage: {locWorkers.length} <button onClick={() => openAssignModal(loc.locationId)} className="ml-auto bg-indigo-500 hover:bg-indigo-600 text-white w-5 h-5 flex items-center justify-center rounded font-bold transition-colors">+</button>
                        </div>
                     </td>
                     <td className="py-4 px-2">
                        <div className="flex items-center justify-center gap-2 text-xs border border-slate-200 rounded px-3 py-1.5 min-w-[200px]">
                           Connected WhatsApp: 0 <button className="ml-auto bg-green-500 text-white w-5 h-5 flex items-center justify-center rounded font-bold">+</button>
                        </div>
                     </td>
                     <td className="py-4 px-2 text-center">
                        <div className="bg-slate-200 w-10 h-5 rounded-full inline-flex items-center">
                           <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow"></div>
                        </div>
                     </td>
                   </tr>
                 )})}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {assignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex flex-col items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl flex flex-col relative overflow-hidden">
             <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Assign iDevice to {targetLocation.companyName || targetLocation.locationId}</h3>
               <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">X</button>
             </div>
             <div className="p-8">
               <table className="w-full text-left text-sm">
                 <thead className="text-[10px] font-bold uppercase text-slate-400">
                   <tr>
                     <th className="pb-4">USER</th>
                     <th className="pb-4">DEVICES</th>
                     <th className="pb-4">DEFAULT</th>
                     <th className="pb-4">ACTIONS</th>
                   </tr>
                 </thead>
                 <tbody className="text-slate-600 dark:text-slate-300">
                   <tr>
                     <td className="py-3">
                       <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none">
                         <option>{targetLocation.companyName || targetLocation.locationId}</option>
                       </select>
                     </td>
                     <td className="py-3">
                       <select 
                         value={selectedWorkerId}
                         onChange={(e) => setSelectedWorkerId(e.target.value)}
                         className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none"
                       >
                         <option value="">Select unassigned device</option>
                         {unassignedWorkers.map(w => (
                           <option key={w.workerId} value={w.workerId}>{w.name || w.workerId}</option>
                         ))}
                       </select>
                     </td>
                     <td className="py-3"></td>
                     <td className="py-3 flex gap-2">
                       <button onClick={handleAssign} disabled={!selectedWorkerId} className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs px-4 py-2 rounded transition-colors">Assign</button>
                       <button onClick={() => setAssignModalOpen(false)} className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-xs px-4 py-2 rounded transition-colors">Cancel</button>
                     </td>
                   </tr>
                   {assignedWorkers.map(w => (
                     <tr key={w.workerId} className="border-t border-slate-100 dark:border-slate-800/50">
                       <td className="py-4">{targetLocation.companyName || targetLocation.locationId}</td>
                       <td className="py-4 font-mono text-xs">{w.name || w.workerId}</td>
                       <td className="py-4"><input type="radio" checked className="w-4 h-4 text-indigo-600" onChange={() => {}} /></td>
                       <td className="py-4">
                         <button onClick={() => handleUnassign(w.workerId)} className="bg-slate-200 dark:bg-slate-700 hover:bg-red-100 text-slate-500 hover:text-red-600 p-2 rounded transition-colors">🗑️</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               
               <div className="flex gap-4 mt-8">
                 <button className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl shadow-sm">+ Assign new iDevice</button>
                 <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-sm">+ Add new iDevice</button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
