"use client";
import React from 'react';

export default function SettingsPage() {
  return (
    <div className="flex-1 bg-[#F5F6FA] dark:bg-slate-950 overflow-y-auto">
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8">
        <div className="flex items-center">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-sm">Back To Admin</button>
        </div>
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Gary Demo 👤
        </div>
      </header>

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Setting</h2>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
           <p className="text-slate-500">General settings, API keys, and notification preferences will go here.</p>
        </div>
      </div>
    </div>
  );
}
