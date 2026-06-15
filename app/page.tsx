"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, MessageSquare, Activity, Smartphone, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

type Stats = {
  connectedSubaccounts: number;
  activeWorkers: number;
  totalWorkers: number;
  assignedWorkers: number;
  messagesSentToday: number;
  pendingMessages: number;
  failedMessages: number;
  redisConnected: boolean;
  mongoConnected: boolean;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () => {
      fetch('/api/dashboard/stats')
        .then((res) => res.json())
        .then(setStats);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { name: 'Connected Subaccounts', value: stats?.connectedSubaccounts ?? '—', icon: Users },
    { name: 'Active Mac Workers', value: stats?.activeWorkers ?? '—', icon: Smartphone },
    { name: 'Messages Sent (Today)', value: stats?.messagesSentToday ?? '—', icon: MessageSquare },
    { name: 'Pending Queue', value: stats?.pendingMessages ?? '—', icon: Activity },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight"
        >
          Overview
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-slate-500 mt-1"
        >
          Kortex Gateway — live system status
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <stat.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/integration"
              className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Connect GoHighLevel</h3>
                <p className="text-xs text-slate-500">OAuth + webhook setup</p>
              </div>
            </Link>
            <Link
              href="/subaccounts"
              className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Assign Workers</h3>
                <p className="text-xs text-slate-500">Link Mac devices to locations</p>
              </div>
            </Link>
            <Link
              href="/workers"
              className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Mac Workers</h3>
                <p className="text-xs text-slate-500">Install and monitor devices</p>
              </div>
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">View Messages</h3>
                <p className="text-xs text-slate-500">Check recent iMessage activity</p>
              </div>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Database</span>
              <span
                className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${
                  stats?.mongoConnected
                    ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'text-red-500 bg-red-50 dark:bg-red-500/10'
                }`}
              >
                {stats?.mongoConnected ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Redis Queue</span>
              <span
                className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${
                  stats?.redisConnected
                    ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                }`}
              >
                {stats?.redisConnected ? 'Ready' : 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Mac Workers</span>
              <span className="text-xs font-semibold text-slate-500">
                {stats ? `${stats.activeWorkers} active / ${stats.totalWorkers} total` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Failed Today</span>
              <span className="text-xs font-semibold text-slate-500">{stats?.failedMessages ?? '—'}</span>
            </div>
          </div>
          <Link href="/monitor" className="mt-4 block text-center text-xs text-indigo-500 underline">
            Open queue monitor
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
