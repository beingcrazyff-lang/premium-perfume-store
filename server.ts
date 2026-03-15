import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './server/db.ts';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      res.status(500).json({ status: 'error', database: 'disconnected', error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get all products
  app.get('/api/products', (req, res) => {
    try {
      const products = db.prepare(`
        SELECT p.*, 
               COALESCE(AVG(r.rating), 0) as averageRating, 
               COUNT(r.id) as reviewCount 
        FROM products p 
        LEFT JOIN reviews r ON p.id = r.product_id 
        GROUP BY p.id
      `).all();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // Get single product with reviews
  app.get('/api/products/:id', (req, res) => {
    try {
      const product = db.prepare(`
        SELECT p.*, 
               COALESCE(AVG(r.rating), 0) as averageRating, 
               COUNT(r.id) as reviewCount 
        FROM products p 
        LEFT JOIN reviews r ON p.id = r.product_id 
        WHERE p.id = ?
        GROUP BY p.id
      `).get(req.params.id) as any;
      
      if (!product) return res.status(404).json({ error: 'Product not found' });

      // If it's a combo, fetch the items
      if (product.is_combo === 1 && product.combo_items) {
        const itemIds = JSON.parse(product.combo_items);
        if (itemIds.length > 0) {
          const placeholders = itemIds.map(() => '?').join(',');
          const comboItems = db.prepare(`SELECT id, name, image, category FROM products WHERE id IN (${placeholders})`).all(...itemIds);
          product.comboItemsDetails = comboItems;
        } else {
          product.comboItemsDetails = [];
        }
      }

      const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(req.params.id);
      res.json({ ...product, reviews });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  // Add a review
  app.post('/api/products/:id/reviews', (req, res) => {
    const { customerName, rating, comment } = req.body;
    try {
      db.prepare('INSERT INTO reviews (id, product_id, customer_name, rating, comment) VALUES (?, ?, ?, ?, ?)')
        .run(crypto.randomUUID(), req.params.id, customerName, rating, comment);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add review' });
    }
  });

  // Create an order
  app.post('/api/orders', (req, res) => {
    const { customerName, customerPhone, customerAddress, shippingZone, items, totalAmount, shippingFee, promoCode, discountAmount, giftMessage } = req.body;
    
    try {
      // Generate sequential ID like ap01, ap02
      const lastOrder = db.prepare("SELECT id FROM orders WHERE id LIKE 'ap%' ORDER BY created_at DESC LIMIT 1").get() as { id: string } | undefined;
      let nextId = 'ap01';
      if (lastOrder && lastOrder.id.startsWith('ap')) {
        const lastNum = parseInt(lastOrder.id.substring(2));
        nextId = `ap${String(lastNum + 1).padStart(2, '0')}`;
      }
      
      const orderId = nextId;

      db.prepare('BEGIN').run();

      // Insert Order
      db.prepare(`
        INSERT INTO orders (id, customer_name, customer_phone, customer_address, shipping_zone, shipping_fee, total_amount, status, promo_code, discount_amount, gift_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, customerName, customerPhone, customerAddress, shippingZone, shippingFee, totalAmount, 'PENDING', promoCode || null, discountAmount || 0, giftMessage || null);

      // Insert Order Items & Update Stock
      const insertItem = db.prepare('INSERT INTO order_items (id, order_id, product_id, quantity, price, size, engraving) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
      
      for (const item of items) {
        insertItem.run(crypto.randomUUID(), orderId, item.productId, item.quantity, item.price, item.size || null, item.engraving || null);
        updateStock.run(item.quantity, item.productId);
      }

      db.prepare('COMMIT').run();

      // Telegram Notification (Fire and forget)
      sendTelegramNotification({
        id: orderId,
        customerName,
        customerPhone,
        totalAmount,
        shippingZone
      });

      res.json({ success: true, orderId });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Order creation failed:', error);
      res.status(500).json({ error: 'Failed to place order' });
    }
  });

  // Get all orders (Admin)
  app.get('/api/orders', (req, res) => {
    try {
      console.log('Fetching orders...');
      const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
      console.log(`Found ${orders.length} orders`);
      
      // Fetch items for each order
      const ordersWithItems = orders.map((order: any) => {
        try {
          const items = db.prepare(`
            SELECT oi.*, p.name, p.size 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?
          `).all(order.id);
          return { ...order, items };
        } catch (itemError) {
          console.error(`Error fetching items for order ${order.id}:`, itemError);
          return { ...order, items: [], error: 'Failed to fetch items' };
        }
      });
      res.json(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ 
        error: 'Failed to fetch orders', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Delete an order (Admin)
  app.delete('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;
    console.log(`Attempting to delete order: ${orderId}`);
    try {
      db.prepare('BEGIN').run();
      const itemsDeleted = db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
      const ordersDeleted = db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
      db.prepare('COMMIT').run();
      console.log(`Successfully deleted order ${orderId}. Items: ${itemsDeleted.changes}, Orders: ${ordersDeleted.changes}`);
      res.json({ success: true });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error(`Failed to delete order ${orderId}:`, error);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  // Update order status (Admin)
  app.put('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    try {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  // Update order notes (Admin)
  app.put('/api/orders/:id/notes', (req, res) => {
    const { notes } = req.body;
    try {
      db.prepare('UPDATE orders SET admin_notes = ? WHERE id = ?').run(notes, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update notes' });
    }
  });

  // Create product (Admin)
  app.post('/api/products', (req, res) => {
    const { name, description, price, size, image, category, stock, price_6ml, price_10ml, price_30ml, top_notes, heart_notes, base_notes, is_combo, combo_items } = req.body;
    const id = crypto.randomUUID();
    console.log(`Creating product ${id}:`, { name, image });
    try {
      db.prepare(`
        INSERT INTO products (id, name, description, price, size, image, category, stock, price_6ml, price_10ml, price_30ml, top_notes, heart_notes, base_notes, is_combo, combo_items)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, 
        name, 
        description, 
        price, 
        size, 
        image, 
        category, 
        stock, 
        price_6ml || 320, 
        price_10ml || 540, 
        price_30ml || 729, 
        top_notes || null, 
        heart_notes || null, 
        base_notes || null, 
        is_combo || 0, 
        combo_items || '[]'
      );
      console.log(`Product ${id} created successfully`);
      res.json({ success: true, id });
    } catch (error) {
      console.error('Failed to create product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  // Update product (Admin)
  app.put('/api/products/:id', (req, res) => {
    const { name, description, price, size, image, category, stock, price_6ml, price_10ml, price_30ml, top_notes, heart_notes, base_notes, is_combo, combo_items } = req.body;
    const productId = req.params.id;
    console.log(`Updating product ${productId}:`, { name, image });
    try {
      const result = db.prepare(`
        UPDATE products 
        SET name = ?, description = ?, price = ?, size = ?, image = ?, category = ?, stock = ?, price_6ml = ?, price_10ml = ?, price_30ml = ?, top_notes = ?, heart_notes = ?, base_notes = ?, is_combo = ?, combo_items = ?
        WHERE id = ?
      `).run(
        name, 
        description, 
        price, 
        size, 
        image, 
        category, 
        stock, 
        price_6ml || 320, 
        price_10ml || 540, 
        price_30ml || 729, 
        top_notes || null, 
        heart_notes || null, 
        base_notes || null, 
        is_combo || 0, 
        combo_items || '[]', 
        productId
      );
      
      if (result.changes > 0) {
        console.log(`Product ${productId} updated successfully`);
        res.json({ success: true });
      } else {
        console.warn(`Product ${productId} not found for update`);
        res.status(404).json({ error: 'Product not found' });
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // Delete product (Admin)
  app.delete('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    console.log(`Attempting to delete product: ${productId}`);
    try {
      const deleteTx = db.transaction((id) => {
        // Delete reviews
        db.prepare('DELETE FROM reviews WHERE product_id = ?').run(id);
        // Delete order items associated with this product
        db.prepare('DELETE FROM order_items WHERE product_id = ?').run(id);
        
        // Remove this product from any combos it might be part of
        const combos = db.prepare("SELECT id, combo_items FROM products WHERE is_combo = 1 AND combo_items LIKE ?").all(`%${id}%`);
        for (const combo of combos as any) {
          try {
            const items = JSON.parse(combo.combo_items);
            const updatedItems = items.filter((itemId: string) => itemId !== id);
            db.prepare("UPDATE products SET combo_items = ? WHERE id = ?").run(JSON.stringify(updatedItems), combo.id);
          } catch (e) {
            console.error(`Failed to update combo ${combo.id} after product deletion`, e);
          }
        }

        // Delete the product itself
        const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
        return result;
      });

      const result = deleteTx(productId);
      
      if (result.changes > 0) {
        console.log(`Product ${productId} deleted successfully`);
        res.json({ success: true });
      } else {
        console.warn(`Product ${productId} not found for deletion`);
        res.status(404).json({ error: 'Product not found' });
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      res.status(500).json({ 
        error: 'Failed to delete product',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get dashboard stats (Admin)
  app.get('/api/dashboard', (req, res) => {
    try {
      console.log('Fetching dashboard stats...');
      
      const stats = {
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        totalRevenue: 0,
        totalProducts: 0
      };

      try {
        const row = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status != 'CANCELLED'").get() as any;
        stats.totalOrders = row?.count || 0;
      } catch (e) { console.error('Dashboard: Error counting orders', e); }

      try {
        const row = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'PENDING'").get() as any;
        stats.pendingOrders = row?.count || 0;
      } catch (e) { console.error('Dashboard: Error counting pending', e); }

      try {
        const row = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'DELIVERED'").get() as any;
        stats.deliveredOrders = row?.count || 0;
      } catch (e) { console.error('Dashboard: Error counting delivered', e); }

      try {
        const row = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status = 'DELIVERED'").get() as any;
        stats.totalRevenue = row?.total || 0;
      } catch (e) { console.error('Dashboard: Error calculating revenue', e); }

      try {
        const row = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
        stats.totalProducts = row?.count || 0;
      } catch (e) { console.error('Dashboard: Error counting products', e); }

      res.json(stats);
    } catch (error) {
      console.error('Critical error in dashboard route:', error);
      res.status(500).json({ 
        error: 'Failed to fetch dashboard stats',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin Login
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    try {
      const admin = db.prepare('SELECT id, username, role FROM admins WHERE username = ? AND password = ?').get(username, password) as any;
      if (admin) {
        res.json({ success: true, admin });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // List all admins (Main Admin only)
  app.get('/api/admin/list', (req, res) => {
    try {
      const admins = db.prepare('SELECT id, username, role, created_at FROM admins').all();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admins' });
    }
  });

  // Add new admin (Main Admin only)
  app.post('/api/admin/add', (req, res) => {
    const { username, password, role } = req.body;
    console.log(`Attempting to add admin: ${username}, role: ${role}`);
    try {
      const id = crypto.randomBytes(16).toString('hex');
      db.prepare('INSERT INTO admins (id, username, password, role) VALUES (?, ?, ?, ?)').run(id, username, password, role || 'sub');
      console.log(`Admin ${username} added successfully with ID ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to add admin:', error);
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Username already exists' });
      } else {
        res.status(500).json({ error: 'Failed to add admin', details: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  // Delete admin (Main Admin only)
  app.delete('/api/admin/:id', (req, res) => {
    try {
      const adminId = req.params.id;
      // Prevent deleting the last main admin or self
      const admin = db.prepare('SELECT role FROM admins WHERE id = ?').get(adminId) as any;
      if (admin?.role === 'main') {
        const mainAdmins = db.prepare("SELECT COUNT(*) as count FROM admins WHERE role = 'main'").get() as any;
        if (mainAdmins.count <= 1) {
          return res.status(400).json({ error: 'Cannot delete the last main admin' });
        }
      }
      db.prepare('DELETE FROM admins WHERE id = ?').run(adminId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete admin' });
    }
  });

  // Get settings
  app.get('/api/settings', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      const settings = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
      const settingsObj = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Update settings (Main Admin only)
  app.post('/api/settings', (req, res) => {
    const settings = req.body;
    console.log('[SETTINGS UPDATE] Received:', settings);
    
    if (!settings || typeof settings !== 'object') {
      console.error('[SETTINGS UPDATE] Invalid data received');
      return res.status(400).json({ error: 'Invalid settings data' });
    }

    try {
      const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      
      // Perform updates one by one for debugging
      for (const [key, value] of Object.entries(settings)) {
        const result = upsert.run(key, String(value));
        console.log(`[SETTINGS UPDATE] Key: ${key}, Value: ${value}, Changes: ${result.changes}`);
      }

      console.log('[SETTINGS UPDATE] All updates completed successfully');
      res.json({ success: true });
    } catch (error) {
      console.error('[SETTINGS UPDATE] Error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          overlay: false
        },
        watch: null
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Simple Telegram Notification Service
async function sendTelegramNotification(order: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId) {
    console.log('Telegram credentials not set. Skipping notification.');
    return;
  }

  const message = `🚨 *NEW ORDER* 🚨\nID: #${order.id.slice(0,6)}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}\nTotal: ৳${order.totalAmount}\nZone: ${order.shippingZone}`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Telegram notification failed:', error);
  }
}

startServer();
