export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
} 