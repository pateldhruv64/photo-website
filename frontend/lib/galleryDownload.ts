/**
 * ─────────────────────────────────────────────────────────────────────
 *  CLIENT GALLERY — DOWNLOAD ENGINE
 * ─────────────────────────────────────────────────────────────────────
 *
 *  Pehle sab kuch backend se hoke jaata tha:
 *
 *      Cloudinary  →  Render server  →  browser
 *
 *  Matlab har byte do baar travel karta tha, aur Render ke free plan ki
 *  bandwidth poori gallery ka bottleneck ban jaati thi. 200 photos ka
 *  zip 10-15 minute leta tha (ya beech me toot jaata tha), aur ek single
 *  photo bhi 5-10 second.
 *
 *  Ab default raasta hai:
 *
 *      Cloudinary CDN  →  browser        (5 photos ek saath, parallel)
 *
 *  Server sirf tab beech me aata hai jab client ke network par CDN
 *  reachable na ho — us case me neeche `serverZip()` fallback chalta hai.
 *
 *  Teen tarike, best-first:
 *
 *   1. FOLDER  — File System Access API. Client ek folder chunta hai aur
 *                photos SEEDHE us folder me likhi jaati hain. Koi zip
 *                nahi, koi extract nahi, RAM me kuch nahi. Adhoora reh
 *                gaya download dobara chalane par wahin se resume hota
 *                hai. (Chrome / Edge desktop)
 *   2. ZIP     — client-zip se browser me hi zip banti hai. Disk par
 *                stream hoti hai (showSaveFilePicker) ya chhoti gallery
 *                ke liye memory me.
 *   3. SERVER  — backend ka streaming zip. Safari / iOS / purane browser
 *                aur badi galleries ke liye — download manager ise
 *                seedha disk par likhta hai, isliye memory safe hai.
 */

import { makeZip } from 'client-zip';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/** Ek saath itni photos CDN se — isse zyada karne par Chrome khud queue kar deta hai. */
const CONCURRENCY = 5;
const MAX_RETRIES = 2;

/** Bina File System Access ke itni photos tak hi memory-zip safe hai. */
const MEMORY_ZIP_LIMIT = 60;

// ─── Types ───────────────────────────────────────────────────────────

export interface DownloadableItem {
  publicId: string;
  /** Final filename, extension ke saath — `001-Haldi.jpg` */
  name: string;
}

export type DownloadMode = 'folder' | 'zip';

export type DownloadRoute = 'folder' | 'zip-disk' | 'zip-memory' | 'server';

export type DownloadPhase =
  | 'idle'
  | 'choosing'
  | 'downloading'
  | 'finalizing'
  | 'done'
  | 'cancelled'
  | 'error';

export interface DownloadState {
  phase: DownloadPhase;
  route: DownloadRoute | null;
  total: number;
  completed: number;
  skipped: number;
  failed: number;
  bytes: number;
  /** Bytes per second, rolling. 0 = abhi maloom nahi. */
  speed: number;
  currentName: string;
  /** Client ko dikhane wala ek line ka status. */
  message: string;
  failedNames: string[];
}

export const initialDownloadState: DownloadState = {
  phase: 'idle',
  route: null,
  total: 0,
  completed: 0,
  skipped: 0,
  failed: 0,
  bytes: 0,
  speed: 0,
  currentName: '',
  message: '',
  failedNames: [],
};

/** User ne khud cancel kiya — error nahi hai. */
export class DownloadCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'DownloadCancelled';
  }
}

// ─── Filenames ───────────────────────────────────────────────────────
//  ⚠️ Yeh logic backend ke utils/galleryFiles.js se hu-ba-hu match karta
//     hai. Client browser me zip bane ya server par — client ko dono
//     baar bilkul same filenames milne chahiye.

const stripControlChars = (value: string): string =>
  Array.from(value)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code > 31 && code !== 127;
    })
    .join('');

