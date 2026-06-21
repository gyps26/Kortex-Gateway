"use client";

import Link from 'next/link';

export function PageHeader({ userName = 'Admin' }: { userName?: string }) {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8">
      <div className="flex items-center">
        <Link
          href="/"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-sm"
        >
          Back To Dashboard
        </Link>
      </div>
      <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{userName} 👤</div>
    </header>
  );
}
