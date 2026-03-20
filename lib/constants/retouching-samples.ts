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
  };
}

export const RETOUCHING_SAMPLES: RetouchingSample[] = [
  {
    id: "1",
    thumbnail: "/images/retouching/sample1/thumbnail.webp",
    label: "글로우 매트",
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
      outputSize: "2K",
      ratio: "AUTO",
    },
  },
  {
    id: "2",
    thumbnail: "/images/retouching/sample2/thumbnail.png",
    label: "스튜디오 메이크업",
    before: "/images/retouching/sample2/before.png",
    after: "/images/retouching/sample2/after.png",
    settings: {
      filter: "studio",
      filterIntensity: 0.6,
      gender: "female",
      mode: "soft-makeup",
      faceReshape: false,
      faceReshapeIntensity: 0.5,
      excludedAreas: [],
      outputSize: "2K",
      ratio: "AUTO",
    },
  },
  {
    id: "3",
    thumbnail: "/images/retouching/sample3/thumbnail.png",
    label: "매거진 매트",
    before: "/images/retouching/sample3/before.png",
    after: "/images/retouching/sample3/after.png",
    settings: {
      filter: "glow",
      filterIntensity: 0.7,
      gender: "female",
      mode: "matte",
      faceReshape: true,
      faceReshapeIntensity: 0.6,
      excludedAreas: [],
      outputSize: "2K",
      ratio: "AUTO",
    },
  },
  {
    id: "4",
    thumbnail: "/images/retouching/sample4/thumbnail.png",
    label: "남성 브라이트닝",
    before: "/images/retouching/sample4/before.png",
    after: "/images/retouching/sample4/after.png",
    settings: {
      filter: "brightening",
      filterIntensity: 0.5,
      gender: "male",
      mode: "natural",
      faceReshape: false,
      faceReshapeIntensity: 0.5,
      excludedAreas: [],
      outputSize: "2K",
      ratio: "AUTO",
    },
  },
  {
    id: "5",
    thumbnail: "/images/retouching/sample5/thumbnail.png",
    label: "남성 스튜디오",
    before: "/images/retouching/sample5/before.png",
    after: "/images/retouching/sample5/after.png",
    settings: {
      filter: "studio",
      filterIntensity: 0.5,
      gender: "male",
      mode: "natural",
      faceReshape: false,
      faceReshapeIntensity: 0.5,
      excludedAreas: [],
      outputSize: "2K",
      ratio: "AUTO",
    },
  },
];
