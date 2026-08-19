/**
 * ─────────────────────────────────────────────────────────────────────
 *  CLIENT GALLERY — FILE NAMING + ZIP STREAMING
 * ─────────────────────────────────────────────────────────────────────
 *  Yeh module do kaam karta hai:
 *
 *  1. Har photo ka ek predictable, sorted filename banata hai. Frontend
 *     me bilkul yahi logic dobara likha hai (lib/galleryDownload.ts),
 *     taki zip browser me bane ya server par — dono jagah filenames
 *     identical rahein.
 *
 *  2. Gallery ka zip client tak stream karta hai — bounded concurrency
 *     ke saath.
 *
 *  ⚠️ Purana code kyun fail hota tha:
 *     Loop me har photo ka axios stream turant khol diya jaata tha aur
 *     `archive.append(stream)` kar diya jaata tha. Archiver in streams ko
 *     EK-EK karke consume karta hai, isliye 200 photos wali gallery me
 *     200 HTTP connections khul kar idle padi rehti thi — Cloudinary
 *     unhe timeout kar deta tha, zip beech me toot jaata tha, aur client
 *     ko corrupt/adhoora file milti thi. Isi wajah se "folder download
 *     hota hi nahi" wali complaint aati thi.
 *
 *     Ab: ek time par sirf CONCURRENCY photos fetch hoti hain, buffer me
 *     aati hain, aur archiver ke aage sirf ek chhoti si queue rehti hai
 *     (backpressure) — na memory phatati hai, na connections.
 */

const axios = require('axios');
const archiver = require('archiver');

const CONCURRENCY = 5;          // ek saath itni photos CDN se
const QUEUE_AHEAD = 2;          // archiver se itni entries aage tak hi
const FETCH_TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ASCII control characters filenames me kabhi nahi jaane chahiye. */
const stripControlChars = (value) =>
  Array.from(value)
    .filter((ch) => {
      const code = ch.codePointAt(0);
      return code > 31 && code !== 127;
    })
    .join('');

