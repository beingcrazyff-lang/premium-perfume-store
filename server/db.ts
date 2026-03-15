import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const dbExists = fs.existsSync(dbPath);
console.log(`Database exists: ${dbExists} at ${dbPath}`);
const db = new Database(dbPath);

// Initialize Database Schema
if (!dbExists) {
  console.log('Database file does not exist. Creating new database...');
}
console.log('Creating tables if not exist...');
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    size TEXT NOT NULL,
    image TEXT NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    top_notes TEXT,
    heart_notes TEXT,
    base_notes TEXT,
    price_6ml REAL NOT NULL DEFAULT 320,
    price_10ml REAL NOT NULL DEFAULT 540,
    price_30ml REAL NOT NULL DEFAULT 729,
    is_combo INTEGER DEFAULT 0,
    combo_items TEXT
  );
`);

// ... rest of the table creations ...
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    shipping_zone TEXT NOT NULL,
    shipping_fee REAL NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    admin_notes TEXT,
    promo_code TEXT,
    discount_amount REAL DEFAULT 0,
    gift_message TEXT
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    size TEXT,
    engraving TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'sub',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed initial settings if empty
const settingsCountResult = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
if (settingsCountResult.count === 0) {
  console.log('Seeding initial settings...');
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('facebook_link', 'https://facebook.com/yourpage');
  insertSetting.run('instagram_link', 'https://instagram.com/yourprofile');
  insertSetting.run('contact_address', 'Mirpur, Dhaka 1216, Bangladesh');
  insertSetting.run('contact_phone', '+880 1913745672');
  insertSetting.run('contact_email', 'auraperfumes@gmail.com');
}

// Seed initial admins if empty
const adminCountResult = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
if (adminCountResult.count === 0) {
  console.log('Seeding initial main admin...');
  const insertAdmin = db.prepare('INSERT INTO admins (id, username, password, role) VALUES (?, ?, ?, ?)');
  // Default main admin
  const defaultPassword = process.env.VITE_ADMIN_PASSWORD || 'admin123';
  insertAdmin.run('a1', 'admin', defaultPassword, 'main');
}

// Seed initial data if empty
const countResult = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (countResult.count === 0) {
  console.log('Seeding initial products...');
  const insert = db.prepare('INSERT INTO products (id, name, description, price, size, image, category, stock, top_notes, heart_notes, base_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insert.run('1', 'Oud Al Layl', 'A rich, woody fragrance with notes of agarwood and rose. Perfect for evening wear.', 1500, '50ml', 'https://picsum.photos/seed/oud/400/400', 'Men', 50, 'Saffron, Nutmeg', 'Agarwood (Oud), Rose', 'Patchouli, Musk, Amber');
  insert.run('2', 'Rose Vanilla', 'Sweet and floral, perfect for everyday wear. Leaves a lasting impression.', 1200, '50ml', 'https://picsum.photos/seed/rose/400/400', 'Women', 30, 'Lemon, Water Notes', 'Rose, Sugar', 'Vanilla, White Musk, Cedar');
  insert.run('3', 'Aqua Blue', 'Fresh aquatic scent with citrus undertones. Ideal for summer days.', 1800, '100ml', 'https://picsum.photos/seed/aqua/400/400', 'Unisex', 20, 'Bergamot, Neroli, Green Mandarin', 'Marine Notes, Jasmine, Rosemary', 'Cedarwood, Musk, Patchouli');
  insert.run('4', 'Musk Safi', 'Pure white musk, clean and elegant. A timeless classic.', 2500, '10ml', 'https://picsum.photos/seed/musk/400/400', 'Unisex', 100, 'Lily of the Valley, Aldehydes', 'White Musk, Jasmine', 'Sandalwood, Amber');
  insert.run('5', 'Amber Leather', 'Bold and sophisticated leather notes mixed with warm amber.', 3200, '50ml', 'https://picsum.photos/seed/leather/400/400', 'Men', 15, 'Cardamom', 'Leather, Jasmine Sambac', 'Amber, Moss, Patchouli');
  insert.run('6', 'Jasmine Bloom', 'Delicate white floral scent capturing the essence of blooming jasmine.', 1400, '30ml', 'https://picsum.photos/seed/jasmine/400/400', 'Women', 45, 'Green Notes, Orange Blossom', 'Jasmine, Tuberose', 'Musk, Vanilla');
  insert.run('7', 'Discovery Set', 'Experience our signature collection with this set of 5 luxury mini perfumes. Find your perfect scent.', 2000, '5x2ml', 'https://picsum.photos/seed/perfumeset/400/400', 'Unisex', 50, 'Various', 'Various', 'Various');
}

// Seed initial reviews if empty
const reviewCountResult = db.prepare('SELECT COUNT(*) as count FROM reviews').get() as { count: number };
if (reviewCountResult.count === 0) {
  console.log('Seeding initial reviews...');
  const insertReview = db.prepare('INSERT INTO reviews (id, product_id, customer_name, rating, comment) VALUES (?, ?, ?, ?, ?)');
  insertReview.run('r1', '1', 'Ahmed', 5, 'Amazing fragrance! Lasts all day.');
  insertReview.run('r2', '1', 'Sara', 4, 'Very strong but good.');
  insertReview.run('r3', '2', 'Nusrat', 5, 'My favorite everyday perfume.');
  insertReview.run('r4', '3', 'Rahim', 4, 'Fresh and clean.');
}

export default db;
