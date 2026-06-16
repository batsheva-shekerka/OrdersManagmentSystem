export interface Category {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}
