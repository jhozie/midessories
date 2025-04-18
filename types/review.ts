export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  helpful: number;
  response?: {
    text: string;
    date: Date;
  };
  createdAt: Date;
  updatedAt: Date;
} 