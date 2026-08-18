import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    summary: {
      subtotal_inr: 0,
      total_discount_inr: 0,
      net_taxable_inr: 0,
      cgst_inr: 0,
      sgst_inr: 0,
      igst_inr: 0,
      total_tax_inr: 0,
      shipping_inr: 0,
      grand_total_inr: 0,
      items_count: 0,
      is_interstate: false,
    },
    moq_passed: true,
    moq_errors: [],
  });

  const [loading, setLoading] = useState(false);

  // Get current state code or default to GJ
  const destState = 'GJ';

  const refreshCart = async () => {
    try {
      const buyerType = user?.role || 'guest';
      const res = await api.get('/order/cart', {
        params: {
          buyer_id: user?.id || undefined,
          buyer_type: buyerType,
          dest_state: destState,
        },
      });
      if (res.data?.success && res.data.cart) {
        setCart(res.data.cart);
      }
    } catch (err) {
      console.warn('Cart refresh warning:', err.message);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const addToCart = async (product, quantity = 1) => {
    try {
      setLoading(true);
      const buyerType = user?.role || 'guest';
      await api.post('/order/cart/add', {
        buyer_id: user?.id || undefined,
        buyer_type: buyerType,
        product_id: product.id || product._id,
        item_name: product.name,
        quantity,
      });
      await refreshCart();
      return true;
    } catch (err) {
      console.error('Error adding to cart:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      await api.post('/order/cart/remove', {
        buyer_id: user?.id || undefined,
        product_id: productId,
      });
      await refreshCart();
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setLoading(false);
    }
  };

  const itemCount = cart.summary?.items_count || cart.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        addToCart,
        removeFromCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