const RESERVED_CHARS = /[\\/:*?"<>|]+/g;

export const sanitizeName = (raw: string | undefined | null): string =>
  stripControlChars(String(raw ?? ''))
    .normalize('NFKD')
    .replace(RESERVED_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
    .slice(0, 80)
    .trim();

/**
 * `001-Haldi-Ceremony.jpg`
 *
 * Number prefix isliye ki client ke folder me photos wahi order me
 * dikhein jo photographer ne set kiya tha.
 */
export const buildPhotoFileName = (
  photo: { title?: string; public_id: string; original_format?: string },
  index: number,
  total: number
): string => {
  const pad = Math.max(3, String(total).length);
  const seq = String(index + 1).padStart(pad, '0');
  const format =
    sanitizeName(photo.original_format).toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const label =
    sanitizeName(photo.title).replace(/\s+/g, '-') ||
    sanitizeName(photo.public_id.split('/').pop()).replace(/\s+/g, '-') ||
    'photo';
  return `${seq}-${label}.${format}`;
};

export const buildGalleryName = (title: string): string =>
  sanitizeName(title).replace(/\s+/g, '_') || 'gallery';

// ─── Cloudinary URLs ─────────────────────────────────────────────────

/** Original file — zero transformations. */
export const originalUrl = (publicId: string): string =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;

/**
 * `fl_attachment` Cloudinary ko bolta hai ki `Content-Disposition:
 * attachment` bheje — matlab browser is URL par jaate hi file ko
 * download manager me daal deta hai, tab kholta nahi. Isse single photo
 * download instant ho jaata hai: na fetch, na blob, na hamara server.
 */
export const attachmentUrl = (publicId: string, filename: string): string => {
  const base = filename.replace(/\.[^.]+$/, '');
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/fl_attachment:${encodeURIComponent(
    base
  )}/${publicId}`;
};

// ─── Capability detection ────────────────────────────────────────────

type DirectoryPicker = (options?: Record<string, unknown>) => Promise<FileSystemDirectoryHandle>;
type FilePicker = (options?: Record<string, unknown>) => Promise<FileSystemFileHandle>;

const pickers = () =>
  window as unknown as {
    showDirectoryPicker?: DirectoryPicker;
    showSaveFilePicker?: FilePicker;
  };

export const canSaveToFolder = (): boolean =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  typeof pickers().showDirectoryPicker === 'function';

export const canStreamZipToDisk = (): boolean =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  typeof pickers().showSaveFilePicker === 'function';

/** User ne file/folder picker cancel kar diya. */
const isAbortError = (err: unknown): boolean =>
  err instanceof DOMException && (err.name === 'AbortError' || err.name === 'NotAllowedError');

// ─── Utilities ───────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 MB';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value >= 100 || i < 2 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
};

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return `${m}m ${s}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const fetchWithRetry = async (url: string, signal: AbortSignal): Promise<Response> => {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal.aborted) throw new DownloadCancelled();
    try {
      const res = await fetch(url, { signal, mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (signal.aborted) throw new DownloadCancelled();
      lastErr = err;
      if (attempt < MAX_RETRIES) await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Fetch failed');
};

/**
 * Ek baar check karta hai ki CDN se seedha download ho sakta hai ya
 * nahi. Kuch corporate/school networks res.cloudinary.com block karte
 * hain — us case me hum chup-chaap server fallback par chale jaate hain
 * bajaye iske ki client ko khaali screen dikhe.
 */
let cdnReachable: boolean | null = null;
export const probeCdn = async (samplePublicId: string): Promise<boolean> => {
  if (cdnReachable !== null) return cdnReachable;
  try {
    // HEAD isliye ki yeh CORS ka "simple request" hai — koi preflight
    // nahi, koi body nahi. Sirf yeh jaanna hai ki CDN pahunch me hai.
    const res = await fetch(originalUrl(samplePublicId), {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit',
    });
    cdnReachable = res.ok;
  } catch {
    cdnReachable = false;
  }
  return cdnReachable;
};

// ─── Single photo ────────────────────────────────────────────────────

const clickDownloadLink = (href: string, filename?: string) => {
  const a = document.createElement('a');
  a.href = href;
  if (filename) a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 0);
};

/**
 * Ek photo download karo.
 *
 * Pehli koshish: seedha CDN link (turant, browser ka apna download
 * manager, progress bhi wahi dikhata hai). CDN block ho to server proxy.
 */
export const downloadSinglePhoto = async (
  slug: string,
  publicId: string,
  token: string,
  filename: string
): Promise<void> => {
  if (await probeCdn(publicId)) {
    clickDownloadLink(attachmentUrl(publicId, filename), filename);
    return;
  }

  const res = await fetch(
    `${API_URL}/client-gallery/${slug}/photo/${encodeURIComponent(publicId)}/download`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    if (res.status === 401) throw new Error('SESSION_EXPIRED');
    throw new Error('Download failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  clickDownloadLink(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

// ─── Progress plumbing ───────────────────────────────────────────────

type Report = (patch: Partial<DownloadState>) => void;

class ProgressTracker {
  private startedAt = Date.now();
  private lastEmit = 0;
  bytes = 0;
  completed = 0;
  skipped = 0;
  failed = 0;
  failedNames: string[] = [];
  currentName = '';

  constructor(private report: Report, private total: number) {}

  addBytes(n: number) {
    this.bytes += n;
    this.throttledEmit();
  }

  fileDone(name: string) {
    this.completed++;
    this.currentName = name;
    this.emit();
  }

  fileSkipped() {
    this.skipped++;
    this.emit();
  }

  fileFailed(name: string) {
    this.failed++;
    if (this.failedNames.length < 25) this.failedNames.push(name);
    this.emit();
  }

  setCurrent(name: string) {
    this.currentName = name;
    this.throttledEmit();
  }

  private throttledEmit() {
    const now = Date.now();
    if (now - this.lastEmit < 200) return;
    this.emit();
  }

  emit() {
    this.lastEmit = Date.now();
    const elapsed = (Date.now() - this.startedAt) / 1000;
    this.report({
      total: this.total,
      completed: this.completed,
      skipped: this.skipped,
      failed: this.failed,
      bytes: this.bytes,
      speed: elapsed > 1 ? this.bytes / elapsed : 0,
      currentName: this.currentName,
      failedNames: [...this.failedNames],
    });
  }
}

/** Bytes ginne ke liye pass-through stream. */
const countingStream = (onBytes: (n: number) => void) =>
  new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      onBytes(chunk.byteLength);
      controller.enqueue(chunk);
    },
  });

/**
 * `concurrency` workers ek shared cursor se kaam uthate hain — isse
 * hamesha utne hi requests in-flight rehte hain, chahe koi file badi ho
 * ya chhoti.
 */
const runPool = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
  signal: AbortSignal
): Promise<void> => {
  let cursor = 0;
  const runner = async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length || signal.aborted) return;
      await worker(items[index], index);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, runner)
  );
};

