"use client";
import React from 'react';

export default function MonitorPage() {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Queue Monitor</h2>
        <p className="text-slate-500 dark:text-slate-400">View real-time Redis BullMQ processing telemetry and failed jobs.</p>
    </div>
  );
}
