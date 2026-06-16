export interface PointsTier {
  _id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  pointsPercentage: number;
  isActive: boolean;
}
