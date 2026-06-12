"use client";
import React, { useState, useEffect } from 'react';

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Messages</h2>
        
        {/* Advanced Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Search</p>
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" placeholder="Messages" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Status</p>
              <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option>All Statuses</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Type</p>
              <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option>All</option>
                <option>SMS</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Subaccount</p>
              <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option>All Subaccounts</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
             <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Mobile Number</p>
              <input type="text" placeholder="Filter by number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Start Date</p>
              <input type="text" placeholder="dd/mm/yyyy 📅" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">End Date</p>
              <input type="text" placeholder="dd/mm/yyyy 📅" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Dynamic Table from DB */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden mt-6">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" /></th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {messages.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No messages found.</td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                       <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                       {m.phone}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-sm">
                      {m.body}
                    </td>
                    <td className="px-6 py-4">
                       <span className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400 font-medium text-[13px]">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg> 
                         Reply
                       </span>
                    </td>
                    <td className="px-6 py-4">sms</td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                       {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
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
