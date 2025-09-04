import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = 'listing_draft_v1';

const initialState = {
  loaded: false,
  isDirty: false,
  photos: [],
  details: {
    name: '',
    description: '',
    category: '',
    condition: '',
    qty: '',
    productId: '7654738920xxx',
  },
  play: {
    expectedPrice: '',
    pricePerPlay: '',
    playsCount: '',
    endDate: '',
    game: '',
  },
  delivery: {
    method: 'pickup',
    pickupNote: '',
  },
  policies: {
    listing: false,
    dispute: false,
    antifraud: false,
    agreeAll: false,
  },
};

export const loadDraft = createAsyncThunk('listingDraft/load', async () => {
  const json = await AsyncStorage.getItem(DRAFT_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
});

export const saveDraft = createAsyncThunk('listingDraft/save', async (state) => {
  const toSave = { ...state, isDirty: false };
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
  return true;
});

// Convenience: save whatever is in the store without passing state down
export const saveDraftFromStore = createAsyncThunk('listingDraft/saveCurrent', async (_, { getState }) => {
  const state = getState().listingDraft;
  const toSave = { ...state, isDirty: false };
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
  return true;
});

export const clearDraftStorage = createAsyncThunk('listingDraft/clear', async () => {
  await AsyncStorage.removeItem(DRAFT_KEY);
  return true;
});

const slice = createSlice({
  name: 'listingDraft',
  initialState,
  reducers: {
    setPhotos(state, action) {
      state.photos = action.payload || [];
      state.isDirty = true;
    },
    addPhotos(state, action) {
      const arr = action.payload || [];
      state.photos = [...state.photos, ...arr];
      state.isDirty = true;
    },
    removePhotoAt(state, action) {
      const idx = action.payload;
      state.photos = state.photos.filter((_, i) => i !== idx);
      state.isDirty = true;
    },
    setCoverIndex(state, action) {
      const idx = action.payload;
      if (idx >= 0 && idx < state.photos.length) {
        const cover = state.photos[idx];
        state.photos = [cover, ...state.photos.filter((_, i) => i !== idx)];
        state.isDirty = true;
      }
    },
    updateDetails(state, action) {
      state.details = { ...state.details, ...(action.payload || {}) };
      state.isDirty = true;
    },
    updatePlay(state, action) {
      state.play = { ...state.play, ...(action.payload || {}) };
      state.isDirty = true;
    },
    updateDelivery(state, action) {
      state.delivery = { ...state.delivery, ...(action.payload || {}) };
      state.isDirty = true;
    },
    updatePolicies(state, action) {
      state.policies = { ...state.policies, ...(action.payload || {}) };
      state.isDirty = true;
    },
    markSaved(state) {
      state.isDirty = false;
    },
    resetDraft(state) {
      Object.assign(state, initialState);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDraft.fulfilled, (state, action) => {
        state.loaded = true;
        if (action.payload) {
          const merged = { ...initialState, ...action.payload };
          merged.isDirty = action.payload.isDirty || false;
          Object.assign(state, merged);
        }
      })
      .addCase(loadDraft.rejected, (state) => {
        state.loaded = true;
      })
      .addCase(saveDraft.fulfilled, (state) => {
        state.isDirty = false;
      })
      .addCase(clearDraftStorage.fulfilled, (state) => {
        Object.assign(state, { ...initialState, loaded: true });
      });
  }
});

export const {
  setPhotos,
  addPhotos,
  removePhotoAt,
  setCoverIndex,
  updateDetails,
  updatePlay,
  updateDelivery,
  updatePolicies,
  markSaved,
  resetDraft,
} = slice.actions;

export default slice.reducer;
