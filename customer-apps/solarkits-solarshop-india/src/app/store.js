import { configureStore } from "@reduxjs/toolkit"
import slice, { syncCartWithBackend } from "../features/slice";
import alertReducer from "../features/alert.slice";
import authReducer from "../features/auth.slice";

let syncTimeout = null;

const cartSyncMiddleware = store => next => action => {
  const result = next(action);
  
  // Only sync the regular cart to backend (not bulk cart)
  const cartActions = [
    'slice/addToCart',
    'slice/removeFromCart',
    'slice/increaseQty',
    'slice/decreaseQty',
    'slice/addCustomKitToCart',
    'slice/clearCart',
    'slice/updateCartVariant',
    'slice/undoRemove',
    'solar/fetchLiveInventory/fulfilled'
  ];
  
  if (cartActions.includes(action.type)) {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    syncTimeout = setTimeout(() => {
      const state = store.getState();
      if (state.auth_slice.isAuthenticated) {
        store.dispatch(syncCartWithBackend());
      }
    }, 500); // 500ms debounce
  }
  
  return result;
};

const store = configureStore({
    reducer: {
        slice: slice,
        alert_slice: alertReducer,
        auth_slice: authReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(cartSyncMiddleware)
})

export default store;