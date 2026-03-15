import { useEffect, useState } from 'react';
import { Product, useCart } from '../store/useCart';
import { useWishlist } from '../store/useWishlist';
import { ShoppingCart, Star, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import FragranceFinder from '../components/FragranceFinder';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const addItem = useCart((state) => state.addItem);
  const { toggleItem, isInWishlist } = useWishlist();

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch products', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-charcoal-950">
      {/* Hero Section */}
      <section className="relative bg-black text-white py-32 sm:py-48 overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <img 
            src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop" 
            alt="Luxury Perfume" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-charcoal-950/50 to-charcoal-950"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-gold-400 font-medium tracking-widest uppercase text-sm mb-4 block">The Art of Perfumery</span>
            <h1 className="text-5xl sm:text-7xl font-serif font-medium tracking-tight mb-6 text-white">
              Discover Your <span className="gold-gradient-text">Signature</span> Scent
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light">
              Premium fragrances crafted for elegance. Experience the luxury of authentic perfumes delivered across Bangladesh.
            </p>
            <a href="#collection" className="inline-flex items-center gap-2 bg-gold-500 text-charcoal-950 px-8 py-4 rounded-full font-medium hover:bg-gold-400 transition-colors">
              Shop Collection <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 bg-charcoal-900 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop" 
                alt="Luxury Perfume Craftsmanship" 
                className="rounded-2xl shadow-2xl border border-white/10 w-full h-[500px] object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-medium text-white mb-6">Masterful Craftsmanship</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Every bottle of Aura Perfume is a testament to the timeless art of perfumery. We source the rarest and most exquisite ingredients from around the world, blending them with precision to create fragrances that tell a story.
              </p>
              <p className="text-gray-400 mb-8 leading-relaxed">
                From the deep, resonant notes of pure Oudh to the delicate whisper of blooming Jasmine, our collection is designed for those who appreciate true luxury.
              </p>
              <div className="flex items-center gap-4 text-gold-400 font-serif italic">
                <Sparkles className="w-5 h-5" />
                <span>Crafted with passion, worn with elegance.</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section id="collection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex justify-between items-end mb-16 text-center sm:text-left">
          <div className="w-full">
            <h2 className="text-4xl font-serif font-medium text-white">Featured Collection</h2>
            <p className="mt-4 text-gray-400">Curated fragrances for every occasion.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="animate-pulse">
                <div className="bg-charcoal-800 aspect-[4/5] rounded-2xl mb-6"></div>
                <div className="h-4 bg-charcoal-800 rounded w-2/3 mb-3"></div>
                <div className="h-4 bg-charcoal-800 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product, index) => (
              <motion.div 
                key={product.id} 
                className="group flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/product/${product.id}`} className="relative aspect-[4/5] bg-charcoal-900 rounded-2xl overflow-hidden mb-6 block border border-white/5">
                  <img
                    src={product.image}
                    alt={product.name}
                    onLoad={() => setLoadedImages(prev => ({ ...prev, [product.id]: true }))}
                    className={`w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ${
                      loadedImages[product.id] ? 'opacity-80 group-hover:opacity-100 blur-0' : 'opacity-0 blur-md'
                    }`}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="glass-panel px-3 py-1 rounded-full text-xs font-medium text-gold-400 border border-gold-400/20">
                      {product.category}
                    </div>
                    {product.is_combo === 1 && (
                      <div className="bg-gold-500 text-charcoal-950 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Combo
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleItem(product);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full glass-panel border border-white/10 transition-all hover:scale-110"
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addItem(product, '6ml', product.price_6ml || 320);
                    }}
                    disabled={product.stock === 0}
                    className="absolute bottom-6 right-6 bg-gold-500 text-charcoal-950 p-4 rounded-full opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20 hover:bg-gold-400"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </Link>
                <div className="flex justify-between items-start px-2">
                  <div>
                    <Link to={`/product/${product.id}`} className="hover:text-gold-400 transition-colors">
                      <h3 className="text-xl font-serif font-medium text-white">{product.name}</h3>
                    </Link>
                    <p className="text-sm text-gray-400 mt-1">6ml / 10ml / 30ml</p>
                    {product.reviewCount !== undefined && product.reviewCount > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-4 h-4 fill-gold-500 text-gold-500" />
                        <span className="text-sm font-medium text-gray-300">{Number(product.averageRating).toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({product.reviewCount})</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xl font-medium text-gold-400">From ৳{product.price_6ml || 320}</p>
                </div>
                {product.stock === 0 && (
                  <p className="text-red-400 text-sm mt-2 font-medium px-2">Out of Stock</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <FragranceFinder />
    </div>
  );
}
