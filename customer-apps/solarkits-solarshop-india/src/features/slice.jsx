import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";
import { clearUser } from "./auth.slice";

// ─────────────────────────────────────────────────────────────────
// Thunks
// ─────────────────────────────────────────────────────────────────

export const fetchCart = createAsyncThunk(
  "solar/fetchCart",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/india/v1/shop/cart");
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(clearUser());
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const syncCartWithBackend = createAsyncThunk(
  "solar/syncCartWithBackend",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { slice } = getState();
      const { cart } = slice;
      const { isAuthenticated } = getState().auth_slice;
      if (!isAuthenticated) return;
      const response = await axiosInstance.post("/india/v1/shop/cart", { cart });
      
      // Fetch latest live stock so quantity updates are instantly reflected
      const districtId = slice.selectedDistrict?.id;
      if (districtId) {
        dispatch(fetchLiveInventory({ districtId }));
      } else {
        dispatch(fetchLiveInventory({}));
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(clearUser());
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to sync cart');
    }
  }
);

export const getAvailableKitData = createAsyncThunk(
  "solar/getAvailableKitData",
  async (params) => {
    const { districtId } = params || {};
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const url = districtId 
      ? `${apiBase}/india/v1/shop/combo-kits?district_id=${districtId}`
      : `${apiBase}/india/v1/shop/combo-kits`;
    const response = await axios.get(url);
    return response.data.data;
  }
);

// Bulk kits thunk (completely separate for Bulk Buy page)
export const getBulkKitBuyData = createAsyncThunk(
  "solar/getBulkKitBuyData",
  async (params) => {
    const { districtId } = params || {};
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const url = districtId 
      ? `${apiBase}/india/v1/shop/combo-kits?district_id=${districtId}`
      : `${apiBase}/india/v1/shop/combo-kits`;
    const response = await axios.get(url);
    return response.data.data;
  }
);

