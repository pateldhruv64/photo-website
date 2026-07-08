/**
 * Admin Add Script
 * Usage: node admin-add.js <username> <password>
 * Example: node admin-add.js admin admin123
 * 
 * Run: npm run admin-add -- <username> <password>
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const SiteConfig = require('./models/SiteConfig');

const addAdmin = async () => {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node admin-add.js <username> <password>');
    console.log('Example: node admin-add.js admin admin123');
    process.exit(1);
  }

  const [username, password] = args;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Check if admin already exists
    const existing = await Admin.findOne({ username: username.toLowerCase() });
    if (existing) {
      console.log(`⚠️  Admin "${username}" already exists. Updating password...`);
      existing.password = password;
      await existing.save();
      console.log(`✅ Password updated for admin "${username}"`);
    } else {
      await Admin.create({ username: username.toLowerCase(), password });
      console.log(`✅ Admin "${username}" created successfully`);
    }

    // Ensure default site config exists
    const configExists = await SiteConfig.findOne();
    if (!configExists) {
      await SiteConfig.create({
        photographer_name: 'Photographer',
        hero_title: 'Capturing Moments',
        hero_subtitle: 'Photography that tells your story'
      });
      console.log('✅ Default site config created');
    } else {
      console.log('ℹ️  Site config already exists');
    }

    console.log('\n🎉 Done! You can now login at /admin/login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

addAdmin();
