/**
 * ─────────────────────────────────────────────────────────────────────
 *  CLEANUP: Photo collection ke purane indexes hatao
 * ─────────────────────────────────────────────────────────────────────
 *  Chalane ka tarika:   npm run fix-indexes
 *
 *  Photo model ke indexes badle gaye hain taki har public query ka
 *  `{ order: 1, created_at: -1 }` sort index se hi serve ho (details
 *  models/Photo.js me likhi hain).
 *
 *  Mongoose naye indexes khud bana leta hai, par PURANE apne aap DROP
 *  nahi karta — wo database me pade rehte hain. Har pade hue index ki
 *  keemat hoti hai: har photo insert/update par Mongo use bhi likhta
 *  hai, aur planner ko zyada options tolne padte hain. Nuksaan nahi
 *  hota, bas faltu kaam hota hai.
 *
 *  Yeh script sirf woh indexes hatati hai jo naye compound indexes ka
 *  prefix ban chuke hain — yaani jinka kaam ab koi doosra index pehle
 *  se kar raha hai. `_id_` aur `public_id` ka unique index kabhi haath
 *  nahi lagte.
 *
 *  Dobara chalana safe hai: jo index maujood nahi hai use chup-chaap
 *  chhod deti hai.
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

/* Purane index ke naam. Mongo index ka default naam field-direction
   jodkar banata hai, isliye yeh naam deterministic hain. */
const OBSOLETE = [
  'category_1',                 // ab {category,order,created_at} ka prefix
  'is_featured_1',              // ab {is_featured,order,created_at} ka prefix
  'created_at_1',               // koi query akele created_at:1 par sort nahi karti
  'category_1_created_at_-1',   // {category,order,created_at} se replace hua
  'is_featured_1_order_1'       // {is_featured,order,created_at} se replace hua
];

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI .env me nahi mila.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  const photos = mongoose.connection.db.collection('photos');
  const existing = (await photos.indexes()).map((i) => i.name);

  let dropped = 0;
  for (const name of OBSOLETE) {
    if (!existing.includes(name)) {
      console.log(`⏭️  ${name} — pehle se nahi hai, skip`);
      continue;
    }
    await photos.dropIndex(name);
    console.log(`🗑️  ${name} — dropped`);
    dropped++;
  }

  const remaining = (await photos.indexes()).map((i) => i.name);
  console.log(`\n✨ ${dropped} index hataye. Ab bache hue indexes:`);
  remaining.forEach((n) => console.log(`   • ${n}`));

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('❌ Index cleanup fail hua:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