export const fetchLiveInventory = createAsyncThunk(
  "solar/fetchLiveInventory",
  async (params, { rejectWithValue }) => {
    try {
      const { districtId } = params || {};
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const url = districtId
        ? `${apiBase}/india/v1/shop/inventory-status?district_id=${districtId}`
        : `${apiBase}/india/v1/shop/inventory-status`;
      const response = await axios.get(url);
      return response.data.stock || {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inventory');
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────
const generateCartItemId = (kitId, variantIndex, districtId) => {
  return districtId ? `${kitId}-${variantIndex}-${districtId}` : `${kitId}-${variantIndex}`;
};

// ─────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────
const slice = createSlice({
  name: "slice",
  initialState: {
    availableKits: [],
    bulkKits: [],
    cart: [],
    bulkCart: [],
    // Live inventory: { [kitId]: availableStock }
    liveStock: {},
    // Reservation expiry time (ISO string or null)
    cartExpiryTime: null,
    // District ID that was active when cart items were added
    cartDistrictId: null,
    showAuthDialog: false,
    // location change warning: pending district change info
    pendingLocationChange: null, // { selectedState, selectedDistrict }
    alert: { status: "", message: "", undoItem: null },
    status: 'idle',
    error: null,
    selectedState: (() => {
      try {
        return JSON.parse(localStorage.getItem("selectedState")) || null;
      } catch (e) {
        return null;
      }
    })(),
    selectedDistrict: (() => {
      try {
        return JSON.parse(localStorage.getItem("selectedDistrict")) || null;
      } catch (e) {
        return null;
      }
    })(),
  },
  reducers: {
    // ── Regular Cart ────────────────────────────────────────────
    addToCart: (state, action) => {
      const payload = action.payload;

      // Handle direct catalogue items (e.g. EPC product catalogue)
      if (payload && (payload.is_catalogue_item || payload.listing_id || payload.item_type === 'product')) {
        const cartItemId = payload.listing_id || payload.id || `item_${Date.now()}`;
        const exists = state.cart.find((c) => c.cartItemId === cartItemId || c.id === (payload.id || payload.listing_id));

        if (exists) {
          exists.qty += (payload.qty || 1);
        } else {
          state.cart.push({
            id: payload.id || payload.listing_id,
            cartItemId,
            title: payload.title || payload.name,
            kitName: payload.title || payload.name,
            selling_price_inr: payload.selling_price_inr,
            price_before_tax_inr: payload.price_before_tax_inr,
            taxes_and_charges_inr: payload.taxes_and_charges_inr,
            ourPrice: parseFloat(payload.selling_price_inr || 0),
            marketPrice: parseFloat(payload.selling_price_inr || 0),
            image_url: payload.image_url,
            is_catalogue_item: true,
            is_custom: true,
            qty: payload.qty || 1,
            availableStock: payload.stock_quantity || 99,
            productTier: payload.sku_code || 'Standard',
          });
        }
        state.alert = {
          status: "success",
          message: `${payload.title || payload.name} added to cart.`,
          undoItem: null,
        };
        return;
      }

      let kit;
      let variantIndex = 0;

      if (typeof payload === 'number' || typeof payload === 'string') {
        kit = state.availableKits.find((i) => i.id === Number(payload));
        variantIndex = 0;
      } else {
        kit = state.availableKits.find((i) => i.id === payload.id);
        variantIndex = payload.variantIndex || 0;
      }

      if (kit) {
        const currentVariant = kit.variants?.[variantIndex];
        if (!currentVariant) return;

        // Use live stock if available, otherwise fall back to variant's availableStock
        const liveAvailable = state.liveStock[kit.id] !== undefined
          ? state.liveStock[kit.id]
          : (currentVariant.availableStock ?? 999);

        const districtId = state.selectedDistrict?.id || state.selectedDistrict?._id || null;
        const districtName = state.selectedDistrict?.name || null;

        const cartItemId = generateCartItemId(kit.id, variantIndex, districtId);
        const exists = state.cart.find((c) => c.cartItemId === cartItemId);

        const cartItem = {
          ...kit,
          ...currentVariant,
          id: kit.id,
          cartItemId,
          variantIndex,
          qty: 1,
          productTier: currentVariant.productTier,
          tierBenefits: currentVariant.tierBenefits,
          marketPrice: currentVariant.marketPrice,
          ourPrice: currentVariant.ourPrice,
          includedDeliveryCharge: currentVariant.includedDeliveryCharge,
          inStock: currentVariant.inStock,
          availableStock: liveAvailable,
          districtId,
          districtName
        };

        const currentCartQtySum = state.cart
          .filter(item => item.id === kit.id && item.districtId === districtId)
          .reduce((sum, item) => sum + item.qty, 0);

        if (exists) {
          if (currentCartQtySum < liveAvailable) {
            exists.qty += 1;
          }
        } else {
          if (currentCartQtySum < liveAvailable && liveAvailable > 0) {
            state.cart.push(cartItem);
            // Record the district when first item was added
            if (state.cart.length === 1) {
              state.cartDistrictId = districtId;
            }
          }
        }

        state.alert = {
          status: "success",
          message: `${kit.kitName} (${currentVariant.productTier}) added to cart.`,
          undoItem: null,
        };
      }
    },

    removeFromCart: (state, action) => {
      const cartItemId = action.payload;
      const item = state.cart.find((c) => c.cartItemId === cartItemId);

      if (item) {
        state.cart = state.cart.filter((c) => c.cartItemId !== cartItemId);
        if (state.cart.length === 0) {
          state.cartDistrictId = null;
        }
        state.alert = {
          status: "warning",
          message: `${item.kitName} (${item.productTier}) removed from cart.`,
          undoItem: { ...item, source: "cart" },
        };
      }
    },

    increaseQty: (state, action) => {
      const cartItemId = action.payload;
      const product = state.cart.find((c) => c.cartItemId === cartItemId);
      if (product) {
        const liveAvailable = state.liveStock[product.id] !== undefined
          ? state.liveStock[product.id]
          : (product.availableStock ?? 999);
        const currentCartQtySum = state.cart
          .filter(item => item.id === product.id)
          .reduce((sum, item) => sum + item.qty, 0);
        if (currentCartQtySum < liveAvailable) {
          product.qty += 1;
        }
      }
    },

    decreaseQty: (state, action) => {
      const cartItemId = action.payload;
      const product = state.cart.find((c) => c.cartItemId === cartItemId);
      if (product && product.qty > 1) product.qty -= 1;
    },

    // ── Bulk Cart (local-only, disconnected from live inventory) ─────────────
    addToBulkCart: (state, action) => {
      const payload = action.payload;
      let kit;
      let variantIndex = 0;
      if (typeof payload === 'number' || typeof payload === 'string') {
        kit = state.bulkKits.find((i) => i.id === Number(payload));
        variantIndex = 0;
      } else {
        kit = state.bulkKits.find((i) => i.id === payload.id);
        variantIndex = payload.variantIndex || 0;
      }
      if (kit) {
        const currentVariant = kit.variants?.[variantIndex];
        if (!currentVariant) return;
        const cartItemId = generateCartItemId(kit.id, variantIndex);
        const exists = state.bulkCart.find((c) => c.cartItemId === cartItemId);
        const bulkCartItem = {
          ...kit, ...currentVariant, id: kit.id, cartItemId, variantIndex, qty: 1,
          productTier: currentVariant.productTier, tierBenefits: currentVariant.tierBenefits,
          marketPrice: currentVariant.marketPrice, ourPrice: currentVariant.ourPrice,
          includedDeliveryCharge: currentVariant.includedDeliveryCharge,
          inStock: currentVariant.inStock, availableStock: currentVariant.availableStock,
          bulkPack: kit.bulkPack,
        };
        if (exists) {
          let maxAllowedPacks = 10;
          if (exists.bulkPack?.tiers?.length > 0) {
            maxAllowedPacks = Math.max(...exists.bulkPack.tiers.map(t => t.quantity));
          }
          if (exists.qty < maxAllowedPacks) exists.qty += 1;
        } else {
          state.bulkCart.push(bulkCartItem);
        }
        state.alert = { status: "success", message: `${kit.kitName} (${currentVariant.productTier}) added to bulk cart.`, undoItem: null };
      }
    },

    removeFromBulkCart: (state, action) => {
      const cartItemId = action.payload;
      const item = state.bulkCart.find((c) => c.cartItemId === cartItemId);
      if (item) {
        state.bulkCart = state.bulkCart.filter((c) => c.cartItemId !== cartItemId);
        state.alert = { status: "warning", message: `${item.kitName} (${item.productTier}) removed from bulk cart.`, undoItem: { ...item, source: "bulkCart" } };
      }
    },

    increaseBulkQty: (state, action) => {
      const cartItemId = action.payload;
      const product = state.bulkCart.find((c) => c.cartItemId === cartItemId);
      if (product) {
        let maxAllowedPacks = 10;
        if (product.bulkPack?.tiers?.length > 0) {
          maxAllowedPacks = Math.max(...product.bulkPack.tiers.map(t => t.quantity));
        }
        if (product.qty < maxAllowedPacks) product.qty += 1;
      }
    },

    decreaseBulkQty: (state, action) => {
      const cartItemId = action.payload;
      const product = state.bulkCart.find((c) => c.cartItemId === cartItemId);
      if (product && product.qty > 1) product.qty -= 1;
    },

    updateBulkCartVariant: (state, action) => {
      const { oldCartItemId, newVariantIndex } = action.payload;
      const oldItem = state.bulkCart.find(c => c.cartItemId === oldCartItemId);
      if (oldItem) {
        const kit = state.bulkKits.find(k => k.id === oldItem.id);
        if (kit && kit.variants?.[newVariantIndex]) {
          const newVariant = kit.variants[newVariantIndex];
          const newCartItemId = generateCartItemId(oldItem.id, newVariantIndex);
          const existingItem = state.bulkCart.find(c => c.cartItemId === newCartItemId);
          if (existingItem) {
            existingItem.qty += oldItem.qty;
            state.bulkCart = state.bulkCart.filter(c => c.cartItemId !== oldCartItemId);
          } else {
            oldItem.cartItemId = newCartItemId;
            oldItem.variantIndex = newVariantIndex;
            oldItem.productTier = newVariant.productTier;
            oldItem.tierBenefits = newVariant.tierBenefits;
            oldItem.marketPrice = newVariant.marketPrice;
            oldItem.ourPrice = newVariant.ourPrice;
            oldItem.includedDeliveryCharge = newVariant.includedDeliveryCharge;
            oldItem.inStock = newVariant.inStock;
          }
        }
      }
    },

    clearBulkCart: (state) => { state.bulkCart = []; },

    // ── Shared Actions ──────────────────────────────────────────
    undoRemove: (state) => {
      if (state.alert.undoItem) {
        const { source, ...item } = state.alert.undoItem;
        if (source === "cart") {
          const exists = state.cart.find(c => c.cartItemId === item.cartItemId);
          if (!exists) state.cart.push(item);
        } else if (source === "bulkCart") {
          const exists = state.bulkCart.find(c => c.cartItemId === item.cartItemId);
          if (!exists) state.bulkCart.push(item);
        }
        state.alert = {
          status: "success",
          message: `${item.kitName} (${item.productTier}) restored.`,
          undoItem: null,
        };
      }
    },

    clearAlert: (state) => {
      state.alert = { status: "", message: "", undoItem: null };
    },

    updateCartVariant: (state, action) => {
      const { oldCartItemId, newVariantIndex } = action.payload;
      const oldItem = state.cart.find(c => c.cartItemId === oldCartItemId);

      if (oldItem) {
        const kit = state.availableKits.find(k => k.id === oldItem.id);
        if (kit && kit.variants?.[newVariantIndex]) {
          const newVariant = kit.variants[newVariantIndex];
          const newCartItemId = generateCartItemId(oldItem.id, newVariantIndex, oldItem.districtId);

          const existingItem = state.cart.find(c => c.cartItemId === newCartItemId);

          if (existingItem) {
            existingItem.qty += oldItem.qty;
            state.cart = state.cart.filter(c => c.cartItemId !== oldCartItemId);
          } else {
            oldItem.cartItemId = newCartItemId;
            oldItem.variantIndex = newVariantIndex;
            oldItem.productTier = newVariant.productTier;
            oldItem.tierBenefits = newVariant.tierBenefits;
            oldItem.marketPrice = newVariant.marketPrice;
            oldItem.ourPrice = newVariant.ourPrice;
            oldItem.includedDeliveryCharge = newVariant.includedDeliveryCharge;
            oldItem.inStock = newVariant.inStock;
          }
        }
      }
    },

    addCustomKitToCart: (state, action) => {
      const customKit = action.payload;
      state.cart.push(customKit);
      state.alert = {
        status: "success",
        message: `${customKit.kitName} added to cart.`,
        undoItem: null,
      };
    },

    clearCart: (state) => {
      state.cart = [];
      state.cartDistrictId = null;
      state.cartExpiryTime = null;
    },

    setShowAuthDialog: (state, action) => {
      state.showAuthDialog = action.payload;
    },

    // ── Location management ──────────────────────────────────────
    setPendingLocationChange: (state, action) => {
      state.pendingLocationChange = action.payload; // { selectedState, selectedDistrict }
    },

    clearPendingLocationChange: (state) => {
      state.pendingLocationChange = null;
    },

    commitLocationChange: (state, action) => {
      const { clearCartOnChange } = action.payload;
      if (state.pendingLocationChange) {
        const { selectedState, selectedDistrict } = state.pendingLocationChange;
        state.selectedState = selectedState;
        state.selectedDistrict = selectedDistrict;
        if (selectedState) {
          localStorage.setItem("selectedState", JSON.stringify(selectedState));
        } else {
          localStorage.removeItem("selectedState");
        }
        if (selectedDistrict) {
          localStorage.setItem("selectedDistrict", JSON.stringify(selectedDistrict));
        } else {
          localStorage.removeItem("selectedDistrict");
        }
        state.pendingLocationChange = null;
        if (clearCartOnChange) {
          state.cart = [];
          state.cartDistrictId = null;
        }
        state.liveStock = {};
      }
    },

    setSelectedLocation: (state, action) => {
      const { selectedState, selectedDistrict } = action.payload;
      state.selectedState = selectedState;
      state.selectedDistrict = selectedDistrict;
      if (selectedState) {
        localStorage.setItem("selectedState", JSON.stringify(selectedState));
      } else {
        localStorage.removeItem("selectedState");
      }
      if (selectedDistrict) {
        localStorage.setItem("selectedDistrict", JSON.stringify(selectedDistrict));
      } else {
        localStorage.removeItem("selectedDistrict");
      }
    },

    setLiveStock: (state, action) => {
      state.liveStock = action.payload || {};
      
      const kitsInCart = [...new Set(state.cart.map(item => item.id))];
      kitsInCart.forEach(kitId => {
        const liveAvailable = state.liveStock[kitId];
        if (liveAvailable !== undefined) {
          const items = state.cart.filter(item => item.id === kitId);
          items.forEach(item => {
            item.availableStock = liveAvailable;
            item.inStock = liveAvailable > 0;
          });
          
          let totalQty = items.reduce((sum, item) => sum + item.qty, 0);
          if (totalQty > liveAvailable) {
            let excess = totalQty - liveAvailable;
            for (let i = items.length - 1; i >= 0; i--) {
              if (excess <= 0) break;
              const item = items[i];
              if (item.qty > excess) {
                item.qty -= excess;
                excess = 0;
              } else {
                excess -= item.qty;
                item.qty = 0;
              }
            }
            state.cart = state.cart.filter(item => item.qty > 0);
            if (state.cart.length === 0) {
              state.cartDistrictId = null;
            }
          }
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAvailableKitData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getAvailableKitData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.availableKits = action.payload;
        if (action.payload && Array.isArray(action.payload)) {
          action.payload.forEach(kit => {
            if (kit.limitedStock?.quantityLeft !== undefined) {
              state.liveStock[kit.id] = kit.limitedStock.quantityLeft;
            }
          });
        }
      })
      .addCase(getAvailableKitData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cart = action.payload.cart || [];
        state.cartExpiryTime = action.payload.expiry_time || null;
        // If cart is empty, clear expiry
        if (!state.cart.length) state.cartExpiryTime = null;
      })
      .addCase(syncCartWithBackend.fulfilled, (state, action) => {
        if (action.payload?.expiry_time !== undefined) {
          state.cartExpiryTime = action.payload.expiry_time || null;
        }
        if (!state.cart.length) state.cartExpiryTime = null;
      })
      .addCase(getBulkKitBuyData.fulfilled, (state, action) => {
        state.bulkKits = action.payload || [];
      })
      .addCase(fetchLiveInventory.fulfilled, (state, action) => {
        state.liveStock = action.payload || {};
        
        const kitsInCart = [...new Set(state.cart.map(item => item.id))];
        kitsInCart.forEach(kitId => {
          const liveAvailable = state.liveStock[kitId];
          if (liveAvailable !== undefined) {
            const items = state.cart.filter(item => item.id === kitId);
            items.forEach(item => {
              item.availableStock = liveAvailable;
              item.inStock = liveAvailable > 0;
            });
            
            let totalQty = items.reduce((sum, item) => sum + item.qty, 0);
            if (totalQty > liveAvailable) {
              let excess = totalQty - liveAvailable;
              for (let i = items.length - 1; i >= 0; i--) {
                if (excess <= 0) break;
                const item = items[i];
                if (item.qty > excess) {
                  item.qty -= excess;
                  excess = 0;
                } else {
                  excess -= item.qty;
                  item.qty = 0;
                }
              }
              state.cart = state.cart.filter(item => item.qty > 0);
              if (state.cart.length === 0) {
                state.cartDistrictId = null;
              }
            }
          }
        });
      });
  },
});

// ─────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────
export const selectCartItems = (state) => state.slice.cart;
export const selectCartTotal = (state) => {
  return state.slice.cart.reduce((sum, item) => sum + (item.qty * item.ourPrice), 0);
};
export const selectCartTotalItems = (state) => {
  return state.slice.cart.reduce((sum, item) => sum + item.qty, 0);
};
export const selectCartSavings = (state) => {
  return state.slice.cart.reduce((sum, item) => {
    return sum + (item.qty * (item.marketPrice - item.ourPrice));
  }, 0);
};
export const selectLiveStock = (state) => state.slice.liveStock;
export const selectCartExpiryTime = (state) => state.slice.cartExpiryTime;

export const {
  addToCart,
  removeFromCart,
  increaseQty,
  decreaseQty,
  undoRemove,
  clearAlert,
  updateCartVariant,
  addToBulkCart,
  removeFromBulkCart,
  increaseBulkQty,
  decreaseBulkQty,
  updateBulkCartVariant,
  clearBulkCart,
  setSelectedLocation,
  setPendingLocationChange,
  clearPendingLocationChange,
  commitLocationChange,
  addCustomKitToCart,
  clearCart,
  setShowAuthDialog,
  setLiveStock,
} = slice.actions;

export default slice.reducer;