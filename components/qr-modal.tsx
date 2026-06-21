"use client";

import React, { useState } from 'react';

const QR_PLACEHOLDER = 'Waiting for QR...';

interface QrModalProps {
  open: boolean;
  title: string;
  qrData: string;
  pairingCode?: string;
  subtitle?: string;
  error?: string | null;
  workerOffline?: boolean;
  onClose: () => void;
  onRequestPairingCode?: (number: string) => void;
}

function qrImageUrl(data: string) {
  if (!data) return '';
  if (data.startsWith('data:image/')) return data;
  if (data.length > 500) {
    if (!data.startsWith('data:')) return `data:image/png;base64,${data}`;
    return data;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}`;
}

export function QrModal({
  open,
  title,
  qrData,
  pairingCode,
  subtitle,
  error,
  workerOffline,
  onClose,
  onRequestPairingCode,
}: QrModalProps) {
  if (!open) return null;

  const hasQr = qrData && qrData !== QR_PLACEHOLDER;
  const [showPairing, setShowPairing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePairingRequest = () => {
    if (phoneNumber.trim() && onRequestPairingCode) {
      onRequestPairingCode(phoneNumber.trim());
      setShowPairing(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>

        {workerOffline && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
            WhatsApp worker is offline. Start it with <code className="font-mono text-xs">docker compose up</code> or{' '}
            <code className="font-mono text-xs">npm run worker:whatsapp</code>.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          {showPairing && pairingCode ? (
            <div className="w-[250px] h-[250px] rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3 p-4">
              <div className="text-4xl font-mono text-indigo-600 tracking-widest bg-white dark:bg-slate-900 px-4 py-2 rounded-lg shadow">
                {pairingCode}
              </div>
              <p className="text-xs text-slate-500 text-center">Enter this code in WhatsApp → Linked Devices → Link with phone number</p>
            </div>
          ) : hasQr ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl(qrData)}
                alt="QR Code"
                className="w-[250px] h-[250px] rounded-lg bg-white p-2 shadow-sm"
              />
              <p className="text-xs text-slate-500 text-center">Scan with WhatsApp on your phone</p>
            </>
          ) : (
            <div className="w-[250px] h-[250px] rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Waiting for QR code...</p>
            </div>
          )}
        </div>

        {!showPairing && !pairingCode && (
          <div className="mt-4 w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">No camera? Link with phone number instead</p>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Phone number (e.g. +15551234567)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handlePairingRequest}
                disabled={!phoneNumber.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Code
              </button>
            </div>
          </div>
        )}

        {showPairing && !pairingCode && (
          <p className="text-xs text-slate-500 text-center">Requesting pairing code...</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export { QR_PLACEHOLDER };
