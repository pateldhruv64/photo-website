'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { fetcher, apiRequest } from '@/lib/fetcher';

import type { CloudinarySignature } from '@/lib/types';

interface ClientGalleryPhoto {
  _id: string;
  public_id: string;
  width: number;
  height: number;
  title: string;
  order: number;
  original_format?: string;
}

interface ClientGallery {
  _id: string;
  title: string;
  slug: string;
  client_name: string;
  event_date: string | null;
  expires_at: string | null;
  is_active: boolean;
  photoCount: number;
  created_at: string;
  photos: ClientGalleryPhoto[];
}

interface FormData {
  title: string;
  slug: string;
  password: string;
  client_name: string;
  event_date: string;
  expires_at: string;
  is_active: boolean;
}

const defaultForm: FormData = {
  title: '',
  slug: '',
  password: '',
  client_name: '',
  event_date: '',
  expires_at: '',
  is_active: true,
};

export default function AdminClientGalleriesPage() {
  const { data: galleries, mutate } = useSWR<ClientGallery[]>('/admin/client-galleries', fetcher);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [deleteGallery, setDeleteGallery] = useState<ClientGallery | null>(null);
  const [deletePhoto, setDeletePhoto] = useState<ClientGalleryPhoto | null>(null);

  // Photo management state
  const [managePhotosGalleryId, setManagePhotosGalleryId] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragOver, setDragOver] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const selectedGallery = galleries?.find(g => g._id === managePhotosGalleryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        event_date: form.event_date || null,
        expires_at: form.expires_at || null,
      };

      if (editId) {
        if (!payload.password) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _pwd, ...rest } = payload;
          await apiRequest(`/admin/client-galleries/${editId}`, 'PUT', rest);
        } else {
          await apiRequest(`/admin/client-galleries/${editId}`, 'PUT', payload);
        }
      } else {
        await apiRequest('/admin/client-galleries', 'POST', payload);
      }
      setForm(defaultForm);
      setEditId(null);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (gallery: ClientGallery) => {
    setForm({
      title: gallery.title,
      slug: gallery.slug,
      password: '',
      client_name: gallery.client_name,
      event_date: gallery.event_date ? gallery.event_date.split('T')[0] : '',
      expires_at: gallery.expires_at ? gallery.expires_at.split('T')[0] : '',
      is_active: gallery.is_active,
    });
    setEditId(gallery._id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteGallery) return;
    try {
      await apiRequest(`/admin/client-galleries/${deleteGallery._id}`, 'DELETE');
      mutate();
      setDeleteGallery(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gallery');
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${siteUrl}/client/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const autoSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Upload helpers
  const uploadToCloudinary = async (file: File, signature: CloudinarySignature) => {
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

    if (!res.ok) throw new Error('Cloudinary upload failed');
    return res.json();
  };

  const handleUploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0 || !managePhotosGalleryId || !selectedGallery) return;

    setUploadingPhotos(true);
    try {
      const signature = await apiRequest('/admin/cloudinary-signature');
      const uploadedPhotosList = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${file.name}-${i}`;
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        try {
          setUploadProgress((prev) => ({ ...prev, [fileId]: 30 }));
          const result = await uploadToCloudinary(file, signature);
          setUploadProgress((prev) => ({ ...prev, [fileId]: 70 }));

          const fileFormat = result.format || file.name.split('.').pop() || 'jpg';

          uploadedPhotosList.push({
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            title: file.name.replace(/\.[^/.]+$/, ''),
            order: (selectedGallery.photos?.length || 0) + i,
            original_format: fileFormat,
          });

          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          setUploadProgress((prev) => ({ ...prev, [fileId]: -1 }));
        }
      }

      if (uploadedPhotosList.length > 0) {
        await apiRequest(`/admin/client-galleries/${managePhotosGalleryId}/photos`, 'POST', {
          photos: uploadedPhotosList
        });
        mutate();
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
      setTimeout(() => setUploadProgress({}), 3000);
    }
  };

  const handleDeletePhotoConfirm = async () => {
    if (!selectedGallery || !deletePhoto) return;

    try {
      const updatedPhotos = selectedGallery.photos.filter(p => p._id !== deletePhoto._id);
      await apiRequest(`/admin/client-galleries/${selectedGallery._id}`, 'PUT', {
        photos: updatedPhotos
      });
      mutate();
      setDeletePhoto(null);
    } catch {
      alert('Failed to delete photo');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUploadPhotos(e.dataTransfer.files);
  };

  // ═══ Render Manage Photos Panel ═══
  if (managePhotosGalleryId && selectedGallery) {
    return (
      <AdminLayout>
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => setManagePhotosGalleryId(null)}
                className="text-xs font-body text-text-muted hover:text-text-primary flex items-center gap-1 mb-2"
              >
                ← Back to Galleries
              </button>
              <h1 className="font-display text-2xl font-semibold text-text-primary">
                Manage Photos: {selectedGallery.title}
              </h1>
              <p className="font-body text-xs text-text-muted mt-1">
                Client: {selectedGallery.client_name || 'N/A'} · Slug: /client/{selectedGallery.slug}
              </p>
            </div>
          </div>

          {/* Upload Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 mb-8 text-center transition-colors ${
              dragOver ? 'border-text-primary bg-surface/50' : 'border-border bg-white hover:border-text-primary/50'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              onChange={(e) => handleUploadPhotos(e.target.files)}
              className="hidden"
              disabled={uploadingPhotos}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-text-muted">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span className="font-body text-sm font-semibold text-text-primary block mb-1">
                Drag and drop original photos here
              </span>
              <span className="font-body text-xs text-text-muted block">
                or click to browse files (JPEG, PNG, WebP)
              </span>
            </label>

            {uploadingPhotos && (
              <div className="mt-4 max-w-md mx-auto space-y-2">
                <p className="font-body text-xs text-text-muted">Uploading to Cloudinary...</p>
                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-text-primary h-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}
          </div>

          {/* File Upload Progress Grid */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="bg-white border border-border rounded-lg p-4 mb-6 max-h-48 overflow-y-auto space-y-2">
              <p className="font-body text-xs font-semibold text-text-primary">Upload Queue</p>
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="flex items-center justify-between text-xs font-body">
                  <span className="truncate max-w-xs text-text-muted">{fileName}</span>
                  <span>
                    {progress === -1 ? (
                      <span className="text-red-500 font-semibold">Failed</span>
                    ) : progress === 100 ? (
                      <span className="text-green-600 font-semibold">Done</span>
                    ) : (
                      `${progress}%`
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Photos Grid */}
          <h2 className="font-body text-sm font-semibold text-text-primary mb-4">
            Gallery Photos ({selectedGallery.photos?.length || 0})
          </h2>

          {!selectedGallery.photos || selectedGallery.photos.length === 0 ? (
            <div className="bg-white border border-border rounded-lg p-12 text-center">
              <p className="font-body text-sm text-text-muted">
                No photos in this gallery yet. Upload some above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {selectedGallery.photos
                .sort((a, b) => a.order - b.order)
                .map((photo) => (
                  <div key={photo._id} className="bg-white border border-border rounded-md overflow-hidden group relative">
                    <div className="relative aspect-square">
                      <Image
                        src={photo.public_id}
                        alt={photo.title || 'Client Photo'}
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => setDeletePhoto(photo)}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete photo"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-2">
                      <p className="font-body text-[11px] font-semibold text-text-primary truncate" title={photo.title}>
                        {photo.title || 'Untitled'}
                      </p>
                      <p className="font-body text-[9px] text-text-muted mt-0.5 uppercase tracking-wider">
                        Format: {photo.original_format || 'jpg'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  // ═══ Render Client Galleries List ═══
  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="font-display text-2xl font-semibold text-text-primary mb-6">
          Client Galleries
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-body">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-6 mb-8 space-y-4">
          <h2 className="font-body text-sm font-semibold text-text-primary">
            {editId ? 'Edit Gallery Details' : 'Create New Gallery'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Gallery Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm({ ...form, title, slug: editId ? form.slug : autoSlug(title) });
                }}
                className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
                required
              />
            </div>
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Slug (URL) *</label>
              <div className="flex items-center gap-1">
                <span className="text-text-muted text-xs font-body">/client/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="flex-1 px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">
                Password {editId ? '(leave empty to keep)' : '*'}
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editId ? '••••••••' : 'Enter password'}
                className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
                required={!editId}
              />
            </div>
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Client Name</label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
              />
            </div>
            <div>
              <label className="block font-body text-xs text-text-muted mb-1">Event Date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-xs text-text-muted mb-1">Expires At (optional)</label>
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className="w-64 px-3 py-2 border border-border rounded-md font-body text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-text-primary text-white text-sm font-body rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : editId ? 'Update' : 'Create Gallery'}
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

        {/* Galleries List */}
        <div className="space-y-3">
          {!galleries ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-border border-t-text-primary rounded-full animate-spin" />
            </div>
          ) : galleries.length === 0 ? (
            <p className="text-center py-8 font-body text-text-muted text-sm">
              No client galleries yet. Create one above.
            </p>
          ) : (
            galleries.map((g) => (
              <div
                key={g._id}
                className="bg-white border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-body text-sm font-semibold text-text-primary truncate">
                      {g.title}
                    </p>
                    {!g.is_active && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-body rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-text-muted">
                    {g.client_name ? `${g.client_name} · ` : ''}{g.photoCount} photos · /client/{g.slug}
                  </p>
                  {g.expires_at && (
                    <p className="font-body text-[10px] text-red-500 mt-1">
                      Expires: {new Date(g.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Manage Photos Button */}
                  <button
                    onClick={() => setManagePhotosGalleryId(g._id)}
                    className="px-3 py-1.5 bg-surface border border-border text-text-primary text-xs font-body font-semibold rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    Photos ({g.photoCount})
                  </button>

                  {/* Copy Link */}
                  <button
                    onClick={() => copyLink(g.slug)}
                    className="px-3 py-1.5 border border-border text-text-muted text-xs font-body rounded-md hover:bg-surface transition-colors"
                  >
                    {copiedSlug === g.slug ? '✓ Copied' : 'Copy Link'}
                  </button>

                  <button
                    onClick={() => handleEdit(g)}
                    className="p-2 text-text-muted hover:text-text-primary transition-colors"
                    title="Edit Details"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteGallery(g)}
                    className="p-2 text-text-muted hover:text-red-500 transition-colors"
                    title="Delete Gallery"
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
        {/* Delete Gallery Modal */}
        <ConfirmModal
          isOpen={deleteGallery !== null}
          title="Delete Client Gallery"
          message={`Are you sure you want to delete gallery <strong>"${deleteGallery?.title || 'this gallery'}"</strong>? All photos inside it will be permanently removed.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDanger={true}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteGallery(null)}
        />

        {/* Remove Photo from Gallery Modal */}
        <ConfirmModal
          isOpen={deletePhoto !== null}
          title="Remove Photo"
          message={`Are you sure you want to remove <strong>"${deletePhoto?.title || 'this photo'}"</strong> from the gallery?`}
          confirmText="Remove"
          cancelText="Cancel"
          isDanger={true}
          onConfirm={handleDeletePhotoConfirm}
          onClose={() => setDeletePhoto(null)}
        />
      </div>
    </AdminLayout>
  );
}
