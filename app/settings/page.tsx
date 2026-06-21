"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '../../components/page-header';

function SettingsContent() {
  const searchParams = useSearchParams();
  const [tokenInfo, setTokenInfo] = useState<{ token: string; apiUrl: string; installerUrl: string } | null>(null);
  const [stats, setStats] = useState<{ redisConnected: boolean; mongoConnected: boolean } | null>(null);
  const [copied, setCopied] = useState('');

  const [appOrigin, setAppOrigin] = useState('');
  useEffect(() => { setAppOrigin(window.location.origin); }, []);
  const oauthSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    fetch('/api/settings/token')
      .then((res) => res.json())
      .then((data) => setTokenInfo(data));

    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const webhookUrls = [
    { name: 'Outbound (Custom SMS Provider)', url: `${appOrigin}/api/outbound/webhook` },
    { name: 'Outbound (Workflow Webhook)', url: `${appOrigin}/api/ghl/webhook/messages` },
  ];

  return (
    <div className="flex-1 bg-[#F5F6FA] dark:bg-slate-950 overflow-y-auto">
      <PageHeader />

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Gateway configuration, webhooks, and Mac worker setup</p>
        </div>

        {oauthSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl p-4 text-sm">
            GoHighLevel connected successfully. Assign a Mac worker to the location on the{' '}
            <Link href="/subaccounts" className="underline font-semibold">Subaccounts</Link> page.
          </div>
        )}

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">System Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-lg px-4 py-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Database</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stats?.mongoConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {stats?.mongoConnected ? 'Connected' : 'Unavailable'}
              </span>
            </div>
            <div className="flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-lg px-4 py-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Redis Queue</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stats?.redisConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {stats?.redisConnected ? 'Connected' : 'Not configured'}
              </span>
            </div>
          </div>
          {!stats?.redisConnected && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Set <code className="font-mono">REDIS_URL</code> in your environment for reliable message queuing. Without Redis, direct worker assignment is used as a fallback.
            </p>
          )}
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Mac Worker Connection</h3>
          <p className="text-sm text-slate-500">
            Paste this token into the Mac worker app. Format: <code className="font-mono text-xs">API_URL|API_SECRET</code>
          </p>
          <div className="flex border border-indigo-200 dark:border-indigo-900 rounded-lg overflow-hidden">
            <div className="px-4 py-3 font-mono text-indigo-500 text-xs truncate flex-1 select-all bg-slate-50 dark:bg-slate-800/50">
              {tokenInfo?.token || 'Loading...'}
            </div>
            <button
              onClick={() => tokenInfo && copyText('token', tokenInfo.token)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 transition-colors shrink-0"
            >
              {copied === 'token' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href={tokenInfo?.installerUrl || '/api/installer'}
              className="text-indigo-500 underline font-medium"
            >
              Download CLI installer script
            </a>
            <Link href="/workers" className="text-indigo-500 underline font-medium">
              Manage devices
            </Link>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">GoHighLevel Webhooks</h3>
          <p className="text-sm text-slate-500">
            Configure one of these URLs in GHL as your Custom SMS Provider or workflow webhook. Include{' '}
            <code className="font-mono text-xs">locationId</code> in the payload so messages route to the correct Mac worker.
          </p>
          {webhookUrls.map((item) => (
            <div key={item.name} className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">{item.name}</p>
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-300 truncate flex-1 bg-slate-50 dark:bg-slate-800/50">
                  {item.url}
                </div>
                <button
                  onClick={() => copyText(item.name, item.url)}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs px-3 shrink-0"
                >
                  {copied === item.name ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400">
            Optional: set <code className="font-mono">GHL_WEBHOOK_SECRET</code> and send it as the Authorization header or{' '}
            <code className="font-mono">x-ghl-webhook-secret</code>.
          </p>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Environment Variables</h3>
          <ul className="text-sm text-slate-500 space-y-1 font-mono text-xs">
            <li>MONGODB_URI — database connection</li>
            <li>REDIS_URL — BullMQ message queue</li>
            <li>API_SECRET — Mac worker authentication</li>
            <li>GHL_CLIENT_ID / GHL_CLIENT_SECRET — OAuth (server)</li>
            <li>NEXT_PUBLIC_GHL_CLIENT_ID / NEXT_PUBLIC_GHL_REDIRECT_URI — OAuth (browser)</li>
            <li>GHL_WEBHOOK_SECRET — webhook verification (optional)</li>
            <li>APP_URL — public URL of this gateway</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
