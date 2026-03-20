export const queryKeys = {
  history: {
    all: ["history"] as const,
    byFeature: (featureType: string) => ["history", featureType] as const,
  },
  favorites: {
    all: ["favorites"] as const,
    byFeature: (featureType: string) => ["favorites", featureType] as const,
  },
  credits: {
    balance: ["credits", "balance"] as const,
  },
};