/** Windows / macOS dono par filename me allowed nahi. */
const RESERVED_CHARS = /[\\/:*?"<>|]+/g;

/** Filename ko har OS par safe banao (Windows sabse sakht hai). */
const sanitize = (raw) =>
  stripControlChars(String(raw || ''))
    .normalize('NFKD')
    .replace(RESERVED_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')               // trailing dot/space Windows todta hai
    .slice(0, 80)
    .trim();

/**
 * `001-Haldi-Ceremony.jpg` jaisa naam.
 *
 * Index prefix isliye hai ki client ke folder me photos wahi order me
 * dikhein jo photographer ne gallery me set kiya tha — warna Cloudinary
 * ke random public_id ke hisaab se bikhri hui aati thi.
 */
const buildPhotoFileName = (photo, index, total) => {
  const pad = Math.max(3, String(total).length);
  const seq = String(index + 1).padStart(pad, '0');
  const format = (sanitize(photo.original_format).toLowerCase() || 'jpg').replace(/[^a-z0-9]/g, '') || 'jpg';
  const label =
    sanitize(photo.title).replace(/\s+/g, '-') ||
    sanitize(String(photo.public_id).split('/').pop()).replace(/\s+/g, '-') ||
    'photo';
  return `${seq}-${label}.${format}`;
};

/** Gallery title se folder/zip ka naam. */
const buildGalleryName = (title) => sanitize(title).replace(/\s+/g, '_') || 'gallery';

/** Original file ka Cloudinary URL — zero transformations. */
const originalUrl = (publicId) =>
  `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;

/** Ek photo buffer me laao, retry ke saath. */
const fetchPhotoBuffer = async (publicId, signal) => {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await axios.get(originalUrl(publicId), {
        responseType: 'arraybuffer',
        timeout: FETCH_TIMEOUT_MS,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        signal,
      });
      return Buffer.from(res.data);
    } catch (err) {
      lastErr = err;
      if (signal && signal.aborted) throw err;
      if (attempt < MAX_RETRIES) await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr;
};

/**
 * Gallery ka zip client tak stream karta hai.
 *
 * @param {object}    opts
 * @param {object}    opts.req
 * @param {object}    opts.res
 * @param {object}    opts.gallery     ClientGallery lean doc
 * @param {boolean}   opts.withFolder  true = zip ke andar ek folder
 * @param {string[]=} opts.only        sirf in public_ids ko zip karo
 */
const streamGalleryZip = async ({ req, res, gallery, withFolder, only }) => {
  const galleryName = buildGalleryName(gallery.title);

  const ordered = [...(gallery.photos || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  // `only` ke case me bhi gallery ka original order aur numbering bani rahe,
  // isliye filter poore ordered list par lagta hai — index nahi badalta.
  const selected = new Set(Array.isArray(only) && only.length ? only : []);
  const entries = ordered
    .map((photo, index) => ({
      photo,
      name: buildPhotoFileName(photo, index, ordered.length),
    }))
    .filter((e) => (selected.size ? selected.has(e.photo.public_id) : true));

  if (!entries.length) {
    return res.status(404).json({ error: 'No photos to download.' });
  }

  const controller = new AbortController();
  let aborted = false;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${galleryName}.zip"`);
  res.setHeader('Cache-Control', 'no-store, no-transform');
  // Nginx/Render ke reverse proxy ko bolo ki stream buffer mat karo,
  // warna client ko bytes tabhi milte hain jab poora zip ban chuka ho.
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  // JPEG/PNG pehle se compressed hain — level 0 (store) sabse tez hai
  // aur CPU par sabse halka. Compression yahan sirf time barbaad karta.
  const archive = archiver('zip', { zlib: { level: 0 }, store: true });

  let archiveFailed = false;
  archive.on('error', (err) => {
    archiveFailed = true;
    console.error('[gallery-zip] archiver error:', err.message);
    controller.abort();
    res.destroy(err);
  });
  archive.on('warning', (err) => {
    console.warn('[gallery-zip] archiver warning:', err.message);
  });

  // Client ne tab band kar diya / download cancel kiya — sab rok do.
  req.on('close', () => {
    if (res.writableEnded) return;
    aborted = true;
    controller.abort();
    try { archive.abort(); } catch { /* already finished */ }
  });

  archive.pipe(res);

  // ── Backpressure: archiver se sirf QUEUE_AHEAD entries aage rehna hai ──
  let appended = 0;
  let written = 0;
  let drainResolve = null;
  archive.on('entry', () => {
    written++;
    if (drainResolve) {
      const resolve = drainResolve;
      drainResolve = null;
      resolve();
    }
  });
  const waitForRoom = async () => {
    while (appended - written > QUEUE_AHEAD && !aborted && !archiveFailed) {
      await new Promise((resolve) => {
        drainResolve = resolve;
        setTimeout(resolve, 5000); // safety net — kabhi hang na ho
      });
    }
  };

  // ── Bounded prefetch window ──
  const inFlight = new Map();
  let nextToStart = 0;
  const startNext = () => {
    if (nextToStart >= entries.length || aborted) return;
    const index = nextToStart++;
    inFlight.set(
      index,
      fetchPhotoBuffer(entries[index].photo.public_id, controller.signal).catch((err) => {
        if (!aborted) {
          console.error(
            `[gallery-zip] skip ${entries[index].photo.public_id}: ${err.message}`
          );
        }
        return null;
      })
    );
  };
  for (let i = 0; i < CONCURRENCY; i++) startNext();

  let failures = 0;
  for (let i = 0; i < entries.length; i++) {
    if (aborted || archiveFailed) break;

    const buffer = await inFlight.get(i);
    inFlight.delete(i);
    startNext();

    if (aborted || archiveFailed) break;

    if (!buffer) {
      failures++;
      continue;
    }

    const name = withFolder ? `${galleryName}/${entries[i].name}` : entries[i].name;
    archive.append(buffer, { name, date: gallery.event_date || undefined });
    appended++;
    await waitForRoom();
  }

  if (aborted || archiveFailed) {
    try { archive.abort(); } catch { /* already gone */ }
    return;
  }

  if (failures) {
    archive.append(
      Buffer.from(
        `${failures} photo(s) could not be fetched from the CDN and were skipped.\n` +
        `Please run the download again, or contact your photographer.\n`,
        'utf8'
      ),
      { name: withFolder ? `${galleryName}/_MISSING_FILES.txt` : '_MISSING_FILES.txt' }
    );
  }

  await archive.finalize();
};

module.exports = {
  sanitize,
  buildPhotoFileName,
  buildGalleryName,
  originalUrl,
  streamGalleryZip,
};
