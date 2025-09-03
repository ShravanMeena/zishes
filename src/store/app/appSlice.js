import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARD_KEY = 'onboard_seen';
const COUNTRY_KEY = 'user_country';

export const bootstrapApp = createAsyncThunk('app/bootstrap', async () => {
  const [seen, country] = await Promise.all([
    AsyncStorage.getItem(ONBOARD_KEY),
    AsyncStorage.getItem(COUNTRY_KEY),
  ]);
  return { onboardingSeen: seen === '1', country: country || null };
});

export const setOnboardingSeen = createAsyncThunk('app/setOnboardingSeen', async () => {
  await AsyncStorage.setItem(ONBOARD_KEY, '1');
  return true;
});

export const setCountry = createAsyncThunk('app/setCountry', async (country) => {
  await AsyncStorage.setItem(COUNTRY_KEY, country);
  return country;
});

const initialState = {
  bootstrapped: false,
  onboardingSeen: false,
  country: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapApp.fulfilled, (state, action) => {
        state.bootstrapped = true;
        state.onboardingSeen = action.payload.onboardingSeen;
        state.country = action.payload.country;
      })
      .addCase(bootstrapApp.rejected, (state) => {
        state.bootstrapped = true;
      })
      .addCase(setOnboardingSeen.fulfilled, (state) => {
        state.onboardingSeen = true;
      })
      .addCase(setCountry.fulfilled, (state, action) => {
        state.country = action.payload;
      });
  },
});

export default appSlice.reducer;

