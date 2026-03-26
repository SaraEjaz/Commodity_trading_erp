import client from './client';

export interface OrderItem {
  id: number;
  commodity: number;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  line_total: number;
  grade?: string;
}

export interface Order {
  id: number;
  order_number: string;
  order_type: 'purchase' | 'sales';
  supplier?: number;
  customer?: number;
  order_date: string;
  required_date: string;
  delivery_date?: string;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  status: string;
  notes?: string;
  items?: OrderItem[];
}

const ordersAPI = {
  // ✅ Added missing `list` method (used by OrdersPage)
  list: async (params?: Record<string, any>) => {
    const response = await client.get('orders/orders/', { params });
    const data = response.data as any;
    return Array.isArray(data) ? data : (data.results || []);
  },

  getOrders: async (params?: Record<string, any>) => {
    const response = await client.get('orders/orders/', { params });
    const data = response.data as any;
    return Array.isArray(data) ? data : (data.results || []);
  },

  getOrder: async (id: number) => {
    const response = await client.get<Order>(`orders/orders/${id}/`);
    return response.data;
  },

  createOrder: async (data: Partial<Order>) => {
    const response = await client.post<Order>('orders/orders/', data);
    return response.data;
  },

  updateOrder: async (id: number, data: Partial<Order>) => {
    const response = await client.patch<Order>(`orders/orders/${id}/`, data);
    return response.data;
  },

  deleteOrder: async (id: number) => {
    await client.delete(`orders/orders/${id}/`);
  },

  getOrderItems: async (orderId: number) => {
    const response = await client.get<OrderItem[]>(`orders/orders/${orderId}/items/`);
    return response.data;
  },

  createOrderItem: async (data: Partial<OrderItem>) => {
    const response = await client.post<OrderItem>('orders/order-items/', data);
    return response.data;
  },

  updateOrderItem: async (id: number, data: Partial<OrderItem>) => {
    const response = await client.patch<OrderItem>(`orders/order-items/${id}/`, data);
    return response.data;
  },
};

export default ordersAPI;
export { ordersAPI };