// ─── Route 1: real folder ────────────────────────────────────────────

const downloadToFolder = async (
  items: DownloadableItem[],
  folderName: string,
  tracker: ProgressTracker,
  report: Report,
  signal: AbortSignal
): Promise<void> => {
  const picker = pickers().showDirectoryPicker;
  if (!picker) throw new Error('No directory picker');

  report({ phase: 'choosing', message: 'Choose where to save your photos…' });

  const root = await picker({
    id: 'client-gallery-download',
    mode: 'readwrite',
    startIn: 'downloads',
  });
  const dir = await root.getDirectoryHandle(folderName, { create: true });

  // Resume: jo files pichhli baar likh chuke hain unhe dobara nahi laate.
  const existing = new Set<string>();
  try {
    for await (const name of (dir as unknown as { keys(): AsyncIterable<string> }).keys()) {
      existing.add(name);
    }
  } catch {
    /* purana implementation — resume ke bina chalega */
  }

  report({
    phase: 'downloading',
    message: existing.size
      ? `Resuming — ${existing.size} photos already saved`
      : `Saving to “${folderName}”`,
  });

  await runPool(
    items,
    CONCURRENCY,
    async (item) => {
      if (existing.has(item.name)) {
        tracker.fileSkipped();
        return;
      }
      tracker.setCurrent(item.name);
      let wroteAnything = false;
      try {
        const res = await fetchWithRetry(originalUrl(item.publicId), signal);
        const handle = await dir.getFileHandle(item.name, { create: true });
        const writable = await handle.createWritable();
        wroteAnything = true;
        if (res.body) {
          await res.body
            .pipeThrough(countingStream((n) => tracker.addBytes(n)))
            .pipeTo(writable);
        } else {
          const blob = await res.blob();
          await writable.write(blob);
          await writable.close();
          tracker.addBytes(blob.size);
        }
        tracker.fileDone(item.name);
      } catch {
        if (signal.aborted) {
          // Adhoori file chhod dena galat hai — agli baar resume use
          // "ho chuki" samajh lega. Isliye use hata dete hain.
          if (wroteAnything) {
            try {
              await dir.removeEntry(item.name);
            } catch {
              /* kabhi kabhi lock rehta hai — chhod do */
            }
          }
          throw new DownloadCancelled();
        }
        tracker.fileFailed(item.name);
      }
    },
    signal
  );

  if (signal.aborted) throw new DownloadCancelled();
};

