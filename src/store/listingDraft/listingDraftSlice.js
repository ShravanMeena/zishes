import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadImage } from '../../services/uploads';
import { createProductWithTournament } from '../../services/products';
import users from '../../services/users';
import { setUser } from '../auth/authSlice';
import { saveNewDraft } from './draftsStorage';

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
    game: '', // store selected game id (ObjectId string)
    gameName: '', // friendly name for UI display
    // New fields to support backend flow
    earlyTerminationEnabled: true,
    earlyTerminationThresholdPct: 80,
    platinumOnly: false,
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
    // Additional acknowledgements required by backend
    enableEarlyTerminationAck: false,
    listingExtensionAck: false,
    platinumOnlyAck: false,
  },
  // Submission UI state
  submitting: false,
  submitStage: 'idle', // 'idle' | 'uploading' | 'creating' | 'success' | 'error'
  submitProgress: 0, // 0..1
  submitError: null,
  lastResponse: null,
  // UI helpers
  ui: {
    pendingLeaveToRoute: null, // if user tries to leave Sell tab while dirty
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

// Save the current draft as a new entry in the drafts list
export const saveCurrentAsNewDraft = createAsyncThunk('listingDraft/saveNewDraft', async ({ name }, { getState }) => {
  const rootState = getState();
  const draftState = rootState.listingDraft;
  const userCountry = rootState?.auth?.user?.address?.country;
  const toSave = { ...draftState, isDirty: false };
  const saved = await saveNewDraft({
    name: name || draftState?.details?.name || 'Untitled Item',
    data: toSave,
    originCountry: userCountry,
  });
  return saved;
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
    setSubmitStage(state, action) {
      state.submitStage = action.payload || 'idle';
    },
    setSubmitProgress(state, action) {
      const p = Number(action.payload || 0);
      state.submitProgress = Math.max(0, Math.min(1, p));
    },
    setSubmitting(state, action) {
      state.submitting = !!action.payload;
    },
    setSubmitError(state, action) {
      state.submitError = action.payload || null;
    },
    setSubmitResult(state, action) {
      state.lastResponse = action.payload || null;
    },
    clearSubmitState(state) {
      state.submitting = false;
      state.submitStage = 'idle';
      state.submitProgress = 0;
      state.submitError = null;
      state.lastResponse = null;
    },
    resetDraft(state) {
      Object.assign(state, initialState);
    },
    // Load full draft data programmatically (e.g., Continue from Drafts)
    loadFromDraft(state, action) {
      const payload = action.payload || {};
      const merged = { ...initialState, ...payload };
      merged.loaded = true;
      Object.assign(state, merged);
    },
    setPendingLeaveRoute(state, action) {
      state.ui.pendingLeaveToRoute = action.payload || null;
    },
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
      })
      .addCase(saveCurrentAsNewDraft.fulfilled, (state) => {
        state.isDirty = false;
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
  setSubmitStage,
  setSubmitProgress,
  setSubmitting,
  setSubmitError,
  setSubmitResult,
  clearSubmitState,
  resetDraft,
  loadFromDraft,
  setPendingLeaveRoute,
} = slice.actions;

export default slice.reducer;

// --- Submit flow: upload images, create product + tournament ---

function mapCondition(cond) {
  if (!cond) return undefined;
  const c = String(cond).trim().toLowerCase();
  if (c === 'new') return 'New';
  if (c === 'like new' || c === 'like_new' || c === 'like-new' || c === 'likenew') return 'LIKE_NEW';
  if (c === 'good' || c === 'used') return 'GOOD';
  if (c === 'fair') return 'FAIR';
  return undefined;
}

function mapDelivery(method) {
  switch (method) {
    case 'pickup': return 'SELF_PICKUP';
    case 'courier':
    case 'domestic': return 'COURIER_DOMESTIC';
    case 'intl': return 'COURIER_INTERNATIONAL';
    case 'digital': return 'DIGITAL';
    default: return undefined;
  }
}

export const publishListing = createAsyncThunk('listingDraft/publish', async (_, { getState, rejectWithValue, dispatch }) => {
  const { listingDraft, auth } = getState();
  const token = auth?.token;
  if (!token) return rejectWithValue('You must be logged in.');

  const photos = Array.isArray(listingDraft.photos) ? listingDraft.photos : [];
  const details = listingDraft.details || {};
  const play = listingDraft.play || {};
  const delivery = listingDraft.delivery || {};
  const policies = listingDraft.policies || {};

  // Basic validations
  if (!photos.length) return rejectWithValue('Please add at least one photo.');
  if (!details.name) return rejectWithValue('Please enter item name.');
  if (!details.description) return rejectWithValue('Please enter description.');
  if (!details.qty && details.qty !== 0) return rejectWithValue('Please enter quantity.');
  if (!play.expectedPrice) return rejectWithValue('Please enter expected price.');
  if (!play.pricePerPlay) return rejectWithValue('Please enter price per gameplay.');
  if (!play.playsCount) return rejectWithValue('Please enter number of gameplays.');
  if (!play.endDate) return rejectWithValue('Please select an end date.');
  if (!play.game) return rejectWithValue('Please select a game.');
  // All terms must be acknowledged
  const requiredTermsTrue = [
    policies.listing,
    policies.dispute,
    policies.antifraud,
    policies.agreeAll,
  ].every(Boolean);
  if (!requiredTermsTrue) return rejectWithValue('Please accept all terms in Policies tab.');

  // Initialize submit state
  dispatch(setSubmitting(true));
  dispatch(setSubmitError(null));
  dispatch(setSubmitResult(null));

  const fail = (err, fallback) => {
    const message = typeof err === 'string' ? err : err?.message || fallback;
    dispatch(setSubmitStage('error'));
    dispatch(setSubmitting(false));
    dispatch(setSubmitError(message));
    return rejectWithValue(message);
  };

  // Upload images if local with coarse progress
  const imageUrls = [];
  const total = photos.length + 1; // +1 for create step
  let step = 0;
  const update = () => dispatch(setSubmitProgress(step / total));
  dispatch(setSubmitStage('uploading'));
  update();
  try {
    for (const p of photos) {
      const uri = p?.uri || p;
      if (!uri) { step += 1; update(); continue; }
      if (/^https?:\/\//i.test(uri)) {
        imageUrls.push(uri);
        step += 1; update();
      } else {
        const up = await uploadImage({ uri, token });
        if (!up?.url) throw new Error('Image upload failed');
        imageUrls.push(up.url);
        step += 1; update();
      }
    }
  } catch (err) {
    return fail(err, 'Failed to upload listing images');
  }

  // Build endedAt ISO
  let endedAt;
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(play.endDate))) {
      endedAt = new Date(`${play.endDate}T23:59:00.000Z`).toISOString();
    } else {
      endedAt = new Date(play.endDate).toISOString();
    }
  } catch (_) {
    return rejectWithValue('Invalid end date.');
  }

  const normalizedThreshold = (() => {
    const pct = Number(play.earlyTerminationThresholdPct);
    if (!Number.isFinite(pct)) return null;
    if (pct < 1 || pct > 100) return null;
    return pct;
  })();
  const earlyTerminationPayload = (() => {
    const enabled = !!play.earlyTerminationEnabled;
    if (!enabled && normalizedThreshold == null) return undefined;
    return {
      enabled,
      ...(normalizedThreshold != null ? { thresholdPct: normalizedThreshold } : {}),
    };
  })();

  const payload = {
    images: imageUrls,
    name: String(details.name || ''),
    categories: details.category ? [String(details.category)] : [],
    description: String(details.description || ''),
    condition: mapCondition(details.condition),
    quantity: Number(details.qty || 0),

    price: Number(play.expectedPrice || 0),
    entryFee: Number(play.pricePerPlay || 0),
    expectedPlayers: Number(play.playsCount || 0),
    endedAt,
    game: String(play.game),
    ...(earlyTerminationPayload ? { earlyTermination: earlyTerminationPayload } : {}),
    platinumOnly: !!play.platinumOnly,
    delivery: mapDelivery(delivery.method),

    terms: {
      enableEarlyTerminationAck: !!(policies.enableEarlyTerminationAck || play.earlyTerminationEnabled),
      listingExtensionAck: !!policies.listingExtensionAck,
      platinumOnlyAck: !!(policies.platinumOnlyAck || play.platinumOnly),
      acceptListingStandards: !!policies.listing,
      disputePolicy: !!policies.dispute,
      antiFraud: !!policies.antifraud,
      tosPrivacy: !!policies.agreeAll,
    },
  };

  if (__DEV__) {
    try {
      console.log('[publishListing] payload', JSON.stringify(payload, null, 2));
    } catch (_) {}
  }

  dispatch(setSubmitStage('creating'));
  step = total - 1; update();
  try {
    const res = await createProductWithTournament(payload, token);
    try {
      const me = await users.getMe();
      const doc = me?.data || me;
      if (doc) dispatch(setUser(doc));
    } catch (_) {}
    // Clear draft on success
    await dispatch(clearDraftStorage());
    dispatch(setSubmitProgress(1));
    dispatch(setSubmitStage('success'));
    dispatch(setSubmitting(false));
    dispatch(setSubmitResult(res));
    return res;
  } catch (err) {
    return fail(err, 'Failed to publish listing');
  }
});
