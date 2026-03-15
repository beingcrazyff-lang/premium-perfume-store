import React, { useEffect, useState } from 'react';
import { Package, DollarSign, ShoppingBag, Clock, Edit2, X, Check, Lock, Loader2, AlertCircle, CheckCircle2, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Product } from '../store/useCart';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  created_at: string;
  admin_notes?: string;
  promo_code?: string;
  discount_amount?: number;
  gift_message?: string;
  items: any[];
}

interface AdminUser {
  id: string;
  username: string;
  role: 'main' | 'sub';
  created_at?: string;
}

function ExpandableItems({ items, showPrice = false }: { items: any[], showPrice?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayItems = isExpanded ? items : items.slice(0, 2);
  const hasMore = items.length > 2;

  return (
    <div className="space-y-1 min-w-[200px]">
      {displayItems.map((item, idx) => (
        <div key={idx} className="text-sm">
          <div className={showPrice ? "flex justify-between items-start gap-4" : ""}>
            <span className="text-white">{item.quantity}x {item.name} ({item.size})</span>
            {showPrice && <span className="text-white whitespace-nowrap">৳{item.price * item.quantity}</span>}
          </div>
          {item.engraving && (
            <div className="text-gold-400 italic text-[10px] ml-4">Engraving: "{item.engraving}"</div>
          )}
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] text-gold-400 hover:text-gold-300 font-medium flex items-center gap-0.5 mt-1 transition-colors"
        >
          {isExpanded ? (
            <>Show Less <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>+{items.length - 2} more <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}
    </div>
  );
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'admins' | 'settings'>('orders');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', role: 'sub' as 'main' | 'sub' });

  const [settings, setSettings] = useState<Record<string, string>>({
    facebook_link: '',
    instagram_link: '',
    contact_address: '',
    contact_phone: '',
    contact_email: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      try {
        const statsRes = await fetch('/api/dashboard');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        } else {
          const err = await statsRes.json();
          console.error('Dashboard fetch failed:', err);
        }
      } catch (e) {
        console.error('Error fetching dashboard:', e);
      }

      // Fetch orders
      try {
        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        } else {
          const err = await ordersRes.json();
          console.error('Orders fetch failed:', err);
        }
      } catch (e) {
        console.error('Error fetching orders:', e);
      }

      // Fetch products
      try {
        const productsRes = await fetch('/api/products');
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        } else {
          console.error('Products fetch failed');
        }
      } catch (e) {
        console.error('Error fetching products:', e);
      }
    } catch (error) {
      console.error('Failed to fetch admin data', error);
      showToast('Failed to load some dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth');
    const user = sessionStorage.getItem('adminUser');
    if (auth === 'true' && user) {
      const parsedUser = JSON.parse(user);
      setIsAuthenticated(true);
      setAdminUser(parsedUser);
      if (parsedUser.role === 'main' && activeTab === 'admins') {
        fetchAdmins();
      }
      if (activeTab === 'settings') {
        fetchSettings();
      }
    }
    fetchData();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched settings:', data);
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    console.log('Sending settings to server:', settings);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log('Server response:', result);
        if (result.success) {
          showToast('Settings saved successfully', 'success');
          // Wait a tiny bit then refetch to be absolutely sure
          setTimeout(fetchSettings, 500);
        } else {
          showToast('Failed to save settings', 'error');
        }
      } else {
        console.error('Server error status:', res.status);
        showToast('Failed to save settings', 'error');
      }
    } catch (error) {
      console.error('Update settings error:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setAdminUser(data.admin);
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminUser', JSON.stringify(data.admin));
        setAuthError('');
        fetchData();
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      setAuthError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    if (adminUser?.role !== 'main') return;
    try {
      const res = await fetch('/api/admin/list');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });

      if (res.ok) {
        showToast('Admin added successfully', 'success');
        setIsAddingAdmin(false);
        setNewAdmin({ username: '', password: '', role: 'sub' });
        fetchAdmins();
      } else {
        const data = await res.json();
        showToast(data.details || data.error || 'Failed to add admin', 'error');
      }
    } catch (error) {
      showToast('Failed to add admin', 'error');
    }
  };

  const deleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;
    try {
      const res = await fetch(`/api/admin/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Admin removed', 'success');
        fetchAdmins();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to remove admin', 'error');
      }
    } catch (error) {
      showToast('Failed to remove admin', 'error');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      await fetchData(); // Refresh data
      showToast(`Order #${orderId} marked as ${newStatus}`, 'success');
    } catch (error) {
      console.error('Failed to update status', error);
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const updateOrderNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, admin_notes: notes } : o));
        showToast('Notes updated', 'success');
      }
    } catch (error) {
      showToast('Failed to update notes', 'error');
    }
  };

  const deleteOrder = async (orderId: string) => {
    console.log('deleteOrder called for:', orderId);
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete order');
      
      await fetchData(); // Refresh data
      showToast(`Order #${orderId} deleted successfully`, 'success');
    } catch (error) {
      console.error('Failed to delete order', error);
      showToast('Failed to delete order', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsUpdatingProduct(true);
    try {
      const url = isNewProduct ? '/api/products' : `/api/products/${editingProduct.id}`;
      const method = isNewProduct ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      
      if (!res.ok) throw new Error(`Failed to ${isNewProduct ? 'create' : 'update'} product`);
      
      setEditingProduct(null);
      setIsNewProduct(false);
      await fetchData(); // Refresh data
      showToast(`Product ${isNewProduct ? 'created' : 'updated'} successfully`, 'success');
    } catch (error) {
      console.error(`Failed to ${isNewProduct ? 'create' : 'update'} product`, error);
      showToast(`Failed to ${isNewProduct ? 'create' : 'update'} product`, 'error');
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete product');
      
      await fetchData();
      showToast('Product deleted successfully', 'success');
      setProductToDelete(null);
    } catch (error) {
      console.error('Failed to delete product', error);
      showToast('Failed to delete product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openNewProductModal = () => {
    setEditingProduct({
      id: '',
      name: '',
      description: '',
      price: 0,
      size: '',
      image: '',
      category: 'Combo',
      stock: 0,
      price_6ml: 0,
      price_10ml: 0,
      price_30ml: 0,
      is_combo: 0,
      combo_items: '[]'
    });
    setIsNewProduct(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] bg-charcoal-950 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/5 shadow-lg">
          <div className="w-16 h-16 bg-charcoal-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Lock className="w-8 h-8 text-gold-400" />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif font-medium text-white">Admin Access</h1>
            <p className="text-gray-400 mt-2">Enter your credentials to continue.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder:text-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder:text-gray-600"
                required
              />
              {authError && <p className="text-red-400 text-sm mt-2 text-center">{authError}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold-500 text-charcoal-950 rounded-xl font-medium hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/10 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-gold-400 bg-charcoal-950 min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-950 pt-8 pb-24 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border transition-all animate-in slide-in-from-top-4 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-medium text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your store, orders, and products.</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'orders' ? 'text-gold-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Orders
            {activeTab === 'orders' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-400 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'products' ? 'text-gold-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Products
            {activeTab === 'products' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-400 rounded-t-full" />
            )}
          </button>
          {adminUser?.role === 'main' && (
            <>
              <button
                onClick={() => { setActiveTab('admins'); fetchAdmins(); }}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'admins' ? 'text-gold-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Admins
                {activeTab === 'admins' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-400 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'settings' ? 'text-gold-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Settings
                {activeTab === 'settings' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-400 rounded-t-full" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center border border-blue-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-white">{stats?.totalOrders || 0}</p>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center border border-yellow-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Pending Orders</p>
              <p className="text-2xl font-bold text-white">{stats?.pendingOrders || 0}</p>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Delivered Orders</p>
              <p className="text-2xl font-bold text-white">{stats?.deliveredOrders || 0}</p>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-gold-500/10 text-gold-400 rounded-full flex items-center justify-center border border-gold-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">৳{stats?.totalRevenue || 0}</p>
            </div>
          </div>
        </div>

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Desktop Table View */}
          <div className="hidden md:block glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead className="bg-charcoal-900 text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Items</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Total</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Admin Notes</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No orders found.</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        
              <td className="px-6 py-4 font-mono text-gold-400">#{order.id}</td>
                    
  <p className="font-medium text-white">{order.customer_name}</p>
  <p className="text-gray-500 text-xs">{order.customer_phone}</p>
  <p className="text-gray-500 text-xs mt-1 line-clamp-2 max-w-[200px]" title={order.customer_address}>
    {order.customer_address}
  </p>
  <p className="text-gold-400/70 text-[10px] uppercase tracking-wider mt-0.5">{order.shipping_zone}</p>
</td>
                        <td className="px-6 py-4">
                          
                          <ExpandableItems items={order.items || []} showPrice={true} />
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-white">
                          <div>৳{order.total_amount}</div>
                          {order.discount_amount > 0 && (
                            <div className="text-[10px] text-emerald-400">
                              Disc: -৳{order.discount_amount} ({order.promo_code})
                            </div>
                          )}
                          {order.gift_message && (
                            <div className="text-[10px] text-gold-400 mt-1 italic">
                              Gift: {order.gift_message}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                              order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <textarea
                            defaultValue={order.admin_notes || ''}
                            onBlur={(e) => updateOrderNotes(order.id, e.target.value)}
                            placeholder="Add note"
                            className="w-full min-w-[150px] bg-charcoal-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:ring-1 focus:ring-gold-500 outline-none resize-none"
                            rows={2}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                disabled={updatingOrderId === order.id}
                                className="text-sm border border-white/10 rounded-lg px-2 py-1 bg-charcoal-900 text-white focus:ring-2 focus:ring-gold-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="SHIPPED">Shipped</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                              {updatingOrderId === order.id && (
                                <Loader2 className="w-4 h-4 animate-spin text-gold-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                              )}
                            </div>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              disabled={updatingOrderId === order.id}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>{/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {orders.length === 0 ? (
              <div className="glass-panel p-8 text-center text-gray-500 rounded-2xl border border-white/5">
                No orders found.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-gold-400 text-sm">#{order.id}</p>
                      <p className="font-medium text-white mt-1">{order.customer_name}</p>
                      <p className="text-gray-500 text-xs">{order.customer_phone}</p>
                      <p className="text-gray-400 text-xs mt-1">{order.customer_address}</p>
                      <p className="text-gold-400/70 text-[10px] uppercase tracking-wider mt-0.5">{order.shipping_zone}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border
                      ${order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                        order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="bg-charcoal-900/50 rounded-xl p-3 space-y-2">
                    <ExpandableItems items={order.items || []} showPrice={true} />
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Total Amount</span>
                      <div className="text-right">
                        <p className="text-gold-400 font-bold">৳{order.total_amount}</p>
                        {order.discount_amount > 0 && (
                          <p className="text-[10px] text-emerald-400">Disc: -৳{order.discount_amount}</p>
                        )}
                        {order.gift_message && (
                          <p className="text-[10px] text-gold-400 italic">Gift: {order.gift_message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Admin Notes</p>
                    <textarea
                      defaultValue={order.admin_notes || ''}
                      onBlur={(e) => updateOrderNotes(order.id, e.target.value)}
                      placeholder="Add note..."
                      className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-gold-500 outline-none resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id}
                        className="w-full text-sm border border-white/10 rounded-xl px-4 py-2.5 bg-charcoal-900 text-white focus:ring-2 focus:ring-gold-500 outline-none disabled:opacity-50 appearance-none"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      {updatingOrderId === order.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-gold-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      disabled={updatingOrderId === order.id}
                      className="p-2.5 text-gray-500 hover:text-red-400 bg-charcoal-900 border border-white/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

         
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Desktop Table View */}
          <div className="hidden md:block glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">Manage Products</h2>
              <button
                onClick={openNewProductModal}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-charcoal-950 rounded-xl font-medium hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/10"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-charcoal-900 text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Image</th>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Stock</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg border border-white/10" referrerPolicy="no-referrer" />
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                      <td className="px-6 py-4 text-gray-400">৳{product.price_6ml || 320} - ৳{product.price_30ml || 729}</td>
                      <td className="px-6 py-4 text-gray-400">{product.stock}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setEditingProduct(product)}
                            className="text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                          <button 
                            onClick={() => setProductToDelete(product.id)}
                            className="text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            <button
              onClick={openNewProductModal}
              className="w-full py-4 glass-panel rounded-2xl border border-dashed border-white/20 text-gold-400 flex items-center justify-center gap-2 hover:border-gold-400/50 transition-all mb-2"
            >
              <Plus className="w-5 h-5" /> Add New Product
            </button>
            {products.map((product) => (
              <div key={product.id} className="glass-panel p-4 rounded-2xl border border-white/5 flex gap-4 items-center">
                <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-xl border border-white/10" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{product.name}</h3>
                  <p className="text-gold-400 text-sm font-bold mt-1">৳{product.price_6ml} - ৳{product.price_30ml}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setEditingProduct(product)}
                        className="text-gold-400 hover:text-gold-300 text-xs flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={() => setProductToDelete(product.id)}
                        className="text-gray-500 hover:text-red-400 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'admins' && adminUser?.role === 'main' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">Manage Admins</h2>
              <button
                onClick={() => setIsAddingAdmin(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-charcoal-950 rounded-xl font-medium hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/10"
              >
                <Plus className="w-4 h-4" /> Add Admin
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-charcoal-900 text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Username</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Created At</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{admin.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          admin.role === 'main' ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {admin.role} Admin
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{new Date(admin.created_at || '').toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        {admin.id !== adminUser.id && (
                          <button
                            onClick={() => deleteAdmin(admin.id)}
                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && adminUser?.role === 'main' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl border border-white/5 p-8 max-w-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-serif font-medium text-white">Website Settings</h2>
              <button 
                onClick={fetchSettings}
                className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-2"
              >
                <Clock className="w-4 h-4" /> Refresh
              </button>
            </div>
            <form onSubmit={updateSettings} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Facebook Page Link</label>
                  <input
                    type="url"
                    value={settings.facebook_link || ''}
                    onChange={(e) => setSettings({ ...settings, facebook_link: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Instagram Profile Link</label>
                  <input
                    type="url"
                    value={settings.instagram_link || ''}
                    onChange={(e) => setSettings({ ...settings, instagram_link: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-lg font-medium text-white mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                      <input
                        type="text"
                        value={settings.contact_address || ''}
                        onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                      <input
                        type="text"
                        value={settings.contact_phone || ''}
                        onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={settings.contact_email || ''}
                        onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-3 bg-gold-500 text-charcoal-950 rounded-xl font-medium hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddingAdmin && (
        <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="glass-panel rounded-3xl w-full max-w-md p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-medium text-white">Add New Admin</h2>
              <button onClick={() => setIsAddingAdmin(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={addAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value as 'main' | 'sub'})}
                  className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none appearance-none"
                >
                  <option value="sub">Sub Admin (Staff)</option>
                  <option value="main">Main Admin (Full Access)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gold-500 text-charcoal-950 rounded-xl font-medium hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/10 mt-4"
              >
                Add Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="glass-panel rounded-3xl w-full max-w-md p-8 border border-white/10 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-medium text-white mb-2">Delete Product?</h2>
            <p className="text-gray-400 mb-8">Are you sure you want to delete this product? This action cannot be undone and will delete all associated reviews.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setProductToDelete(null)}
                className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteProduct(productToDelete)}
                className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-medium text-white">{isNewProduct ? 'Add New Product' : 'Edit Product'}</h2>
              <button onClick={() => { console.log('Closing modal'); setEditingProduct(null); setIsNewProduct(false); }} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="is_combo"
                  checked={editingProduct.is_combo === 1}
                  onChange={(e) => setEditingProduct({...editingProduct, is_combo: e.target.checked ? 1 : 0})}
                  className="w-5 h-5 rounded border-white/10 bg-charcoal-900 text-gold-500 focus:ring-gold-500"
                />
                <label htmlFor="is_combo" className="text-white font-medium">This is a Combo Product</label>
              </div>

              {editingProduct.is_combo === 1 && (
                <div className="p-4 bg-charcoal-900 rounded-2xl border border-white/5 space-y-4">
                  <label className="block text-sm font-medium text-gray-400">Select Products for Combo</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {products.filter(p => p.is_combo !== 1).map(p => {
                      const selectedItems = JSON.parse(editingProduct.combo_items || '[]');
                      const isSelected = selectedItems.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const newItems = isSelected 
                              ? selectedItems.filter((id: string) => id !== p.id)
                              : [...selectedItems, p.id];
                            setEditingProduct({...editingProduct, combo_items: JSON.stringify(newItems)});
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all border ${
                            isSelected ? 'bg-gold-500/10 border-gold-500/50 text-gold-400' : 'bg-charcoal-800 border-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <img src={p.image} alt="" className="w-6 h-6 rounded object-cover" />
                          <span className="truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Price (৳)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Price 6ml (৳)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price_6ml || 320}
                    onChange={(e) => setEditingProduct({...editingProduct, price_6ml: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Price 10ml (৳)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price_10ml || 540}
                    onChange={(e) => setEditingProduct({...editingProduct, price_10ml: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Price 30ml (৳)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price_30ml || 729}
                    onChange={(e) => setEditingProduct({...editingProduct, price_30ml: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Stock</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Top Notes</label>
                  <input
                    type="text"
                    value={editingProduct.top_notes || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, top_notes: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                    placeholder="e.g. Bergamot, Lemon"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Heart Notes</label>
                  <input
                    type="text"
                    value={editingProduct.heart_notes || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, heart_notes: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                    placeholder="e.g. Jasmine, Rose"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Base Notes</label>
                  <input
                    type="text"
                    value={editingProduct.base_notes || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, base_notes: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                    placeholder="e.g. Musk, Amber"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Image URL</label>
                <input
                  type="url"
                  required
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                />
                {editingProduct.image && (
                  <div className="mt-4 aspect-video bg-charcoal-900 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center">
                    <img src={editingProduct.image} alt="Preview" className="h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  required
                  rows={5}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-6 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProduct}
                  className="px-6 py-3 bg-gold-500 text-charcoal-950 rounded-xl font-medium hover:bg-gold-400 transition-colors flex items-center gap-2 shadow-lg shadow-gold-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingProduct ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {isUpdatingProduct ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
