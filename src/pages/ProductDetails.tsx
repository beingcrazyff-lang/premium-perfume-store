import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, useCart } from '../store/useCart';
import { useWishlist } from '../store/useWishlist';
import { ShoppingCart, Star, ArrowLeft, CheckCircle2, Heart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ProductWithReviews extends Product {
  reviews: Review[];
  comboItemsDetails?: { id: string; name: string; image: string; category: string }[];
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCart((state) => state.addItem);
  const { toggleItem, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState<ProductWithReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSize, setSelectedSize] = useState('6ml');

  // Gallery state
  const [activeImage, setActiveImage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState('0% 0%');
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState<Record<string, boolean>>({});
  const [engraving, setEngraving] = useState('');

  useEffect(() => {
    setMainImageLoaded(false);
  }, [activeImage]);

  // Review form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setProduct(data);
      setActiveImage(data.image);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: reviewName,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (res.ok) {
        setReviewName('');
        setReviewRating(5);
        setReviewComment('');
        fetchProduct(); // Refresh reviews
      }
    } catch (error) {
      console.error('Failed to submit review', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setBackgroundPosition(`${x}% ${y}%`);
  };

  if (loading) {
    return <div className="min-h-screen bg-charcoal-950 flex items-center justify-center text-gold-400">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-gray-400">Product not found</p>
        <button onClick={() => navigate('/')} className="text-gold-400 hover:text-gold-300 hover:underline">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-950 pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-gold-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          {/* Product Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            {/* Main Image with Zoom */}
            <div 
              className="aspect-[4/5] bg-charcoal-900 rounded-3xl overflow-hidden relative cursor-crosshair border border-white/5"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <img 
              src={activeImage} 
              alt={product.name} 
              onLoad={() => setMainImageLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isZoomed ? 'opacity-0' : (mainImageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md')
              }`}
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
            />
            {isZoomed && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${activeImage})`,
                  backgroundPosition: backgroundPosition,
                  backgroundSize: '200%',
                  backgroundRepeat: 'no-repeat'
                }}
              />
            )}
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-4">
            {[
              product.image,
              product.image.replace(/seed\/([^\/]+)\//, 'seed/$1-alt1/'),
              product.image.replace(/seed\/([^\/]+)\//, 'seed/$1-alt2/'),
              product.image.replace(/seed\/([^\/]+)\//, 'seed/$1-alt3/')
            ].map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(imgUrl)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  activeImage === imgUrl ? 'border-black' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img 
                  src={imgUrl} 
                  alt={`${product.name} view ${idx + 1}`} 
                  onLoad={() => setThumbLoaded(prev => ({ ...prev, [imgUrl]: true }))}
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    thumbLoaded[imgUrl] ? 'opacity-100 blur-0' : 'opacity-0 blur-md'
                  }`} 
                  referrerPolicy="no-referrer" 
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center"
        >
          <div className="mb-4">
            <span className="inline-block glass-panel border border-gold-400/20 px-3 py-1 rounded-full text-xs font-medium text-gold-400 mb-4">
              {product.category}
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif font-medium text-white mb-2">{product.name}</h1>
            
            {/* Rating Summary */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-5 h-5 ${
                      star <= Math.round(product.averageRating || 0) 
                        ? 'fill-gold-500 text-gold-500' 
                        : 'fill-charcoal-800 text-charcoal-800'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-white">
                {Number(product.averageRating || 0).toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">
                ({product.reviewCount || 0} reviews)
              </span>
            </div>
          </div>

          <p className="text-3xl font-medium text-gold-400 mb-6">
            ৳{selectedSize === '6ml' ? product.price_6ml || 320 : selectedSize === '10ml' ? product.price_10ml || 540 : product.price_30ml || 729}
          </p>
          
          <p className="text-gray-400 mb-8 leading-relaxed font-light text-lg">
            {product.description}
          </p>

          {/* Scent Notes */}
          {(product.top_notes || product.heart_notes || product.base_notes) && (
            <div className="mb-8 glass-panel p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-serif font-medium text-white mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-gold-400" /> Fragrance Notes
              </h3>
              <div className="space-y-4">
                {product.top_notes && (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-gold-400/80 font-medium block mb-1">Top Notes</span>
                    <span className="text-gray-300">{product.top_notes}</span>
                  </div>
                )}
                {product.heart_notes && (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-gold-400/80 font-medium block mb-1">Heart Notes</span>
                    <span className="text-gray-300">{product.heart_notes}</span>
                  </div>
                )}
                {product.base_notes && (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-gold-400/80 font-medium block mb-1">Base Notes</span>
                    <span className="text-gray-300">{product.base_notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Size</h3>
            <div className="flex gap-3">
              {['6ml', '10ml', '30ml'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-6 py-2 rounded-xl font-medium transition-all ${
                    selectedSize === size
                      ? 'bg-gold-500 text-charcoal-950 shadow-lg shadow-gold-500/20'
                      : 'bg-charcoal-900 text-gray-400 border border-white/10 hover:border-gold-500/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Personalized Engraving (Optional)</h3>
            <input
              type="text"
              maxLength={15}
              placeholder="e.g. A.M. (Max 15 chars)"
              value={engraving}
              onChange={(e) => setEngraving(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 outline-none placeholder:text-gray-600 transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">Add a personal touch to your bottle.</p>
          </div>

          {product.is_combo === 1 && product.comboItemsDetails && (
            <div className="mb-8 p-6 glass-panel rounded-2xl border border-gold-500/20">
              <h3 className="text-lg font-serif font-medium text-gold-400 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Included in this Combo
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {product.comboItemsDetails.map((item) => (
                  <div key={item.id} className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <p className="text-[10px] text-white font-medium line-clamp-2">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const currentPrice = selectedSize === '6ml' ? product.price_6ml || 320 : selectedSize === '10ml' ? product.price_10ml || 540 : product.price_30ml || 729;
                addItem(product, selectedSize, currentPrice, engraving);
                setEngraving(''); // Reset after adding
              }}
              disabled={product.stock === 0}
              className="flex-1 bg-gold-500 text-charcoal-950 py-4 rounded-xl font-medium text-lg hover:bg-gold-400 transition-all disabled:bg-charcoal-800 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gold-500/10"
            >
              <ShoppingCart className="w-5 h-5" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={() => toggleItem(product)}
              className="p-4 rounded-xl glass-panel border border-white/10 hover:border-gold-500/50 transition-all"
              title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
          </div>
          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-red-400 text-sm mt-4 font-medium">Only {product.stock} items left in stock!</p>
          )}
        </motion.div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-white/10 pt-16">
        <h2 className="text-3xl font-serif font-medium text-white mb-12 text-center sm:text-left">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Review List */}
          <div className="lg:col-span-7 space-y-6">
            {product.reviews.length === 0 ? (
              <p className="text-gray-500 italic">No reviews yet. Be the first to review this product!</p>
            ) : (
              product.reviews.map((review, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  key={review.id} 
                  className="glass-panel p-6 rounded-2xl border border-white/5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-charcoal-800 flex items-center justify-center text-gold-400 font-serif text-lg">
                        {review.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-white flex items-center gap-2">
                          {review.customer_name}
                          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                          </span>
                        </h4>
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${
                          star <= review.rating 
                            ? 'fill-gold-500 text-gold-500' 
                            : 'fill-charcoal-800 text-charcoal-800'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 font-light leading-relaxed">{review.comment}</p>
                </motion.div>
              ))
            )}
          </div>

          {/* Write Review Form */}
          <div className="lg:col-span-5">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 sticky top-24">
              <h3 className="text-xl font-serif font-medium text-white mb-6">Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                  <input
                    required
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-8 h-8 transition-colors ${
                            star <= reviewRating 
                              ? 'fill-gold-500 text-gold-500' 
                              : 'fill-charcoal-800 text-charcoal-800 hover:text-gold-500/50 hover:fill-gold-500/50'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Your Review</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-white/10 text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="What did you think about this fragrance?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gold-500 text-charcoal-950 py-4 rounded-xl font-medium hover:bg-gold-400 transition-colors disabled:bg-charcoal-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
