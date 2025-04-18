export interface DeliveryZone {
  id: string;
  name: string;
  countries: string[];
  regions?: string[];
  postalCodes?: string[];
  status: 'active' | 'inactive';
}

export interface DeliveryMethod {
  id: string;
  name: string;
  description?: string;
  type: 'flat_rate' | 'free' | 'weight_based' | 'price_based';
  cost: number;
  freeShippingThreshold?: number;
  weightRules?: {
    min: number;
    max: number;
    cost: number;
  }[];
  priceRules?: {
    min: number;
    max: number;
    cost: number;
  }[];
  estimatedDays: {
    min: number;
    max: number;
  };
  zoneIds: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
} 