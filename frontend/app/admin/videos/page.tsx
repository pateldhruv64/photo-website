'use client';

import { useState } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import AdminLayout from '@/components/admin/AdminLayout';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { fetcher, apiRequest } from '@/lib/fetcher';
import type { Category, VideoItem } from '@/lib/types';

interface FormData {
  youtube_url: string;
  title: string;
  category: string;
  order: number;
  is_active: boolean;
}

const defaultForm: FormData = {
  youtube_url: '',
  title: '',
  category: '',
  order: 0,
  is_active: true,
};

/**
 * Extract YouTube video ID for live preview
 */
function extractPreviewId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function AdminVideosPage() {
  const { data: videos, mutate } = useSWR<VideoItem[]>('/admin/videos', fetcher);
  const { data: categories } = useSWR<Category[]>('/admin/categories', fetcher);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteVideo, setDeleteVideo] = useState<VideoItem | null>(null);

  const previewId = extractPreviewId(form.youtube_url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editId) {
        await apiRequest(`/admin/videos/${editId}`, 'PUT', form);
      } else {
        await apiRequest('/admin/videos', 'POST', form);
      }
      setForm(defaultForm);
      setEditId(null);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save video');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video: VideoItem) => {
    const categoryId = typeof video.category === 'string' ? video.category : video.category._id;
    setForm({
      youtube_url: video.youtube_url,
      title: video.title,
      category: categoryId,
      order: video.order,
      is_active: video.is_active,
    });
    setEditId(video._id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteVideo) return;
    try {
      await apiRequest(`/admin/videos/${deleteVideo._id}`, 'DELETE');
      mutate();
      setDeleteVideo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
    }
  };

  const handleToggleActive = async (video: VideoItem) => {
    try {
      await apiRequest(`/admin/videos/${video._id}`, 'PUT', {
        is_active: !video.is_active,
      });
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update video');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="font-display text-2xl font-semibold text-text-primary mb-6">
          Videos
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-body">
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-6 mb-8 space-y-4">
          <h2 className="font-body text-sm font-semibold text-text-primary">
            {editId ? 'Edit Video' : 'Add New Video'}
          </h2>

          {/* YouTube URL + Preview */}
          <div>
            <label className="block font-body text-xs text-text-muted mb-1">YouTube URL *</label>
            <input
              type="url"
              value={form.youtube_url}
              onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
              required
            />
            {/* Live Preview */}
            {previewId && (
              <div className="mt-2 relative w-48 rounded-md overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <Image
                  src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`}
                  alt="Video preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A1A1A"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Video title"
                className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
              />
            </div>
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
                required
              >
                <option value="">Select category</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-text-primary text-white text-sm font-body rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : editId ? 'Update' : 'Add Video'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => { setForm(defaultForm); setEditId(null); }}
                className="px-4 py-2 border border-border text-text-muted text-sm font-body rounded-md hover:bg-surface transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Videos List */}
        <div className="space-y-3">
          {!videos ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-border border-t-text-primary rounded-full animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <p className="text-center py-8 font-body text-text-muted text-sm">
              No videos yet. Add one above.
            </p>
          ) : (
            videos.map((video) => (
              <div
                key={video._id}
                className="bg-white border border-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                {/* Thumbnail */}
                <div className="relative w-32 flex-shrink-0 rounded-md overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title || 'Video'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-body text-sm font-semibold text-text-primary truncate">
                      {video.title || 'Untitled'}
                    </p>
                    {!video.is_active && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-body rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-text-muted truncate">
                    {typeof video.category === 'object' ? video.category.name : 'Unknown'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(video)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      video.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={video.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                        video.is_active ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleEdit(video)}
                    className="p-2 text-text-muted hover:text-text-primary transition-colors"
                    title="Edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteVideo(video)}
                    className="p-2 text-text-muted hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteVideo !== null}
        title="Delete Video"
        message={`Are you sure you want to delete <strong>"${deleteVideo?.title || 'this video'}"</strong>?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteVideo(null)}
      />
    </AdminLayout>
  );
}
