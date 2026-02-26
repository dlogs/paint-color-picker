export interface SwatchAsset {
  id: string;
  name: string;
  hex: string;
  number?: string;
}

export interface CollectionAsset {
  collection: string;
  swatches: SwatchAsset[];
}

export interface BrandAsset {
  brand: string;
  retrievalDate: string;
  collections: CollectionAsset[];
}
