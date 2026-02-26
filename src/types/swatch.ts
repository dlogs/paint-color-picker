export interface Swatch {
  id: string;
  brand: string;
  collection: string;
  name: string;
  rgb: [number, number, number];
  oklab: [number, number, number];
  oklch: [number, number, number];
  number?: string;
}
