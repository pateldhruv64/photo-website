const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Download a single photo in original quality (proxied through backend).
 * Creates a temporary anchor element to trigger browser download.
 */
export const downloadSinglePhoto = async (
  slug: string,
  publicId: string,
  token: string,
  filename: string
): Promise<void> => {
  const encodedId = encodeURIComponent(publicId);
  const response = await fetch(
    `${API_URL}/client-gallery/${slug}/photo/${encodedId}/download`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    throw new Error('Download failed');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Download all gallery photos as a flat zip (no folder structure).
 * Uses fetch + blob since Bearer token can't be sent via anchor href.
 */
export const downloadAllPhotos = async (
  slug: string,
  token: string,
  galleryTitle: string
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/client-gallery/${slug}/download-all`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    throw new Error('Download failed');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${galleryTitle.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Download all gallery photos as a zip with gallery-named folder inside.
 */
export const downloadAsFolder = async (
  slug: string,
  token: string,
  galleryTitle: string
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/client-gallery/${slug}/download-folder`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    throw new Error('Download failed');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${galleryTitle.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
