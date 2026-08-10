/**
 * ─────────────────────────────────────────────────────────────────────
 *  BACKFILL: Instagram reel thumbnails ko Cloudinary par mirror karo
 * ─────────────────────────────────────────────────────────────────────
 *  Chalane ka tarika:   npm run fix-thumbnails
 *
 *  Yeh un sab reels ko theek karta hai jinke thumbnails mar chuke hain.
 *  Kya "mara hua" maana jaata hai:
 *
 *    - khaali thumbnail_url
 *    - purana dead placeholder path (/images/instagram-placeholder.png)
 *    - koi bhi scontent.cdninstagram.com URL — yeh SIGNED hote hain aur
 *      ghanton me expire ho jaate hain. Isi wajah se admin panel me
 *      thumbnail dikhta tha par site par grey box aata tha.
 *
 *  Theek hone ke baad thumbnail Cloudinary par rehta hai — kabhi expire
 *  nahi hoga. Yeh script dobara chalana safe hai; jo pehle se
 *  Cloudinary par hain unhe chhod deti hai.
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const VideoItem = require('../models/VideoItem');
const { mirrorInstagramThumbnail } = require('../utils/instagram');

const isDead = (url) =>
  !url ||
  url === '/images/instagram-placeholder.png' ||
  url.includes('cdninstagram.com') ||
  url.includes('fbcdn.net');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function backfill() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ MongoDB connected\n');

  const videos = await VideoItem.find({ platform: 'instagram' });
  console.log(`Found ${videos.length} Instagram reel(s)\n`);

  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (const video of videos) {
    const label = video.title || video.youtube_id;

    if (!isDead(video.thumbnail_url)) {
      console.log(`⏭️  ${label} — already on Cloudinary, skipping`);
      skipped++;
      continue;
    }

    console.log(`🔄 ${label} — fetching + mirroring…`);
    const mirrored = await mirrorInstagramThumbnail(video.youtube_id);

    if (mirrored?.public_id) {
      video.thumbnail_url = mirrored.url;
      video.thumbnail_public_id = mirrored.public_id;
      await video.save();
      console.log(`✅ ${label} — fixed\n`);
      fixed++;
    } else {
      console.log(`❌ ${label} — Instagram ne thumbnail nahi diya (private/deleted reel?)\n`);
      failed++;
    }

    // Microlink free tier rate-limited hai — thoda ruk kar chalo
    await sleep(1500);
  }

  console.log('─'.repeat(50));
  console.log(`✅ fixed: ${fixed}   ⏭️  skipped: ${skipped}   ❌ failed: ${failed}`);
  if (failed > 0) {
    console.log('\nJo fail hue: admin panel me us reel ko edit karke');
    console.log('manually ek thumbnail image upload kar dein.');
  }

  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error('Backfill crashed:', err);
  process.exit(1);
});
