import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  size: string;
  image: string;
  category: string;
  stock: number;
  top_notes?: string;
  heart_notes?: string;
  base_notes?: string;
  averageRating?: number;
  reviewCount?: number;
  price_6ml: number;
  price_10ml: number;
  price_30ml: number;
  is_combo?: number;
  combo_items?: string; // JSON string of product IDs
}

export interface CartItem extends Product {
  quantity: number;
  engraving?: string;
  selectedSize: string;
  selectedPrice: number;
  cartItemId: string; // Unique ID for cart item to handle same product with different engravings and sizes
}

interface CartStore {
  items: CartItem[];
  giftWrap: boolean;
  addItem: (product: Product, selectedSize: string, selectedPrice: number, engraving?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  toggleGiftWrap: () => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      giftWrap: false,
      addItem: (product, selectedSize, selectedPrice, engraving) => {
        set((state) => {
          const cartItemId = engraving ? `${product.id}-${selectedSize}-${engraving}` : `${product.id}-${selectedSize}`;
          const existingItem = state.items.find((item) => item.cartItemId === cartItemId);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.cartItemId === cartItemId
                  ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
                  : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1, engraving, selectedSize, selectedPrice, cartItemId }] };
        });
      },
      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },
      updateQuantity: (cartItemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity } : item
          ),
        }));
      },
      toggleGiftWrap: () => set((state) => ({ giftWrap: !state.giftWrap })),
      clearCart: () => set({ items: [], giftWrap: false }),
      getTotal: () => {
        const itemsTotal = get().items.reduce((total, item) => total + item.selectedPrice * item.quantity, 0);
        return itemsTotal + (get().giftWrap ? 200 : 0); // 200 is gift wrap fee
      },
    }),
    {
      name: 'perfume-cart',
    }
  )
);
