'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import AdminLayoutClient from '@/components/admin/AdminLayout';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { fetcher, apiRequest } from '@/lib/fetcher';
import { thumbnailUrl } from '@/lib/cloudinary';
import type { Photo, Category, PaginatedPhotos, CloudinarySignature } from '@/lib/types';

export default function PhotosPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [deletePhoto, setDeletePhoto] = useState<Photo | null>(null);

  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: photosData, mutate: mutatePhotos } = useSWR<PaginatedPhotos>(
    `/admin/photos?page=${page}&limit=${limit}${selectedCategory ? `&category=${selectedCategory}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: categories } = useSWR<Category[]>('/admin/categories', fetcher, {
    revalidateOnFocus: false,
  });

  const photos = photosData?.photos || [];

  // Upload file to Cloudinary
  const uploadToCloudinary = async (file: File, signature: CloudinarySignature): Promise<Record<string, unknown>> => {
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

  // Handle file upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!categories || categories.length === 0) {
      alert('Please create a category first before uploading photos.');
      return;
    }

    setUploading(true);
    const defaultCategory = selectedCategory || categories[0]._id;

    try {
      // Get signed upload params
      const signature = await apiRequest('/admin/cloudinary-signature');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${file.name}-${i}`;
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        try {
          // Upload to Cloudinary
          setUploadProgress((prev) => ({ ...prev, [fileId]: 30 }));
          const result = await uploadToCloudinary(file, signature);
          setUploadProgress((prev) => ({ ...prev, [fileId]: 70 }));

          // Save metadata to our DB
          await apiRequest('/admin/photos/upload', 'POST', {
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            category: defaultCategory,
            is_featured: false,
          });

          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          setUploadProgress((prev) => ({ ...prev, [fileId]: -1 }));
        }
      }

      // Refresh photos list
      mutatePhotos();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to get upload signature. Please try again.');
    } finally {
      setUploading(false);
      // Clear progress after a delay
      setTimeout(() => setUploadProgress({}), 3000);
    }
  };

  // Delete photo
  const handleDeleteConfirm = async () => {
    if (!deletePhoto) return;

    try {
      await apiRequest(`/admin/photos/${deletePhoto._id}`, 'DELETE');
      mutatePhotos();
      setDeletePhoto(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete photo');
    }
  };

  // Update photo
  const handleUpdate = async (photo: Photo, updates: Partial<Photo>) => {
    try {
      await apiRequest(`/admin/photos/${photo._id}`, 'PUT', updates as unknown as Record<string, unknown>);
      mutatePhotos();
      setEditingPhoto(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update photo');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <AdminLayoutClient>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-light text-text-primary">Photos</h1>
          <div className="flex items-center gap-3">
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-border rounded-sm font-body text-sm text-text-primary focus:outline-none focus:border-text-primary"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          className={`drop-zone mb-6 ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            input.onchange = (e) => handleUpload((e.target as HTMLInputElement).files);
            input.click();
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5" className="mx-auto mb-3">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="font-body text-sm text-text-muted">
            {uploading ? 'Uploading...' : 'Drag & drop photos or click to browse'}
          </p>
          <p className="font-body text-xs text-text-muted mt-1">
            Uploads directly to Cloudinary CDN
          </p>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-6 space-y-2">
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="bg-white border border-border rounded-sm p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-xs text-text-muted truncate max-w-[200px]">
                    {fileId.split('-').slice(0, -1).join('-')}
                  </span>
                  <span className="font-body text-xs text-text-muted">
                    {progress === -1 ? 'Failed' : progress === 100 ? 'Done' : `${progress}%`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress === -1 ? 'bg-red-400' : progress === 100 ? 'bg-green-400' : 'bg-text-primary'
                    }`}
                    style={{ width: `${Math.max(0, progress)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map((photo) => (
            <div key={photo._id} className="group relative bg-white border border-border rounded-sm overflow-hidden">
              <div
                className="relative"
                style={{ aspectRatio: `${photo.width}/${photo.height}`, maxHeight: '200px' }}
              >
                <Image
                  src={thumbnailUrl(photo.public_id, 300)}
                  alt={photo.title || 'Photo'}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/25 lg:bg-black/0 lg:group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                  <button
                    onClick={() => setEditingPhoto(photo)}
                    className="p-2 bg-white rounded-full text-text-primary hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeletePhoto(photo)}
                    className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>

                {/* Featured badge */}
                {photo.is_featured && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-yellow-400 text-[10px] font-body font-medium rounded-sm">
                    ★
                  </div>
                )}
              </div>

              <div className="p-2">
                <p className="font-body text-xs text-text-primary truncate">{photo.title || 'Untitled'}</p>
                <p className="font-body text-[10px] text-text-muted">
                  {typeof photo.category === 'object' ? (photo.category as Category).name : ''}
                </p>
              </div>
            </div>
          ))}
        </div>

        {photos.length === 0 && !uploading && (
          <div className="text-center py-16">
            <p className="font-body text-sm text-text-muted">No photos yet. Upload some to get started!</p>
          </div>
        )}

        {/* Pagination Controls */}
        {photosData?.pagination && photosData.pagination.pages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-6">
            <p className="font-body text-xs text-text-muted">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, photosData.pagination.total)} of {photosData.pagination.total} photos
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 font-body text-xs rounded border border-border bg-white text-text-primary hover:bg-surface disabled:opacity-40 disabled:hover:bg-white transition-all"
              >
                Previous
              </button>
              
              {/* Page Number Buttons */}
              {Array.from({ length: photosData.pagination.pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === photosData.pagination.pages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <div key={p} className="flex items-center gap-1.5">
                      {showEllipsis && <span className="text-text-muted px-1 text-xs font-body">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 font-body text-xs rounded border transition-all ${
                          page === p
                            ? 'bg-text-primary text-white border-text-primary font-medium'
                            : 'bg-white text-text-primary border-border hover:bg-surface'
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}

              <button
                onClick={() => setPage(prev => Math.min(photosData.pagination.pages, prev + 1))}
                disabled={page === photosData.pagination.pages}
                className="px-3 py-1.5 font-body text-xs rounded border border-border bg-white text-text-primary hover:bg-surface disabled:opacity-40 disabled:hover:bg-white transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingPhoto && (
          <EditPhotoModal
            photo={editingPhoto}
            categories={categories || []}
            onSave={(updates) => handleUpdate(editingPhoto, updates)}
            onClose={() => setEditingPhoto(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deletePhoto !== null}
          title="Delete Photo"
          message={`Are you sure you want to delete <strong>"${deletePhoto?.title || 'this photo'}"</strong>? This will permanently remove it from Cloudinary and the database.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDanger={true}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletePhoto(null)}
        />
      </div>
    </AdminLayoutClient>
  );
}

// ─── Edit Photo Modal ─────────────────────────────────────────────────
function EditPhotoModal({
  photo,
  categories,
  onSave,
  onClose,
}: {
  photo: Photo;
  categories: Category[];
  onSave: (updates: Partial<Photo>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(photo.title);
  const [category, setCategory] = useState(
    typeof photo.category === 'object' ? photo.category._id : photo.category
  );
  const [isFeatured, setIsFeatured] = useState(photo.is_featured);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-sm border border-border max-w-md w-full p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-light text-text-primary mb-4">Edit Photo</h3>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
            />
          </div>

          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-border"
            />
            <span className="font-body text-sm text-text-primary">Featured photo</span>
          </label>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-body text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ title, category, is_featured: isFeatured })}
            className="px-4 py-2 bg-text-primary text-white font-body text-sm rounded-sm hover:bg-gray-800 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
