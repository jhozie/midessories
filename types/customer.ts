export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addresses: Address[];
  orders: string[]; // Order IDs
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'blocked';
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastOrderDate?: Date;
}

export interface Address {
  id: string;
  type: 'billing' | 'shipping';
  isDefault: boolean;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
} 