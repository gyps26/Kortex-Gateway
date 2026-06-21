"use client";

import React, { useState } from 'react';
import { ProxyModal } from './proxy-modal';

interface CreateWhatsAppDialogProps {
  open: boolean;
  loading?: boolean;
  onCreate: (name: string, proxy?: string) => void;
  onCancel: () => void;
}

export function CreateWhatsAppDialog({
  open,
  loading = false,
  onCreate,
  onCancel,
}: CreateWhatsAppDialogProps) {
  const [name, setName] = useState('WhatsApp Line 1');
  const [showProxyModal, setShowProxyModal] = useState(false);

  if (!open) return null;

  if (showProxyModal) {
    return (
      <ProxyModal
        open={true}
        onSave={(proxy) => {
          onCreate(name.trim() || 'WhatsApp Line 1', proxy);
          setShowProxyModal(false);
        }}
        onCancel={() => setShowProxyModal(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Add WhatsApp Line</h3>
        
        <div className="space-y-4 mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Connector name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="WhatsApp Line 1"
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
            autoFocus
          />

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Use a proxy?</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Route WhatsApp traffic through a proxy (HTTP/HTTPS/SOCKS5). Useful for geo-restrictions or IP rotation.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => onCreate(name.trim() || 'WhatsApp Line 1')}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'No, create without proxy'}
              </button>
              <button
                type="button"
                onClick={() => setShowProxyModal(true)}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Yes, add proxy
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
