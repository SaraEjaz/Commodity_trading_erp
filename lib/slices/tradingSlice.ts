import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Trade {
  id: number;
  trade_id: string;
  commodity: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  unit_price: number;
  total_value: number;
  status: string;
  trade_date: string;
}

interface TradingState {
  trades: Trade[];
  positions: any[];
  loading: boolean;
  error: string | null;
  selectedTrade: Trade | null;
}

const initialState: TradingState = {
  trades: [],
  positions: [],
  loading: false,
  error: null,
  selectedTrade: null,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setTrades(state, action: PayloadAction<Trade[]>) {
      state.trades = action.payload;
    },
    addTrade(state, action: PayloadAction<Trade>) {
      state.trades.unshift(action.payload);
    },
    updateTrade(state, action: PayloadAction<Trade>) {
      const index = state.trades.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.trades[index] = action.payload;
      }
    },
    setSelectedTrade(state, action: PayloadAction<Trade | null>) {
      state.selectedTrade = action.payload;
    },
    setPositions(state, action: PayloadAction<any[]>) {
      state.positions = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setTrades,
  addTrade,
  updateTrade,
  setSelectedTrade,
  setPositions,
} = tradingSlice.actions;
export default tradingSlice.reducer;
