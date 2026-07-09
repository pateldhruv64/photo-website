'use client';

import { useState } from 'react';
import useSWR from 'swr';
import AdminLayoutClient from '@/components/admin/AdminLayout';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { fetcher, apiRequest } from '@/lib/fetcher';
import type { Category } from '@/lib/types';

export default function CategoriesPage() {
  const { data: categories, mutate } = useSWR<Category[]>('/admin/categories', fetcher, {
    revalidateOnFocus: false,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [categoryWarning, setCategoryWarning] = useState<string | null>(null);

  const handleDeleteClick = (cat: Category) => {
    if (cat.photoCount && cat.photoCount > 0) {
      setCategoryWarning(`Cannot delete "${cat.name}" — it has <strong>${cat.photoCount}</strong> photo(s). Move or delete photos first.`);
      return;
    }
    setDeleteCategory(cat);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCategory) return;
    try {
      await apiRequest(`/admin/categories/${deleteCategory._id}`, 'DELETE');
      mutate();
      setDeleteCategory(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  return (
    <AdminLayoutClient>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-light text-text-primary">Categories</h1>
          <button
            onClick={() => { setEditingCategory(null); setShowForm(true); }}
            className="px-4 py-2 bg-text-primary text-white font-body text-sm rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Category
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-2">
          {categories?.map((cat) => (
            <div
              key={cat._id}
              className="bg-white border border-border rounded-sm p-4 flex items-center justify-between group hover:border-text-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-body text-sm font-medium text-text-primary">{cat.name}</h3>
                    <span className="font-body text-[10px] px-1.5 py-0.5 bg-surface text-text-muted rounded">
                      /{cat.slug}
                    </span>
                    {cat.show_in_navbar && (
                      <span className="font-body text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                        Navbar
                      </span>
                    )}
                    {!cat.is_active && (
                      <span className="font-body text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-text-muted mt-0.5">
                    {cat.photoCount || 0} photos · Order: {cat.navbar_order}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingCategory(cat); setShowForm(true); }}
                  className="p-2 text-text-muted hover:text-text-primary transition-colors"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteClick(cat)}
                  className="p-2 text-text-muted hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {(!categories || categories.length === 0) && (
          <div className="text-center py-16 bg-white border border-border rounded-sm">
            <p className="font-body text-sm text-text-muted">No categories yet. Create one to start organizing photos.</p>
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {showForm && (
          <CategoryFormModal
            category={editingCategory}
            onSave={async (data) => {
              try {
                if (editingCategory) {
                  await apiRequest(`/admin/categories/${editingCategory._id}`, 'PUT', data);
                } else {
                  await apiRequest('/admin/categories', 'POST', data);
                }
                mutate();
                setShowForm(false);
                setEditingCategory(null);
              } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to save category');
              }
            }}
            onClose={() => { setShowForm(false); setEditingCategory(null); }}
          />
        )}
        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteCategory !== null}
          title="Delete Category"
          message={`Are you sure you want to delete category <strong>"${deleteCategory?.name || 'this category'}"</strong>?`}
          confirmText="Delete"
          cancelText="Cancel"
          isDanger={true}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteCategory(null)}
        />

        {/* Warning Alert Modal */}
        <ConfirmModal
          isOpen={categoryWarning !== null}
          title="Cannot Delete Category"
          message={categoryWarning || ''}
          confirmText="OK"
          showCancel={false}
          isDanger={true}
          onConfirm={() => setCategoryWarning(null)}
          onClose={() => setCategoryWarning(null)}
        />
      </div>
    </AdminLayoutClient>
  );
}

// ─── Category Form Modal ──────────────────────────────────────────────
function CategoryFormModal({
  category,
  onSave,
  onClose,
}: {
  category: Category | null;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [description, setDescription] = useState(category?.description || '');
  const [showInNavbar, setShowInNavbar] = useState(category?.show_in_navbar || false);
  const [navbarOrder, setNavbarOrder] = useState(category?.navbar_order || 0);
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [slugEdited, setSlugEdited] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited && !category) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-sm border border-border max-w-md w-full p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-light text-text-primary mb-4">
          {category ? 'Edit Category' : 'New Category'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Wedding Photography"
              className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
            />
          </div>

          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">Slug</label>
            <div className="flex items-center gap-1">
              <span className="font-body text-sm text-text-muted">/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInNavbar}
                onChange={(e) => setShowInNavbar(e.target.checked)}
                className="rounded border-border"
              />
              <span className="font-body text-sm text-text-primary">Show in Navbar</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-border"
              />
              <span className="font-body text-sm text-text-primary">Active</span>
            </label>
          </div>

          {showInNavbar && (
            <div>
              <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">Navbar Order</label>
              <input
                type="number"
                value={navbarOrder}
                onChange={(e) => setNavbarOrder(parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-body text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ name, slug, description, show_in_navbar: showInNavbar, navbar_order: navbarOrder, is_active: isActive })}
            className="px-4 py-2 bg-text-primary text-white font-body text-sm rounded-sm hover:bg-gray-800 transition-colors"
          >
            {category ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
