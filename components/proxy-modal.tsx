"use client";

import React, { useState } from 'react';

interface ProxyModalProps {
  open: boolean;
  onSave: (proxy: string) => void;
  onCancel: () => void;
}

export function ProxyModal({ open, onSave, onCancel }: ProxyModalProps) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [protocol, setProtocol] = useState<'http' | 'https' | 'socks5'>('http');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const buildProxyUrl = (): string => {
    if (!host.trim() || !port.trim()) return '';
    const auth = username.trim() ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : '';
    return `${protocol}://${auth}${host.trim()}:${port.trim()}`;
  };

  const validate = (): boolean => {
    if (!host.trim() || !port.trim()) {
      setError('Host and port are required');
      return false;
    }
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setError('Port must be a number between 1 and 65535');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const proxyUrl = buildProxyUrl();
    onSave(proxyUrl);
  };

  const handleSkip = () => {
    onSave('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Configure Proxy (Optional)</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Enter proxy details for this WhatsApp instance. Leave empty to connect directly.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Protocol
            </label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as 'http' | 'https' | 'socks5')}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Host
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => { setHost(e.target.value); setError(''); }}
                placeholder="123.456.78.90"
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Port
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => { setPort(e.target.value); setError(''); }}
                placeholder="8080"
                min="1"
                max="65535"
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Username (optional)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_proxy_user"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Password (optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="your_proxy_password"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Skip (No Proxy)
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}