// ─── Route 2/3: zip banaya browser me ────────────────────────────────

const zipEntryGenerator = async function* (
  items: DownloadableItem[],
  tracker: ProgressTracker,
  signal: AbortSignal
) {
  // client-zip entries ko ek-ek karke consume karta hai, isliye aage se
  // CONCURRENCY files pehle hi fetch karke rakhte hain. Blob browser
  // khud disk par spill kar deta hai, to memory nahi phatati.
  const queue: Promise<{ name: string; blob: Blob | null }>[] = [];
  let next = 0;

  const push = () => {
    if (next >= items.length) return;
    const item = items[next++];
    queue.push(
      (async () => {
        try {
          const res = await fetchWithRetry(originalUrl(item.publicId), signal);
          const blob = await res.blob();
          tracker.addBytes(blob.size);
          return { name: item.name, blob };
        } catch {
          // Yahan se kabhi throw mat karo. Cancel hone par queue me
          // pehle se kai promises pade hote hain — agar wo reject karein
          // to unko koi await nahi karta aur browser "unhandled promise
          // rejection" phenk deta hai. Cancel ka faisla neeche loop
          // `signal.aborted` dekhkar leta hai.
          return { name: item.name, blob: null };
        }
      })()
    );
  };

  for (let i = 0; i < CONCURRENCY; i++) push();

  while (queue.length) {
    if (signal.aborted) throw new DownloadCancelled();
    const result = await queue.shift()!;
    if (signal.aborted) throw new DownloadCancelled();
    push();
    if (!result.blob) {
      tracker.fileFailed(result.name);
      continue;
    }
    tracker.setCurrent(result.name);
    yield { name: result.name, input: result.blob, lastModified: new Date() };
    tracker.fileDone(result.name);
  }
};

