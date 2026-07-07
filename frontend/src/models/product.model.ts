import { ProductMedia } from "./media.model";

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  sellerId: string;
  stockQuantity: number;
  category: string;
  media?: ProductMedia[];
  createdAt?: Date;
}