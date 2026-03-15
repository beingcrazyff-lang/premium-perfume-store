import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/useCart';
import { Trash2, ArrowRight, CheckCircle2, Gift } from 'lucide-react';
import { motion } from 'motion/react';

export default function Checkout() {
  const { items, updateQuantity, removeItem, getTotal, clearCart, giftWrap, toggleGiftWrap } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    shippingZone: 'Inside Dhaka',
    giftMessage: '',
  });

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  const subtotal = getTotal();
  const shippingFee = formData.shippingZone === 'Inside Dhaka' ? 70 : 130;
  const giftWrapFee = giftWrap ? 200 : 0;
  
  const discountAmount = appliedPromo === 'SCHOLARS' ? Math.round((subtotal - giftWrapFee) * 0.05) : 0;
  
  // Note: getTotal already includes giftWrapFee, so we just add shipping and subtract discount
  const totalAmount = subtotal + shippingFee - discountAmount;

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'SCHOLARS') {
      setAppliedPromo('SCHOLARS');
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
      setAppliedPromo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (formData.customerName.trim().length < 3) {
      alert('Please enter your full name (at least 3 characters).');
      return;
    }

    // Basic phone validation for Bangladesh numbers
    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneRegex.test(formData.customerPhone)) {
      alert('Please enter a valid Bangladeshi phone number.');
      return;
    }

    if (formData.customerAddress.trim().length < 10) {
      alert('Please enter a complete delivery address (at least 10 characters).');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.selectedPrice,
            size: item.selectedSize,
            engraving: item.engraving
          })),
          shippingFee,
          totalAmount,
          promoCode: appliedPromo,
          discountAmount
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOrderId(data.orderId);
        setSuccess(true);
        clearCart();
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] bg-charcoal-950 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6 glass-panel p-12 rounded-3xl border border-white/5"
        >
          <div className="w-20 h-20 bg-emerald-400/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400/20 shadow-[0_0_30px_rgba(52,211,153,0.2)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif font-medium text-white">Order Confirmed!</h1>
          <p className="text-gray-400">
            Thank you for your purchase. Your order ID is <span className="font-mono font-medium text-gold-400">#{orderId}</span>.
            We will contact you shortly to confirm delivery.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-block bg-gold-500 text-charcoal-950 px-8 py-3 rounded-xl font-medium hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/10"
          >
            Continue Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-950 pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-serif font-medium text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Section */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5"
              >
                <h2 className="text-xl font-serif font-medium text-white mb-6">Shipping Information</h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                    <input
                      required
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                    <input
                      required
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Delivery Zone</label>
                    <select
                      value={formData.shippingZone}
                      onChange={(e) => setFormData({...formData, shippingZone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all appearance-none"
                    >
                      <option value="Inside Dhaka">Inside Dhaka (৳70)</option>
                      <option value="Outside Dhaka">Outside Dhaka (৳130)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Address</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.customerAddress}
                      onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="House, Road, Area..."
                    />
                  </div>

                  {giftWrap && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-medium text-gold-400 mb-2">Gift Message (Optional)</label>
                      <textarea
                        rows={2}
                        value={formData.giftMessage}
                        onChange={(e) => setFormData({...formData, giftMessage: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-gold-500/20 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Write a sweet note for your loved one..."
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5"
              >
                <h2 className="text-xl font-serif font-medium text-white mb-4">Payment Method</h2>
                <div className="p-4 border border-gold-500/30 rounded-xl bg-gold-500/5 flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-gold-500 ring-4 ring-gold-500/20"></div>
                  <span className="font-medium text-gold-400">Cash on Delivery (COD)</span>
                </div>
              </motion.div>

              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="w-full bg-gold-500 text-charcoal-950 py-4 rounded-xl font-medium text-lg hover:bg-gold-400 transition-colors disabled:bg-charcoal-800 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gold-500/10"
              >
                {loading ? 'Processing...' : 'Place Order'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 sticky top-24"
            >
              <h2 className="text-xl font-serif font-medium text-white mb-6">Order Summary</h2>
              
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item.cartItemId} className="flex gap-4 group">
                        <div className="w-20 h-20 bg-charcoal-900 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{item.name}</h3>
                          <p className="text-sm text-gray-400">{item.selectedSize}</p>
                          {item.engraving && (
                            <p className="text-xs text-gold-400 mt-1 italic">Engraving: "{item.engraving}"</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 bg-charcoal-900 border border-white/10 rounded-lg px-2 py-1">
                              <button 
                                onClick={() => updateQuantity(item.cartItemId, Math.max(1, item.quantity - 1))}
                                className="text-gray-400 hover:text-gold-400 transition-colors"
                              >-</button>
                              <span className="text-sm font-medium w-4 text-center text-white">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.cartItemId, Math.min(item.stock, item.quantity + 1))}
                                className="text-gray-400 hover:text-gold-400 transition-colors"
                              >+</button>
                            </div>
                            <p className="font-medium text-gold-400">৳{item.selectedPrice * item.quantity}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeItem(item.cartItemId)}
                          className="text-gray-500 hover:text-red-400 self-start p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Gift Wrap Toggle */}
                  <div className="pt-4 border-t border-white/10">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${giftWrap ? 'bg-gold-500/20 text-gold-400' : 'bg-charcoal-900 text-gray-400 group-hover:text-gold-400'}`}>
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">Gift Wrapping</p>
                          <p className="text-xs text-gray-400">Add a luxurious touch</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gold-400 font-medium">+৳200</span>
                        <div className={`w-12 h-6 rounded-full transition-colors relative ${giftWrap ? 'bg-gold-500' : 'bg-charcoal-800'}`} onClick={toggleGiftWrap}>
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${giftWrap ? 'translate-x-7' : 'translate-x-1'}`} />
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Promo Code Section */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Promo Code"
                        className="flex-1 px-4 py-2 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors border border-white/10"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && <p className="text-red-400 text-xs mt-2 ml-1">{promoError}</p>}
                    {appliedPromo && <p className="text-emerald-400 text-xs mt-2 ml-1">Promo code "{appliedPromo}" applied!</p>}
                  </div>

                  <div className="pt-6 border-t border-white/10 space-y-3">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal (Items)</span>
                      <span>৳{subtotal - giftWrapFee}</span>
                    </div>
                    {giftWrap && (
                      <div className="flex justify-between text-gold-400/80">
                        <span>Gift Wrapping</span>
                        <span>৳200</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-400">
                      <span>Shipping</span>
                      <span>৳{shippingFee}</span>
                    </div>
                    {appliedPromo && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount (5%)</span>
                        <span>-৳{discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-serif font-medium text-white pt-4 border-t border-white/10">
                      <span>Total</span>
                      <span className="text-gold-400">৳{totalAmount}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
