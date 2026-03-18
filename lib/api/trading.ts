import client from './client';

export interface Trade {
  id: number;
  trade_id: string;
  commodity: number;
  trade_type: 'buy' | 'sell';
  quantity: number;
  unit_price: number;
  total_value: number;
  commission: number;
  net_value: number;
  status: string;
  trade_date: string;
  settlement_date: string;
  counterparty_name: string;
  counterparty_country: string;
  notes: string;
}

export interface TradePosition {
  id: number;
  trader: number;
  commodity: string;
  long_quantity: number;
  short_quantity: number;
  average_long_price: number;
  average_short_price: number;
  current_market_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
}

const tradingAPI = {
  getTrades: async (params?: Record<string, any>) => {
    const response = await client.get<Trade[]>('trading/trades/', { params });
    return response.data;
  },

  getTrade: async (id: number) => {
    const response = await client.get<Trade>(`trading/trades/${id}/`);
    return response.data;
  },

  createTrade: async (data: Partial<Trade>) => {
    const response = await client.post<Trade>('trading/trades/', data);
    return response.data;
  },

  updateTrade: async (id: number, data: Partial<Trade>) => {
    const response = await client.patch<Trade>(`trading/trades/${id}/`, data);
    return response.data;
  },

  deleteTrade: async (id: number) => {
    await client.delete(`trading/trades/${id}/`);
  },

  getPositions: async () => {
    const response = await client.get<TradePosition[]>('trading/positions/');
    return response.data;
  },

  getPosition: async (id: number) => {
    const response = await client.get<TradePosition>(`trading/positions/${id}/`);
    return response.data;
  },
};

export default tradingAPI;
