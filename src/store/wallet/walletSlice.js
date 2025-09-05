import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import walletService from '../../services/wallet';

export const fetchMyWallet = createAsyncThunk('wallet/fetchMyWallet', async (_, { getState, rejectWithValue }) => {
  try {
    const token = getState()?.auth?.token;
    if (!token) return rejectWithValue('UNAUTHORIZED');
    const data = await walletService.getMyWallet(token);
    return data;
  } catch (e) {
    return rejectWithValue(e?.message || 'Failed to fetch wallet');
  }
});

const initialState = {
  availableZishCoins: 0,
  withdrawalBalance: 0,
  lastFetched: 0,
  status: 'idle',
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet(state, action) {
      const { availableZishCoins = 0, withdrawalBalance = 0 } = action.payload || {};
      state.availableZishCoins = Number(availableZishCoins || 0);
      state.withdrawalBalance = Number(withdrawalBalance || 0);
      state.lastFetched = Date.now();
    },
    resetWallet(state) {
      state.availableZishCoins = 0;
      state.withdrawalBalance = 0;
      state.lastFetched = 0;
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyWallet.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyWallet.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.availableZishCoins = Number(action.payload?.availableZishCoins || 0);
        state.withdrawalBalance = Number(action.payload?.withdrawalBalance || 0);
        state.lastFetched = Date.now();
      })
      .addCase(fetchMyWallet.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch wallet';
      });
  },
});

export const { setWallet, resetWallet } = walletSlice.actions;
export default walletSlice.reducer;

