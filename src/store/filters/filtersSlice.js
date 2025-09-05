import { createSlice } from '@reduxjs/toolkit';

// Default UI selections for FiltersSheet
const defaultSelections = {
  price: 500,
  plays: 150,
  progress: 35,
  timeLeft: 'today',
  condition: 'new',
  category: 'all',
  sortBy: 'popular',
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

