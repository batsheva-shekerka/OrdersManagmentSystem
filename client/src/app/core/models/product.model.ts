import { Category } from "./category.model";

export type ProductStatus = "available" | "out_of_stock" | "discontinued";

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: Category | string;
  status: ProductStatus;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
}
