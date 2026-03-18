import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Commodity {
  id: number;
  code: string;
  name: string;
  category: string;
  base_price: number;
  currency: string;
  unit: string;
  is_active: boolean;
}

interface CommoditiesState {
  items: Commodity[];
  loading: boolean;
  error: string | null;
  filters: {
    category: string | null;
    search: string;
  };
}

const initialState: CommoditiesState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    category: null,
    search: '',
  },
};

const commoditiesSlice = createSlice({
  name: 'commodities',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setCommodities(state, action: PayloadAction<Commodity[]>) {
      state.items = action.payload;
    },
    addCommodity(state, action: PayloadAction<Commodity>) {
      state.items.unshift(action.payload);
    },
    updateCommodity(state, action: PayloadAction<Commodity>) {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    setFilterCategory(state, action: PayloadAction<string | null>) {
      state.filters.category = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.filters.search = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setCommodities,
  addCommodity,
  updateCommodity,
  setFilterCategory,
  setSearchQuery,
} = commoditiesSlice.actions;
export default commoditiesSlice.reducer;
