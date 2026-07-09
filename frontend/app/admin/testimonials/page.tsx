'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { fetcher, apiRequest } from '@/lib/fetcher';

interface Testimonial {
  _id: string;
  client_name: string;
  event_type: string;
  review_text: string;
  rating: number;
  photo_url: string;
  is_active: boolean;
  created_at: string;
}

interface FormData {
  client_name: string;
  event_type: string;
  review_text: string;
  rating: number;
  is_active: boolean;
  photo_url: string;
}

const defaultForm: FormData = {
  client_name: '',
  event_type: '',
  review_text: '',
  rating: 5,
  is_active: true,
  photo_url: '',
};

export default function AdminTestimonialsPage() {
  const { data: testimonials, mutate } = useSWR<Testimonial[]>('/admin/testimonials', fetcher);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [deleteTestimonial, setDeleteTestimonial] = useState<Testimonial | null>(null);

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const signature = await apiRequest('/admin/cloudinary-signature');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.api_key);
      formData.append('timestamp', signature.timestamp.toString());
      formData.append('signature', signature.signature);
      formData.append('folder', signature.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloud_name}/auto/upload`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setForm((prev) => ({ ...prev, photo_url: data.secure_url }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editId) {
        await apiRequest(`/admin/testimonials/${editId}`, 'PUT', form);
      } else {
        await apiRequest('/admin/testimonials', 'POST', form);
      }
      setForm(defaultForm);
      setEditId(null);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save testimonial');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setForm({
      client_name: testimonial.client_name,
      event_type: testimonial.event_type,
      review_text: testimonial.review_text,
      rating: testimonial.rating,
      is_active: testimonial.is_active,
      photo_url: testimonial.photo_url || '',
    });
    setEditId(testimonial._id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTestimonial) return;

    try {
      await apiRequest(`/admin/testimonials/${deleteTestimonial._id}`, 'DELETE');
      mutate();
      setDeleteTestimonial(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete testimonial');
    }
  };

  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      await apiRequest(`/admin/testimonials/${testimonial._id}`, 'PUT', {
        is_active: !testimonial.is_active,
      });
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update testimonial');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="font-display text-2xl font-semibold text-text-primary mb-6">
          Testimonials
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-body">
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-6 mb-8 space-y-4">
          <h2 className="font-body text-sm font-semibold text-text-primary">
            {editId ? 'Edit Testimonial' : 'Add New Testimonial'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Client Name *</label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
                required
              />
            </div>
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Event Type *</label>
              <input
                type="text"
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                placeholder="e.g. Wedding, Pre-Wedding"
                className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-xs text-text-muted mb-1">Review *</label>
            <textarea
              value={form.review_text}
              onChange={(e) => setForm({ ...form, review_text: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20 resize-none"
              required
            />
          </div>

          {/* Client Profile Photo Uploader */}
          <div className="border border-border rounded-md p-4 bg-surface/30">
            <label className="block font-body text-xs font-semibold text-text-muted mb-2">Client Profile Photo</label>
            <div className="flex items-center gap-4">
              {form.photo_url ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden border border-border bg-white flex-shrink-0">
                  <Image
                    src={form.photo_url}
                    alt="Client preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, photo_url: '' }))}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity text-[10px] font-body"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-text-muted bg-white text-xs font-body flex-shrink-0">
                  No Image
                </div>
              )}
              
              <div className="flex-1">
                <input
                  type="file"
                  id="client-photo"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <label
                  htmlFor="client-photo"
                  className={`inline-block px-3 py-1.5 border border-border rounded-md font-body text-xs text-text-primary bg-white hover:bg-neutral-50 cursor-pointer shadow-sm ${
                    uploadingPhoto ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {uploadingPhoto ? 'Uploading...' : 'Choose Image'}
                </label>
                <p className="text-[10px] font-body text-text-muted mt-1">
                  Upload square-cropped client portrait for best visual styling
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Star Rating Selector */}
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className={`text-xl transition-colors ${
                      star <= form.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Active</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  form.is_active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    form.is_active ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || uploadingPhoto}
              className="px-4 py-2 bg-text-primary text-white text-sm font-body rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : editId ? 'Update' : 'Add Testimonial'}
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

        {/* Testimonials List */}
        <div className="space-y-3">
          {!testimonials ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-border border-t-text-primary rounded-full animate-spin" />
            </div>
          ) : testimonials.length === 0 ? (
            <p className="text-center py-8 font-body text-text-muted text-sm">
              No testimonials yet. Add one above.
            </p>
          ) : (
            testimonials.map((t) => (
              <div
                key={t._id}
                className="bg-white border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                {/* Profile Photo */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border bg-surface flex-shrink-0">
                  {t.photo_url ? (
                    <Image
                      src={t.photo_url}
                      alt={t.client_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-text-muted font-body">
                      No Photo
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-body text-sm font-semibold text-text-primary truncate">
                      {t.client_name}
                    </p>
                    <span className="px-2 py-0.5 bg-surface text-text-muted text-[10px] font-body rounded-full">
                      {t.event_type}
                    </span>
                    {!t.is_active && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-body rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="font-body text-sm text-text-muted line-clamp-2">{t.review_text}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`text-xs ${s <= t.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(t)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      t.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={t.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                        t.is_active ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleEdit(t)}
                    className="p-2 text-text-muted hover:text-text-primary transition-colors"
                    title="Edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTestimonial(t)}
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
        isOpen={deleteTestimonial !== null}
        title="Delete Testimonial"
        message={`Are you sure you want to delete the testimonial from <strong>"${deleteTestimonial?.client_name || 'this client'}"</strong>?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTestimonial(null)}
      />
    </AdminLayout>
  );
}
