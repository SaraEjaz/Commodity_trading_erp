import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Stock {
  id: number;
  commodity: string;
  warehouse: string;
  quantity_on_hand: number;
  quantity_available: number;
  reorder_point: number;
}

interface InventoryState {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
  warehouses: any[];
  selectedWarehouse: number | null;
}

const initialState: InventoryState = {
  stocks: [],
  loading: false,
  error: null,
  warehouses: [],
  selectedWarehouse: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setStocks(state, action: PayloadAction<Stock[]>) {
      state.stocks = action.payload;
    },
    updateStock(state, action: PayloadAction<Stock>) {
      const index = state.stocks.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.stocks[index] = action.payload;
      }
    },
    setWarehouses(state, action: PayloadAction<any[]>) {
      state.warehouses = action.payload;
    },
    setSelectedWarehouse(state, action: PayloadAction<number | null>) {
      state.selectedWarehouse = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setStocks,
  updateStock,
  setWarehouses,
  setSelectedWarehouse,
} = inventorySlice.actions;
export default inventorySlice.reducer;
