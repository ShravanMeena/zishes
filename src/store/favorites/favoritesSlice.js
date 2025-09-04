import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAV_KEY = 'favorites_v1';

export const bootstrapFavorites = createAsyncThunk('favorites/bootstrap', async () => {
  try {
    const raw = await AsyncStorage.getItem(FAV_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
});

export const addFavorite = createAsyncThunk('favorites/add', async (item, { getState }) => {
  const { favorites } = getState();
  const exists = favorites.items.find((it) => it.id === item.id);
  const next = exists ? favorites.items : [item, ...favorites.items];
  await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
});

export const removeFavorite = createAsyncThunk('favorites/remove', async (id, { getState }) => {
  const { favorites } = getState();
  const next = favorites.items.filter((it) => it.id !== id);
  await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
});

export const clearFavorites = createAsyncThunk('favorites/clear', async () => {
  await AsyncStorage.setItem(FAV_KEY, JSON.stringify([]));
  return [];
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { items: [], bootstrapped: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapFavorites.fulfilled, (state, action) => {
        state.items = action.payload;
        state.bootstrapped = true;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(clearFavorites.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export default favoritesSlice.reducer;

