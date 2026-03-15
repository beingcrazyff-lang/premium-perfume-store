import { Link } from 'react-router-dom';
import { ShoppingBag, LayoutDashboard } from 'lucide-react';
import { useCart } from '../store/useCart';

export default function Navbar() {
  const items = useCart((state) => state.items);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center">
              <span className="text-charcoal-950 font-serif font-bold text-xl">A</span>
            </div>
            <span className="font-serif text-xl font-semibold tracking-tight text-white">Aura Perfumes</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/admin" className="text-gray-400 hover:text-gold-400 flex items-center gap-2 text-sm font-medium transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
            
            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-gold-400 hover:bg-white/5 rounded-full transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-charcoal-950 transform translate-x-1/4 -translate-y-1/4 bg-gold-500 rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
