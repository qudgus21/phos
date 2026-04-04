export interface RetouchingSample {
  id: string;
  thumbnail: string;
  label: string;
  before: string;
  after: string;
  defaultCompare?: boolean;
  settings: {
    filter: string;
    filterIntensity: number;
    gender: "female" | "male";
    mode: "natural" | "soft-makeup" | "matte";
    faceReshape: boolean;
    faceReshapeIntensity: number;
    excludedAreas: string[];
    outputSize: string;
    ratio: string;
    scale: number;
  };
}

export const RETOUCHING_SAMPLES: RetouchingSample[] = [
  {
    id: "1",
    thumbnail: "/images/retouching/sample1/thumbnail.webp",
    label: "Glow Matte",
    before: "/images/retouching/sample1/before.webp",
    after: "/images/retouching/sample1/after.webp",
    defaultCompare: true,
    settings: {
      filter: "glow",
      filterIntensity: 1.0,
      gender: "female",
      mode: "matte",
      faceReshape: false,
      faceReshapeIntensity: 0.5,
      excludedAreas: [],
      outputSize: "4K",
      ratio: "1:1",
      scale: 4,
    },
  },
  {
    id: "2",
    thumbnail: "/images/retouching/sample2/thumbnail.webp",
    label: "Studio Makeup",
    before: "/images/retouching/sample2/before.webp",
    after: "/images/retouching/sample2/after.webp",
    settings: {
      filter: "studio",
      filterIntensity: 1.0,
      gender: "female",
      mode: "soft-makeup",
      faceReshape: true,
      faceReshapeIntensity: 1.0,
      excludedAreas: [],
      outputSize: "4K",
      ratio: "1:1",
      scale: 4,
    },
  },
  {
    id: "3",
    thumbnail: "/images/retouching/sample3/thumbnail.webp",
    label: "Brightening Natural",
    before: "/images/retouching/sample3/before.webp",
    after: "/images/retouching/sample3/after.webp",
    settings: {
      filter: "brightening",
      filterIntensity: 0.7,
      gender: "female",
      mode: "natural",
      faceReshape: false,
      faceReshapeIntensity: 0.5,
      excludedAreas: [],
      outputSize: "4K",
      ratio: "1:1",
      scale: 4,
    },
  },
  {
    id: "4",
    thumbnail: "/images/retouching/sample4/thumb.webp",
    label: "Glow Matte Makeup",
    before: "/images/retouching/sample4/before.webp",
    after: "/images/retouching/sample4/after.webp",
    settings: {
      filter: "glow",
      filterIntensity: 0.3,
      gender: "female",
      mode: "matte",
      faceReshape: false,
      faceReshapeIntensity: 0.5,
      excludedAreas: [],
      outputSize: "4K",
      ratio: "1:1",
      scale: 4,
    },
  },
  {
    id: "5",
    thumbnail: "/images/retouching/sample5/thumb.webp",
    label: "Male Studio",
    before: "/images/retouching/sample5/before.webp",
    after: "/images/retouching/sample5/after.webp",
    settings: {
      filter: "studio",
      filterIntensity: 0.5,
      gender: "male",
      mode: "natural",
      faceReshape: true,
      faceReshapeIntensity: 0.5,
      excludedAreas: [],
      outputSize: "4K",
      ratio: "1:1",
      scale: 4,
    },
  },
  {
    id: "6",
    thumbnail: "/images/retouching/sample6/thumb.webp",
    label: "Male Glow",
    before: "/images/retouching/sample6/before.webp",
    after: "/images/retouching/sample6/after.webp",
    settings: {
      filter: "glow",
      filterIntensity: 0.8,
      gender: "male",
      mode: "matte",
      faceReshape: false,
      faceReshapeIntensity: 0.5,
      excludedAreas: [],
      outputSize: "4K",
      ratio: "1:1",
      scale: 4,
    },
  },
];
