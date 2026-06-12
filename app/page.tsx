"use client";
import React from 'react';
import { motion } from 'motion/react';
import { Users, MessageSquare, Activity, Settings, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const stats = [
    { name: 'Connected Subaccounts', value: '3', icon: Users, change: '+12%', changeType: 'positive' },
    { name: 'Active SIMs', value: '4', icon: Smartphone, change: '+33%', changeType: 'positive' },
    { name: 'Messages Sent (Today)', value: '1,284', icon: MessageSquare, change: '+5.4%', changeType: 'positive' },
    { name: 'Worker Uptime', value: '99.9%', icon: Activity, change: 'Stable', changeType: 'neutral' },
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
          Welcome back to the MyCRMSIM Dashboard.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
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
            <div className="mt-4">
              <span className={`text-xs font-semibold ${stat.changeType === 'positive' ? 'text-emerald-500' : 'text-slate-500'}`}>
                {stat.change}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">from last month</span>
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
            <Link href="/subaccounts" className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Manage Subaccounts</h3>
                <p className="text-xs text-slate-500">Add or configure connections</p>
              </div>
            </Link>
            <Link href="/messages" className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">View Messages</h3>
                <p className="text-xs text-slate-500">Check recent SMS & iMessage</p>
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
              <span className="text-sm text-slate-600 dark:text-slate-400">Database Connection</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Redis Queue</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Mac Workers</span>
              <span className="text-xs font-semibold text-slate-500">1 Active</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}