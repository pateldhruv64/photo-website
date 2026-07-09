'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import AdminLayoutClient from '@/components/admin/AdminLayout';
import { fetcher, apiRequest } from '@/lib/fetcher';
import { thumbnailUrl } from '@/lib/cloudinary';
import type { SiteConfig, PaginatedPhotos, Category, CloudinarySignature } from '@/lib/types';

export default function SettingsPage() {
  const { data: config, mutate } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
  });

  const { data: photosData, mutate: mutatePhotos } = useSWR<PaginatedPhotos>('/admin/photos?limit=200', fetcher, {
    revalidateOnFocus: false,
  });

  const { data: categories } = useSWR<Category[]>('/admin/categories', fetcher, {
    revalidateOnFocus: false,
  });

  const photos = photosData?.photos || [];

  const [form, setForm] = useState({
    photographer_name: '',
    hero_title: '',
    hero_subtitle: '',
    hero_photo: '',
    about_text: '',
    contact_email: '',
    social_links: { instagram: '', facebook: '', youtube: '' },
    navbar_links: [] as { label: string; url: string; order: number }[],
    studio_logo: null as { public_id: string; secure_url: string } | null,
    studio_name: '',
    studio_phone: '',
    studio_website: '',
    studio_services_text: '',
    studio_description: '',
    studio_whatsapp: '',
    studio_location_url: '',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const signature = await apiRequest('/admin/cloudinary-signature');
      const result = await uploadToCloudinary(file, signature);

      setForm((prev) => ({
        ...prev,
        studio_logo: {
          public_id: result.public_id as string,
          secure_url: result.secure_url as string,
        },
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload studio logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

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

  const handleHeroPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!categories || categories.length === 0) {
      alert('Please create at least one category in the Categories page before uploading a hero photo.');
      return;
    }

    setUploading(true);
    try {
      const signature = await apiRequest('/admin/cloudinary-signature');
      const result = await uploadToCloudinary(file, signature);

      // Save photo to DB under the first category
      const savedPhoto = await apiRequest('/admin/photos/upload', 'POST', {
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        title: `Hero Background - ${file.name.replace(/\.[^/.]+$/, '')}`,
        category: categories[0]._id,
        is_featured: false,
      });

      // Update form state with the new photo's ID
      updateField('hero_photo', savedPhoto._id);
      
      // Mutate photos so the select dropdown also updates with the new photo
      mutatePhotos();
    } catch (err) {
      console.error(err);
      alert('Failed to upload hero photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Populate form when config loads
  useEffect(() => {
    if (config) {
      setForm({
        photographer_name: config.photographer_name || '',
        hero_title: config.hero_title || '',
        hero_subtitle: config.hero_subtitle || '',
        hero_photo: config.hero_photo?._id || '',
        about_text: config.about_text || '',
        contact_email: config.contact_email || '',
        social_links: {
          instagram: config.social_links?.instagram || '',
          facebook: config.social_links?.facebook || '',
          youtube: config.social_links?.youtube || '',
        },
        navbar_links: config.navbar_links || [],
        studio_logo: config.studio_logo || null,
        studio_name: config.studio_name || '',
        studio_phone: config.studio_phone || '',
        studio_website: config.studio_website || '',
        studio_services_text: config.studio_services?.join(', ') || '',
        studio_description: config.studio_description || '',
        studio_whatsapp: config.studio_whatsapp || '',
        studio_location_url: config.studio_location_url || '',
      });
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = { ...form } as Record<string, unknown>;
      delete payload.studio_services_text;
      
      payload.hero_photo = form.hero_photo || null;
      payload.studio_services = form.studio_services_text
        ? form.studio_services_text.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await apiRequest('/admin/config', 'PUT', payload as unknown as Record<string, unknown>);
      mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSocial = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      social_links: { ...prev.social_links, [key]: value },
    }));
  };

  const addNavLink = () => {
    setForm((prev) => ({
      ...prev,
      navbar_links: [...prev.navbar_links, { label: '', url: '', order: prev.navbar_links.length }],
    }));
  };

  const updateNavLink = (index: number, field: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      navbar_links: prev.navbar_links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const removeNavLink = (index: number) => {
    setForm((prev) => ({
      ...prev,
      navbar_links: prev.navbar_links.filter((_, i) => i !== index),
    }));
  };

  return (
    <AdminLayoutClient>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="font-display text-2xl font-light text-text-primary">Settings</h1>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="font-body text-sm text-green-600 animate-fade-in">
                ✓ Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-text-primary text-white font-body text-sm rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50 text-center"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* General */}
          <section className="bg-white border border-border rounded-sm p-6">
            <h2 className="font-body text-sm font-medium text-text-primary mb-4">General</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                  Photographer Name
                </label>
                <input
                  type="text"
                  value={form.photographer_name}
                  onChange={(e) => updateField('photographer_name', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                />
              </div>
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => updateField('contact_email', e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                />
              </div>
            </div>
          </section>

          {/* Hero Section */}
          <section className="bg-white border border-border rounded-sm p-6">
            <h2 className="font-body text-sm font-medium text-text-primary mb-4">Hero Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={form.hero_title}
                  onChange={(e) => updateField('hero_title', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                />
              </div>
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                  Hero Subtitle
                </label>
                <input
                  type="text"
                  value={form.hero_subtitle}
                  onChange={(e) => updateField('hero_subtitle', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                />
              </div>
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                  Hero Background Photo
                </label>
                
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <select
                    value={form.hero_photo}
                    onChange={(e) => updateField('hero_photo', e.target.value)}
                    className="w-full sm:flex-1 px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary bg-white h-10"
                  >
                    <option value="">No Background Photo (Use Gradient)</option>
                    {photos.map((photo) => (
                      <option key={photo._id} value={photo._id}>
                        {photo.title || 'Untitled'}
                      </option>
                    ))}
                  </select>

                  <label className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-text-primary text-text-primary rounded-sm font-body text-sm hover:bg-gray-50 transition-colors h-10 w-auto flex-shrink-0 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {uploading ? 'Uploading...' : 'Upload New'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroPhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                {form.hero_photo && (
                  <div className="mt-3 relative w-32 h-20 rounded-sm overflow-hidden border border-border">
                    {(() => {
                      const selectedPhoto = photos.find((p) => p._id === form.hero_photo);
                      if (selectedPhoto) {
                        return (
                          <img
                            src={thumbnailUrl(selectedPhoto.public_id, 200)}
                            alt="Selected Hero"
                            className="object-cover w-full h-full"
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* About */}
          <section className="bg-white border border-border rounded-sm p-6">
            <h2 className="font-body text-sm font-medium text-text-primary mb-4">About</h2>
            <div>
              <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                About Text
              </label>
              <textarea
                value={form.about_text}
                onChange={(e) => updateField('about_text', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary resize-none"
              />
            </div>
          </section>

          {/* Social Links */}
          <section className="bg-white border border-border rounded-sm p-6">
            <h2 className="font-body text-sm font-medium text-text-primary mb-4">Social Links</h2>
            <div className="space-y-4">
              {(['instagram', 'facebook', 'youtube'] as const).map((platform) => (
                <div key={platform}>
                  <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </label>
                  <input
                    type="url"
                    value={form.social_links[platform]}
                    onChange={(e) => updateSocial(platform, e.target.value)}
                    placeholder={`https://${platform}.com/...`}
                    className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Studio Details Box (Lightbox Overlay) */}
          <section className="bg-white border border-border rounded-sm p-6">
            <h2 className="font-body text-sm font-medium text-text-primary mb-4">Studio Details Box (Lightbox Overlay)</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                  Studio Logo
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    {form.studio_logo?.secure_url ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-border bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
                        <img
                          src={form.studio_logo.secure_url}
                          alt="Studio Logo"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-hover-surface border border-border border-dashed flex items-center justify-center text-text-muted font-body text-[10px] flex-shrink-0">
                        No Logo
                      </div>
                    )}
                    <span className="font-body text-xs text-text-muted sm:hidden">
                      {form.studio_logo ? 'Current Studio Logo' : 'No Logo Uploaded'}
                    </span>
                  </div>

                  <label className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-text-primary text-text-primary rounded-sm font-body text-sm hover:bg-gray-50 transition-colors h-10 w-full sm:w-auto ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                  Studio/Business Name
                </label>
                <input
                  type="text"
                  value={form.studio_name}
                  onChange={(e) => updateField('studio_name', e.target.value)}
                  placeholder="e.g. Digital Photography"
                  className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={form.studio_phone}
                    onChange={(e) => updateField('studio_phone', e.target.value)}
                    placeholder="e.g. +91 9999999999"
                    className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={form.studio_website}
                    onChange={(e) => updateField('studio_website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                  Services Offered (Comma separated)
                </label>
                <input
                  type="text"
                  value={form.studio_services_text}
                  onChange={(e) => updateField('studio_services_text', e.target.value)}
                  placeholder="Wedding Shoot, Pre Wedding Shoot, Candid Shoot"
                  className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                />
              </div>

              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                  Description / Subtext
                </label>
                <textarea
                  value={form.studio_description}
                  onChange={(e) => updateField('studio_description', e.target.value)}
                  placeholder="All Type Of Photography & Videography"
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                    WhatsApp Link/Number
                  </label>
                  <input
                    type="text"
                    value={form.studio_whatsapp}
                    onChange={(e) => updateField('studio_whatsapp', e.target.value)}
                    placeholder="WhatsApp chat link or phone number"
                    className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-wider uppercase text-text-muted mb-1.5">
                    Google Maps Location URL
                  </label>
                  <input
                    type="url"
                    value={form.studio_location_url}
                    onChange={(e) => updateField('studio_location_url', e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Custom Navbar Links */}
          <section className="bg-white border border-border rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-body text-sm font-medium text-text-primary">Custom Navbar Links</h2>
              <button
                onClick={addNavLink}
                className="font-body text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Link
              </button>
            </div>

            {form.navbar_links.length === 0 ? (
              <p className="font-body text-xs text-text-muted">No custom links. Click &quot;Add Link&quot; to add one.</p>
            ) : (
              <div className="space-y-3">
                {form.navbar_links.map((link, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface/40 p-3 sm:p-0 rounded-sm border border-border/40 sm:border-none">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateNavLink(i, 'label', e.target.value)}
                        placeholder="Label"
                        className="px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateNavLink(i, 'url', e.target.value)}
                        placeholder="/about or https://..."
                        className="px-3 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex items-center gap-1.5">
                        <span className="font-body text-xs text-text-muted sm:hidden">Order:</span>
                        <input
                          type="number"
                          value={link.order}
                          onChange={(e) => updateNavLink(i, 'order', parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-2 border border-border rounded-sm font-body text-sm focus:outline-none focus:border-text-primary"
                          title="Order"
                        />
                      </div>
                      <button
                        onClick={() => removeNavLink(i)}
                        className="p-2 text-text-muted hover:text-red-500 transition-colors flex items-center justify-center rounded border border-border sm:border-none w-10 sm:w-auto h-9 sm:h-auto"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayoutClient>
  );
}
