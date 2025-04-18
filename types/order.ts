export interface Order {
  id: string;
  amount: number;
  createdAt: Date;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  payment: {
    method: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    reference: string;
  };
  shipping: {
    address: {
      additionalInfo?: string;
      address: string;
      city: string;
      firstName: string;
      lastName: string;
      state: string;
    };
    cost: number;
    location: string;
    method: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  updatedAt: Date;
  userId: string;
}

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  image?: string;
} 