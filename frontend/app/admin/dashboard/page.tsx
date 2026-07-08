'use client';

import useSWR from 'swr';
import AdminLayoutClient from '@/components/admin/AdminLayout';
import { fetcher } from '@/lib/fetcher';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const { data: stats, isLoading } = useSWR<DashboardStats>('/admin/stats', fetcher, {
    revalidateOnFocus: false,
  });

  const statCards = [
    {
      label: 'Total Photos',
      value: stats?.totalPhotos || 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    },
    {
      label: 'Categories',
      value: stats?.totalCategories || 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: 'Featured',
      value: stats?.featuredPhotos || 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ];

  return (
    <AdminLayoutClient>
      <div className="max-w-6xl">
        <h1 className="font-display text-2xl font-light text-text-primary mb-6">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white border border-border rounded-sm p-5 flex items-center gap-4"
            >
              <div className="text-text-muted">{card.icon}</div>
              <div>
                {isLoading ? (
                  <div className="w-12 h-6 shimmer rounded" />
                ) : (
                  <p className="font-body text-2xl font-medium text-text-primary">
                    {card.value}
                  </p>
                )}
                <p className="font-body text-xs text-text-muted uppercase tracking-wider mt-0.5">
                  {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-border rounded-sm p-6">
          <h2 className="font-body text-sm font-medium text-text-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="/admin/photos"
              className="flex items-center gap-3 p-3 rounded-sm hover:bg-hover-surface transition-colors text-sm font-body text-text-muted hover:text-text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Upload Photos
            </a>
            <a
              href="/admin/categories"
              className="flex items-center gap-3 p-3 rounded-sm hover:bg-hover-surface transition-colors text-sm font-body text-text-muted hover:text-text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Category
            </a>
            <a
              href="/admin/settings"
              className="flex items-center gap-3 p-3 rounded-sm hover:bg-hover-surface transition-colors text-sm font-body text-text-muted hover:text-text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4" />
              </svg>
              Site Settings
            </a>
          </div>
        </div>
      </div>
    </AdminLayoutClient>
  );
}
