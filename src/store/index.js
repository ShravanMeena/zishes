import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import authReducer from './auth/authSlice';
import appReducer from './app/appSlice';
import favoritesReducer from './favorites/favoritesSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  app: appReducer,
  favorites: favoritesReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export default store;
