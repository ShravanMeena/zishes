import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import authReducer from './auth/authSlice';
import appReducer from './app/appSlice';
import favoritesReducer from './favorites/favoritesSlice';
import listingDraftReducer from './listingDraft/listingDraftSlice';
import walletReducer from './wallet/walletSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  app: appReducer,
  favorites: favoritesReducer,
  listingDraft: listingDraftReducer,
  wallet: walletReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export default store;
