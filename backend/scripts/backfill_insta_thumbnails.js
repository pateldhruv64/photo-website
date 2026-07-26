const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const VideoItem = require('../models/VideoItem');
const { getInstagramThumbnail } = require('../utils/instagram');

async function backfill() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const videos = await VideoItem.find({ platform: 'instagram' });
  console.log(`Found ${videos.length} instagram videos`);

  for (const video of videos) {
    if (!video.thumbnail_url || video.thumbnail_url === '/images/instagram-placeholder.png') {
      console.log(`Fetching thumbnail for video ${video._id} (ID: ${video.youtube_id})...`);
      const thumb = await getInstagramThumbnail(video.youtube_id);
      if (thumb) {
        video.thumbnail_url = thumb;
        await video.save();
        console.log(`Updated thumbnail for ${video._id}: ${thumb}`);
      } else {
        console.log(`Could not fetch thumbnail for ${video._id}`);
      }
    } else {
      console.log(`Video ${video._id} already has thumbnail: ${video.thumbnail_url}`);
    }
  }

  await mongoose.disconnect();
  console.log('Done!');
}

backfill().catch(console.error);
