import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Order {
  id: number;
  order_number: string;
  order_type: 'purchase' | 'sales';
  status: string;
  order_date: string;
  total_amount: number;
  supplier?: string;
  customer?: string;
}

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  selectedOrder: Order | null;
  filters: {
    status: string | null;
    type: string | null;
  };
}

const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
  selectedOrder: null,
  filters: {
    status: null,
    type: null,
  },
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setOrders(state, action: PayloadAction<Order[]>) {
      state.orders = action.payload;
    },
    addOrder(state, action: PayloadAction<Order>) {
      state.orders.unshift(action.payload);
    },
    updateOrder(state, action: PayloadAction<Order>) {
      const index = state.orders.findIndex((o) => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },
    deleteOrder(state, action: PayloadAction<number>) {
      state.orders = state.orders.filter((o) => o.id !== action.payload);
    },
    setSelectedOrder(state, action: PayloadAction<Order | null>) {
      state.selectedOrder = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<string | null>) {
      state.filters.status = action.payload;
    },
    setTypeFilter(state, action: PayloadAction<string | null>) {
      state.filters.type = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setOrders,
  addOrder,
  updateOrder,
  deleteOrder,
  setSelectedOrder,
  setStatusFilter,
  setTypeFilter,
} = ordersSlice.actions;
export default ordersSlice.reducer;
