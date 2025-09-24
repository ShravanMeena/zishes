import { createSlice } from '@reduxjs/toolkit';

// Default UI selections for FiltersSheet
const defaultSelections = {
  entryFeeMax: 500,
  progressMax: 35,
  category: null,
  categorySlug: 'all',
  sort: 'newest',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState: {
    selections: defaultSelections,
  },
  reducers: {
    setFilters(state, action) {
      const next = action.payload || {};
      state.selections = { ...state.selections, ...next };
    },
    resetFilters(state) {
      state.selections = defaultSelections;
    },
  },
});

export const { setFilters, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
