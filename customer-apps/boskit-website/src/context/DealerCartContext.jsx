import React, { createContext, useContext, useState, useEffect } from 'react';

const DealerCartContext = createContext(null);

const CART_STORAGE_KEY = 'boskit_dealer_cart';

export function DealerCartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse dealer cart from storage:', e);
    }
    return [];
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('depot_pickup'); // 'depot_pickup' | 'site_delivery'

  // Persist to localStorage whenever cartItems changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to save dealer cart:', e);
    }
  }, [cartItems]);

  // Add Item to Cart
  const addToCart = (product, quantityToAdd) => {
    const moq = product.moq || 1;
    const qty = Math.max(moq, parseInt(quantityToAdd, 10) || moq);

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + qty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          brand: product.brand,
          brand_logo: product.brand_logo,
          image_url: product.image_url,
          dealer_wholesale_inr: product.dealer_wholesale_inr,
          mrp_inr: product.mrp_inr,
          savings_inr: product.savings_inr || Math.max(0, product.mrp_inr - product.dealer_wholesale_inr),
          moq: moq,
          quantity: qty,
          in_stock: product.in_stock,
          stock_status: product.stock_status,
          specifications: product.specifications,
        },
      ];
    });

    setIsDrawerOpen(true);
  };

  // Update Item Quantity with MOQ check
  const updateQuantity = (productId, newQty) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const minQty = item.moq || 1;
            const validQty = Math.max(1, parseInt(newQty, 10) || minQty);
            return { ...item, quantity: validQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove single item
  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== productId));
  };

  // Clear all items
  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {}
  };

  // Calculations
  const subtotalInr = cartItems.reduce(
    (acc, i) => acc + (parseFloat(i.dealer_wholesale_inr) || 0) * (i.quantity || 1),
    0
  );
  const totalMrpInr = cartItems.reduce(
    (acc, i) => acc + (parseFloat(i.mrp_inr) || (parseFloat(i.dealer_wholesale_inr) * 1.15)) * (i.quantity || 1),
    0
  );
  const totalSavingsInr = Math.max(0, totalMrpInr - subtotalInr);
  const gstAmountInr = Math.round(subtotalInr * 0.18);
  const freightInr = deliveryMode === 'depot_pickup' ? 0 : subtotalInr > 200000 ? 0 : 2500;
  const grandTotalInr = subtotalInr + gstAmountInr + freightInr;
  const totalItemsCount = cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);

  return (
    <DealerCartContext.Provider
      value={{
        cartItems,
        totalItemsCount,
        subtotalInr,
        totalMrpInr,
        totalSavingsInr,
        gstAmountInr,
        freightInr,
        grandTotalInr,
        deliveryMode,
        setDeliveryMode,
        isDrawerOpen,
        setIsDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </DealerCartContext.Provider>
  );
}

export function useDealerCart() {
  const context = useContext(DealerCartContext);
  if (!context) {
    throw new Error('useDealerCart must be used within a DealerCartProvider');
  }
  return context;
}