const downloadAsZip = async (
  items: DownloadableItem[],
  folderName: string,
  tracker: ProgressTracker,
  report: Report,
  signal: AbortSignal,
  toDisk: boolean
): Promise<void> => {
  let writable: FileSystemWritableFileStream | null = null;

  if (toDisk) {
    report({ phase: 'choosing', message: 'Choose where to save the ZIP…' });
    const picker = pickers().showSaveFilePicker!;
    const handle = await picker({
      id: 'client-gallery-zip',
      suggestedName: `${folderName}.zip`,
      startIn: 'downloads',
      types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }],
    });
    writable = await handle.createWritable();
  }

  report({ phase: 'downloading', message: 'Building your ZIP…' });

  const stream = makeZip(zipEntryGenerator(items, tracker, signal));

  if (writable) {
    try {
      await stream.pipeTo(writable);
    } catch (err) {
      try {
        await writable.abort();
      } catch {
        /* already closed */
      }
      throw err;
    }
    return;
  }

  // Memory zip — sirf chhoti galleries ke liye (upar limit check hota hai).
  const blob = await new Response(stream).blob();
  if (signal.aborted) throw new DownloadCancelled();
  report({ phase: 'finalizing', message: 'Starting download…' });
  const url = URL.createObjectURL(blob);
  clickDownloadLink(url, `${folderName}.zip`);
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
};

// ─── Route 4: server ka streaming zip ────────────────────────────────

const downloadFromServer = async (
  slug: string,
  token: string,
  folderName: string,
  mode: DownloadMode,
  only: string[] | null,
  report: Report,
  signal: AbortSignal
): Promise<void> => {
  report({
    phase: 'downloading',
    message: 'Preparing your ZIP on the server — this can take a few minutes…',
  });

  const endpoint = mode === 'folder' ? 'download-folder' : 'download-all';
  const query = only && only.length ? `?only=${only.map(encodeURIComponent).join(',')}` : '';

  const res = await fetch(`${API_URL}/client-gallery/${slug}/${endpoint}${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('SESSION_EXPIRED');
    throw new Error('Download failed');
  }

  report({ phase: 'finalizing', message: 'Almost done…' });
  const blob = await res.blob();
  if (signal.aborted) throw new DownloadCancelled();

  const url = URL.createObjectURL(blob);
  clickDownloadLink(url, `${folderName}.zip`);
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
};

// ─── Orchestrator ────────────────────────────────────────────────────

export interface StartDownloadOptions {
  slug: string;
  token: string;
  items: DownloadableItem[];
  folderName: string;
  mode: DownloadMode;
  /** Poori gallery hai ya sirf selected photos. */
  isSubset: boolean;
  report: Report;
  signal: AbortSignal;
}

/**
 * Best available route chunta hai aur download chalata hai.
 * Throw karta hai: DownloadCancelled | Error('SESSION_EXPIRED') | Error
 */
export const startGalleryDownload = async ({
  slug,
  token,
  items,
  folderName,
  mode,
  isSubset,
  report,
  signal,
}: StartDownloadOptions): Promise<void> => {
  const tracker = new ProgressTracker(report, items.length);
  report({ ...initialDownloadState, phase: 'choosing', total: items.length });

  const cdnOk = await probeCdn(items[0].publicId);

  // Route decide karo
  let route: DownloadRoute;
  if (!cdnOk) {
    route = 'server';
  } else if (mode === 'folder' && canSaveToFolder()) {
    route = 'folder';
  } else if (canStreamZipToDisk()) {
    route = 'zip-disk';
  } else if (items.length <= MEMORY_ZIP_LIMIT) {
    route = 'zip-memory';
  } else {
    // Bina File System Access ke itni saari photos memory me zip karna
    // browser ko maar dega. Server ka stream download manager ke through
    // seedha disk par jaata hai — dheema hai, par surakshit.
    route = 'server';
  }

  report({ route });

  try {
    if (route === 'folder') {
      await downloadToFolder(items, folderName, tracker, report, signal);
    } else if (route === 'zip-disk' || route === 'zip-memory') {
      await downloadAsZip(
        items,
        folderName,
        tracker,
        report,
        signal,
        route === 'zip-disk'
      );
    } else {
      await downloadFromServer(
        slug,
        token,
        folderName,
        mode,
        isSubset ? items.map((i) => i.publicId) : null,
        report,
        signal
      );
    }
  } catch (err) {
    if (isAbortError(err) || signal.aborted || err instanceof DownloadCancelled) {
      throw new DownloadCancelled();
    }
    throw err;
  }

  tracker.emit();
};
